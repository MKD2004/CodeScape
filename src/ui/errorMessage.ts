import { GithubApiError } from '../data/github'

export function friendlyErrorMessage(err: unknown): string {
  if (err instanceof GithubApiError) {
    switch (err.code) {
      case 'not_found':
        return "Repo not found — check the owner/repo, or it might be private (CodeScape only works with public repos)."
      case 'rate_limited':
        return "GitHub API rate limit hit. Unauthenticated requests are capped — wait a few minutes and try again."
      case 'empty':
        return 'That repository has no files to build a city from.'
      default:
        return err.message
    }
  }
  return err instanceof Error ? err.message : 'Failed to load repo'
}
