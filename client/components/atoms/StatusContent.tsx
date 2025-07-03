'use client'

import { BookOpenCheck } from 'lucide-react'

export const LoadingContent = () => {
  return (
    <div className={`
        flex flex-col items-center justify-center min-h-[400px]
        bg-gradient-to-b from-background to-muted
      `}>
      <div className="flex items-center gap-2 mb-4">
        <div className="w-3 h-3 bg-primary rounded-full animate-ping"></div>
        <div
          className="w-3 h-3 bg-primary rounded-full animate-ping"
          style={{ animationDelay: '0.2s' }}
        ></div>
        <div
          className="w-3 h-3 bg-primary rounded-full animate-ping"
          style={{ animationDelay: '0.4s' }}
        ></div>
      </div>
      <p className="text-sm text-muted-foreground animate-pulse">
          Chargement des cours...
      </p>
    </div>
  )
}

export const ErrorContent = ({ message }: { message: string }) => {
  return (
    <div className={`
        flex flex-col items-center justify-center min-h-[400px]
        bg-gradient-to-b from-background to-muted
      `}>
      <div className="text-error mb-4">
        <svg
          className="w-12 h-12 mx-auto"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732
              4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>
      </div>
      <p className="text-error font-medium">{message}</p>
      <button
        onClick={() => window.location.reload()}
        className={`
            mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-lg
            hover:bg-primary-dark transition-colors
          `}
      >
          Réessayer
      </button>
    </div>
  )
}

export const EmptyContent = () => {
  return (
    <div className={`
        flex flex-col items-center justify-center min-h-[400px]
        bg-gradient-to-b from-background to-muted
      `}>
      <BookOpenCheck className="w-12 h-12 text-muted-foreground mb-4" />
      <h3 className="text-lg font-medium text-foreground mb-2">
          Aucun cours disponible
      </h3>
      <p className="text-sm text-muted-foreground text-center max-w-md">
          Vous n&apos;avez pas encore de cours assignés. Contactez
          l&apos;administration pour plus d&apos;informations.
      </p>
    </div>
  )
}
