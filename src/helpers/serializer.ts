import { FormInput } from '../types'
const SCALARS_FIELD = '__safe-form-scalars'

export const createFormData = <Input extends FormInput>(values: Input) => {
  const formData = new FormData()
  let scalars: any = {}

  for (const [name, value] of Object.entries(values)) {
    // Handle files
    if (value instanceof File) {
      formData.append(name, value)
      continue
    }

    // Handle scalars
    scalars[name] = value
  }

  formData.append(SCALARS_FIELD, JSON.stringify(scalars))

  return formData
}

export const parseFormData = (formData: FormData): Record<string, unknown> => {
  const input: Record<string, unknown> = {}

  for (const [name, value] of Array.from(formData.entries())) {
    // Handle scalars
    if (name === SCALARS_FIELD) {
      const scalars = JSON.parse(value as string)
      for (const [name, value] of Object.entries(scalars)) {
        input[name] = value
      }
      continue
    }

    // Handle files
    input[name] = value
  }

  return input
}
