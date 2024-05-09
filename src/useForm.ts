'use client'

import { createFormData } from '@/helpers/serializer'
import {
  FormHTMLAttributes,
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
import { flushSync, useFormState } from 'react-dom'
import { z } from 'zod'
import { parseValueFromInput } from './helpers/parseValueFromInput'
import { parseZodError } from './helpers/parseZodError'
import { FormAction, FormFieldErrors, FormInput, FormState } from './types'

type BindableField = HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement

type UseFormParams<Input extends FormInput, FormResponse> = {
  action: FormAction<Input, FormResponse>
  schema?: z.Schema<Input>
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
  connect: () => FormHTMLAttributes<HTMLFormElement>
  getAll: () => Input
  validateAll: () => boolean
  getField: <Field extends keyof Input>(name: Field) => Input[Field]
  setField: <Field extends keyof Input>(
    name: Field,
    value: Input[Field]
  ) => void
  validateField: <Field extends keyof Input>(name: Field) => boolean
  bindField: (name: keyof Input) => any // TODO: Fix this type
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
  const [formState, formAction] = useFormState(action, initialState ?? null)
  const [fieldErrors, setFieldErrors] = useState<FormFieldErrors<Input>>({})
  const [values, setValues] = useState<Input>(
    (initialValues as Input) ?? ({} as Input)
  )

  const getAll = useCallback(() => {
    // If there are no bound fields, just return values
    if (!inputRef.current) {
      return values
    }

    // Otherwise, get the values from the bound fields
    let _values: Record<string, unknown> = values
    for (const [field, ref] of Object.entries(inputRef.current)) {
      if (!ref?.current) {
        continue
      }

      _values[field] = parseValueFromInput(ref.current)
    }

    setValues({
      ...values,
      ...(_values as Input)
    })

    return _values as Input
  }, [inputRef, values])

  const validateAll = useCallback(() => {
    // Get all the values before validating
    const input = getAll()

    // If there is no schema, skip validation
    if (!schema) return true

    // Validate all fields
    const validation = schema.safeParse(input)

    if (!validation.success) {
      setFieldErrors(parseZodError(validation.error))
      return false
    }

    // Reset field errors if validation is successful
    setFieldErrors({})
    return true
  }, [setFieldErrors, schema, inputRef, getAll])

  const getField = useCallback(
    <Field extends keyof Input>(name: Field) => {
      return values[name]
    },
    [values]
  )

  const setField = useCallback(
    <Field extends keyof Input>(name: keyof Input, value: Input[Field]) => {
      setValues((values) => ({
        ...values,
        [name]: value
      }))
    },
    [inputRef, setValues]
  )

  const validateField = useCallback(
    <Field extends keyof Input>(name: Field) => {
      // If there is no schema, skip validation
      if (!schema) return true

      // If it's a bound field, get the value from the ref
      let value = values[name]
      if (inputRef.current?.[name]?.current) {
        value = parseValueFromInput(
          inputRef.current[name]!.current!
        ) as Input[Field]
      }

      const validation = schema.safeParse({
        [name]: value
      })

      // Validate a single field
      if (!validation.success) {
        const errors = parseZodError<Input>(validation.error)[name]

        if (errors) {
          setFieldErrors((fieldErrors) => ({
            ...fieldErrors,
            [name]: errors
          }))
          return false
        }
      }

      // Reset this field's error if validation is successful
      setFieldErrors((fieldErrors) => ({
        ...fieldErrors,
        [name]: undefined
      }))
      return true
    },
    [setFieldErrors, schema, inputRef, getAll]
  )

  const connect = useCallback(() => {
    return {
      onSubmit: async (event: SyntheticEvent<HTMLFormElement>) => {
        event.preventDefault()

        // Reset field errors
        setFieldErrors({})

        // If there is an onSubmit callback, call it
        if (onSubmit) {
          const shouldSubmit = await onSubmit(getAll())
          if (!shouldSubmit) return
        }

        // Validate all fields before submitting
        let validation = false
        flushSync(() => {
          validation = validateAll()
        })
        if (!validation) {
          return
        }

        // Create a FormData object from the values
        const formData = createFormData(values)

        // Call the server action
        startTransition(async () => {
          await formAction(formData)
        })
      },
      action: formAction
    } satisfies Pick<FormHTMLAttributes<HTMLFormElement>, 'onSubmit' | 'action'>
  }, [
    values,
    validateAll,
    setFieldErrors,
    formAction,
    startTransition,
    formAction
  ])

  const bindField = useCallback(
    (name: keyof Input) => {
      if (inputRef.current === null) {
        inputRef.current = {}
      }

      inputRef.current[name] = createRef()

      return {
        ref: inputRef.current[name],
        name: name.toString(),
        onBlur: validateOnBlur ? () => validateField(name) : undefined,
        onChange: validateOnChange ? () => validateField(name) : undefined
      } satisfies InputHTMLAttributes<HTMLInputElement> &
        RefAttributes<BindableField>
    },
    [inputRef, validateField, validateOnBlur, validateOnChange]
  )

  useEffect(() => {
    if (formState?.error || formState?.fieldErrors) {
      onError?.(formState?.error ?? null, formState?.fieldErrors ?? null)
    }
    if (formState?.response) {
      onSuccess?.(formState.response)
    }
  }, [formState])

  return {
    error: formState?.error ?? null,
    response: formState?.response ?? null,
    fieldErrors:
      formState?.fieldErrors ?? fieldErrors ?? ({} as FormFieldErrors<Input>),
    isPending,
    getAll,
    validateAll,
    getField,
    setField,
    validateField,
    connect,
    bindField
  }
}
