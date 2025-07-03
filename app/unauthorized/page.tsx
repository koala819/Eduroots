'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'

import { Button } from '@/client/components/ui/button'

const ErrorContent = () => {
  const searchParams = useSearchParams()
  const search = searchParams.get('error')

  return (
    <div className="p-6 bg-background rounded-lg shadow-lg border border-border/30
      text-center space-y-4">
      <h1 className="text-2xl font-bold text-foreground">
        {search === 'ErrorFetchTeacher' ? 'Erreur' : 'Erreur d\'authentification'}
      </h1>
      <ErrorMessage error={search} />
      <Link href="/">
        <Button className="bg-primary hover:bg-primary-dark text-primary-foreground
            transition-colors duration-200">
            Revenir à l&apos;écran Principal
        </Button>
      </Link>
    </div>
  )
}

const ErrorMessage = ({ error }: {error: string | null}) => {
  function getErrorMessage(error: string | null) {
    switch (error) {
    case 'CredentialsSignin':
      return 'Échec de la connexion. Vérifiez vos identifiants et réessayez.'
    case 'AccessDenied':
      return 'Vous n\'avez pas la permission d\'accéder à cette page.'
    case 'ErrorFetchTeacher':
      return 'Une erreur est survenue lors de la récupération des enseignants. '+
        'Veuillez contacter le support.'
    default:
      return 'Une erreur inconnue est survenue. Veuillez réessayer.'
    }
  }

  return <p className="mb-4 font-bold text-destructive">{getErrorMessage(error)}</p>
}

const ErrorPage = () => {
  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <Suspense fallback={<p className="text-muted-foreground">Chargement...</p>}>
        <ErrorContent />
      </Suspense>
    </div>
  )
}

export default ErrorPage
