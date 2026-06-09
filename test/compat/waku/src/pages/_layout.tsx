import type { ReactNode } from 'react'

type RootLayoutProps = {
  children: ReactNode
}

export default async function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang='en'>
      <body>{children}</body>
    </html>
  )
}

export const getConfig = async () => {
  return {
    render: 'static'
  } as const
}
