'use client'

import { Mail as MailIcon, Paperclip } from 'lucide-react'
import { useEffect, useState } from 'react'

import { Mail } from '@/types/models'

import { MessageViewer } from '@/components/organisms/client/MessageViewer'

import { fetchReceiver } from '@/app/actions/mails'
import { getReceiverName } from '@/lib/mails/utils'

interface MessageItemProps {
  message: Mail
  index: number
  isSelected: boolean
  fromSendBox?: boolean
  onClick: (index: number) => void
  onDelete: (index: number) => void | Promise<void>

  formatDate: (isoDate: string) => string
}

const MessageItem: React.FC<MessageItemProps> = ({
  message,
  index,
  isSelected,
  onClick,
  onDelete,
  formatDate,
  fromSendBox,
}) => {
  const [receiverName, setReceiverName] = useState<string>('')

  useEffect(() => {
    async function loadReceiverInfo() {
      if (message.recipientId.length > 1) return

      if (message.recipientId[0] === process.env.DEFAULT_SENDER) {
        setReceiverName(process.env.DEFAULT_NAME || '')
        return
      }

      try {
        const result = await fetchReceiver(
          message.recipientType,
          message.recipientId[0],
        )
        if (result) {
          setReceiverName(`${result.firstname} ${result.lastname}`)
        } else {
          setReceiverName(getReceiverName(message.recipientType))
        }
      } catch (error) {
        console.error('Error fetching recipient information:', error)
        setReceiverName(getReceiverName(message.recipientType))
      }
    }

    loadReceiverInfo()
  }, [message.recipientId, message.recipientType])

  return (
    <>
      <div
        className={`flex items-start gap-4 group cursor-pointer rounded-lg border p-4 shadow-sm transition-all duration-300
          ${message.isRead || fromSendBox ? 'bg-white hover:bg-gray-100' : 'bg-blue-50 hover:bg-blue-100 font-semibold'}
          ${isSelected ? 'ring-2 ring-blue-500' : ''}`}
        onClick={() => onClick(index)}
        role="button"
        aria-expanded={isSelected}
      >
        <div className="flex-1 grid gap-1">
          <div className="flex items-center justify-between">
            <div
              className={`flex items-center ${message.isRead || fromSendBox ? 'text-gray-700' : 'text-blue-700'}`}
            >
              {!message.isRead && !fromSendBox && (
                <MailIcon className="mr-2 h-4 w-4" />
              )}
              <span>{message.senderName}</span>
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              {formatDate(message.createdAt || message.date)}
            </div>
          </div>
          {fromSendBox ? (
            <div className="text-sm text-gray-500 dark:text-gray-400">
              {`Message envoyé à ${getReceiverName(message.recipientType)}`}
            </div>
          ) : (
            <div className="text-sm text-gray-500 dark:text-gray-400">
              {!message.isRead && 'Nouveau message :'}
            </div>
          )}
          <div
            className={`line-clamp-1 ${message.isRead || fromSendBox ? 'text-gray-600' : 'text-blue-600'}`}
          >
            {message.subject}
          </div>
          {message.attachmentUrl && (
            <div className="flex items-center text-xs text-gray-500">
              <Paperclip className="mr-1 h-3 w-3" />1 pièce jointe
            </div>
          )}
        </div>
        {!message.isRead && !fromSendBox && (
          <div className="w-3 h-3 bg-blue-500 rounded-full self-center"></div>
        )}
      </div>
      {isSelected && (
        <div className="mt-2 text-sm text-gray-500 dark:text-gray-400">
          <MessageViewer
            message={message}
            isMarkingAsUnread={false}
            onDelete={() => onDelete(index)}
            senderName={message.senderName}
            fromSendBox={fromSendBox}
            index={index}
          />
        </div>
      )}
    </>
  )
}

export default MessageItem
