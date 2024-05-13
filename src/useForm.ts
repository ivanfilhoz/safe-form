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
  action?: FormAction<Input, FormResponse>
  schema?: Schema<Input>
  initialState?: FormState<Input, FormResponse> | null
  initialValues?: Partial<Input>
  validateOnBlur?: boolean
  validateOnChange?: boolean
  onSubmit?: (input: Partial<Input>) => boolean | Promise<boolean>
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
  const inputRef = useRef<
    { [field in keyof Input]?: RefObject<BindableField> } | null
  >(null)
  const [isPending, startTransition] = useTransition()
  const [isDirty, setIsDirty] = useState(false)
  const [formState, formAction] = useFormState(
    action ?? (() => null),
    initialState ?? null
  )
  const [fieldErrors, setFieldErrors] = useState<FormFieldErrors<Input>>({})
  const values = useRef<Partial<Input>>(initialValues)
  const [flushToggle, setFlushToggle] = useState(false)

  const flush = useCallback(() => {
    setFlushToggle((toggle) => !toggle)
  }, [])

  const getValues = useCallback(() => {
    return values.current
  }, [])

  const setValues = useCallback(
    (newValues: Partial<Input>, rerender: boolean = true) => {
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
  }, [setFieldErrors, schema])

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
    [setFieldErrors, schema]
  )

  const getField = useCallback(<Field extends keyof Input>(name: Field) => {
    return values.current[name]
  }, [])

  const setField = useCallback(
    <Field extends keyof Input>(
      name: keyof Input,
      value: Input[Field],
      validate: boolean = true
    ) => {
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

  const bindField = useCallback(
    (name: keyof Input) => {
      if (inputRef.current === null) {
        inputRef.current = {}
      }

      inputRef.current[name] = createRef()

      const mutate = (name: keyof Input, validate: boolean = true) => {
        const ref = inputRef.current?.[name]
        if (!ref?.current) return

        const newValue = parseValueFromInput(ref.current) as Input[keyof Input]

        setField(name, newValue)
      }

      return {
        ref: inputRef.current[name],
        name: name.toString(),
        defaultValue: initialValues?.[name] ?? '',
        onBlur: () => {
          mutate(name, validateOnBlur)
        },
        onChange: validateOnChange ? () => mutate(name) : undefined
      } satisfies InputHTMLAttributes<HTMLInputElement> &
        RefAttributes<BindableField>
    },
    [inputRef, setField, validateOnBlur, validateOnChange, initialValues]
  )

  const connect = useCallback(() => {
    return {
      onSubmit: async (event: SyntheticEvent<HTMLFormElement>) => {
        event.preventDefault()

        // Reset field errors
        setFieldErrors({})

        // Validate all fields before submitting
        if (!validate()) {
          return
        }

        // If there is an onSubmit callback, call it
        if (onSubmit) {
          const shouldSubmit = await onSubmit(values.current)
          if (!shouldSubmit) return
        }

        // If there is no action, skip the submission
        if (!action) return

        // Create a FormData object from the values
        const formData = createFormData(values.current)

        // Call the server action
        startTransition(async () => {
          await formAction(formData)
        })
      },
      action: formAction
    } satisfies Pick<FormHTMLAttributes<HTMLFormElement>, 'onSubmit' | 'action'>
  }, [validate, setFieldErrors, startTransition, formAction, action, onSubmit])

  useEffect(() => {
    if (formState?.error || formState?.fieldErrors) {
      onError?.(formState?.error ?? null, formState?.fieldErrors ?? null)
    }
    if (formState?.response) {
      setIsDirty(false)
      onSuccess?.(formState.response)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
