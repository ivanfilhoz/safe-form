'use client'

import { createFormData } from '@/helpers/serializer'
import { useCallback, useEffect, useTransition } from 'react'
import { useFormState } from 'react-dom'
import { FormAction, FormFieldErrors, FormInput, FormState } from './types'

type UseFormActionParams<Input extends FormInput, FormResponse> = {
  action: FormAction<Input, FormResponse> | null
  initialState?: FormState<Input, FormResponse> | null
  onSuccess?: (response: FormResponse) => void
  onError?: (
    error: string | null,
    fieldErrors: FormFieldErrors<Input> | null
  ) => void
}

type UseFormActionReturn<Input extends FormInput, FormResponse> = {
  error: string | null
  response: FormResponse | null
  fieldErrors: FormFieldErrors<Input> | null
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
  const [isPending, startTransition] = useTransition()
  const [formState, formAction] = useFormState(
    action ?? (() => null),
    initialState ?? null
  )

  const submit = useCallback(
    async (input: Input) => {
      // If there is no action, skip the submission
      if (!action) return

      // Create a FormData object from the values
      const formData = createFormData(input)

      // Call the server action
      startTransition(async () => {
        await formAction(formData)
      })
    },
    [formAction, action]
  )

  useEffect(() => {
    if (formState?.error || formState?.fieldErrors) {
      onError?.(formState?.error ?? null, formState?.fieldErrors ?? null)
    }
    if (formState?.response) {
      onSuccess?.(formState.response)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formState])

  return {
    error: formState?.error ?? null,
    response: formState?.response ?? null,
    fieldErrors: formState?.fieldErrors ?? null,
    isPending,
    formAction,
    submit
  }
}
