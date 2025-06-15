import { useCallback, useMemo, useState } from 'react'
import { toast } from 'react-toastify'

import { Session } from 'next-auth'

import { Mail } from '@/types/mongo/models'

import { deleteMail, getMail, getSentMails, onClickMail } from '@/app/actions/mails'

export function useMailsManager(session: Session, isSentbox: boolean) {
  const [rawMessages, setRawMessages] = useState<Mail[]>([])
  const userId = (session?.user?._id as string) || ''

  // Filtrer et trier les messages
  const messages = useMemo(() => {
    // console.log('useMailsManager: Filtering messages, rawMessages length:', rawMessages?.length)

    if (!rawMessages || !Array.isArray(rawMessages) || rawMessages.length === 0) {
      // console.log('useMailsManager: No messages to filter')
      return []
    }

    const filteredMessages = rawMessages
      .filter((message: Mail) => {
        // Vérifier si le message existe
        if (!message) {
          // console.log('useMailsManager: Found a null/undefined message')
          return false
        }

        // Vérifier si le message est supprimé
        if (!message.isDeleted) {
          // console.log('useMailsManager: Message not deleted, keeping it')
          return true
        }

        if (typeof message.isDeleted === 'object' && userId) {
          const isNotDeletedForUser = !message.isDeleted[userId]
          // console.log(
          //   `useMailsManager: Message ${message._id} isDeleted check for user ${userId}: ${isNotDeletedForUser}`,
          // )
          return isNotDeletedForUser
        }

        // console.log('useMailsManager: Message not deleted (default case)')
        return !message.isDeleted
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

    // console.log(
    //   'useMailsManager: Final filtered messages length:',
    //   filteredMessages.length,
    // )
    return filteredMessages
  }, [rawMessages, userId])

  // Récupérer les emails
  const fetchMails = useCallback(async () => {
    // Si pas de session ou d'ID d'utilisateur, retourner un tableau vide
    if (!userId) {
      // console.log('useMailsManager: No userId, returning empty array')
      return []
    }

    try {
      let mails = [] as unknown as Mail[]
      // Récupérer mails envoyés
      if (isSentbox) {
        // console.log('useMailsManager: Fetching sent mails for userId:', userId)
        const data = await getSentMails(userId)
        // console.log('useMailsManager: getSentMails response:', data)
        mails = data.data as unknown as Mail[]
        // console.log('useMailsManager: Mails after typecast:', mails?.length)
      }
      // Récupérer mails reçus
      else {
        // console.log(
        //   'useMailsManager: Fetching received mails for userId:',
        //   userId,
        // )
        const data = await getMail(userId)
        // console.log('useMailsManager: getMail response:', data)
        mails = data.data as unknown as Mail[]
        // console.log('useMailsManager: Mails after typecast:', mails?.length)
      }

      // console.log(
      //   'useMailsManager: Setting rawMessages with length:',
      //   mails?.length,
      // )
      setRawMessages(mails || [])
      return mails
    } catch (error) {
      console.error('useMailsManager: Error fetching mails:', error)
      throw error
    }
  }, [userId, isSentbox])

  // Supprimer un email
  const handleDelete = useCallback(
    async (index: number) => {
      // Si pas d'ID utilisateur, retourner immédiatement
      if (!userId) return

      try {
        const messageToDelete = messages[index]
        if (!messageToDelete) return

        const response = await deleteMail(messageToDelete._id, userId)

        if (!response.success) {
          toast.error('Erreur lors de la suppression de l\'email')
          return
        }

        setRawMessages((prev) => {
          const updatedMessages = [...prev]
          const targetMessage = updatedMessages.find((msg) => msg._id === messageToDelete._id)

          if (targetMessage) {
            if (typeof targetMessage.isDeleted === 'object') {
              targetMessage.isDeleted = {
                ...targetMessage.isDeleted,
                [userId]: true,
              }
            } else {
              targetMessage.isDeleted = {
                [userId]: true,
              }
            }
          }

          return updatedMessages
        })

        toast.success('Email supprimé avec succès')
      } catch (error) {
        toast.error('Erreur lors de la suppression de l\'email')
      }
    },
    [messages, userId],
  )

  // Gérer le clic sur un message pour le marquer comme non lu ou lu
  const handleMessageClick = useCallback(
    async (mailId: number) => {
      // Si pas d'ID utilisateur, retourner immédiatement
      if (!userId) return

      try {
        const clickedMessage = messages[mailId]
        if (!clickedMessage) return

        const response = await onClickMail(parseInt(userId), mailId)

        if (!response.success) {
          toast.error('Erreur lors du marquage de l\'email comme lu')
          return
        }

        setRawMessages((prev) => {
          const updatedMessages = [...prev]
          const targetMessage = updatedMessages.find((msg) => msg._id === clickedMessage._id)

          if (targetMessage) {
            targetMessage.isRead = !targetMessage.isRead // Inverse l'état localement aussi
          }

          return updatedMessages
        })
      } catch (error) {
        toast.error('Erreur lors du marquage de l\'email comme lu')
      }
    },
    [messages, userId],
  )

  return {
    messages,
    fetchMails,
    handleDelete,
    handleMessageClick,
  }
}
