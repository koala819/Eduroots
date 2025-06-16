'use client'

import { useRouter } from 'next/navigation'

export default function ErrorPage() {
  const router = useRouter()

  return (
    <div className="flex min-h-screen flex-col items-center justify-center">
      <h2 className="text-2xl font-bold mb-4">Accès non autorisé</h2>
      <p className="text-gray-600 mb-4">
        Vous n'êtes pas autorisé à accéder à cette page
      </p>
      <button
        onClick={() => router.push('/')}
        className="px-4 py-2 bg-[#375073] text-white rounded hover:border-[#375073] shadow-lg
        hover:bg-[#375073]/80 "
      >
        Retour à l'accueil
      </button>
    </div>
  )
}
