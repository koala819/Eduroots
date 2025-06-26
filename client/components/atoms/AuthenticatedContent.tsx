'use client'

import { Suspense } from 'react'

import LoadingScreen from '@/client/components/atoms/LoadingScreen'
import { useAuth } from '@/client/hooks/use-auth'


interface AuthenticatedContentProps {
  children: React.ReactNode
  fallback?: React.ReactNode
}

export function AuthenticatedContent({
  children,
  fallback = <LoadingScreen />,
}: Readonly<AuthenticatedContentProps>) {
  const { session, isLoading } = useAuth()

  if (isLoading) {
    return fallback
  }

  if (!session) {
    return null
  }

  return <Suspense fallback={fallback}>{children}</Suspense>
}
