import { z } from 'zod'

export const profileSchema = z.object({
  displayName: z.string().min(2, 'Display name is required'),
  bio: z.string().max(120, 'Bio must be at most 120 characters').optional()
})
