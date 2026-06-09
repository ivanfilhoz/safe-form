import type { Metadata } from 'next'
import { ProfileForm } from './form'

export const metadata: Metadata = {
  title: 'safe-form Next compatibility'
}

export default function Page() {
  return <ProfileForm />
}
