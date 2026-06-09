'use server'

import { createFormAction, FormActionError } from 'safe-form/server'
import { profileSchema } from './schema'

export const updateProfileAction = createFormAction(
  profileSchema,
  async (input) => {
    if (input.displayName.toLowerCase() === 'admin') {
      throw new FormActionError('This display name is reserved.')
    }

    return {
      savedDisplayName: input.displayName,
      hasBio: Boolean(input.bio)
    }
  }
)
