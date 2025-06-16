'use client'

import { Paperclip } from 'lucide-react'
import { memo } from 'react'

type MessageAttachmentProps = {
  url: string
}

export const MessageAttachment = memo(function MessageAttachment({ url }: MessageAttachmentProps) {
  return (
    <div className="mt-4">
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center text-blue-600 hover:underline"
      >
        <Paperclip className="mr-2 h-4 w-4" />
        Télécharger la pièce jointe
      </a>
    </div>
  )
})
