'use client'

import { useRouter } from 'next/navigation'

export default function ErrorPage() {
  const router = useRouter()

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background">
      <h2 className="text-2xl font-bold mb-4 text-foreground">
        Accès non autorisé
      </h2>
      <p className="text-muted-foreground mb-4">
        Vous n'êtes pas autorisé à accéder à cette page
      </p>
      <button
        onClick={() => router.push('/')}
        className="px-4 py-2 bg-primary text-primary-foreground rounded-lg
          hover:bg-primary-dark transition-all duration-200 shadow-md
          hover:shadow-lg cursor-pointer hover:cursor-pointer"
      >
        Retour à l'accueil
      </button>
    </div>
  )
}
