'use client'
import { ChatSendMessage } from '@/components/atoms/client/ChatSendMessage'
import { MessagesChat } from '@/components/atoms/client/MessagesChat'
import { MessagesSideBar } from '@/components/molecules/client/MessagesSideBar'
import { Student } from '@/types/user'
import { cn } from '@/lib/utils'
import { FamilyChildren } from '@/types/messages'

interface MessagesDesktopProps {
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
  grouploading: boolean
  socketRef: any
  students?: Student[]
  fromFamily: boolean
  coursesTeachersWithChildren?: {name: string, students: Student[]}[]
  userType: 'family' | 'teacher' | 'bureau'
  FamilyChildren?: FamilyChildren[]
}

export default function MessagesDesktop({
  selectedGroup,
  handleSelectGroup,
  childrenRooms,
  setGroupLoading,
  selectedChildId,
  teacherId,
  bureauId,
  grouploading,
  socketRef,
  students,
  fromFamily,
  coursesTeachersWithChildren,
  userType,
  FamilyChildren,
}: MessagesDesktopProps) {


  const coursesWithChild = FamilyChildren?.find((child) => child.id === selectedChildId)
  console.log('coursesWithChild', coursesWithChild)

  return (
    <section className="flex flex-1 min-h-0">
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

      <main
        className={cn(
          'flex flex-col bg-gray-50 w-full',
          fromFamily ? 'h-[calc(100vh-7rem)]' : 'h-[calc(100vh)]',
        )}
      >
        <div className="flex-1 overflow-y-auto bg-gray-100">
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
        <ChatSendMessage
          selectedGroup={selectedGroup!}
          socketRef={socketRef}
          selectedChildId={selectedChildId!}
        />
      </main>
    </section>
  )
}
