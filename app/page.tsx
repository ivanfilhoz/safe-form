'use client'

import { useState } from 'react'
import { HelloForm } from './forms/hello'

export default function Home() {
  const [validateOnBlur, setValidateOnBlur] = useState(false)
  const [validateOnChange, setValidateOnChange] = useState(false)
  const [clientValidation, setClientValidation] = useState(false)

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
    </main>
  )
}
