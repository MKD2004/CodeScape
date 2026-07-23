import { describe, expect, it } from 'vitest'
import { classifyFile } from './classify'

describe('classifyFile', () => {
  it('classifies test files', () => {
    expect(classifyFile('src/utils/parse.test.ts')).toBe('test')
    expect(classifyFile('src/__tests__/App.tsx')).toBe('test')
    expect(classifyFile('tests/e2e/login.spec.js')).toBe('test')
  })

  it('classifies config files', () => {
    expect(classifyFile('package.json')).toBe('config')
    expect(classifyFile('vite.config.ts')).toBe('config')
    expect(classifyFile('.eslintrc.json')).toBe('config')
  })

  it('classifies model files', () => {
    expect(classifyFile('src/models/User.ts')).toBe('model')
    expect(classifyFile('src/db/UserModel.ts')).toBe('model')
  })

  it('classifies API route files', () => {
    expect(classifyFile('src/routes/users.ts')).toBe('api')
    expect(classifyFile('api/health.ts')).toBe('api')
    expect(classifyFile('src/controllers/AuthController.ts')).toBe('api')
  })

  it('classifies style files', () => {
    expect(classifyFile('src/App.css')).toBe('style')
    expect(classifyFile('src/theme.scss')).toBe('style')
  })

  it('classifies doc files', () => {
    expect(classifyFile('README.md')).toBe('doc')
    expect(classifyFile('docs/guide.mdx')).toBe('doc')
  })

  it('classifies component files by folder or extension', () => {
    expect(classifyFile('src/components/Button.tsx')).toBe('component')
    expect(classifyFile('src/widgets/Card.jsx')).toBe('component')
  })

  it('uses a capitalized default export to confirm ambiguous tsx as a component', () => {
    const content = 'export default function Card() { return null }'
    expect(classifyFile('src/widgets/card.tsx', content)).toBe('component')
  })

  it('falls back to other for unrecognized files', () => {
    expect(classifyFile('src/index.ts')).toBe('other')
    expect(classifyFile('scripts/build.mjs')).toBe('other')
  })
})
