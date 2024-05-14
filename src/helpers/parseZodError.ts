import { shallowEqual } from '@/helpers/shallowEqual'
import type { ZodError } from 'zod'
import { FormFieldErrors, FormInput } from '..'

export const parseZodError = <Input extends FormInput>(
  error: ZodError<Input>
): FormFieldErrors<Input> => {
  const { fieldErrors } = error.flatten()

  return Object.keys(fieldErrors).reduce((acc, key) => {
    const rawErrors = error.errors.filter((e) => e.path[0] === key)

    const all = rawErrors
      .filter((e) => shallowEqual(e.path, [key]))
      .map((issue) => issue.message)

    return {
      ...acc,
      [key]: {
        first: all[0],
        all,
        hasChildErrors: rawErrors.length > all.length,
        rawErrors
      } satisfies FormFieldErrors<Input>[typeof key]
    }
  }, {})
}
