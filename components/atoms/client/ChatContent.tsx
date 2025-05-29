'use client'

import {getSession} from 'next-auth/react'
import { useEffect, useState } from 'react'
import { Socket } from 'socket.io-client'
// import Image from 'next/image'

interface ChatContentProps {
  selectedGroup: string
  selectedChildId: string
  teacherId: string
  bureauId: string
  setGroupLoading: (loading: boolean) => void
  loading: boolean
  socketRef: React.RefObject<Socket>
}

export const ChatContent = ({ selectedGroup, selectedChildId, teacherId, bureauId, setGroupLoading, loading, socketRef }: ChatContentProps) => {
    const [messagesByConversation, setMessagesByConversation] = useState<Record<string, any[]>>({})

    const users = [
      {
        id: selectedChildId,
        name: 'Famille',
        // avatar: '/avatar-family.webp'
      },
      {
        id: teacherId,
        name: 'Professeur',
        // avatar: '/avatar-teacher.webp'
      },
      {
        id: bureauId,
        name: 'Bureau',
        // avatar: '/avatar-bureau.webp'
      },
    ]

    useEffect(() => {
      if (!selectedGroup) return

      async function handleSelectGroup(conversationId: string) {
        console.log('selectedChildId', selectedChildId)
        const session = await getSession()
        const token = session?.user?.customToken

        const res = await fetch(`http://localhost:3001/conversations/${conversationId}/messages?childId=${selectedChildId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })
        const messages = await res.json()

        setMessagesByConversation(messages)
        setGroupLoading( false)
      }
      handleSelectGroup(selectedGroup)
    }, [selectedGroup])

  useEffect(() => {
    if (!socketRef.current) return

    // Fonction de callback pour l'arrivée d'un nouveau message
    const handleNewMessage = (message: any) => {
      setMessagesByConversation(prev => ({
        ...prev,
        [selectedGroup]: [...(prev[selectedGroup] || []), message]
      }))
    }

    // S'abonner à l'événement
    socketRef.current.on('newMessage', handleNewMessage)

    // Nettoyage à la destruction du composant
    return () => {
      socketRef.current?.off('newMessage', handleNewMessage)
    }
  }, [socketRef, selectedGroup])

    if (loading) return (
    <div className="flex-1 overflow-y-auto p-8 bg-gray-100" style={{minHeight: 0}} >
      <div className="flex justify-center items-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900"></div>
      </div>
      </div>
      )

    if (Object.keys(messagesByConversation).length === 0) return <div className="flex-1 overflow-y-auto p-8 bg-gray-100" style={{minHeight: 0}} />

    return (
      <div className="flex-1 overflow-y-auto p-8 bg-gray-100" style={{minHeight: 0}}>
        {Object.keys(messagesByConversation).length > 0 && Object.values(messagesByConversation).map((msg: any) => {
        // console.log('msg', msg)
        // console.log('users', users)
        const user = users.find(u => u.id === msg.author)
        return (
          <div key={msg._id} className="w-full px-5 flex flex-col justify-between">
            <div className="flex flex-col mt-2">
              {user?.id === selectedChildId ? (
              <div className="flex justify-end">
                <div className="mr-2 px-4 bg-blue-400 rounded-l-3xl rounded-tr-xl text-white">
                  {msg.content}
                </div>
                {/* <Image
                  src={user?.avatar}
                  className="object-contain h-20 w-20 rounded-full"
                  alt={user?.name}
                  width={64}
                  height={64}
                /> */}
              </div>
              ) : (
                <div className="flex justify-start mt-4">
                  {/* <Image
                    src="/avatar-teacher.webp"
                    className="object-cover h-12 w-12 rounded-full"
                    alt="teacher avatar"
                    width={64}
                    height={64}
                  /> */}
                  <div className="ml-2 py-3 px-4 bg-gray-200 rounded-bl-3xl rounded-tl-3xl rounded-tr-xl">
                    <p>{msg.content}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )
      })}
      </div>
          )
}


