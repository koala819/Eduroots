'use client'

import { useSession } from 'next-auth/react'
import { useCallback, useEffect, useReducer } from 'react'

import { Session } from 'next-auth'

import { useMailsManager } from '@/hooks/useMailsManager'

import { MessageContainerProps } from '@/types/models'

import MessageList from '@/components/template/client/MessageList'

import { formatDate } from '@/lib/mails/utils'

// Définir un type pour l'état
type MailsState = {
  isLoading: boolean
  error: string | null
  displayPostIndex: number | null
  isInitialRender: boolean
}

// Définir les actions possibles
type MailsAction =
  | {type: 'FETCH_START'}
  | {type: 'FETCH_SUCCESS'}
  | {type: 'FETCH_ERROR'; payload: string}
  | {type: 'SET_DISPLAY_INDEX'; payload: number | null}

// Créer un reducer pour gérer l'état
const mailsReducer = (state: MailsState, action: MailsAction): MailsState => {
  switch (action.type) {
  case 'FETCH_START':
    return { ...state, isLoading: true, error: null }
  case 'FETCH_SUCCESS':
    return { ...state, isLoading: false, isInitialRender: false }
  case 'FETCH_ERROR':
    return {
      ...state,
      isLoading: false,
      error: action.payload,
      isInitialRender: false,
    }
  case 'SET_DISPLAY_INDEX':
    return { ...state, displayPostIndex: action.payload }
  default:
    return state
  }
}

const MessageContainer: React.FC<MessageContainerProps> = ({ isSentbox = false }) => {
  const { data: session } = useSession()

  // Utiliser useReducer pour gérer l'état - TOUJOURS mettre les hooks au niveau supérieur
  const [state, dispatch] = useReducer(mailsReducer, {
    isLoading: true,
    error: null,
    displayPostIndex: null,
    isInitialRender: true,
  })

  // Utiliser un hook personnalisé pour gérer les emails
  // - Utiliser un objet vide si session est null
  const { messages, fetchMails, handleDelete, handleMessageClick } = useMailsManager(
    session || ({} as Session),
    isSentbox,
  )

  // Définir tous les useCallback AVANT la condition
  // Fonction pour charger les emails
  const loadEmails = useCallback(async () => {
    if (!session) return

    dispatch({ type: 'FETCH_START' })
    try {
      await fetchMails()
      dispatch({ type: 'FETCH_SUCCESS' })
    } catch (err) {
      dispatch({
        type: 'FETCH_ERROR',
        payload: 'Erreur lors de la récupération des e-mails',
      })
    }
  }, [fetchMails, session])

  // Fonction pour gérer le clic sur un email pour le marquer comme non lu ou lu
  const handleEmailClick = useCallback(
    (mailId: number) => {
      if (!session) return

      handleMessageClick(mailId)
      dispatch({
        type: 'SET_DISPLAY_INDEX',
        payload: mailId === state.displayPostIndex ? null : mailId,
      })
    },
    [handleMessageClick, state.displayPostIndex, session],
  )

  // Fonction pour supprimer un email
  const deleteEmail = useCallback(
    (index: number) => {
      if (!session) return

      handleDelete(index)
      dispatch({ type: 'SET_DISPLAY_INDEX', payload: null })
    },
    [handleDelete, session],
  )

  // Fonction inactive pour boîte d'envoi (déplacée ici aussi)
  const noOpMarkAsUnread = useCallback(() => {}, [])

  // Charger les emails au montage du composant
  useEffect(() => {
    if (session) {
      loadEmails()
    }
  }, [loadEmails, session])

  // Vérifier la session après TOUS les hooks
  if (!session) {
    return null
  }

  if (state.isLoading || state.isInitialRender) {
    return <div className="text-center">Chargement...</div>
  }

  if (state.error) {
    return <div className="text-center text-red-500">{state.error}</div>
  }

  if (messages.length === 0) {
    return <div className="text-center">Aucun message trouvé</div>
  }

  return (
    <MessageList
      messages={messages}
      error={state.error}
      displayPostIndex={state.displayPostIndex}
      deleteEmail={deleteEmail}
      handleEmailClick={handleEmailClick}
      formatDate={formatDate}
      fromSendBox={isSentbox}
    />
  )
}

export default MessageContainer
