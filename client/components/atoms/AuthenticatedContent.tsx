'use client'

import { Suspense } from 'react'

import { LoadingContent } from '@/client/components/atoms/StatusContent'
import { useAuth } from '@/client/hooks/use-auth'


interface AuthenticatedContentProps {
  children: React.ReactNode
  fallback?: React.ReactNode
}

export function AuthenticatedContent({
  children,
  fallback = <LoadingContent />,
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
