import { FormHTMLAttributes } from 'react';
import { z } from 'zod';
import { FormAction, FormFieldErrors, FormInput, FormState } from './types';
type UseFormParams<Input extends FormInput, FormResponse> = {
    action: FormAction<Input, FormResponse>;
    schema?: z.Schema<Input>;
    initialState?: FormState<Input, FormResponse> | null;
    initialValues?: Partial<Input>;
    validateOnBlur?: boolean;
    validateOnChange?: boolean;
    onSubmit?: (input: Input) => boolean | Promise<boolean>;
    onSuccess?: (response: FormResponse) => void;
    onError?: (error: string | null, fieldErrors: FormFieldErrors<Input> | null) => void;
};
type UseFormReturn<Input extends FormInput, FormResponse> = {
    error: string | null;
    response: FormResponse | null;
    fieldErrors: FormFieldErrors<Input>;
    isPending: boolean;
    connect: () => FormHTMLAttributes<HTMLFormElement>;
    getAll: () => Input;
    validateAll: () => boolean;
    getField: <Field extends keyof Input>(name: Field) => Input[Field];
    setField: <Field extends keyof Input>(name: Field, value: Input[Field]) => void;
    validateField: <Field extends keyof Input>(name: Field) => boolean;
    bindField: (name: keyof Input) => any;
};
export declare const useForm: <Input extends FormInput, FormResponse>({ action, schema, initialState, initialValues, validateOnBlur, validateOnChange, onSubmit, onSuccess, onError }: UseFormParams<Input, FormResponse>) => UseFormReturn<Input, FormResponse>;
export {};
//# sourceMappingURL=useForm.d.ts.map