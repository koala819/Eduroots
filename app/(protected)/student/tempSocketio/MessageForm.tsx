'use client'
import {FormEvent, useState} from 'react'
import {getSession, signIn, signOut} from 'next-auth/react'
import StudentSelector from '@/components/atoms/client/StudentSelector'
import { Student } from '@/types/user'
import {cn} from '@/lib/utils'
import { IoSend } from 'react-icons/io5'
import ChatSideBar from '@/app/(protected)/student/tempSocketio/ChatSideBar'

interface MessageFormProps {
  familyStudents: Student[]
}

export default function MessageForm({familyStudents}: MessageFormProps) {
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [newToken, setNewToken] = useState<string | null>(null)
  const [isPending, setIsPending] = useState<boolean>(false)
  const [selectedChildId, setSelectedChildId] = useState<string | null>()
  const [input, setInput] = useState('')
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null)

  async function handleSelectStudent (studentId: string) {
    setSelectedChildId(studentId)
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
        body: JSON.stringify({ studentId })
      })

      if (res.status === 401 || res.status === 403) {
        setError('Votre session a expiré, tentative de reconnexion automatique...')
        setIsPending(false)
        try {
          signIn('credentials', {
            redirect: false,
            callbackUrl: `${process.env.NEXT_PUBLIC_CLIENT_URL}/`,
          })
          if (session && session.user?.customToken) {
            setError(null)
            setNewToken('Session reconnexion automatique réussie')
          } else {
            setError('Reconnexion automatique échouée, veuillez vous reconnecter manuellement')
            setTimeout(() => {
              signOut({
                redirect: true,
                callbackUrl: `${process.env.NEXT_PUBLIC_CLIENT_URL}/`,
              })
            }, 3000)
          }
        } catch (error) {
          setError('Erreur lors de la reconnexion automatique' + error)
        }
        return
      }

      const data = await res.json()
      console.log('data', data)
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

  async function handleSendMessage(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault()
    console.log('input', input)
    console.log('selectedChildId', selectedChildId)
  }

  function handleSelectGroup(key: string): void {
    setSelectedGroup(key)
  }

  return (
    <div className={cn('flex flex-col h-full flex-1 min-h-0 ', selectedChildId ? 'p-4' : 'p-0')}>
      <section className={cn('flex', selectedChildId ? 'h-28' : 'h-screen justify-center items-center')}>
        <div className='flex flex-col gap-4'>
          <h2 className={cn('text-2xl font-semibold text-slate-500 mb-3 text-center', selectedChildId ? 'hidden' : '')}>Choix de l'enfant</h2>
          <StudentSelector
            familyStudents={familyStudents}
            selectedChildId={selectedChildId}
            onSelectStudent={handleSelectStudent}
          />
        </div>
      </section>

      {result && (
        <section className="flex flex-1 min-h-0">
          <ChatSideBar selected={selectedGroup!} onSelect={handleSelectGroup} />
        {/* Zone de discussion Message */}
        <main className="flex-1 flex flex-col bg-gray-50 h-full">
          <div className="flex-1 overflow-y-auto p-8 bg-gray-50" style={{minHeight: 0}}>

            {/* Affichage de la réponse du backend */}
            {isPending && <p className="mt-4 text-gray-500">Envoi en cours...</p>}
            {error && (
              <pre className="mt-4 p-2 bg-red-100 text-red-800 rounded whitespace-pre-wrap break-words max-h-64 overflow-y-auto">
                {error}
              </pre>
            )}
            {newToken && <pre className="mt-4 p-2 bg-green-100 text-black rounded">{newToken}</pre>}
            {result && (
              <pre className="mt-4 p-2 bg-green-100 text-green-800 rounded whitespace-pre-wrap break-words max-h-64 overflow-y-auto">{JSON.stringify(result[0])}</pre>
            )}
            {result && result[0].name === 'Parent et Prof' && (
              <pre className="mt-4 p-2 bg-green-100 text-green-800 rounded whitespace-pre-wrap break-words max-h-64 overflow-y-auto">Parent et Prof</pre>
            )}
          </div>
          {/* Zone d'envoi Sender */}
          <form onSubmit={handleSendMessage} className="bg-yellow-300 flex items-center px-6 py-4 gap-4" style={{minHeight: '80px'}}>
            <input
              type="text"
              className="flex-1 rounded-lg border border-yellow-400 px-4 py-2 text-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
              placeholder="Écrire un message..."
              value={input}
              onChange={e => setInput(e.target.value)}
              disabled={!selectedChildId || isPending}
              name="sender-input"
              autoComplete="off"
            />
            <button
              type="submit"
              className="bg-yellow-500 hover:bg-yellow-400 text-white font-bold py-2 px-6 rounded-lg flex items-center gap-2 disabled:opacity-50"
              disabled={!selectedChildId || isPending || !input.trim()}
              name="sender-button"
            >
              <IoSend className="text-xl" />
              Envoyer
            </button>
          </form>
        </main>
      </section>
      )}
    </div>
  )
}
