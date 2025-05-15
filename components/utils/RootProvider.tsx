'use client'

import { SessionProvider } from 'next-auth/react'
import { ReactNode } from 'react'

import { OneSignalProvider } from '@/components/providers/client/OneSignalProvider'

import { ConfigProvider } from '@/context/ConfigContext'

const RootProvider = ({ children }: { children: ReactNode }) => {
  return (
    <SessionProvider>
      <OneSignalProvider />
      <ConfigProvider>{children}</ConfigProvider>
    </SessionProvider>
  )
}

export default RootProvider
