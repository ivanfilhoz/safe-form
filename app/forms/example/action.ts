'use server'

import { createFormAction, FormActionError } from '@'
import { exampleSchema } from './schema'

export const exampleAction = createFormAction(exampleSchema, async (input) => {
  if (input.name === 'Joe') {
    throw new FormActionError('Joe is not allowed to send messages.') // Custom errors! 💜
  }

  return `Hello, ${input.name}! Your message is: ${input.message}`
})
