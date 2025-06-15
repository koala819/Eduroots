'use client'

import { useCallback, useState } from 'react'

import { Message } from '@/types/mongo/message'

import { MessageAttachment } from '@/components/atoms/client/MessageAttachment'
import { MessageActionButtons } from '@/components/molecules/client/MessageActionButtons'
import { Separator } from '@/components/ui/separator'

interface MessageViewerProps {
  message: Message
  isMarkingAsUnread: boolean
  onDelete: (index: number) => void
  showAllButtons?: boolean
  isDeleting?: boolean
  senderName: string
  fromSendBox?: boolean
  index: number
}

export function MessageViewer({
  message,
  isMarkingAsUnread,
  onDelete,
  showAllButtons = true,
  fromSendBox,
  senderName,
  index,
}: MessageViewerProps) {
  const [isReplyDialogOpen, setIsReplyDialogOpen] = useState<boolean>(false)

  const handleSendSuccess = useCallback(() => {
    setIsReplyDialogOpen(false)
  }, [])

  const handleCancelReply = useCallback(() => {
    setIsReplyDialogOpen(false)
  }, [])

  return (
    <div className="group flex flex-col gap-4 py-2 border border-gray-200 rounded-lg dark:border-gray-800 max-w-full overflow-hidden">
      <div className="flex flex-1 flex-col">
        <Separator />
        <div className="flex-1 p-2 sm:p-4 text-sm prose prose-sm max-w-none overflow-x-auto">
          <div
            dangerouslySetInnerHTML={{ __html: message.message }}
            className="[&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_li]:my-1"
          />
          {message.attachmentUrl && <MessageAttachment url={message.attachmentUrl} />}
        </div>
        <MessageActionButtons
          message={message}
          isMarkingAsUnread={isMarkingAsUnread}
          onDelete={onDelete}
          showAllButtons={showAllButtons}
          fromSendBox={fromSendBox}
          senderName={senderName}
          index={index}
          isReplyDialogOpen={isReplyDialogOpen}
          setIsReplyDialogOpen={setIsReplyDialogOpen}
          onCancelReply={handleCancelReply}
          onSendSuccess={handleSendSuccess}
        />
      </div>
    </div>
  )
}
