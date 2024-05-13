'use client'

import { useState } from 'react'
import { ActionlessForm } from './forms/actionless/form'
import { HelloForm } from './forms/hello'

export default function Home() {
  const [validateOnBlur, setValidateOnBlur] = useState(true)
  const [validateOnChange, setValidateOnChange] = useState(false)
  const [clientValidation, setClientValidation] = useState(true)

  return (
    <main className='flex flex-col items-center'>
      <label htmlFor='clientValidation'>
        <input
          type='checkbox'
          id='clientValidation'
          checked={clientValidation}
          onChange={(e) => setClientValidation(e.target.checked)}
        />
        Client validation
      </label>
      <label htmlFor='validateOnBlur'>
        <input
          type='checkbox'
          id='validateOnBlur'
          disabled={!clientValidation}
          checked={clientValidation && validateOnBlur}
          onChange={(e) => setValidateOnBlur(e.target.checked)}
        />
        Validate on blur
      </label>
      <label htmlFor='validateOnBlur'>
        <input
          type='checkbox'
          id='validateOnChange'
          disabled={!clientValidation}
          checked={clientValidation && validateOnChange}
          onChange={(e) => setValidateOnChange(e.target.checked)}
        />
        Validate on change
      </label>
      <HelloForm
        validateOnBlur={validateOnBlur}
        validateOnChange={validateOnChange}
        clientValidation={clientValidation}
      />
      <hr className='my-4' />
      <ActionlessForm />
    </main>
  )
}
