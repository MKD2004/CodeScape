import { describe, expect, it } from 'vitest'
import { detectLanguage, isBinaryPath } from './languages'

describe('detectLanguage', () => {
  it('detects common languages by extension', () => {
    expect(detectLanguage('src/App.tsx')).toBe('TypeScript')
    expect(detectLanguage('main.py')).toBe('Python')
    expect(detectLanguage('server.go')).toBe('Go')
    expect(detectLanguage('lib.rs')).toBe('Rust')
    expect(detectLanguage('README.md')).toBe('Markdown')
  })

  it('falls back to Other for unknown or missing extensions', () => {
    expect(detectLanguage('Makefile')).toBe('Other')
    expect(detectLanguage('LICENSE')).toBe('Other')
  })
})

describe('isBinaryPath', () => {
  it('flags common binary extensions', () => {
    expect(isBinaryPath('logo.png')).toBe(true)
    expect(isBinaryPath('font.woff2')).toBe(true)
  })

  it('does not flag text source files', () => {
    expect(isBinaryPath('src/App.tsx')).toBe(false)
    expect(isBinaryPath('README.md')).toBe(false)
  })
})
