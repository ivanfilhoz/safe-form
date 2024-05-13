'use client'

import { useForm } from '@'
import { actionlessSchema } from './schema'

export const ActionlessForm = () => {
  const { connect, bindField, isPending, fieldErrors } = useForm({
    schema: actionlessSchema,
    onSubmit: async (values) => {
      console.log('Submitting form with values:', values)
      return true
    }
  })

  return (
    <form {...connect()}>
      <label htmlFor='name'>Name</label>
      <input {...bindField('name')} />
      {fieldErrors.name && <pre>{fieldErrors.name.first}</pre>}
      <br />
      <label htmlFor='message'>Message</label>
      <textarea {...bindField('message')} />
      {fieldErrors.message && <pre>{fieldErrors.message.first}</pre>}
      <br />
      <label htmlFor='attachment'>Attachment (optional)</label>
      <input type='file' {...bindField('attachment')} />
      {fieldErrors.attachment && <pre>{fieldErrors.attachment.first}</pre>}
      <button type='submit' disabled={isPending}>
        Submit
      </button>
      <br />
    </form>
  )
}
