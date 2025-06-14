'use client'

import {Mail} from '@/types/mongo/models'

import MessageItem from '@/components/organisms/client/MessageItem'

interface MessageListProps {
  messages: Mail[]
  fromSendBox?: boolean
  error: string | null
  displayPostIndex: number | null
  setDisplayPostIndex?: (index: number | null) => void
  deleteEmail: (index: number) => void
  handleEmailClick: (index: number) => void

  formatDate: (isoDate: string) => string
}

const MessageList: React.FC<MessageListProps> = ({
  messages,
  error,
  displayPostIndex,
  deleteEmail,
  handleEmailClick,
  formatDate,

  fromSendBox,
}) => {
  if (error && messages.length !== 0)
    return <div className="text-center text-red-500 p-4">Erreur : {error}</div>

  if (messages.length === 0)
    return (
      <div className="text-center text-gray-500 p-4">
        {fromSendBox ? 'Aucun message envoyé' : 'Aucun message reçu'}
      </div>
    )

  return (
    <div className="w-full px-2 sm:px-4 md:px-6 lg:px-8 mt-16 sm:mt-8">
      <div className="max-w-3xl mx-auto space-y-2 sm:space-y-4">
        {messages.map((message, index) => (
          <MessageItem
            key={message._id}
            message={message}
            index={index}
            isSelected={displayPostIndex === index}
            onClick={handleEmailClick}
            onDelete={() => deleteEmail(index)}
            formatDate={formatDate}
            fromSendBox={fromSendBox}
          />
        ))}
      </div>
    </div>
  )
}

export default MessageList
