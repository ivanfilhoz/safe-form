'use server'
import { createFormAction } from '@/createFormAction'
import { helloSchema } from './schema'

export const helloAction = createFormAction(helloSchema, async (input) => {
  await new Promise((resolve) => setTimeout(resolve, 1000))
  return `Hello, ${input.name}!
  Your message is: ${input.message}.
  Your age is: ${input.age}.
  ${input.attachment ? `You attached a file with size ${input.attachment.size} bytes.` : ''}`
})
