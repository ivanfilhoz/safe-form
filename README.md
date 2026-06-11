# safe-form

[![NPM Version][npm-image]][npm-url]
[![Github License][license-image]](LICENSE)
[![NPM Downloads][downloads-image]][npm-url]

⚡️ End-to-end type-safety from client to server. Inspired by [react-hook-form](https://github.com/react-hook-form/react-hook-form) and [next-safe-action](https://github.com/TheEdoRan/next-safe-action).

## Features

- ✅ Ridiculously easy to use
- ✅ 100% type-safe
- ✅ Input validation using [Standard Schema](https://standardschema.dev/)
- ✅ Server error handling
- ✅ Automatic input binding
- ✅ Native file upload support

## Requirements

- [React](https://react.dev/) >=19
- A React framework or bundler with Server Functions support
- A [Standard Schema](https://standardschema.dev/) compatible validator, such as [zod](https://github.com/colinhacks/zod), [Valibot](https://valibot.dev/), or [ArkType](https://arktype.io/)

## Install

```bash
npm install safe-form
```

Install a validator separately if your app does not already have one:

```bash
npm install zod
```

## Usage

Use the `safe-form/server` and `safe-form/client` entrypoints to keep server
and client boundaries explicit.

First, define your schema in a separate file, so you can use it both in the form and in the server action. This example uses zod, but safe-form accepts any Standard Schema compatible validator:

`schema.ts`

```ts
import { z } from 'zod'

export const exampleSchema = z.object({
  name: z.string().min(3, 'Name must be at least 3 characters'),
  message: z.string().min(10, 'Message must be at least 10 characters'),
  attachment: z.instanceof(File).nullish()
})
```

Now, create a server action:

`action.ts`

```ts
'use server'

import { createFormAction, FormActionError } from 'safe-form/server'
import { exampleSchema } from './schema'

export const exampleAction = createFormAction(exampleSchema, async (input) => {
  if (input.attachment && input.attachment.size >= 1024 * 1024 * 10) {
    throw new FormActionError('The maximum file size is 10MB.') // Custom errors! 💜
  }

  return `Hello, ${input.name}! Your message is: ${input.message}.`
})
```

Finally, create a form as a client component:

`form.tsx`

```tsx
'use client'

import { useForm } from 'safe-form/client'
import { exampleAction } from './action'
import { exampleSchema } from './schema'

export const HelloForm = () => {
  const { connect, bindField, isPending, error, fieldErrors, response } =
    useForm({
      action: exampleAction,
      schema: exampleSchema
    })

  return (
    <form {...connect()}>
      <label htmlFor='name'>Name</label>
      <input {...bindField('name')} />
      {fieldErrors.name && <pre>{fieldErrors.name.first}</pre>}
      <br />
      <label htmlFor='message'>Message</label>
      <textarea {...bindField('message')} />
      {fieldErrors.message && <pre>{fieldErrors.message.first}</pre>}
      <br />
      <label htmlFor='attachment'>Attachment (optional)</label>
      <input type='file' {...bindField('attachment')} />
      {fieldErrors.attachment && <pre>{fieldErrors.attachment.first}</pre>}
      <br />
      <button type='submit' disabled={isPending}>
        Submit
      </button>
      <br />
      {error && <pre>{error}</pre>}
      {response && <div>{response}</div>}
    </form>
  )
}
```

## Progressive enhancement

`connect()` wires the form both ways. With JavaScript enabled, values are
serialized with rich types: date inputs produce `Date` objects, checkboxes
produce booleans, and number inputs produce numbers. Without JavaScript, the
browser submits the native `FormData` as a fallback, so every value reaches
the server action as a plain string (e.g. `"2022-01-01"` for dates, `"on"` or
absent for checkboxes).

If you rely on the no-JS fallback, make your schema accept both
representations. With zod, for example:

```ts
export const exampleSchema = z.object({
  birthDate: z.coerce.date(),
  subscribed: z.coerce.boolean().optional().default(false)
})
```

## Notes

- Date inputs follow the `valueAsDate` convention: values are interpreted as
  midnight UTC, both when reading from and writing to the input.
- Validation issues without a path (e.g. object-level refinements) are exposed
  separately as `rootError` (also passed as the third argument to `onError`),
  so `fieldErrors` stays keyed strictly by your schema's fields. `rootError`
  only refreshes on full validation (`submit()`, `validate()` or `reset()`) —
  field-level validation can't tell whether an object-level rule passes.
- `submit()` resolves once validation and the `onSubmit` callback finish; the
  server action itself runs in a transition. Use `onSuccess`/`onError` (or the
  returned `response`/`error`) to react to the action result.

## License

[MIT](LICENSE)

[npm-image]: https://img.shields.io/npm/v/safe-form.svg
[license-image]: https://img.shields.io/github/license/ivanfilhoz/safe-form.svg
[downloads-image]: https://img.shields.io/npm/dm/safe-form.svg
[npm-url]: https://npmjs.org/package/safe-form
