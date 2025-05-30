'use client'
import { ChatSendMessage } from '@/components/atoms/client/ChatSendMessage'
import { ChatContent } from '@/components/atoms/client/ChatContent'
import { ChatSideBar } from '@/components/atoms/client/ChatSideBar'

interface ChatCenterProps {
  selectedGroup: string
  handleSelectGroup: (key: string) => void
  result: any
  setGroupLoading: (loading: boolean) => void
  selectedChildId: string
  teacherId: string
  bureauId: string
  goruploading: boolean
  socketRef: any
}

export default function ChatCenterDesktop({
    selectedGroup,
    handleSelectGroup,
    result,
    setGroupLoading,
    selectedChildId,
    teacherId,
    bureauId,
    goruploading,
    socketRef
}: ChatCenterProps) {

  return (
    <section className="flex flex-1 min-h-0">
        <ChatSideBar
         selected={selectedGroup!}
         onSelect={handleSelectGroup}
         result={result}
         setLoading={setGroupLoading}
        />

        <main className="h-[calc(100vh-7rem)] flex flex-col bg-gray-50 w-full">
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
