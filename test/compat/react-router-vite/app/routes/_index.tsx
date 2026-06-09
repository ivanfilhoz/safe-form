import { signupAction } from '../actions'
import { SignupForm } from './signup.client'

type ActionArgs = {
  request: Request
}

export async function action({ request }: ActionArgs) {
  return signupAction(null, await request.formData())
}

export default function Route() {
  return <SignupForm />
}
