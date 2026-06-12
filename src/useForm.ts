'use client'

import {
  createRef,
  FormHTMLAttributes,
  HTMLAttributes,
  InputHTMLAttributes,
  RefAttributes,
  RefObject,
  SyntheticEvent,
  useCallback,
  useRef,
  useState
} from 'react'
import { parseValueFromInput } from './helpers/parseValueFromInput.js'
import { shallowEqual } from './helpers/shallowEqual.js'
import {
  getIssuePath,
  parseStandardSchemaIssues,
  validateStandardSchema
} from './helpers/standardSchema.js'
import {
  FormAction,
  FormFieldError,
  FormFieldErrors,
  FormInput,
  FormSchema,
  FormState
} from './types.js'
import { useFormAction } from './useFormAction.js'

type BindableField = HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
type FieldDefaultValue = InputHTMLAttributes<HTMLInputElement>['defaultValue']

// Stable identity for the no-errors case
const NO_FIELD_ERRORS: FormFieldErrors<FormInput> = Object.freeze({})

const getInputDateValue = (value: Date) => value.toISOString().slice(0, 10)

const getStringValue = (value: unknown) => {
  if (value === null || value === undefined) return ''
  if (typeof value === 'string' || typeof value === 'number') return value
  if (typeof value === 'boolean') return value ? 'true' : 'false'
  if (value instanceof Date) return getInputDateValue(value)

  return String(value)
}

const getDefaultValue = (value: unknown): FieldDefaultValue => {
  if (value === null || value === undefined) return ''
  if (typeof value === 'string' || typeof value === 'number') return value
  if (value instanceof Date) return getInputDateValue(value)
  if (Array.isArray(value) && value.every((item) => typeof item === 'string')) {
    return value
  }

  return String(value)
}

const setElementValue = (element: BindableField, value: unknown) => {
  if (element instanceof HTMLInputElement) {
    if (element.type === 'checkbox') {
      element.checked = Boolean(value)
      return
    }

    if (element.type === 'radio') {
      element.checked = value !== null && element.value === String(value)
      return
    }

    if (element.type === 'date') {
      const date =
        value instanceof Date ? value : value ? new Date(String(value)) : null

      element.valueAsDate = date && !Number.isNaN(date.getTime()) ? date : null
      return
    }

    if (element.type === 'file') {
      if (value === null || value === undefined) {
        element.value = ''
      }
      return
    }

    element.value = String(getStringValue(value))
    return
  }

  if (element instanceof HTMLSelectElement && element.multiple) {
    const selectedValues = new Set(
      Array.isArray(value) ? value.map((item) => String(item)) : []
    )

    for (const option of element.options) {
      option.selected = selectedValues.has(option.value)
    }
    return
  }

  element.value = String(getStringValue(value))
}

type UseFormParams<Input extends FormInput, FormResponse> = {
  action?: FormAction<Input, FormResponse> | null
  schema?: FormSchema<FormInput, Input>
  initialState?: FormState<Input, FormResponse> | null
  initialValues?: Partial<Input>
  validateOnBlur?: boolean
  validateOnChange?: boolean
  onSubmit?: (input: Input) => boolean | void | Promise<boolean | void>
  onSuccess?: (response: FormResponse) => void
  onError?: (
    error: string | null,
    fieldErrors: FormFieldErrors<Input> | null,
    rootError: FormFieldError | null
  ) => void
}

type UseFormReturn<Input extends FormInput, FormResponse> = {
  error: string | null
  response: FormResponse | null
  fieldErrors: FormFieldErrors<Input>
  rootError: FormFieldError | null
  isPending: boolean
  isDirty: boolean
  reset: () => void
  submit: () => Promise<void>
  getValues: () => Partial<Input>
  setValues: (values: Partial<Input>) => void
  connect: () => FormHTMLAttributes<HTMLFormElement>
  validate: () => Promise<
    | {
        success: true
        value: Input
      }
    | {
        success: false
        fieldErrors: FormFieldErrors<Input>
        rootError: FormFieldError | null
      }
  >
  getField: <Field extends keyof Input>(name: Field) => Input[Field] | undefined
  setField: <Field extends keyof Input>(
    name: Field,
    value: Input[Field],
    validate?: boolean
  ) => void
  validateField: <Field extends keyof Input>(name: Field) => Promise<boolean>
  bindField: (name: keyof Input) => HTMLAttributes<BindableField>
  getFieldErrorByPath: <Field extends keyof Input>(
    path: [Field, ...(string | number)[]]
  ) => string | undefined
}

