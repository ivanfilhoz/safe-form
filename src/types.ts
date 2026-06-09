import type { StandardSchemaV1 } from '@standard-schema/spec'

export type FormInput = Record<string, unknown>

export type FormFieldErrors<Input extends FormInput> = {
  [field in keyof Input | string]?: {
    first: string | undefined
    all: string[]
    hasChildErrors: boolean
    rawErrors: StandardSchemaV1.Issue[]
  }
}

export type FormState<Input extends FormInput, FormResponse> = {
  response?: FormResponse
  error?: string
  fieldErrors?: FormFieldErrors<Input>
}

export type FormAction<Input extends FormInput, FormResponse> = (
  initialState: FormState<Input, FormResponse> | null,
  formData: FormData
) => Promise<FormState<Input, FormResponse>>

export type FormSchema<
  Input extends FormInput,
  Output extends FormInput = Input
> = StandardSchemaV1<Input, Output>

export type InferSchemaInput<Schema extends StandardSchemaV1> =
  StandardSchemaV1.InferInput<Schema>

export type InferSchemaOutput<Schema extends StandardSchemaV1> =
  StandardSchemaV1.InferOutput<Schema>
