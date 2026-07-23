import { describe, expect, it } from 'vitest'
import { countLines, estimateComplexity } from './textStats'

describe('countLines', () => {
  it('returns 0 for empty content', () => {
    expect(countLines('')).toBe(0)
  })

  it('counts lines without a trailing newline', () => {
    expect(countLines('a\nb\nc')).toBe(3)
  })

  it('does not count a trailing newline as an extra line', () => {
    expect(countLines('a\nb\nc\n')).toBe(3)
  })

  it('normalizes CRLF line endings', () => {
    expect(countLines('a\r\nb\r\nc')).toBe(3)
  })
})

describe('estimateComplexity', () => {
  it('returns 0 for content with no branching', () => {
    expect(estimateComplexity('const x = 1\nexport default x\n')).toBe(0)
  })

  it('counts branching keywords and boolean operators', () => {
    const content = `
      function f(a, b) {
        if (a && b) {
          for (let i = 0; i < a; i++) {
            while (i < b || a > 0) {}
          }
        }
        switch (a) {
          case 1:
            break
        }
        try {} catch (e) {}
      }
    `
    // if, &&, for, while, ||, switch, case, catch = 8
    expect(estimateComplexity(content)).toBe(8)
  })
})
