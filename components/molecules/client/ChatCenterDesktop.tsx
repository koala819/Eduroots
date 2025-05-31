'use client'
import { ChatSendMessage } from '@/components/atoms/client/ChatSendMessage'
import { ChatContent } from '@/components/atoms/client/ChatContent'
import { ChatSideBar } from '@/components/atoms/client/ChatSideBar'
import { Student } from '@/types/user'
import { cn } from '@/lib/utils'

interface ChatCenterProps {
  selectedGroup: string
  handleSelectGroup: (key: string) => void
  childrenRooms?: {
    name: string
    _id: string
  }[]
  setGroupLoading: (loading: boolean) => void
  selectedChildId: string
  teacherId: string
  bureauId: string
  goruploading: boolean
  socketRef: any
  students?: Student[]
  fromFamily: boolean
}

export default function ChatCenterDesktop({
  selectedGroup,
  handleSelectGroup,
  childrenRooms,
  setGroupLoading,
  selectedChildId,
  teacherId,
  bureauId,
  goruploading,
  socketRef,
  students,
  fromFamily,
}: ChatCenterProps) {

  return (
    <section className="flex flex-1 min-h-0">
      <ChatSideBar
        selected={selectedGroup!}
        onSelect={handleSelectGroup}
        childrenRooms={childrenRooms}
        setLoading={setGroupLoading}
        students={students}
      />

      <main
        className={cn(
          'flex flex-col bg-gray-50 w-full',
          fromFamily ? 'h-[calc(100vh-7rem)]' : 'h-[calc(100vh)]',
        )}
      >
        <div className="flex-1 overflow-y-auto bg-gray-100">
          <ChatContent
            selectedGroup={selectedGroup!}
            selectedChildId={selectedChildId!}
            teacherId={teacherId!}
            bureauId={bureauId!}
            setGroupLoading={setGroupLoading}
            loading={goruploading}
            socket={socketRef}
          />
        </div>
        <ChatSendMessage
          selectedGroup={selectedGroup!}
          socketRef={socketRef}
          selectedChildId={selectedChildId!}
        />
      </main>
    </section>
  )
}
