import type { StandardSchemaV1 } from '@standard-schema/spec'
import { FormFieldError, FormFieldErrors, FormInput } from '../types.js'
import { shallowEqual } from './shallowEqual.js'

export type ParsedSchemaIssues<Input extends FormInput> = {
  fieldErrors: FormFieldErrors<Input>
  rootError?: FormFieldError
}

export type StandardSchemaValidationResult<Output> =
  | {
      success: true
      value: Output
    }
  | {
      success: false
      issues: ReadonlyArray<StandardSchemaV1.Issue>
    }

const pathSegmentToKey = (
  segment: PropertyKey | StandardSchemaV1.PathSegment
): PropertyKey => {
  if (typeof segment === 'object' && segment !== null && 'key' in segment) {
    return segment.key
  }

  return segment
}

export const getIssuePath = (issue: StandardSchemaV1.Issue): PropertyKey[] => {
  return issue.path?.map(pathSegmentToKey) ?? []
}

export const parseStandardSchemaIssues = <Input extends FormInput>(
  issues: ReadonlyArray<StandardSchemaV1.Issue>
): ParsedSchemaIssues<Input> => {
  const issuesByField = new Map<string, StandardSchemaV1.Issue[]>()
  const rootIssues: StandardSchemaV1.Issue[] = []

  for (const issue of issues) {
    const [field] = getIssuePath(issue)

    if (field === undefined) {
      rootIssues.push(issue)
      continue
    }

    const key = String(field)
    issuesByField.set(key, [...(issuesByField.get(key) ?? []), issue])
  }

  const fieldErrors: Record<string, FormFieldError> = {}

  for (const [key, rawErrors] of issuesByField) {
    // Top-level messages: the issue points at the field itself, not a child
    const all = rawErrors
      .filter((issue) => shallowEqual(getIssuePath(issue), [key]))
      .map((issue) => issue.message)

    fieldErrors[key] = {
      first: all[0],
      all,
      hasChildErrors: rawErrors.length > all.length,
      rawErrors
    }
  }

  const rootError: FormFieldError | undefined = rootIssues.length
    ? {
        first: rootIssues[0].message,
        all: rootIssues.map((issue) => issue.message),
        hasChildErrors: false,
        rawErrors: rootIssues
      }
    : undefined

  return {
    fieldErrors: fieldErrors as FormFieldErrors<Input>,
    rootError
  }
}

export const validateStandardSchema = async <Schema extends StandardSchemaV1>(
  schema: Schema,
  input: unknown
): Promise<
  StandardSchemaValidationResult<StandardSchemaV1.InferOutput<Schema>>
> => {
  const result = await schema['~standard'].validate(input)

  if (result.issues) {
    return {
      success: false,
      issues: result.issues
    }
  }

  return {
    success: true,
    value: result.value
  }
}
