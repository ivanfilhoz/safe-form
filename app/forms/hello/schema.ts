import { z } from 'zod'

export const helloSchema = z.object({
  name: z.string().min(3, 'Name must be at least 3 characters'),
  age: z.number().int().min(18, 'You must be at least 18 years old'),
  message: z.string().min(10, 'Message must be at least 10 characters'),
  attachment: z.instanceof(File).nullable(),
  terms: z.boolean().refine((value) => value, 'You must accept the terms')
})
