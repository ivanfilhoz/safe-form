'use client'

import { useForm } from '@'
import { exampleAction } from './action'
import { exampleSchema } from './schema'

export const HelloForm = () => {
  const { connect, bindField, isPending, error, fieldErrors, response } =
    useForm({
      action: exampleAction,
      schema: exampleSchema
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
      {error && <pre>{error}</pre>}
      {response && <div>{response}</div>}
    </form>
  )
}