export const useForm = <Input extends FormInput, FormResponse>({
  action,
  schema,
  initialState,
  initialValues = {},
  validateOnBlur,
  validateOnChange,
  onSubmit,
  onSuccess,
  onError
}: UseFormParams<Input, FormResponse>): UseFormReturn<Input, FormResponse> => {
  type ReturnObject = UseFormReturn<Input, FormResponse>

  const {
    isPending,
    formAction,
    submit: serverSubmit,
    error: serverError,
    response: serverResponse,
    fieldErrors: serverFieldErrors,
    rootError: serverRootError
  } = useFormAction({
    action: action ?? null,
    initialState,
    onSuccess: (response) => {
      setIsDirty(false)
      setServerErrorsStale(false)
      onSuccess?.(response)
    },
    onError: (error, fieldErrors, rootError) => {
      setServerErrorsStale(false)
      onError?.(error, fieldErrors, rootError)
    }
  })

  const inputRef = useRef<
    { [field in keyof Input]?: RefObject<BindableField | null> } | null
  >(null)
  const [isDirty, setIsDirty] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<FormFieldErrors<Input>>({})
  const [rootError, setRootError] = useState<FormFieldError | null>(null)
  // Whether a client-side validation run has superseded the last server
  // response, so displayed errors never mix two validation runs
  const [serverErrorsStale, setServerErrorsStale] = useState(false)
  const values = useRef<Partial<Input>>(initialValues)
  const [, setFlushToggle] = useState(false)

  const flush = useCallback(() => {
    setFlushToggle((toggle) => !toggle)
  }, [])

  const reset = useCallback<ReturnObject['reset']>(() => {
    values.current = initialValues
    setFieldErrors({})
    setRootError(null)
    setServerErrorsStale(true)
    setIsDirty(false)
    flush()
  }, [flush, initialValues])

  const getValues = useCallback<ReturnObject['getValues']>(() => {
    return values.current
  }, [])

  const setValues = useCallback<ReturnObject['setValues']>(
    (newValues, rerender = true) => {
      // Set the dirty state if the values have changed
      if (
        Object.keys(newValues).some(
          (key) => newValues[key] !== values.current[key]
        )
      ) {
        setIsDirty(true)
      }

      values.current = {
        ...values.current,
        ...newValues
      }

      // If there are bound fields, update their values
      if (inputRef.current) {
        for (const name in newValues) {
          const ref = inputRef.current?.[name]
          if (ref?.current) {
            setElementValue(ref.current, newValues[name])
          }
        }
      }

      if (rerender) {
        flush()
      }
    },
    [flush]
  )

  const validate = useCallback<ReturnObject['validate']>(async () => {
    // This validation run supersedes the last server response
    setServerErrorsStale(true)

    // If there is no schema, skip validation
    if (!schema) {
      return {
        success: true,
        value: values.current as Input
      }
    }

    // Validate all fields
    const validation = await validateStandardSchema(schema, values.current)

    // Mark again when committing results, so this run also supersedes any
    // server response that landed while the validation was in flight
    setServerErrorsStale(true)

    if (!validation.success) {
      const { fieldErrors, rootError } = parseStandardSchemaIssues<Input>(
        validation.issues
      )
      setFieldErrors(fieldErrors)
      setRootError(rootError ?? null)
      return {
        success: false,
        fieldErrors,
        rootError: rootError ?? null
      }
    }

    // Reset errors if validation is successful
    setFieldErrors({})
    setRootError(null)
    return {
      success: true,
      value: validation.value
    }
  }, [schema])

  const validateField = useCallback<ReturnObject['validateField']>(
    async (name) => {
      const value = values.current[name]

      // If there is no schema, skip validation
      if (!schema) return true

      // This validation run supersedes the last server response
      setServerErrorsStale(true)

      // Validate a single field
      const validation = await validateStandardSchema(schema, {
        [name]: value
      })

      // Mark again when committing results, so this run also supersedes any
      // server response that landed while the validation was in flight
      setServerErrorsStale(true)

      if (!validation.success) {
        const errors = parseStandardSchemaIssues<Input>(validation.issues)
          .fieldErrors[name]

        if (errors) {
          setFieldErrors((fieldErrors) => ({
            ...fieldErrors,
            [name]: errors
          }))

          // The field is invalid
          return false
        }
      }

      // Reset this field's error if validation is successful
      setFieldErrors((fieldErrors) => ({
        ...fieldErrors,
        [name]: undefined
      }))

      // The field is valid
      return true
    },
    [schema]
  )

  const getField = useCallback<ReturnObject['getField']>((name) => {
    return values.current[name]
  }, [])

  const setField = useCallback<ReturnObject['setField']>(
    (name, value, validate = true) => {
      // Set the dirty state if the value has changed
      if (value !== values.current[name]) {
        setIsDirty(true)
      }

      values.current = {
        ...values.current,
        [name]: value
      }

      // If there is a bound field, update its value
      const ref = inputRef.current?.[name]
      if (ref?.current) {
        setElementValue(ref.current, value)
      }

      // Either validate or just flush the state
      if (validate) {
        validateField(name)
      } else {
        flush()
      }
    },
    [flush, validateField]
  )

  const bindField = useCallback<ReturnObject['bindField']>(
    (name) => {
      if (inputRef.current === null) {
        inputRef.current = {}
      }

      inputRef.current[name] = createRef()

      const mutate = (name: keyof Input, validate: boolean = true) => {
        const ref = inputRef.current?.[name]
        if (!ref?.current) return

        const newValue = parseValueFromInput(ref.current) as Input[keyof Input]

        setField(name, newValue, validate)
      }

      const initialValue = initialValues?.[name]

      return {
        ref: inputRef.current[name],
        name: name.toString(),
        // Booleans bind to checkboxes, where only defaultChecked applies
        ...(typeof initialValue === 'boolean'
          ? { defaultChecked: initialValue }
          : initialValue === null || initialValue === undefined
            ? {}
            : { defaultValue: getDefaultValue(initialValue) }),
        onBlur: () => mutate(name, validateOnBlur),
        onChange: validateOnChange ? () => mutate(name) : undefined
      } satisfies InputHTMLAttributes<HTMLInputElement> &
        RefAttributes<BindableField>
    },
    [setField, validateOnBlur, validateOnChange, initialValues]
  )

  // Displayed errors always come from a single validation run: the latest
  // server response, unless a client-side run has superseded it. When the
  // server is authoritative there is no fallback to local state — local
  // errors are by definition older than the server response.
  const displayedError = serverErrorsStale ? null : serverError
  const displayedFieldErrors = serverErrorsStale
    ? fieldErrors
    : (serverFieldErrors ?? (NO_FIELD_ERRORS as FormFieldErrors<Input>))
  const displayedRootError = serverErrorsStale ? rootError : serverRootError

  const getFieldErrorByPath = useCallback<ReturnObject['getFieldErrorByPath']>(
    ([fieldName, ...subpath]) => {
      return displayedFieldErrors[fieldName]?.rawErrors.find((e) =>
        shallowEqual(getIssuePath(e), [fieldName, ...subpath])
      )?.message
    },
    [displayedFieldErrors]
  )

  const submit = useCallback<ReturnObject['submit']>(async () => {
    // Reset errors
    setFieldErrors({})
    setRootError(null)

    // Validate all fields before submitting
    const validation = await validate()
    if (!validation.success) {
      onError?.(null, validation.fieldErrors, validation.rootError)
      return
    }

    // Parse the form values
    const input = validation.value

    // If there is an onSubmit callback, call it
    if (onSubmit) {
      const shouldSubmit = await onSubmit(input)

      // If the callback explicitly returns false, skip the server action
      if (shouldSubmit === false) return
    }

    // Submit the server action
    serverSubmit(input)
  }, [validate, onSubmit, onError, serverSubmit])

  const connect = useCallback<ReturnObject['connect']>(() => {
    return {
      // Patch the onSubmit event to call the submit function
      onSubmit: async (event: SyntheticEvent<HTMLFormElement>) => {
        event.preventDefault()
        event.stopPropagation()

        await submit()
      },
      // Pass the form action as a graceful fallback
      action: formAction
    } satisfies Pick<FormHTMLAttributes<HTMLFormElement>, 'onSubmit' | 'action'>
  }, [submit, formAction])

  return {
    error: displayedError,
    response: serverResponse,
    fieldErrors: displayedFieldErrors,
    rootError: displayedRootError,
    isPending,
    isDirty,
    reset,
    submit,
    getValues,
    setValues,
    connect,
    validate,
    getField,
    setField,
    validateField,
    bindField,
    getFieldErrorByPath
  }
}
