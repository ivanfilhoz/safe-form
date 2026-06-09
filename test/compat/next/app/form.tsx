'use client'

import { useForm } from 'safe-form/client'
import { updateProfileAction } from './actions'
import { profileSchema } from './schema'

export function ProfileForm() {
  const { bindField, connect, error, fieldErrors, isPending, response } =
    useForm({
      action: updateProfileAction,
      schema: profileSchema
    })

  return (
    <form {...connect()}>
      <input {...bindField('displayName')} />
      {fieldErrors.displayName && <span>{fieldErrors.displayName.first}</span>}
      <textarea {...bindField('bio')} />
      {fieldErrors.bio && <span>{fieldErrors.bio.first}</span>}
      <button disabled={isPending}>Save</button>
      {error && <p>{error}</p>}
      {response && <p>{response.savedDisplayName}</p>}
    </form>
  )
}
