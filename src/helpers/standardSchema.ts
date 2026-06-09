import type { StandardSchemaV1 } from '@standard-schema/spec'
import { FormFieldErrors, FormInput } from '../types.js'
import { shallowEqual } from './shallowEqual.js'

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
): FormFieldErrors<Input> => {
  const issuesByField = new Map<string, StandardSchemaV1.Issue[]>()

  for (const issue of issues) {
    const [field = '_root'] = getIssuePath(issue)
    const key = String(field)
    issuesByField.set(key, [...(issuesByField.get(key) ?? []), issue])
  }

  return Array.from(issuesByField.entries()).reduce<FormFieldErrors<Input>>(
    (acc, [key, rawErrors]) => {
      const all = rawErrors
        .filter((issue) => shallowEqual(getIssuePath(issue), [key]))
        .map((issue) => issue.message)

      return {
        ...acc,
        [key]: {
          first: all[0],
          all,
          hasChildErrors: rawErrors.length > all.length,
          rawErrors
        }
      }
    },
    {}
  )
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
