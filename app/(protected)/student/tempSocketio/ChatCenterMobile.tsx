'use client'

import { ChatContent } from "@/components/atoms/client/ChatContent"
import { ChatSendMessage } from "@/components/atoms/client/ChatSendMessage"
import { ChatSideBar } from "@/components/atoms/client/ChatSideBar"
import { ArrowLeft } from "lucide-react"

interface ChatCenterMobileProps {
  handleSelectGroup: (key: string) => void
  result: any
  setGroupLoading: (loading: boolean) => void
  selectedGroup: string
  selectedChildId: string
  teacherId: string
  bureauId: string
  goruploading: boolean
  socketRef: any
  setSelectedGroup: (group: string | null) => void
}

export default function ChatCenterMobile({
  handleSelectGroup,
  result,
  setGroupLoading,
  selectedGroup,
  selectedChildId,
  teacherId,
  bureauId,
  goruploading,
  socketRef,
  setSelectedGroup
}: ChatCenterMobileProps) {

const groupLabels: Record<string, string> = {
  'parent-prof': 'Professeur',
  'parent-bureau': 'Bureau',
  'parent-prof-bureau': 'Bureau & Professeur',
}

const selectedGroupObj = result.find((item: { _id: string }) => item._id === selectedGroup)
const displaySelectedGroup = selectedGroupObj ? groupLabels[selectedGroupObj.name] : ''

  return (
    <div className="h-[calc(100vh-11rem)] flex flex-col bg-green-100 w-full">
        {selectedGroup === null ? (
            <ChatSideBar
             selected={selectedGroup!}
             onSelect={handleSelectGroup}
             result={result}
             setLoading={setGroupLoading}
          />
        ) :
        (
        <>
            {/* Header avec bouton retour */}
            <button
            onClick={() => setSelectedGroup(null)}
            className="flex items-center gap-3 px-4 text-white font-semibold text-lg h-12 bg-blue-500 flex items-center px-4 shadow-md"
            >
                <ArrowLeft className="w-6 h-6" />
                <span className="truncate">{displaySelectedGroup}</span>
            </button>

            {/* Zone de contenu avec scroll */}
            <div className="flex-1 overflow-y-auto bg-white">
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

            {/* Footer avec boutons */}
            <ChatSendMessage
                selectedGroup={selectedGroup!}
                socketRef={socketRef}
                selectedChildId={selectedChildId!}
            />
        </>
        )}
    </div>
  )
}