'use server'

import { createFormAction, FormActionError } from '@'
import { exampleSchema } from './schema'

export const exampleAction = createFormAction(exampleSchema, async (input) => {
  if (input.attachment && input.attachment.size >= 1024 * 1024 * 10) {
    throw new FormActionError('The maximum file size is 10MB.') // Custom errors! 💜
  }

  return `Hello, ${input.name}! Your message is: ${input.message}.`
})
