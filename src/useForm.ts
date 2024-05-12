'use client'

import { createFormData } from '@/helpers/serializer'
import {
  FormHTMLAttributes,
  HTMLAttributes,
  InputHTMLAttributes,
  RefAttributes,
  RefObject,
  SyntheticEvent,
  createRef,
  useCallback,
  useEffect,
  useRef,
  useState,
  useTransition
} from 'react'
import { useFormState } from 'react-dom'
import type { Schema } from 'zod'
import { parseValueFromInput } from './helpers/parseValueFromInput'
import { parseZodError } from './helpers/parseZodError'
import { FormAction, FormFieldErrors, FormInput, FormState } from './types'

type BindableField = HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement

type UseFormParams<Input extends FormInput, FormResponse> = {
  action: FormAction<Input, FormResponse>
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
  getValues: () => Input
  setValues: (values: Input) => void
  connect: () => FormHTMLAttributes<HTMLFormElement>
  validate: () => boolean
  getField: <Field extends keyof Input>(name: Field) => Input[Field]
  setField: <Field extends keyof Input>(
    name: Field,
    value: Input[Field]
  ) => void
  validateField: <Field extends keyof Input>(name: Field) => boolean
  bindField: (name: keyof Input) => HTMLAttributes<BindableField>
}

export const useForm = <Input extends FormInput, FormResponse>({
  action,
  schema,
  initialState,
  initialValues,
  validateOnBlur,
  validateOnChange,
  onSubmit,
  onSuccess,
  onError
}: UseFormParams<Input, FormResponse>): UseFormReturn<Input, FormResponse> => {
  const inputRef = useRef<
    { [field in keyof Input]?: RefObject<BindableField> } | null
  >(null)
  const [isPending, startTransition] = useTransition()
  const [isDirty, setIsDirty] = useState(false)
  const [formState, formAction] = useFormState(action, initialState ?? null)
  const [fieldErrors, setFieldErrors] = useState<FormFieldErrors<Input>>({})
  const values = useRef<Input>(initialValues as Input)

  const getValues = useCallback(() => {
    return values.current
  }, [])

  const setValues = useCallback((newValues: Input) => {
    values.current = newValues
  }, [])

  const validate = useCallback(() => {
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
  }, [setFieldErrors, schema, inputRef])

  const getField = useCallback(
    <Field extends keyof Input>(name: Field) => {
      return values.current[name]
    },
    [values.current]
  )

  const setField = useCallback(
    <Field extends keyof Input>(name: keyof Input, value: Input[Field]) => {
      // Set the dirty state if the value has changed
      if (value !== initialValues?.[name]) {
        setIsDirty(true)
      }

      values.current = {
        ...values.current,
        [name]: value
      }

      validateField(name)
    },
    [inputRef]
  )

  const validateField = useCallback(
    <Field extends keyof Input>(name: Field) => {
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
    [setFieldErrors, schema, inputRef, values.current]
  )

  const bindField = useCallback(
    (name: keyof Input) => {
      if (inputRef.current === null) {
        inputRef.current = {}
      }

      inputRef.current[name] = createRef()

      const mutate = (name: keyof Input) => {
        const ref = inputRef.current?.[name]
        if (!ref?.current) return

        const newValue = parseValueFromInput(ref.current) as Input[keyof Input]

        setField(name, newValue)
      }

      return {
        ref: inputRef.current[name],
        name: name.toString(),
        defaultValue: initialValues?.[name] ?? '',
        onBlur: validateOnBlur ? () => mutate(name) : undefined,
        onChange: validateOnChange ? () => mutate(name) : undefined
      } satisfies InputHTMLAttributes<HTMLInputElement> &
        RefAttributes<BindableField>
    },
    [inputRef, setField, validateOnBlur, validateOnChange]
  )

  const connect = useCallback(() => {
    return {
      onSubmit: async (event: SyntheticEvent<HTMLFormElement>) => {
        event.preventDefault()

        // Reset field errors
        setFieldErrors({})

        // If there is an onSubmit callback, call it
        if (onSubmit) {
          const shouldSubmit = await onSubmit(values.current)
          if (!shouldSubmit) return
        }

        // Validate all fields before submitting
        if (!validate()) {
          return
        }

        // Create a FormData object from the values
        const formData = createFormData(values.current)

        // Call the server action
        startTransition(async () => {
          await formAction(formData)
        })
      },
      action: formAction
    } satisfies Pick<FormHTMLAttributes<HTMLFormElement>, 'onSubmit' | 'action'>
  }, [
    values.current,
    validate,
    setFieldErrors,
    formAction,
    startTransition,
    formAction
  ])

  useEffect(() => {
    if (formState?.error || formState?.fieldErrors) {
      onError?.(formState?.error ?? null, formState?.fieldErrors ?? null)
    }
    if (formState?.response) {
      setIsDirty(false)
      onSuccess?.(formState.response)
    }
  }, [formState])

  return {
    error: formState?.error ?? null,
    response: formState?.response ?? null,
    fieldErrors:
      formState?.fieldErrors ?? fieldErrors ?? ({} as FormFieldErrors<Input>),
    isPending,
    isDirty,
    getValues,
    setValues,
    connect,
    validate,
    getField,
    setField,
    validateField,
    bindField
  }
}
