import { z } from 'zod';
import { FormAction, FormInput, FormState } from './types';
export declare const createFormAction: <Input extends FormInput, FormResponse>(schema: z.Schema<Input>, handler: (validatedInput: Input, initialState?: FormState<Input, FormResponse> | null) => Promise<FormResponse>) => FormAction<Input, FormResponse>;
export { useForm } from './useForm';
//# sourceMappingURL=createFormAction.d.ts.map