const LANGUAGE_COLORS: Record<string, string> = {
  TypeScript: '#3178c6',
  JavaScript: '#f1e05a',
  Python: '#3572a5',
  Ruby: '#701516',
  Go: '#00add8',
  Rust: '#dea584',
  Java: '#b07219',
  Kotlin: '#a97bff',
  C: '#555555',
  'C++': '#f34b7d',
  'C#': '#178600',
  PHP: '#4f5d95',
  Swift: '#f05138',
  'Objective-C': '#438eff',
  Scala: '#c22d40',
  Shell: '#89e051',
  PowerShell: '#012456',
  HTML: '#e34c26',
  CSS: '#563d7c',
  SCSS: '#c6538c',
  Less: '#1d365d',
  JSON: '#8bc34a',
  YAML: '#cb171e',
  TOML: '#9c4221',
  Markdown: '#ffffff',
  SQL: '#e38c00',
  Dart: '#00b4ab',
  Lua: '#000080',
  R: '#198ce7',
  Julia: '#a270ba',
  Elixir: '#6e4a7e',
  Elm: '#60b5cc',
  Clojure: '#db5855',
  Haskell: '#5e5086',
  Vue: '#41b883',
  Svelte: '#ff3e00',
  GraphQL: '#e10098',
  'Protocol Buffers': '#3877e2',
}

function hashHue(input: string): number {
  let hash = 0
  for (let i = 0; i < input.length; i++) {
    hash = (hash * 31 + input.charCodeAt(i)) >>> 0
  }
  return hash % 360
}

/** Falls back to a stable hash-derived hue for languages outside the table. */
export function getLanguageColor(language: string): string {
  if (language === 'Other') return '#5c5f6b'
  return LANGUAGE_COLORS[language] ?? `hsl(${hashHue(language)}, 55%, 55%)`
}
