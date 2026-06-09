import { ContactForm } from '../components/contact-form'

export default async function HomePage() {
  return <ContactForm />
}

export const getConfig = async () => {
  return {
    render: 'dynamic'
  } as const
}
