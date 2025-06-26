'use client'

import { Suspense } from 'react'

import { useAuth } from '@/client/hooks/use-auth'

import LoadingOverlay from '../../../zUnused/LoadingOverlay'

interface AuthenticatedContentProps {
  children: React.ReactNode
  fallback?: React.ReactNode
}

export function AuthenticatedContent({
  children,
  fallback = <LoadingOverlay />,
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
