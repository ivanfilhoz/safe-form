export type FormInput = Record<string, any>;
export type FormFieldErrors<Input extends FormInput> = {
    [field in keyof Input]?: string | string[];
};
export type FormState<Input extends FormInput, FormResponse> = {
    response?: FormResponse;
    error?: string;
    fieldErrors?: FormFieldErrors<Input>;
};
export type FormAction<Input extends FormInput, FormResponse> = (initialState: FormState<Input, FormResponse> | null, formData: FormData) => Promise<FormState<Input, FormResponse>>;
//# sourceMappingURL=types.d.ts.map