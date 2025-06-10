'use client'

import { useEffect } from 'react'

export default function ErrorPage({
  error,
  reset,
}: Readonly<{
  error: Error & { digest?: string }
  reset: () => void
}>) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error(error)
  }, [error])

  return (
    <div className="flex min-h-screen flex-col items-center justify-center">
      <h2 className="text-2xl font-bold mb-4">Une erreur est survenue</h2>
      <p className="text-gray-600 mb-4">
        {error.message || 'Une erreur inattendue s\'est produite'}
      </p>
      <button
        onClick={() => reset()}
        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
      >
        Réessayer
      </button>
    </div>
  )
}

