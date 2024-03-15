import { z } from 'zod'
import { FormFieldErrors, FormInput } from '..'

export const parseZodError = <Input extends FormInput>(
  error: z.ZodError
): FormFieldErrors<Input> => {
  return error.flatten().fieldErrors as FormFieldErrors<Input>
}
