export function countLines(content: string): number {
  if (content.length === 0) return 0
  const normalized = content.replace(/\r\n/g, '\n')
  const lines = normalized.split('\n')
  if (lines[lines.length - 1] === '') lines.pop()
  return lines.length
}

const COMPLEXITY_PATTERN = /\b(if|for|while|switch|case|catch)\b|&&|\|\|/g

/**
 * Heuristic proxy, not a real cyclomatic complexity metric — counts
 * branching/looping keywords and boolean operators.
 */
export function estimateComplexity(content: string): number {
  const matches = content.match(COMPLEXITY_PATTERN)
  return matches ? matches.length : 0
}
