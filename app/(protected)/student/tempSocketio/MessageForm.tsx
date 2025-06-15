'use client'
import { useState } from 'react'
import { getSession } from 'next-auth/react'

export default function MessageForm() {
  const [message, setMessage] = useState('')
  const conversation = '66a23f4e1bfe6a163d1af199'
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [isPending, setIsPending] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setResult(null)
    setError(null)
    setIsPending(true)
    try {
      const session = await getSession()
      const token = session?.user?.customToken
      if (!token) throw new Error('Token custom manquant')
      const res = await fetch('/api/sendMessage', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ content: message, conversation }),
      })
      const data = await res.json()
      if (data.success) {
        setResult(data.result)
      } else {
        setError(data.error || 'Erreur inconnue')
      }
    } catch (err: any) {
      setError(err.message || 'Erreur inconnue')
    }
    setIsPending(false)
  }

  return (
    <div>
      <form onSubmit={handleSubmit} className="space-y-4">
        <textarea
          className="w-full border rounded p-2"
          rows={4}
          placeholder="Votre message..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          required
        />
        <button
          type="submit"
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          disabled={isPending}
        >
          Envoyer
        </button>
      </form>
      {isPending && <p className="mt-4 text-gray-500">Envoi en cours...</p>}
      {error && <pre className="mt-4 p-2 bg-red-100 text-red-800 rounded">{error}</pre>}
      {result && (
        <pre className="mt-4 p-2 bg-green-100 text-green-800 rounded">{JSON.stringify(result)}</pre>
      )}
    </div>
  )
}
