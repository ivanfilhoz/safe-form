import { z } from 'zod'
import { FormActionError } from './FormActionError'
import { parseZodError } from './helpers/parseZodError'
import { parseFormData } from './helpers/serializer'
import { FormAction, FormInput, FormState } from './types'

export const createFormAction = <Input extends FormInput, FormResponse>(
  schema: z.Schema<Input>,
  handler: (
    validatedInput: Input,
    initialState?: FormState<Input, FormResponse> | null
  ) => Promise<FormResponse>
): FormAction<Input, FormResponse> => {
  return async (initialState, formData) => {
    const input = parseFormData(formData)
    const validatedInput = schema.safeParse(input)

    if (!validatedInput.success) {
      return {
        fieldErrors: parseZodError<Input>(validatedInput.error)
      }
    }

    try {
      const output = await handler(validatedInput.data, initialState)

      return {
        response: output
      }
    } catch (error: unknown) {
      if (error instanceof FormActionError) {
        return { error: error.message }
      }

      throw error
    }
  }
}

export { useForm } from './useForm'
