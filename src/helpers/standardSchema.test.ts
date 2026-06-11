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
  const { fieldErrors, rootError } = parseStandardSchemaIssues<{
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

  expect(fieldErrors.contacts?.first).toBe('Add at least one contact')
  expect(fieldErrors.contacts?.hasChildErrors).toBe(true)
  expect(fieldErrors.contacts?.rawErrors).toHaveLength(2)
  expect(rootError).toBeUndefined()
})

test('exposes issues without a path as rootError', () => {
  const { fieldErrors, rootError } = parseStandardSchemaIssues<{
    password: string
  }>([
    {
      message: 'Passwords do not match'
    },
    {
      message: 'Password is too short',
      path: ['password']
    }
  ])

  expect(rootError?.first).toBe('Passwords do not match')
  expect(rootError?.all).toEqual(['Passwords do not match'])
  expect(rootError?.hasChildErrors).toBe(false)
  expect(fieldErrors.password?.first).toBe('Password is too short')
})
