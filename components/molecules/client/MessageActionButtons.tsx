'use client'

import { Mail, Reply, Trash } from 'lucide-react'
import { memo, useCallback } from 'react'

import type { Message } from '@/types/message'

import { MessageReplyComposer } from '@/components/molecules/client/MessageReplyComposer'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'

type MessageActionButtonsProps = {
  message: Message
  isMarkingAsUnread: boolean
  onDelete: (index: number) => void
  showAllButtons: boolean
  fromSendBox?: boolean
  senderName?: string
  index: number
  isReplyDialogOpen: boolean
  setIsReplyDialogOpen: (open: boolean) => void
  onCancelReply: () => void
  onSendSuccess: () => void
}

export const MessageActionButtons = memo(function MessageActionButtons({
  message,
  isMarkingAsUnread,
  onDelete,
  showAllButtons,
  fromSendBox,
  senderName,
  index,
  isReplyDialogOpen,
  setIsReplyDialogOpen,
  onCancelReply,
  onSendSuccess,
}: MessageActionButtonsProps) {
  const handleDeleteConfirm = useCallback(() => {
    onDelete(index)
  }, [onDelete, index])

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between p-2 sm:p-4 border-t border-gray-200 dark:border-gray-800 space-y-2 sm:space-y-0 sm:space-x-2">
      {showAllButtons && !fromSendBox && (
        <>
          {senderName !== 'La Direction de la Mosquée de Colomiers' && (
            <Dialog
              open={isReplyDialogOpen}
              onOpenChange={setIsReplyDialogOpen}
            >
              <DialogTrigger className="w-full">
                <Button
                  size="sm"
                  className="w-full sm:w-auto space-x-2"
                  aria-label="Répondre"
                >
                  <Reply className="h-4 w-4" />
                  <span className="font-bold">Répondre</span>
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Répondre au message</DialogTitle>
                  <DialogDescription>
                    <MessageReplyComposer
                      recipientId={message.senderId}
                      recipientType={message.senderType}
                      subject={message.subject}
                      parentMessageId={message.parentMessageId || null}
                      onCancel={onCancelReply}
                      onSendSuccess={onSendSuccess}
                    />
                  </DialogDescription>
                </DialogHeader>
              </DialogContent>
            </Dialog>
          )}
          <Button
            size="sm"
            className="w-full sm:w-auto space-x-2 text-white"
            onClick={() => {
              console.log('mark as unread')
            }}
            disabled={isMarkingAsUnread}
            aria-label="Marquer comme non lu"
          >
            {isMarkingAsUnread ? (
              <>
                <span className="animate-spin">⏳</span>
                <span className="font-bold">Traitement...</span>
              </>
            ) : (
              <>
                <Mail className="h-4 w-4" />
                <span className="font-bold">Marquer comme non lu</span>
              </>
            )}
          </Button>
        </>
      )}

      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button
            variant="destructive"
            size="sm"
            className="w-full sm:w-auto space-x-2 text-white"
            aria-label="Supprimer le message"
          >
            <Trash className="h-4 w-4" />
            <span className="font-bold">Supprimer</span>
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent className="max-w-[90vw] sm:max-w-lg">
          <AlertDialogHeader>
            <AlertDialogTitle>Êtes-vous sûr ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible et supprimera définitivement cet
              email de votre boîte de réception.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm}>
              Confirmer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
})
