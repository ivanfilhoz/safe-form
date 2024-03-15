import { expect, test } from 'vitest'
import { parseValueFromInput } from './parseValueFromInput'

test('handles text inputs', () => {
  const input = document.createElement('input')
  input.value = 'John'
  const result = parseValueFromInput(input)
  expect(result).toEqual('John')
})

test('handles number inputs', () => {
  const input = document.createElement('input')
  input.type = 'number'
  input.value = '30'
  const result = parseValueFromInput(input)
  expect(result).toEqual(30)
})

test('handles checkbox inputs', () => {
  const input = document.createElement('input')
  input.type = 'checkbox'
  input.checked = true
  const result = parseValueFromInput(input)
  expect(result).toEqual(true)
})

test('handles file inputs', () => {
  const input = document.createElement('input')
  input.type = 'file'
  const file = new File([''], 'file.txt')
  Object.defineProperty(input, 'files', { value: [file] })
  const result = parseValueFromInput(input)
  expect(result).toBeInstanceOf(File)
  expect(result).toBe(file)
})

test('handles radio inputs', () => {
  const input = document.createElement('input')
  input.type = 'radio'
  input.value = 'John'
  input.checked = true
  const result = parseValueFromInput(input)
  expect(result).toEqual('John')
})

test('handles select inputs', () => {
  const select = document.createElement('select')
  const option = document.createElement('option')
  option.value = 'John'
  select.appendChild(option)
  const result = parseValueFromInput(select)
  expect(result).toEqual('John')
})

test('handles date inputs', () => {
  const input = document.createElement('input')
  input.type = 'date'
  input.value = '2022-01-01'
  const result = parseValueFromInput(input)
  expect(result).toEqual('2022-01-01T00:00:00.000Z')
})

test('handles textareas', () => {
  const textarea = document.createElement('textarea')
  textarea.value = 'John'
  const result = parseValueFromInput(textarea)
  expect(result).toEqual('John')
})

test('handles unknown inputs', () => {
  const input = document.createElement('input')
  input.type = 'unknown'
  input.value = 'John'
  const result = parseValueFromInput(input)
  expect(result).toEqual('John')
})
