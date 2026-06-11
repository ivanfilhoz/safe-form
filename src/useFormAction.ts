'use client'

import {
  useActionState,
  useCallback,
  useEffect,
  useRef,
  useTransition
} from 'react'
import { createFormData } from './helpers/serializer.js'
import {
  FormAction,
  FormFieldError,
  FormFieldErrors,
  FormInput,
  FormState
} from './types.js'

type UseFormActionParams<Input extends FormInput, FormResponse> = {
  action: FormAction<Input, FormResponse> | null
  initialState?: FormState<Input, FormResponse> | null
  onSuccess?: (response: FormResponse) => void
  onError?: (
    error: string | null,
    fieldErrors: FormFieldErrors<Input> | null,
    rootError: FormFieldError | null
  ) => void
}

type UseFormActionReturn<Input extends FormInput, FormResponse> = {
  error: string | null
  response: FormResponse | null
  fieldErrors: FormFieldErrors<Input> | null
  rootError: FormFieldError | null
  isPending: boolean
  formAction: (payload: FormData) => void
  submit: (input: Input) => void
}

export const useFormAction = <Input extends FormInput, FormResponse>({
  action,
  initialState,
  onSuccess,
  onError
}: UseFormActionParams<Input, FormResponse>): UseFormActionReturn<
  Input,
  FormResponse
> => {
  const [isTransitionPending, startTransition] = useTransition()
  const onSuccessRef = useRef(onSuccess)
  const onErrorRef = useRef(onError)
  const [formState, formAction, isActionPending] = useActionState<
    FormState<Input, FormResponse> | null,
    FormData
  >(action ?? (async () => null), initialState ?? null)

  useEffect(() => {
    onSuccessRef.current = onSuccess
  }, [onSuccess])

  useEffect(() => {
    onErrorRef.current = onError
  }, [onError])

  const submit = useCallback(
    async (input: Input) => {
      // If there is no action, skip the submission
      if (!action) return

      // Create a FormData object from the values
      const formData = createFormData(input)

      // Call the server action
      startTransition(() => {
        formAction(formData)
      })
    },
    [formAction, action]
  )

  useEffect(() => {
    if (formState?.error || formState?.fieldErrors || formState?.rootError) {
      onErrorRef.current?.(
        formState?.error ?? null,
        formState?.fieldErrors ?? null,
        formState?.rootError ?? null
      )
    }
    if (formState?.response) {
      onSuccessRef.current?.(formState.response)
    }
  }, [formState])

  return {
    error: formState?.error ?? null,
    response: formState?.response ?? null,
    fieldErrors: formState?.fieldErrors ?? null,
    rootError: formState?.rootError ?? null,
    isPending: isActionPending || isTransitionPending,
    formAction,
    submit
  }
}
