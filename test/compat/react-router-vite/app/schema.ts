import type { StandardSchemaV1 } from '@standard-schema/spec'

type SignupInput = {
  email?: unknown
}

export type Signup = {
  email: string
}

export const signupSchema: StandardSchemaV1<SignupInput, Signup> = {
  '~standard': {
    version: 1,
    vendor: 'safe-form-compat',
    validate(value) {
      const input = value as SignupInput

      if (typeof input.email !== 'string' || !input.email.includes('@')) {
        return {
          issues: [
            {
              message: 'Email is required',
              path: ['email']
            }
          ]
        }
      }

      return {
        value: {
          email: input.email.toLowerCase()
        }
      }
    }
  }
}
