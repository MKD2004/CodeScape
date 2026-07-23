import { classifyFile } from './classify'
import { mapWithConcurrency } from './concurrency'
import { fetchDefaultBranch, fetchFileContent, fetchRepoTree } from './github'
import { detectLanguage, isBinaryPath } from './languages'
import { countLines, estimateComplexity } from './textStats'
import { buildTree, type FlatFile, type FolderNode } from './tree'

const DEFAULT_MAX_FILE_BYTES = 500_000
const DEFAULT_CONCURRENCY = 8

export interface RepoCityData {
  owner: string
  repo: string
  branch: string
  root: FolderNode
  fileCount: number
  totalLoc: number
  truncated: boolean
}

export interface BuildRepoCityOptions {
  branch?: string
  maxFileBytes?: number
  concurrency?: number
  onProgress?: (done: number, total: number) => void
}

export async function buildRepoCity(
  owner: string,
  repo: string,
  options: BuildRepoCityOptions = {},
): Promise<RepoCityData> {
  const branch = options.branch ?? (await fetchDefaultBranch(owner, repo))
  const maxFileBytes = options.maxFileBytes ?? DEFAULT_MAX_FILE_BYTES
  const concurrency = options.concurrency ?? DEFAULT_CONCURRENCY

  const { entries, truncated } = await fetchRepoTree(owner, repo, branch)
  const blobs = entries.filter((entry) => entry.type === 'blob')

  let done = 0
  const flatFiles = await mapWithConcurrency<(typeof blobs)[number], FlatFile>(
    blobs,
    concurrency,
    async (blob) => {
      const size = blob.size ?? 0
      const language = detectLanguage(blob.path)
      const skipContent = isBinaryPath(blob.path) || size > maxFileBytes

      let loc = 0
      let complexity = 0
      let content: string | undefined

      if (!skipContent) {
        try {
          content = await fetchFileContent(owner, repo, branch, blob.path)
          loc = countLines(content)
          complexity = estimateComplexity(content)
        } catch {
          // Best-effort: unreadable/unfetchable file still gets a footprint.
        }
      }

      options.onProgress?.(++done, blobs.length)

      return {
        path: blob.path,
        size,
        loc,
        language,
        role: classifyFile(blob.path, content),
        complexity,
      }
    },
  )

  const root = buildTree(flatFiles)
  const totalLoc = flatFiles.reduce((sum, file) => sum + file.loc, 0)

  return {
    owner,
    repo,
    branch,
    root,
    fileCount: flatFiles.length,
    totalLoc,
    truncated,
  }
}
