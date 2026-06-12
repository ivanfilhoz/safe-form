import type { StandardSchemaV1 } from '@standard-schema/spec'
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor
} from '@testing-library/react'
import { afterEach, describe, expect, test } from 'vitest'
import type { FormAction, FormState } from './types'
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

  test('getFieldErrorByPath reads the displayed server errors', async () => {
    const action: FormAction<SignupInput, string> = async () => ({
      fieldErrors: {
        name: {
          first: 'This name is taken',
          all: ['This name is taken'],
          hasChildErrors: false,
          rawErrors: [{ message: 'This name is taken', path: ['name'] }]
        }
      }
    })

    function ByPathForm() {
      const { bindField, connect, getFieldErrorByPath } = useForm<
        SignupInput,
        string
      >({
        action,
        initialValues: { name: 'Ivan' },
        schema: signupSchema
      })

      const byPath = getFieldErrorByPath(['name'])

      return (
        <form {...connect()}>
          <label htmlFor='by-path-name'>Name</label>
          <input {...bindField('name')} id='by-path-name' />
          {byPath && <em data-testid='by-path'>{byPath}</em>}
          <button type='submit'>Submit</button>
        </form>
      )
    }

    render(<ByPathForm />)

    fireEvent.submit(screen.getByText('Submit').closest('form') as Element)

    await waitFor(() => {
      expect(screen.getByTestId('by-path').textContent).toBe(
        'This name is taken'
      )
    })
  })

  test('a late server response replaces local errors entirely', async () => {
    let resolveResponse:
      | ((state: FormState<SignupInput, string>) => void)
      | undefined

    const action: FormAction<SignupInput, string> = () =>
      new Promise((resolve) => {
        resolveResponse = resolve
      })

    function RaceForm() {
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
          <label htmlFor='race-name'>Name</label>
          <input {...bindField('name')} id='race-name' />
          {fieldErrors.name && <span>{fieldErrors.name.first}</span>}
          {error && <p>{error}</p>}
          <button type='submit'>Submit</button>
        </form>
      )
    }

    render(<RaceForm />)

    // Submit; the action stays pending
    fireEvent.submit(screen.getByText('Submit').closest('form') as Element)

    // A failing validating blur while the submission is in flight
    const input = screen.getByLabelText('Name') as HTMLInputElement
    fireEvent.change(input, { target: { value: 'Iv' } })
    fireEvent.blur(input)

    await waitFor(() => {
      expect(screen.getByText('Name is too short')).toBeDefined()
    })

    // The response lands last, so the server run is displayed alone: the
    // error-only response must not mix with the local field error
    resolveResponse?.({ error: 'This name is taken' })

    await waitFor(() => {
      expect(screen.getByText('This name is taken')).toBeDefined()
      expect(screen.queryByText('Name is too short')).toBeNull()
    })
  })

  test('a local validation finishing after the response supersedes it', async () => {
    let resolveResponse:
      | ((state: FormState<SignupInput, string>) => void)
      | undefined
    let resolveValidation:
      | ((result: StandardSchemaV1.Result<SignupInput>) => void)
      | undefined

    const action: FormAction<SignupInput, string> = () =>
      new Promise((resolve) => {
        resolveResponse = resolve
      })

    // Valid input passes synchronously (the submit path); invalid input
    // hangs until the test resolves it (the mid-flight blur path)
    const deferredSchema: StandardSchemaV1<
      Record<string, unknown>,
      SignupInput
    > = {
      '~standard': {
        version: 1,
        vendor: 'safe-form-test',
        validate(value) {
          const input = value as { name?: unknown }

          if (typeof input.name === 'string' && input.name.length >= 3) {
            return { value: { name: input.name } }
          }

          return new Promise((resolve) => {
            resolveValidation = resolve
          })
        }
      }
    }

    function LateValidationForm() {
      const { bindField, connect, error, fieldErrors } = useForm<
        SignupInput,
        string
      >({
        action,
        validateOnBlur: true,
        initialValues: { name: 'Ivan' },
        schema: deferredSchema
      })

      return (
        <form {...connect()}>
          <label htmlFor='late-name'>Name</label>
          <input {...bindField('name')} id='late-name' />
          {fieldErrors.name && <span>{fieldErrors.name.first}</span>}
          {error && <p>{error}</p>}
          <button type='submit'>Submit</button>
        </form>
      )
    }

    render(<LateValidationForm />)

    // Submit (validation passes synchronously); the action stays pending
    fireEvent.submit(screen.getByText('Submit').closest('form') as Element)

    // A validating blur whose async validation stays in flight
    const input = screen.getByLabelText('Name') as HTMLInputElement
    fireEvent.change(input, { target: { value: 'Iv' } })
    fireEvent.blur(input)

    // Wait for the submission to reach the action, then respond: the
    // server response lands first and is displayed
    await waitFor(() => {
      expect(resolveResponse).toBeDefined()
    })
    resolveResponse?.({ error: 'This name is taken' })
    await waitFor(() => {
      expect(screen.getByText('This name is taken')).toBeDefined()
    })

    // The blur's validation finishes last, so its run wins
    resolveValidation?.({
      issues: [{ message: 'Name is too short', path: ['name'] }]
    })

    await waitFor(() => {
      expect(screen.getByText('Name is too short')).toBeDefined()
      expect(screen.queryByText('This name is taken')).toBeNull()
    })
  })
})
