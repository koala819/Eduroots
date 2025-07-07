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
    <div className="flex min-h-screen flex-col items-center justify-center bg-background">
      <div className="p-6 bg-background/80 backdrop-blur-sm rounded-lg shadow-lg
        border border-border/30 text-center space-y-4">
        <h2 className="text-2xl font-bold text-foreground">
          Une erreur est survenue
        </h2>
        <p className="text-muted-foreground">
          {error.message || 'Une erreur inattendue s\'est produite'}
        </p>
        <button
          onClick={() => reset()}
          className="px-4 py-2 bg-primary hover:bg-primary-dark text-primary-foreground
            rounded-md transition-colors duration-200 shadow-md hover:shadow-lg"
        >
          Réessayer
        </button>
      </div>
    </div>
  )
}

