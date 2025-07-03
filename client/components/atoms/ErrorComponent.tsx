'use client'

import { AlertTriangle } from 'lucide-react'

interface ErrorComponentProps {
  message: string
}

export function ErrorComponent({ message }: Readonly<ErrorComponentProps>) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] bg-background
    rounded-lg shadow-sm p-6 border border-border">
      <div className="flex items-center justify-center w-12 h-12 mb-4 bg-error/10
      rounded-full border border-error/20">
        <AlertTriangle className="w-6 h-6 text-error-light" />
      </div>
      <h2 className="mb-2 text-lg font-semibold text-foreground">Erreur</h2>
      <p className="text-center text-muted-foreground max-w-md">{message}</p>
      <button
        onClick={() => window.history.back()}
        className="px-4 py-2 mt-6 text-sm font-medium text-primary-foreground
        bg-primary rounded-md hover:bg-primary-dark focus:outline-none
        focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors
        duration-200 shadow-sm hover:shadow-md hover:cursor-pointer"
      >
        Retour
      </button>
    </div>
  )
}
