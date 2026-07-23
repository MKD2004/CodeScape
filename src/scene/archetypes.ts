import type { FileRole } from '../data/classify'

export type Archetype = 'component' | 'api' | 'model' | 'test' | 'default'

export const ARCHETYPES: Archetype[] = [
  'component',
  'api',
  'model',
  'test',
  'default',
]

const ROLE_ARCHETYPE: Record<FileRole, Archetype> = {
  component: 'component',
  api: 'api',
  model: 'model',
  test: 'test',
  config: 'default',
  style: 'default',
  doc: 'default',
  other: 'default',
}

export function archetypeForRole(role: FileRole): Archetype {
  return ROLE_ARCHETYPE[role]
}
