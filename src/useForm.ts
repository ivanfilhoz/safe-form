'use client'

import { shallowEqual } from '@/helpers/shallowEqual'
import { useFormAction } from '@/useFormAction'
import {
  FormHTMLAttributes,
  HTMLAttributes,
  InputHTMLAttributes,
  RefAttributes,
  RefObject,
  SyntheticEvent,
  createRef,
  useCallback,
  useRef,
  useState
} from 'react'
import type { Schema } from 'zod'
import { parseValueFromInput } from './helpers/parseValueFromInput'
import { parseZodError } from './helpers/parseZodError'
import { FormAction, FormFieldErrors, FormInput, FormState } from './types'

type BindableField = HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement

type UseFormParams<Input extends FormInput, FormResponse> = {
  action?: FormAction<Input, FormResponse> | null
  schema?: Schema<Input>
  initialState?: FormState<Input, FormResponse> | null
  initialValues?: Partial<Input>
  validateOnBlur?: boolean
  validateOnChange?: boolean
  onSubmit?: (input: Input) => boolean | Promise<boolean>
  onSuccess?: (response: FormResponse) => void
  onError?: (
    error: string | null,
    fieldErrors: FormFieldErrors<Input> | null
  ) => void
}

type UseFormReturn<Input extends FormInput, FormResponse> = {
  error: string | null
  response: FormResponse | null
  fieldErrors: FormFieldErrors<Input>
  isPending: boolean
  isDirty: boolean
  reset: () => void
  submit: () => void
  getValues: () => Partial<Input>
  setValues: (values: Partial<Input>) => void
  connect: () => FormHTMLAttributes<HTMLFormElement>
  validate: () => boolean
  getField: <Field extends keyof Input>(name: Field) => Input[Field] | undefined
  setField: <Field extends keyof Input>(
    name: Field,
    value: Input[Field],
    validate?: boolean
  ) => void
  validateField: <Field extends keyof Input>(name: Field) => boolean
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
    fieldErrors: serverFieldErrors
  } = useFormAction({
    action: action ?? null,
    initialState,
    onSuccess: (response) => {
      setIsDirty(false)
      onSuccess?.(response)
    },
    onError
  })

  const inputRef = useRef<
    { [field in keyof Input]?: RefObject<BindableField> } | null
  >(null)
  const [isDirty, setIsDirty] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<FormFieldErrors<Input>>({})
  const values = useRef<Partial<Input>>(initialValues)
  const [_, setFlushToggle] = useState(false)

  const flush = useCallback(() => {
    setFlushToggle((toggle) => !toggle)
  }, [])

  const reset = useCallback<ReturnObject['reset']>(() => {
    values.current = initialValues
    setFieldErrors({})
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
            ref.current.value = newValues[name] as string
          }
        }
      }

      if (rerender) {
        flush()
      }
    },
    [flush]
  )

  const validate = useCallback<ReturnObject['validate']>(() => {
    // If there is no schema, skip validation
    if (!schema) return true

    // Validate all fields
    const validation = schema.safeParse(values.current)

    if (!validation.success) {
      setFieldErrors(parseZodError(validation.error))
      return false
    }

    // Reset field errors if validation is successful
    setFieldErrors({})
    return true
  }, [setFieldErrors, schema])

  const validateField = useCallback<ReturnObject['validateField']>(
    (name) => {
      const value = values.current[name]

      // If there is no schema, skip validation
      if (!schema) return true

      // Validate a single field
      const validation = schema.safeParse({
        [name]: value
      })

      if (!validation.success) {
        const errors = parseZodError<Input>(validation.error)[name]

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
    [setFieldErrors, schema]
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
        ref.current.value = value as string
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

      return {
        ref: inputRef.current[name],
        name: name.toString(),
        defaultValue: initialValues?.[name] ?? '',
        onBlur: () => mutate(name, validateOnBlur),
        onChange: validateOnChange ? () => mutate(name) : undefined
      } satisfies InputHTMLAttributes<HTMLInputElement> &
        RefAttributes<BindableField>
    },
    [inputRef, setField, validateOnBlur, validateOnChange, initialValues]
  )

  const getFieldErrorByPath = useCallback<ReturnObject['getFieldErrorByPath']>(
    ([fieldName, ...subpath]) => {
      return fieldErrors[fieldName]?.rawErrors.find((e) =>
        shallowEqual(e.path, [fieldName, ...subpath])
      )?.message
    },
    [fieldErrors]
  )

  const submit = useCallback<ReturnObject['submit']>(async () => {
    // Reset field errors
    setFieldErrors({})

    // Validate all fields before submitting
    if (!validate()) {
      return
    }

    // Parse the form values
    const input = schema
      ? schema.parse(values.current)
      : (values.current as Input)

    // If there is an onSubmit callback, call it
    if (onSubmit) {
      const shouldSubmit = await onSubmit(input)
      if (!shouldSubmit) return
    }

    // Submit the server action
    serverSubmit(input)
  }, [schema, validate, values, onSubmit, serverSubmit])

  const connect = useCallback<ReturnObject['connect']>(() => {
    return {
      onSubmit: async (event: SyntheticEvent<HTMLFormElement>) => {
        event.preventDefault()
        event.stopPropagation()

        submit()
      },
      action: formAction
    } satisfies Pick<FormHTMLAttributes<HTMLFormElement>, 'onSubmit' | 'action'>
  }, [submit, formAction])

  return {
    error: serverError,
    response: serverResponse,
    fieldErrors:
      serverFieldErrors ?? fieldErrors ?? ({} as FormFieldErrors<Input>),
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
