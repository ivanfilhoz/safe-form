import { expect, test } from 'vitest'
import { getIssuePath, parseStandardSchemaIssues } from './standardSchema'

test('normalizes standard schema issue paths', () => {
  const issue = {
    message: 'Invalid email',
    path: ['contacts', { key: 0 }, { key: 'email' }]
  }

  expect(getIssuePath(issue)).toEqual(['contacts', 0, 'email'])
})

test('groups top-level and child issues by field', () => {
  const errors = parseStandardSchemaIssues<{
    contacts: { email: string }[]
  }>([
    {
      message: 'Add at least one contact',
      path: ['contacts']
    },
    {
      message: 'Invalid email',
      path: ['contacts', { key: 0 }, { key: 'email' }]
    }
  ])

  expect(errors.contacts?.first).toBe('Add at least one contact')
  expect(errors.contacts?.hasChildErrors).toBe(true)
  expect(errors.contacts?.rawErrors).toHaveLength(2)
})
