import { render, screen } from '@testing-library/react'
import { describe, expect, test } from 'vitest'
import { HelloForm } from './form'

describe('HelloForm', () => {
  test('renders', () => {
    render(<HelloForm />)
    expect(screen.getByText('Submit')).toBeDefined()
  })
})
