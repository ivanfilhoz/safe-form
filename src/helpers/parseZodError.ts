import type { ZodError } from 'zod'
import { FormFieldErrors, FormInput } from '..'

export const parseZodError = <Input extends FormInput>(
  error: ZodError<Input>
): FormFieldErrors<Input> => {
  const { fieldErrors } = error.flatten()

  return Object.keys(fieldErrors).reduce((acc, key) => {
    const fieldError = fieldErrors[key as keyof typeof fieldErrors] as string[]
    const first = fieldError?.[0]

    return {
      ...acc,
      [key]: {
        first,
        all: fieldError,
        rawErrors: error.errors
      } satisfies FormFieldErrors<Input>[typeof key]
    }
  }, {})
}
