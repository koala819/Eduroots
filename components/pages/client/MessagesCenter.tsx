'use client'
import { useState } from 'react'
import { getSession, signIn, signOut } from 'next-auth/react'
import StudentSelector from '@/components/atoms/client/StudentSelector'
import { Student } from '@/types/user'
import { cn } from '@/lib/utils'
import { useEffect, useRef } from 'react'
import { io, Socket } from 'socket.io-client'
import MessagesDesktop from '@/components/organisms/client/MessagesDesktop'
import MessagesMobile from '@/components/organisms/client/MessagesMobile'
import { FamilyChildren } from '@/types/messages'

interface MessagesCenterProps {
  FamilyChildren?: FamilyChildren[],
  students?: Student[]
  coursesTeachersWithChildren?: {name: string, students: Student[]}[]
  userType: 'family' | 'teacher' | 'bureau'
}

export const MessagesCenter = ({
  FamilyChildren,
  students,
  coursesTeachersWithChildren,
  userType,
}: MessagesCenterProps) => {
  const [childrenRooms, setChildrenRooms] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [selectedChildId, setSelectedChildId] = useState<string | null>()
  const [teacherId, setTeacherId] = useState<string | null>()
  const [bureauId, setBureauId] = useState<string | null>()
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null)
  const socketRef = useRef<Socket | null>(null)
  const [loading, setLoading] = useState<boolean>(false)
  const [grouploading, setGroupLoading] = useState<boolean>(false)

  // Connexion au socket
  useEffect(() => {
    const connectSocket = async () => {
      const session = await getSession()
      const token = session?.user?.customToken

      // Vérifie que l'URL est bien définie
      if (!process.env.NEXT_PUBLIC_SERVER_URL) {
        console.error('NEXT_PUBLIC_SERVER_URL n\'est pas définie')
        return
      }

      socketRef.current = io(process.env.NEXT_PUBLIC_SERVER_URL!, {
        withCredentials: true,
        auth: {
          token: token,
        },
      })

      // Vérifie la connexion du socket
      socketRef.current.on('connect', () => {
        console.log('Socket connecté !', socketRef.current?.id)
      })

      // Gère les erreurs de connexion
      socketRef.current.on('connect_error', (err) => {
        console.error('Erreur de connexion socket.io', err)
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
    setChildrenRooms(null)
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
        body: JSON.stringify({ studentId }),
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
        setChildrenRooms(data.result)
      } else {
        setError(data.error || 'Erreur inconnue')
      }
    } catch (err: any) {
      setError(err.message || 'Erreur inconnue')
    } finally {
      setLoading(false)
    }
  }

  async function handleSelectGroup(key: string): Promise<void> {
    setGroupLoading(false)
    setSelectedGroup(key)
  }

  if (loading ) {
    return <div className="flex-1 overflow-y-auto p-8 bg-gray-100" style={{ minHeight: 0 }}>
      <div className="flex justify-center items-center h-full">
        <div
          className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900"
        />
      </div>
    </div>
  }

  if (error) {
    return (
      <div
        className="mt-4 p-2 bg-red-100 text-red-800 rounded whitespace-pre-wrap break-words max-h-64
         overflow-y-auto"
      >
        {error}
      </div>
    )
  }

  return (
    <div className={cn('flex flex-col h-full w-full',
    )}>
      {FamilyChildren && (
        <section
          className={cn(
            'flex',
            selectedChildId ? 'h-28' : 'flex-1 justify-center items-center',
          )}
        >
          <div className="flex flex-col gap-4">
            <h2
              className={cn(
                'text-2xl font-semibold text-slate-500 mb-3 text-center',
                selectedChildId ? 'hidden' : '',
              )}
            >
              Choix de l'enfant
            </h2>
            <StudentSelector
              familyChildrenFromChat={FamilyChildren}
              selectedChildId={selectedChildId}
              onSelectStudent={handleSelectStudent}
            />
          </div>
        </section>
      )}

      {(
        (childrenRooms && childrenRooms.length > 0)
        || (students && students.length > 0)
        || (coursesTeachersWithChildren && coursesTeachersWithChildren.length > 0)
      )&& (
        <>
          <section className="hidden md:flex flex-1 min-h-0">
            <MessagesDesktop
              selectedGroup={selectedGroup!}
              handleSelectGroup={handleSelectGroup}
              childrenRooms={childrenRooms}
              setGroupLoading={setGroupLoading}
              selectedChildId={selectedChildId!}
              teacherId={teacherId!}
              bureauId={bureauId!}
              grouploading={grouploading}
              socketRef={socketRef}
              students={students}
              fromFamily={FamilyChildren ? true : false}
              coursesTeachersWithChildren={coursesTeachersWithChildren}
              userType={userType}
              FamilyChildren={FamilyChildren}
            />
          </section>
          <section className="flex md:hidden flex-1 min-h-0">
            <MessagesMobile
              handleSelectGroup={handleSelectGroup}
              childrenRooms={childrenRooms}
              setGroupLoading={setGroupLoading}
              selectedGroup={selectedGroup!}
              selectedChildId={selectedChildId!}
              teacherId={teacherId!}
              bureauId={bureauId!}
              grouploading={grouploading}
              socketRef={socketRef}
              setSelectedGroup={setSelectedGroup}
              students={students}
              fromFamily={FamilyChildren ? true : false}
              userType={userType}
            />
          </section>
        </>
      )}
    </div>
  )
}
