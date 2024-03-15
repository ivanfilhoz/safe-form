import { expect, test } from 'vitest'
import { createFormData, parseFormData } from './serializer'

test('handles scalars', () => {
  const formData = createFormData({ name: 'John', age: '30' })
  const result = parseFormData(formData)

  expect(result).toEqual({ name: 'John', age: '30' })
})

test('handles scalars and files', () => {
  const file = new File([''], 'file.txt')
  const formData = createFormData({ name: 'John', age: '30', file })
  const result = parseFormData(formData)

  expect(result).toEqual({ name: 'John', age: '30', file })
  expect(result.file).toBeInstanceOf(File)
})
