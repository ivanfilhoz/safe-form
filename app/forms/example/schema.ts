import { z } from 'zod'

export const exampleSchema = z.object({
  name: z.string().min(3, 'Name must be at least 3 characters'),
  message: z.string().min(10, 'Message must be at least 10 characters')
})
