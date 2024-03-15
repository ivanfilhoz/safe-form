'use client'

import { useForm } from '@'
import { helloAction } from './action'
import { helloSchema } from './schema'

type Props = {
  validateOnBlur?: boolean
  validateOnChange?: boolean
  clientValidation?: boolean
}

export const HelloForm = ({
  validateOnBlur,
  validateOnChange,
  clientValidation
}: Props) => {
  const {
    connect,
    bindField,
    error,
    fieldErrors,
    response,
    isPending,
    getField,
    setField,
    validateField
  } = useForm({
    action: helloAction,
    schema: clientValidation ? helloSchema : undefined,
    initialValues: {
      name: '',
      message: ''
    },
    validateOnBlur: validateOnBlur,
    validateOnChange: validateOnChange,
    onSubmit: (input) => {
      console.log('submit handler', input)
      return true
    },
    onSuccess: (response) => {
      console.log('success handler', response)
    },
    onError: (error, fieldErrors) => {
      console.log('error handler', error, fieldErrors)
    }
  })

  return (
    <form {...connect()} className='flex flex-col w-[320px] gap-1 mt-4'>
      <label htmlFor='name'>Name</label>
      <input {...bindField('name')} autoComplete='off' />
      {fieldErrors.name && (
        <div className='text-sm text-red-500'>{fieldErrors.name}</div>
      )}
      <label htmlFor='age'>Age</label>
      <input {...bindField('age')} type='number' autoComplete='off' />
      {fieldErrors.age && (
        <div className='text-sm text-red-500'>{fieldErrors.age}</div>
      )}
      <label htmlFor='message'>Message</label>
      <input
        value={getField('message')}
        onChange={(e) => setField('message', e.target.value)}
        onBlur={() => validateField('message')}
      />
      {fieldErrors.message && (
        <div className='text-sm text-red-500'>{fieldErrors.message}</div>
      )}
      <label htmlFor='terms'>
        <input {...bindField('terms')} type='checkbox' autoComplete='off' /> I
        accept the terms
      </label>
      {fieldErrors.terms && (
        <div className='text-sm text-red-500'>{fieldErrors.terms}</div>
      )}
      <button type='submit' disabled={isPending}>
        Submit
      </button>
      {error && <div className='text-sm text-red-500'>{error}</div>}
      {response && <div>{response}</div>}
    </form>
  )
}
