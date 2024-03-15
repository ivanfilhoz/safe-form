# safe-form

⚡️ End-to-end type-safety from client to server. Inspired by [react-hook-form](https://github.com/react-hook-form/react-hook-form) and [next-safe-action](https://github.com/TheEdoRan/next-safe-action)

## Features

- ✅ Ridiculously easy to use
- ✅ 100% type-safe
- ✅ Input validation using [zod](https://github.com/colinhacks/zod)
- ✅ Server error handling
- ✅ Automatic input binding

## Requirements

- [Next.js](https://nextjs.org/) >14

## Install

```bash
npm install safe-form
```

## Usage

First, define your schema in a separate file, so you can use it both in the form and in the server action:

`schema.ts`

```ts
import { z } from 'zod'

export const exampleSchema = z.object({
  name: z.string().min(3, 'Name must be at least 3 characters'),
  message: z.string().min(10, 'Message must be at least 10 characters')
})
```

Now, create a server action:

`action.ts`

```ts
'use server'

import { createFormAction, FormActionError } from 'safe-form'
import { exampleSchema } from './schema'

export const exampleAction = createFormAction(exampleSchema, async (input) => {
  if (input.name === 'Joe') {
    throw new FormActionError('Joe is not allowed to send messages.') // Custom errors! 💜
  }

  return `Hello, ${input.name}! Your message is: ${input.message}`
})
```

Finally, create a form as a client component:

`form.tsx`

```tsx
'use client'

import { useForm } from 'safe-form'
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
      {fieldErrors.name && <pre>{fieldErrors.name}</pre>}
      <br />
      <label htmlFor='message'>Message</label>
      <textarea {...bindField('message')} />
      {fieldErrors.message && <pre>{fieldErrors.message}</pre>}
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

## License

MIT
