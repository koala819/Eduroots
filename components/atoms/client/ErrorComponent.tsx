'use client'

import {AlertTriangle} from 'lucide-react'

interface ErrorComponentProps {
  message: string
}

export function ErrorComponent({message}: ErrorComponentProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] bg-white rounded-lg shadow-sm p-6">
      <div className="flex items-center justify-center w-12 h-12 mb-4 bg-red-100 rounded-full">
        <AlertTriangle className="w-6 h-6 text-red-500" />
      </div>
      <h2 className="mb-2 text-lg font-semibold text-gray-900">Erreur</h2>
      <p className="text-center text-gray-600">{message}</p>
      <button
        onClick={() => window.history.back()}
        className="px-4 py-2 mt-6 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
      >
        Retour
      </button>
    </div>
  )
}
