import type { StandardSchemaV1 } from '@standard-schema/spec'
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor
} from '@testing-library/react'
import { afterEach, describe, expect, test } from 'vitest'
import type { FormAction } from './types'
import { useForm } from './useForm'

type SignupInput = { name: string }

const signupSchema: StandardSchemaV1<Record<string, unknown>, SignupInput> = {
  '~standard': {
    version: 1,
    vendor: 'safe-form-test',
    validate(value) {
      const input = value as { name?: unknown }

      if (typeof input.name !== 'string' || input.name.length < 3) {
        return {
          issues: [
            {
              message: 'Name is too short',
              path: ['name']
            }
          ]
        }
      }

      return { value: { name: input.name } }
    }
  }
}

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

  test('applies boolean and date initial values to bound fields', () => {
    function InitialValuesForm() {
      const { bindField, connect } = useForm<TestInput, string>({
        initialValues: {
          name: 'Ivan Filho',
          birthDate: new Date('1992-05-14T00:00:00.000Z'),
          subscribed: true
        }
      })

      return (
        <form {...connect()}>
          <label htmlFor='initial-birth-date'>Birth date</label>
          <input
            {...bindField('birthDate')}
            id='initial-birth-date'
            type='date'
          />
          <label htmlFor='initial-subscribed'>Subscribed</label>
          <input
            {...bindField('subscribed')}
            id='initial-subscribed'
            type='checkbox'
          />
        </form>
      )
    }

    render(<InitialValuesForm />)

    const dateInput = screen.getByLabelText('Birth date') as HTMLInputElement
    const checkbox = screen.getByLabelText('Subscribed') as HTMLInputElement

    expect(dateInput.value).toBe('1992-05-14')
    expect(checkbox.checked).toBe(true)
  })

  test('client-side validation supersedes stale server errors', async () => {
    const action: FormAction<SignupInput, string> = async () => ({
      error: 'This name is taken'
    })

    function SignupForm() {
      const { bindField, connect, error, fieldErrors } = useForm<
        SignupInput,
        string
      >({
        action,
        validateOnBlur: true,
        initialValues: { name: 'Ivan' },
        schema: signupSchema
      })

      return (
        <form {...connect()}>
          <label htmlFor='signup-name'>Name</label>
          <input {...bindField('name')} id='signup-name' />
          {fieldErrors.name && <span>{fieldErrors.name.first}</span>}
          {error && <p>{error}</p>}
          <button type='submit'>Submit</button>
        </form>
      )
    }

    render(<SignupForm />)

    // Submit and wait for the server error to land
    fireEvent.submit(screen.getByText('Submit').closest('form') as Element)
    await waitFor(() => {
      expect(screen.getByText('This name is taken')).toBeDefined()
    })

    // A failing client-side validation run supersedes the server error:
    // only the fresh local field error is displayed
    const input = screen.getByLabelText('Name') as HTMLInputElement
    fireEvent.change(input, { target: { value: 'Iv' } })
    fireEvent.blur(input)

    await waitFor(() => {
      expect(screen.getByText('Name is too short')).toBeDefined()
      expect(screen.queryByText('This name is taken')).toBeNull()
    })

    // A new server response takes precedence again
    fireEvent.change(input, { target: { value: 'Ivan Filho' } })
    fireEvent.blur(input)
    fireEvent.submit(screen.getByText('Submit').closest('form') as Element)

    await waitFor(() => {
      expect(screen.getByText('This name is taken')).toBeDefined()
    })
  })

  test('a root-only server failure does not mask fresh local field errors', async () => {
    const action: FormAction<SignupInput, string> = async () => ({
      fieldErrors: {},
      rootError: {
        first: 'Signups are closed',
        all: ['Signups are closed'],
        hasChildErrors: false,
        rawErrors: [{ message: 'Signups are closed' }]
      }
    })

    function RootFailureForm() {
      const { bindField, connect, fieldErrors, rootError } = useForm<
        SignupInput,
        string
      >({
        action,
        validateOnBlur: true,
        initialValues: { name: 'Ivan' },
        schema: signupSchema
      })

      return (
        <form {...connect()}>
          <label htmlFor='root-failure-name'>Name</label>
          <input {...bindField('name')} id='root-failure-name' />
          {fieldErrors.name && <span>{fieldErrors.name.first}</span>}
          {rootError && <p>{rootError.first}</p>}
          <button type='submit'>Submit</button>
        </form>
      )
    }

    render(<RootFailureForm />)

    // Submit and wait for the server's root error to land
    fireEvent.submit(screen.getByText('Submit').closest('form') as Element)
    await waitFor(() => {
      expect(screen.getByText('Signups are closed')).toBeDefined()
    })

    // A failing client-side validation run supersedes the whole server
    // state: the server's empty fieldErrors must not mask the fresh local
    // field error, and the server root error must disappear with it
    const input = screen.getByLabelText('Name') as HTMLInputElement
    fireEvent.change(input, { target: { value: 'Iv' } })
    fireEvent.blur(input)

    await waitFor(() => {
      expect(screen.getByText('Name is too short')).toBeDefined()
      expect(screen.queryByText('Signups are closed')).toBeNull()
    })
  })
})
