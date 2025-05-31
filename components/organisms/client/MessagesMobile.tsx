'use client'

import { MessagesChat } from '@/components/atoms/client/MessagesChat'
import { ChatSendMessage } from '@/components/atoms/client/ChatSendMessage'
import { ArrowLeft } from 'lucide-react'
import { Student } from '@/types/user'
import { cn } from '@/lib/utils'
import { MessagesSideBar } from '@/components/molecules/client/MessagesSideBar'

interface MessagesMobileProps {
  handleSelectGroup: (key: string) => void
  childrenRooms?: {
    name: string
    _id: string
  }[]
  setGroupLoading: (loading: boolean) => void
  selectedGroup: string
  selectedChildId: string
  teacherId: string
  bureauId: string
  grouploading: boolean
  socketRef: any
  setSelectedGroup: (group: string | null) => void
  students?: Student[]
  fromFamily: boolean
  coursesTeachersWithChildren?: {
    name: string
    students: Student[]
  }[]
  userType: 'family' | 'teacher' | 'bureau'
}

export default function MessagesMobile({
  handleSelectGroup,
  childrenRooms,
  setGroupLoading,
  selectedGroup,
  selectedChildId,
  teacherId,
  bureauId,
  grouploading,
  socketRef,
  setSelectedGroup,
  students,
  fromFamily,
  coursesTeachersWithChildren,
  userType,
}: MessagesMobileProps) {

  const groupLabels: Record<string, string> = {
    'parent-prof': 'Professeur',
    'parent-bureau': 'Bureau',
    'parent-prof-bureau': 'Bureau & Professeur',
  }

  const selectedGroupObj =
    childrenRooms && childrenRooms.find((item: { _id: string }) => item._id === selectedGroup)
  const displaySelectedGroup = selectedGroupObj ? groupLabels[selectedGroupObj.name] : ''

  return (
    <div className={cn('flex flex-col w-full')}>
      {selectedGroup === null ? (
        <div className={cn(fromFamily ?
          'h-[calc(100vh-12rem)]' : 'h-[calc(100vh)] overflow-y-auto',
        )}
        >
          <MessagesSideBar
            selected={selectedGroup!}
            onSelect={handleSelectGroup}
            childrenRooms={childrenRooms}
            setLoading={setGroupLoading}
            students={students}
            coursesTeachersWithChildren={coursesTeachersWithChildren}
            userType={userType}
            fromFamily={fromFamily}
          />
        </div>
      ) : (
        <div className={cn(
          'flex flex-col w-full',
          fromFamily ? 'h-[calc(100vh-12rem)]' : 'h-[calc(100vh-5rem)] overflow-y-auto',
        )}>
          {/* Header avec bouton retour */}
          <button
            onClick={() => setSelectedGroup(null)}
            className="items-center gap-3 px-4 text-white font-semibold text-lg h-12 bg-blue-500
            flex items-center px-4 shadow-md"
          >
            <ArrowLeft className="w-6 h-6" />
            <span className="truncate">{displaySelectedGroup}</span>
          </button>

          {/* Zone de contenu avec scroll */}
          <div className="flex-1 overflow-y-auto">
            <MessagesChat
              selectedGroup={selectedGroup!}
              selectedChildId={selectedChildId!}
              teacherId={teacherId!}
              bureauId={bureauId!}
              setGroupLoading={setGroupLoading}
              loading={grouploading}
              socket={socketRef}
            />
          </div>

          {/* Footer avec boutons */}
          <ChatSendMessage
            selectedGroup={selectedGroup!}
            socketRef={socketRef}
            selectedChildId={selectedChildId!}
          />
        </div>
      )}
    </div>
  )
}
