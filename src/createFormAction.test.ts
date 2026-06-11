import type { StandardSchemaV1 } from '@standard-schema/spec'
import { expect, test } from 'vitest'
import { createFormAction } from './createFormAction'
import { createFormData } from './helpers/serializer'

const schema: StandardSchemaV1<
  { name?: unknown },
  {
    name: string
  }
> = {
  '~standard': {
    version: 1,
    vendor: 'safe-form-test',
    validate(value: unknown) {
      const input = value as { name?: unknown }

      if (typeof input.name !== 'string' || input.name.length < 3) {
        return {
          issues: [
            {
              message: 'Name must be at least 3 characters',
              path: ['name']
            }
          ]
        }
      }

      return {
        value: {
          name: input.name.trim()
        }
      }
    }
  }
} as const

test('validates form data with a standard schema', async () => {
  const action = createFormAction(schema, async (input) => {
    return `Hello, ${input.name}`
  })

  const result = await action(null, createFormData({ name: 'Ivan ' }))

  expect(result).toEqual({
    response: 'Hello, Ivan'
  })
})

test('returns field errors for standard schema issues', async () => {
  const action = createFormAction(schema, async (input) => {
    return `Hello, ${input.name}`
  })

  const result = await action(null, createFormData({ name: 'Iv' }))

  expect(result.fieldErrors?.name?.first).toBe(
    'Name must be at least 3 characters'
  )
  expect(result.rootError).toBeUndefined()
})

test('returns a root error for issues without a path', async () => {
  const rootSchema: StandardSchemaV1<
    { password?: unknown; confirm?: unknown },
    { password: string; confirm: string }
  > = {
    '~standard': {
      version: 1,
      vendor: 'safe-form-test',
      validate(value: unknown) {
        const input = value as { password?: unknown; confirm?: unknown }

        if (input.password !== input.confirm) {
          return {
            issues: [{ message: 'Passwords do not match' }]
          }
        }

        return {
          value: {
            password: String(input.password),
            confirm: String(input.confirm)
          }
        }
      }
    }
  }

  const action = createFormAction(rootSchema, async () => 'ok')

  const result = await action(
    null,
    createFormData({ password: 'one', confirm: 'two' })
  )

  expect(result.rootError?.first).toBe('Passwords do not match')
  expect(result.fieldErrors).toEqual({})
})
