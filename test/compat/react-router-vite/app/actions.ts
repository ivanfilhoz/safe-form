import { createFormAction } from 'safe-form/server'
import { signupSchema } from './schema'

export const signupAction = createFormAction(signupSchema, async (input) => {
  return {
    subscribed: input.email
  }
})
