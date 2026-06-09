import { useForm } from 'safe-form/client'
import { signupSchema } from '../schema'

export function SignupForm() {
  const { bindField, connect, fieldErrors, isPending } = useForm({
    schema: signupSchema
  })

  return (
    <form {...connect()}>
      <input {...bindField('email')} />
      {fieldErrors.email && <span>{fieldErrors.email.first}</span>}
      <button disabled={isPending}>Join</button>
    </form>
  )
}
