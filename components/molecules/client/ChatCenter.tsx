'use client'
import { useState} from 'react'
import {getSession, signIn, signOut} from 'next-auth/react'
import StudentSelector from '@/components/atoms/client/StudentSelector'
import { Student } from '@/types/user'
import {cn} from '@/lib/utils'
import { useEffect, useRef } from 'react'
import { io, Socket } from 'socket.io-client'
import ChatCenterDesktop from '@/app/(protected)/student/tempSocketio/ChatCenterDesktop'
import ChatCenterMobile from '@/app/(protected)/student/tempSocketio/ChatCenterMobile'

interface ChatCenterProps {
  familyStudents: Student[]
}

export default function ChatCenter({familyStudents}: ChatCenterProps) {
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [selectedChildId, setSelectedChildId] = useState<string | null>()
  const [teacherId, setTeacherId] = useState<string | null>()
  const [bureauId, setBureauId] = useState<string | null>()
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null)
  const socketRef = useRef<Socket | null>(null)
  const [loading, setLoading] = useState<boolean>(false)
  const [goruploading, setGroupLoading] = useState<boolean>(false)

  useEffect(() => {
    const connectSocket = async () => {
      const session = await getSession()
      const token = session?.user?.customToken
      socketRef.current = io(`${process.env.NEXT_PUBLIC_SERVER_URL}`, {
        withCredentials: true,
        auth: {
          token: token,
        },
      })
      // Ecoute d'un event
      socketRef.current.on('connect', () => {
      })

      // Nettoyage à la destruction du composant
      return () => {
        socketRef.current?.disconnect()
      }
    }
    connectSocket()
  }, [])


  // Joindre les rooms de l'enfant
  useEffect(() => {
  if (socketRef.current && selectedChildId) {
    socketRef.current.emit('joinChildRooms', { childId: selectedChildId })
  }
}, [selectedChildId])

  async function handleSelectStudent (studentId: string) {
    setSelectedChildId(studentId)
    setResult(null)
    setError(null)
    setLoading(true)
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
        try {
          signIn('credentials', {
            redirect: false,
            callbackUrl: `${process.env.NEXT_PUBLIC_CLIENT_URL}/`,
          })
          if (session && session.user?.customToken) {
            setError(null)
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

      if (data.success) {

      data.result.forEach((item: {name: string, members: string[]}) => {
        if (item.name === 'parent-prof') {
          const teacherId = item.members.find((id: string) => id !== studentId)
          setTeacherId(teacherId)
        }
        if (item.name === 'parent-bureau') {
          const bureauId = item.members.find((id: string) => id !== studentId)
          setBureauId(bureauId)
        }
      })
        setResult(data.result)
      } else {
        setError(data.error || 'Erreur inconnue')
      }
    } catch (err: any) {
      setError(err.message || 'Erreur inconnue')
    } finally {
      setLoading(false)
    }
  }

  function handleSelectGroup(key: string): void {
    setSelectedGroup(key)
  }

  if (loading ) {
    return <div className="flex-1 overflow-y-auto p-8 bg-gray-100" style={{minHeight: 0}}>
      <div className="flex justify-center items-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900"></div>
      </div>
    </div>
  }

  if (error) {
    return (
      <div className="mt-4 p-2 bg-red-100 text-red-800 rounded whitespace-pre-wrap break-words max-h-64 overflow-y-auto">
        {error}
      </div>
    )
  }

  return (
    <div className={cn('flex flex-col h-full w-full'
    // , selectedChildId ? 'p-4' : 'p-0'
    )}>
      <section className={cn('flex', selectedChildId ? 'h-28' : 'flex-1 justify-center items-center')}>
        <div className='flex flex-col gap-4'>
          <h2 className={cn('text-2xl font-semibold text-slate-500 mb-3 text-center', selectedChildId ? 'hidden' : '')}>Choix de l'enfant</h2>
          <StudentSelector
            familyStudents={familyStudents}
            selectedChildId={selectedChildId}
            onSelectStudent={handleSelectStudent}
          />
        </div>
      </section>

      {result && result.length > 0 && (
        <>
        <section className="hidden md:flex flex-1 min-h-0">
          <ChatCenterDesktop
            selectedGroup={selectedGroup!}
            handleSelectGroup={handleSelectGroup}
            result={result}
            setGroupLoading={setGroupLoading}
            selectedChildId={selectedChildId!}
            teacherId={teacherId!}
            bureauId={bureauId!}
            goruploading={goruploading}
            socketRef={socketRef}
          />
        </section>
        <section className="flex md:hidden flex-1 min-h-0">
          <ChatCenterMobile
            handleSelectGroup={handleSelectGroup}
            result={result}
            setGroupLoading={setGroupLoading}
            selectedGroup={selectedGroup!}
            selectedChildId={selectedChildId!}
            teacherId={teacherId!}
            bureauId={bureauId!}
            goruploading={goruploading}
            socketRef={socketRef}
            setSelectedGroup={setSelectedGroup}
          />
        </section>
        </>
      )}
    </div>
  )
}
