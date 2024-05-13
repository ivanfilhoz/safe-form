import { render, screen } from '@testing-library/react'
import { describe, expect, test } from 'vitest'
import { HelloForm } from './form'

describe('HelloForm', () => {
  test('renders', () => {
    render(<HelloForm />)
    expect(screen.getByText('Submit')).toBeDefined()
  })

  test('when setField is called, update the bound field', () => {
    const button = screen.getByTestId('button-foo')
    button.click()
    const input = screen.getByLabelText('Name') as HTMLInputElement
    expect(input.value).toBe('foo')
  })
})
