'use client'

import { Suspense } from 'react'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'

import { Button } from '@/components/ui/button'

const ErrorContent = () => {
  const searchParams = useSearchParams()
  const search = searchParams?.get('error')

  return (
    <div className="p-6 bg-white rounded shadow-md text-center">
      <h1 className="text-2xl font-bold mb-4">
        {search === 'ErrorFetchTeacher' ? 'Error' : 'Authentication Error'}
      </h1>
      <ErrorMessage error={search ?? null} />
      {search === 'ErrorFetchTeacher' ? (
        <Link href="/home">
          <Button>Revenir à l&apos;écran de Principal</Button>
        </Link>
      ) : (
        <Link href="/">
          <Button>Revenir à l&apos;écran de Connexion</Button>
        </Link>
      )}
    </div>
  )
}

const ErrorMessage = ({ error }: { error: string | null }) => {
  function getErrorMessage(error: string | null) {
    switch (error) {
      case 'CredentialsSignin':
        return 'Login failed. Check your credentials and try again.'
      case 'AccessDenied':
        return 'You do not have permission to access this page.'
      case 'AccessDenied':
        return 'You do not have permission to access this page.'
      case 'ErrorFetchTeacher':
        return 'An error to fetch teachers. Please contact support.'
      default:
        return 'An unknown error occurred. Please try again.'
    }
  }

  return <p className="mb-4 font-bold text-red-500">{getErrorMessage(error)}</p>
}

const ErrorPage = () => {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <Suspense fallback={<p>Loading...</p>}>
        <ErrorContent />
      </Suspense>
    </div>
  )
}

export default ErrorPage
