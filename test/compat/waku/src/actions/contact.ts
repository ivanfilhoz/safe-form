'use server'

import { createFormAction, FormActionError } from 'safe-form/server'
import { contactSchema } from '../schema'

export const contactAction = createFormAction(contactSchema, async (input) => {
  if (input.email.endsWith('@blocked.test')) {
    throw new FormActionError('This email domain is blocked.')
  }

  return {
    deliveredTo: input.email,
    preview: input.message.slice(0, 10)
  }
})
