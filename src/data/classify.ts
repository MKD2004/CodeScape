import { getExtension } from './languages'

export type FileRole =
  'test' | 'config' | 'model' | 'api' | 'component' | 'style' | 'doc' | 'other'

const CONFIG_BASENAMES = new Set([
  'package.json',
  'package-lock.json',
  'tsconfig.json',
  'vite.config.ts',
  'vite.config.js',
  'webpack.config.js',
  'babel.config.js',
  '.eslintrc',
  '.eslintrc.json',
  '.eslintrc.js',
  '.prettierrc',
  '.prettierrc.json',
  '.gitignore',
  '.env',
  '.env.example',
  'dockerfile',
  'docker-compose.yml',
  'docker-compose.yaml',
])

function basename(path: string): string {
  return path.split('/').pop() ?? path
}

/**
 * `content` is optional — when present (already fetched for LOC/complexity
 * analysis) it sharpens the component heuristic via a capitalized default
 * export check; path/extension heuristics alone are used otherwise.
 */
export function classifyFile(path: string, content?: string): FileRole {
  const name = basename(path)
  const lowerName = name.toLowerCase()
  const lowerPath = path.toLowerCase()
  const ext = getExtension(path)

  if (
    /\.(test|spec)\.[a-z0-9]+$/i.test(name) ||
    /(^|\/)(__tests__|tests?)\//i.test(path)
  ) {
    return 'test'
  }

  if (
    CONFIG_BASENAMES.has(lowerName) ||
    /\.config\.[a-z0-9]+$/i.test(name) ||
    /^\..*rc(\.[a-z0-9]+)?$/i.test(name)
  ) {
    return 'config'
  }

  if (ext === 'md' || ext === 'mdx' || lowerName === 'readme') {
    return 'doc'
  }

  if (ext === 'css' || ext === 'scss' || ext === 'less') {
    return 'style'
  }

  if (/(^|\/)(routes?|api|controllers?)\//i.test(lowerPath)) {
    return 'api'
  }

  if (/(^|\/)models?\//i.test(lowerPath) || /model/i.test(name)) {
    return 'model'
  }

  if (
    /(^|\/)components?\//i.test(lowerPath) ||
    ext === 'jsx' ||
    ext === 'tsx' ||
    ext === 'vue' ||
    ext === 'svelte'
  ) {
    if ((ext === 'tsx' || ext === 'jsx') && content) {
      const hasCapitalizedDefaultExport =
        /export\s+default\s+function\s+[A-Z]/.test(content) ||
        /export\s+default\s+class\s+[A-Z]/.test(content) ||
        /export\s+default\s+[A-Z]\w*/.test(content)
      if (
        !hasCapitalizedDefaultExport &&
        !/(^|\/)components?\//i.test(lowerPath)
      ) {
        return 'other'
      }
    }
    return 'component'
  }

  return 'other'
}
