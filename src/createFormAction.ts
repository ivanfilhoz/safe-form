import type { StandardSchemaV1 } from '@standard-schema/spec'
import { FormActionError } from './FormActionError.js'
import { parseFormData } from './helpers/serializer.js'
import {
  parseStandardSchemaIssues,
  validateStandardSchema
} from './helpers/standardSchema.js'
import { FormAction, FormInput, FormState } from './types.js'

export const createFormAction = <
  Schema extends StandardSchemaV1<FormInput, FormInput>,
  FormResponse
>(
  schema: Schema,
  handler: (
    validatedInput: StandardSchemaV1.InferOutput<Schema>,
    initialState?: FormState<
      StandardSchemaV1.InferOutput<Schema>,
      FormResponse
    > | null
  ) => Promise<FormResponse>
): FormAction<StandardSchemaV1.InferOutput<Schema>, FormResponse> => {
  return async (initialState, formData) => {
    const input = parseFormData(formData)
    const validation = await validateStandardSchema(schema, input)

    if (!validation.success) {
      return {
        fieldErrors: parseStandardSchemaIssues<
          StandardSchemaV1.InferOutput<Schema>
        >(validation.issues)
      }
    }

    try {
      const output = await handler(validation.value, initialState)

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
