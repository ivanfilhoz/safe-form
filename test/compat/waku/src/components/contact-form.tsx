'use client'

import { useForm } from 'safe-form/client'
import { contactAction } from '../actions/contact'
import { contactSchema } from '../schema'

export function ContactForm() {
  const { bindField, connect, error, fieldErrors, isPending, response } =
    useForm({
      action: contactAction,
      schema: contactSchema
    })

  return (
    <form {...connect()}>
      <input {...bindField('email')} />
      {fieldErrors.email && <span>{fieldErrors.email.first}</span>}
      <textarea {...bindField('message')} />
      {fieldErrors.message && <span>{fieldErrors.message.first}</span>}
      <button disabled={isPending}>Send</button>
      {error && <p>{error}</p>}
      {response && <p>{response.deliveredTo}</p>}
    </form>
  )
}
