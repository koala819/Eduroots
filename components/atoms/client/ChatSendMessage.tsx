'use client'
import { IoSend } from 'react-icons/io5'
import { FormEvent, useState, useRef } from 'react'
import { Socket } from 'socket.io-client'

interface ChatSendMessageProps {
  selectedGroup: string
  socketRef: React.RefObject<Socket>
  selectedChildId: string
}

export const ChatSendMessage = ({ selectedGroup, socketRef, selectedChildId }: ChatSendMessageProps) => {
  const [input, setInput] = useState<string>('')
  const inputRef = useRef<HTMLInputElement>(null)

  async function handleSendMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!input.trim() || !selectedGroup) return

// console.log('Envoi du message', { conversationId: selectedGroup, content: input, authorId: selectedChildId })

    socketRef.current?.emit('sendMessage', {
      conversationId: selectedGroup,
      content: input,
      authorId: selectedChildId
    })

    setInput('')
    inputRef.current?.focus()

  }

  return (
    <form
      onSubmit={handleSendMessage}
      className="bg-[#f4f2ee] flex items-center px-4 py-3 gap-2"
      style={{ minHeight: '64px', borderTop: '1px solid #e0e0e0' }}
    >
      <input
        ref={inputRef}
        type="text"
        className="flex-1 border border-gray-200 px-4 py-2 text-base focus:outline-none focus:ring-2 focus:ring-blue-200 bg-white transition"
        placeholder="Écrire un message…"
        value={input}
        onChange={e => setInput(e.target.value)}
        disabled={!selectedGroup}
        name="sender-input"
        autoComplete="off"
      />
      <button
        type="submit"
        className="bg-blue-500 hover:bg-blue-600 text-white rounded-full p-3 flex items-center justify-center transition disabled:opacity-50"
        disabled={!selectedGroup || !input.trim()}
        name="sender-button"
        aria-label="Envoyer"
      >
        <IoSend className="text-xl" />
      </button>
    </form>
  )
}