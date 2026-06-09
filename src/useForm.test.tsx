import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, test } from 'vitest'
import { useForm } from './useForm'

type TestInput = {
  name: string
  birthDate: Date | null
  subscribed: boolean
}

function TestForm() {
  const { bindField, connect, setField } = useForm<TestInput, string>({
    initialValues: {
      name: 'Ivan Filho',
      birthDate: null,
      subscribed: false
    }
  })

  return (
    <form {...connect()}>
      <label htmlFor='name'>Name</label>
      <input {...bindField('name')} id='name' />
      <label htmlFor='birth-date'>Birth date</label>
      <input {...bindField('birthDate')} id='birth-date' type='date' />
      <label htmlFor='subscribed'>Subscribed</label>
      <input {...bindField('subscribed')} id='subscribed' type='checkbox' />
      <button
        data-testid='button-foo'
        onClick={(event) => {
          event.preventDefault()
          setField('name', 'foo')
        }}
      >
        Set name to foo
      </button>
      <button
        data-testid='button-date'
        onClick={(event) => {
          event.preventDefault()
          setField('birthDate', new Date('1992-05-14T00:00:00.000Z'))
        }}
      >
        Set birth date
      </button>
      <button
        data-testid='button-checkbox'
        onClick={(event) => {
          event.preventDefault()
          setField('subscribed', true)
        }}
      >
        Set subscribed
      </button>
      <button type='submit'>Submit</button>
    </form>
  )
}

describe('useForm', () => {
  afterEach(cleanup)

  test('renders form controls', () => {
    render(<TestForm />)

    expect(screen.getByText('Submit')).toBeDefined()
  })

  test('updates a bound field when setField is called', () => {
    render(<TestForm />)

    const button = screen.getByTestId('button-foo')
    fireEvent.click(button)

    const input = screen.getByLabelText('Name') as HTMLInputElement
    expect(input.value).toBe('foo')
  })

  test('updates bound date and checkbox fields when setField is called', () => {
    render(<TestForm />)

    fireEvent.click(screen.getByTestId('button-date'))
    fireEvent.click(screen.getByTestId('button-checkbox'))

    const dateInput = screen.getByLabelText('Birth date') as HTMLInputElement
    const checkbox = screen.getByLabelText('Subscribed') as HTMLInputElement

    expect(dateInput.value).toBe('1992-05-14')
    expect(checkbox.checked).toBe(true)
  })
})
