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
    isDirty,
    getValues,
    setValues,
    getField,
    setField,
    validateField,
    getFieldErrorByPath
  } = useForm({
    action: helloAction,
    schema: clientValidation ? helloSchema : undefined,
    initialValues: {
      name: 'Ivan Filho',
      message: '',
      contacts: []
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

  const contacts = getField('contacts') || []

  return (
    <form {...connect()} className='flex flex-col w-[320px] gap-1 mt-4'>
      <label htmlFor='name'>Name</label>
      <input {...bindField('name')} id='name' autoComplete='off' />
      {fieldErrors.name && (
        <div className='text-sm text-red-500'>{fieldErrors.name.first}</div>
      )}
      <button
        data-testid='button-foo'
        onClick={(event) => {
          event.preventDefault()
          setField('name', 'foo')
        }}
      >
        Set name to foo
      </button>
      <label htmlFor='age'>Age</label>
      <input {...bindField('age')} type='number' autoComplete='off' />
      {fieldErrors.age && (
        <div className='text-sm text-red-500'>{fieldErrors.age.first}</div>
      )}
      <label htmlFor='message'>Message</label>
      <input
        value={getField('message')}
        onChange={(e) => setField('message', e.target.value)}
        onBlur={() => validateField('message')}
      />
      {fieldErrors.message && (
        <div className='text-sm text-red-500'>{fieldErrors.message.first}</div>
      )}
      <label htmlFor='attachment'>Attachment</label>
      <input type='file' {...bindField('attachment')} />
      {fieldErrors.attachment && <pre>{fieldErrors.attachment.first}</pre>}
      <label htmlFor='terms'>
        <input {...bindField('terms')} type='checkbox' autoComplete='off' /> I
        accept the terms
      </label>
      {fieldErrors.terms && (
        <div className='text-sm text-red-500'>{fieldErrors.terms.first}</div>
      )}
      <label htmlFor='contacts'>Contacts</label>
      {contacts.map((contact, index) => {
        const setSubfield = (subfield: 'name' | 'email', value: string) =>
          setValues({
            ...getValues(),
            contacts: contacts.map((c, i) =>
              i === index ? { ...c, [subfield]: value } : c
            )
          })

        return (
          <div key={index} className='flex flex-col gap-1'>
            <label htmlFor='name'>Name</label>
            <input
              defaultValue={contact.name}
              onBlur={(e) => setSubfield('name', e.target.value)}
            />
            {fieldErrors.contacts && (
              <div className='text-sm text-red-500'>
                {getFieldErrorByPath(['contacts', index, 'name'])}
              </div>
            )}
            <label htmlFor='email'>Email</label>
            <input
              defaultValue={contact.email}
              onBlur={(e) => setSubfield('email', e.target.value)}
            />
            {fieldErrors.contacts && (
              <div className='text-sm text-red-500'>
                {getFieldErrorByPath(['contacts', index, 'email'])}
              </div>
            )}
            <button
              onClick={() =>
                setValues({
                  ...getValues(),
                  contacts: contacts.filter((_, i) => i !== index)
                })
              }
            >
              Remove
            </button>
          </div>
        )
      })}
      <button
        onClick={(event) => {
          event.preventDefault()
          setField('contacts', [...contacts, { name: '', email: '' }], false)
        }}
      >
        Add contact
      </button>
      <button type='submit' disabled={isPending}>
        Submit
      </button>
      {error && <div className='text-sm text-red-500'>{error}</div>}
      {response && <div>{response}</div>}
      <br />
      <pre>
        {JSON.stringify(
          {
            isPending,
            isDirty,
            values: getValues(),
            fieldErrors
          },
          null,
          2
        )}
      </pre>
    </form>
  )
}
