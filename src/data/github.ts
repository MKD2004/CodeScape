export type GithubErrorCode = 'not_found' | 'rate_limited' | 'empty' | 'unknown'

export class GithubApiError extends Error {
  code: GithubErrorCode

  constructor(message: string, code: GithubErrorCode) {
    super(message)
    this.name = 'GithubApiError'
    this.code = code
  }
}

export interface GithubTreeEntry {
  path: string
  type: 'blob' | 'tree'
  size?: number
  sha: string
}

interface GithubTreeResponse {
  tree: GithubTreeEntry[]
  truncated: boolean
}

function toApiError(status: number, remaining: string | null): GithubApiError {
  if (status === 404) {
    return new GithubApiError('Repository or branch not found', 'not_found')
  }
  if (status === 403 && remaining === '0') {
    return new GithubApiError('GitHub API rate limit exceeded', 'rate_limited')
  }
  return new GithubApiError(`GitHub API request failed (${status})`, 'unknown')
}

export async function fetchDefaultBranch(
  owner: string,
  repo: string,
): Promise<string> {
  const res = await fetch(`https://api.github.com/repos/${owner}/${repo}`)
  if (!res.ok) {
    throw toApiError(res.status, res.headers.get('x-ratelimit-remaining'))
  }
  const json = (await res.json()) as { default_branch: string }
  return json.default_branch
}

export async function fetchRepoTree(
  owner: string,
  repo: string,
  branch: string,
): Promise<{ entries: GithubTreeEntry[]; truncated: boolean }> {
  const res = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/git/trees/${encodeURIComponent(branch)}?recursive=1`,
  )
  if (!res.ok) {
    throw toApiError(res.status, res.headers.get('x-ratelimit-remaining'))
  }
  const json = (await res.json()) as GithubTreeResponse
  if (json.tree.length === 0) {
    throw new GithubApiError('Repository is empty', 'empty')
  }
  return { entries: json.tree, truncated: json.truncated }
}

export async function fetchFileContent(
  owner: string,
  repo: string,
  branch: string,
  path: string,
): Promise<string> {
  const res = await fetch(
    `https://raw.githubusercontent.com/${owner}/${repo}/${encodeURIComponent(branch)}/${path
      .split('/')
      .map(encodeURIComponent)
      .join('/')}`,
  )
  if (!res.ok) {
    throw toApiError(res.status, res.headers.get('x-ratelimit-remaining'))
  }
  return res.text()
}

interface GithubCommitResponse {
  commit: {
    author: { date: string } | null
    committer: { date: string } | null
  }
}

export async function fetchLastModified(
  owner: string,
  repo: string,
  path: string,
): Promise<string | null> {
  const res = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/commits?path=${encodeURIComponent(path)}&per_page=1`,
  )
  if (!res.ok) return null
  const json = (await res.json()) as GithubCommitResponse[]
  const commit = json[0]
  if (!commit) return null
  return commit.commit.author?.date ?? commit.commit.committer?.date ?? null
}
