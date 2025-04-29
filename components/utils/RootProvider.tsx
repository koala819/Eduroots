'use client'

import {SessionProvider} from 'next-auth/react'
import {ReactNode} from 'react'

import {ConfigProvider} from '@/context/ConfigContext'

const RootProvider = ({children}: {children: ReactNode}) => {
  return (
    <SessionProvider>
      <ConfigProvider>{children}</ConfigProvider>
    </SessionProvider>
  )
}

export default RootProvider
