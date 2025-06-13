'use server'

import { createClient } from '@/utils/supabase/server'

import { ApiResponse } from '@/types/supabase/api'
import { MessageBody } from '@/types/models'

import { sendEmailNotification } from '@/lib/mails/emailService'
import { recordMessageToDb } from '@/lib/mails/recordMessageToDb'
import { uploadToCloudinary } from '@/lib/mails/uploadToCloudinary'
import { SerializedValue, serializeData } from '@/lib/serialization'
import bcrypt from 'bcryptjs'

type ReceiverInfo = {
  firstname: string
  lastname: string
} | null

// Note: La table messages n'existe pas encore dans le schéma Supabase
// Ces fonctions sont prêtes pour quand la table sera créée
type Message = {
  id: string
  sender_id: string
  sender_type: string
  recipient_id: string
  subject: string
  body: string
  is_read: Record<string, boolean> | null
  is_deleted: Record<string, boolean> | null
  attachments: string[] | null
  created_at: string
  updated_at: string
}

/**
 * Récupère les informations de base d'un utilisateur par son rôle et ID
 */
async function getBasicUserInfo(role: 'teacher' | 'student', userId: string) {
  const supabase = await createClient()

  const { data: user, error } = await supabase
    .from('users')
    .select('id, firstname, lastname, email')
    .eq('id', userId)
    .eq('role', role)
    .eq('is_active', true)
    .single()

  if (error || !user) {
    return null
  }

  return user
}

/**
 * Suppression des emails
 */
export async function deleteMail(
  messageId: string,
  userId: string,
): Promise<ApiResponse<SerializedValue>> {
  await getSessionServer()

  try {
    const supabase = await createClient()

    // Récupérer le message actuel pour obtenir is_deleted
    const { data: currentMessage, error: fetchError } = await supabase
      .from('messages')
      .select('is_deleted')
      .eq('id', messageId)
      .single()

    if (fetchError || !currentMessage) {
      return {
        success: false,
        message: 'Message non trouvé',
        data: null,
      }
    }

    // Mettre à jour is_deleted pour cet utilisateur
    const currentDeleted = currentMessage.is_deleted || {}
    const updatedDeleted = { ...currentDeleted, [userId]: true }

    const { data: updatedMessage, error } = await supabase
      .from('messages')
      .update({ is_deleted: updatedDeleted })
      .eq('id', messageId)
      .select()
      .single()

    if (error || !updatedMessage) {
      console.error('[DELETE_MAIL] Supabase error:', error)
      return {
        success: false,
        message: 'Erreur lors de la suppression',
        data: null,
      }
    }

    return {
      success: true,
      data: updatedMessage ? serializeData(updatedMessage) : null,
      message: 'Message marqué comme supprimé pour l\'utilisateur',
    }
  } catch (error: any) {
    console.error('[SOFT_DELETE_MAIL]', error)
    throw new Error(`Erreur lors de la suppresion des mails: ${error.message}`)
  }
}

/**
 * Réception des emails
 */
export async function getMail(userId: string): Promise<ApiResponse<SerializedValue>> {
  await getSessionServer()

  try {
    const supabase = await createClient()
    let mails: Message[]

    const user =
      (await getBasicUserInfo('teacher', userId)) || (await getBasicUserInfo('student', userId))

    if (userId !== process.env.ADMIN_ID_USER) {
      // Rechercher par ID ou email
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .or(`recipient_id.eq.${userId},recipient_id.eq.${user?.email || ''}`)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('[GET_MAIL] Supabase error:', error)
        throw new Error('Erreur lors de la récupération des messages')
      }

      mails = data || []
    } else {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('recipient_id', 'mosqueecolomiers@gmail.com')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('[GET_MAIL] Admin messages error:', error)
        throw new Error('Erreur lors de la récupération des messages admin')
      }

      mails = data || []
    }

    if (!mails || mails.length === 0) {
      return {
        success: false,
        message: 'Messages non trouvés',
        data: null,
      }
    }

    const enrichedMails = await Promise.all(
      mails.map(async (message) => {
        if (message.sender_type === 'teacher' || message.sender_type === 'student') {
          const senderData = await getBasicUserInfo(message.sender_type, String(message.sender_id))

          if (!senderData) {
            throw new Error(
              `Failed to fetch sender data for ${message.sender_type} ${message.sender_id}`,
            )
          }

          return {
            ...message,
            senderName: `${senderData.firstname} ${senderData.lastname}`,
          }
        }
        // ADMIN
        else if (message.sender_type === 'admin' || message.sender_type === 'bureau') {
          return {
            ...message,
            senderName: 'La Direction de la Mosquée de Colomiers',
          }
        } else {
          throw new Error(`Invalid senderType: ${message.sender_type}`)
        }
      }),
    )

    const filteredMessages = enrichedMails.filter((message: any) => {
      const isNotDeletedForUser = !message.is_deleted?.[userId]
      let isRecipient = false

      if (message.recipient_id.includes(userId)) {
        isRecipient = true
      } else {
        if (message.recipient_id.includes('mosqueecolomiers@gmail.com')) {
          isRecipient = true
        }
      }

      return isNotDeletedForUser && isRecipient
    })

    return {
      success: true,
      data: filteredMessages ? serializeData(filteredMessages) : null,
      message: 'Messages récupéré avec succès',
    }
  } catch (error: any) {
    console.error('[GET_MAIL]', error)
    throw new Error(`Erreur lors de la réception des mails: ${error.message}`)
  }
}

/**
 * Réception des emails envoyés
 */
export async function getSentMails(userId: string): Promise<ApiResponse<SerializedValue>> {
  await getSessionServer()

  try {
    const supabase = await createClient()
    let mails: Message[]

    if (userId !== process.env.ADMIN_ID_USER) {
      // Rechercher les messages envoyés par cet utilisateur
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('sender_id', userId)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('[GET_SENT_MAILS] Supabase error:', error)
        throw new Error('Erreur lors de la récupération des messages envoyés')
      }

      mails = data || []
    } else {
      // Recherche par type d'expéditeur pour l'admin
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .in('sender_type', ['admin', 'bureau'])
        .order('created_at', { ascending: false })

      if (error) {
        console.error('[GET_SENT_MAILS] Admin messages error:', error)
        throw new Error('Erreur lors de la récupération des messages admin')
      }

      mails = data || []
    }

    if (!mails) {
      return {
        success: false,
        message: 'Messages non trouvés',
        data: null,
      }
    }

    const enrichedMails = await Promise.all(
      mails.map(async (message) => {
        if (message.sender_type === 'teacher' || message.sender_type === 'student') {
          const senderData = await getBasicUserInfo(message.sender_type, String(message.sender_id))

          if (!senderData) {
            throw new Error(
              `Failed to fetch sender data for ${message.sender_type} ${message.sender_id}`,
            )
          }

          return {
            ...message,
            senderName: `${senderData.firstname} ${senderData.lastname}`,
          }
        }
        // ADMIN
        else if (message.sender_type === 'admin' || message.sender_type === 'bureau') {
          return {
            ...message,
            senderName: 'La Direction de la Mosquée de Colomiers',
          }
        } else {
          throw new Error(`Invalid senderType: ${message.sender_type}`)
        }
      }),
    )

    return {
      success: true,
      data: enrichedMails ? serializeData(enrichedMails) : null,
      message: 'Messages envoyés récupérés avec succès',
    }
  } catch (error: any) {
    console.error('[GET_SENT_MAILS]', error)
    throw new Error(`Erreur lors de la réception des mails envoyés: ${error.message}`)
  }
}

/**
 * Récupère les informations du destinataire
 */
export async function fetchReceiver(
  recipientType: 'teacher' | 'student',
  recipientId: string,
): Promise<ReceiverInfo> {
  try {
    const receiverData = await getBasicUserInfo(recipientType, recipientId)

    if (!receiverData) {
      return null
    }

    return {
      firstname: receiverData.firstname,
      lastname: receiverData.lastname,
    }
  } catch (error) {
    console.error('[FETCH_RECEIVER]', error)
    return null
  }
}

/**
 * Marquer un mail comme lu
 */
export async function onClickMail(
  userId: number,
  mailId: number,
): Promise<ApiResponse<SerializedValue>> {
  await getSessionServer()

  try {
    const supabase = await createClient()

    // Récupérer le message actuel pour obtenir is_read
    const { data: currentMessage, error: fetchError } = await supabase
      .from('messages')
      .select('is_read')
      .eq('id', mailId)
      .single()

    if (fetchError || !currentMessage) {
      return {
        success: false,
        message: 'Message non trouvé',
        data: null,
      }
    }

    // Mettre à jour is_read pour cet utilisateur
    const currentRead = currentMessage.is_read || {}
    const updatedRead = { ...currentRead, [userId]: true }

    const { data: updatedMessage, error } = await supabase
      .from('messages')
      .update({ is_read: updatedRead })
      .eq('id', mailId)
      .select()
      .single()

    if (error || !updatedMessage) {
      console.error('[ON_CLICK_MAIL] Supabase error:', error)
      return {
        success: false,
        message: 'Erreur lors de la mise à jour',
        data: null,
      }
    }

    return {
      success: true,
      data: updatedMessage ? serializeData(updatedMessage) : null,
      message: 'Message marqué comme lu',
    }
  } catch (error: any) {
    console.error('[ON_CLICK_MAIL]', error)
    throw new Error(`Erreur lors du marquage du mail: ${error.message}`)
  }
}

/**
 * Envoi d'email
 */
export async function sendMail(
  formData: FormData,
  user: {firstname: string; lastname: string},
): Promise<ApiResponse<SerializedValue>> {
  await getSessionServer()

  try {
    const attachments = formData.getAll('attachments') as File[]
    const attachmentUrls: string[] = []

    // Upload des pièces jointes si présentes
    if (attachments && attachments.length > 0 && attachments[0]?.size > 0) {
      for (const file of attachments) {
        const uploadResult = await uploadToCloudinary(file)
        if (uploadResult.success && uploadResult.data) {
          attachmentUrls.push(uploadResult.data.secure_url)
        }
      }
    }

    const messageBody: MessageBody = {
      recipientType: formData.get('recipientType') as 'teacher' | 'student',
      recipientId: formData.get('recipientId') as string,
      senderId: formData.get('senderId') as string,
      senderType: formData.get('senderType') as 'teacher' | 'student' | 'admin' | 'bureau',
      subject: formData.get('subject') as string,
      body: formData.get('body') as string,
      attachments: attachmentUrls,
    }

    // Obtenir les informations du destinataire
    const receiverInfo = await fetchReceiver(messageBody.recipientType, messageBody.recipientId)

    if (!receiverInfo) {
      return {
        success: false,
        message: 'Destinataire non trouvé',
        data: null,
      }
    }

    const normalizedRecipients = normalizeRecipientInfo([receiverInfo])

    // Enregistrer en base de données
    const saveResult = await recordMessageToDb(messageBody)
    if (!saveResult.success) {
      return saveResult
    }

    // Envoyer l'email
    const emailResult = await sendEmailNotification(
      messageBody,
      normalizedRecipients,
      user.firstname,
      user.lastname,
    )

    if (!emailResult.success) {
      return emailResult
    }

    return {
      success: true,
      data: serializeData(saveResult.data),
      message: 'Email envoyé avec succès',
    }
  } catch (error: any) {
    console.error('[SEND_MAIL]', error)
    throw new Error(`Erreur lors de l'envoi de l'email: ${error.message}`)
  }
}

/**
 * Vérification email et mot de passe
 */
export async function verifyEmailAndPassword(
  email: string,
  pwd: string,
): Promise<ApiResponse<SerializedValue>> {
  try {
    const supabase = await createClient()

    const { data: user, error } = await supabase
      .from('users')
      .select('id, email, password_hash, firstname, lastname, role')
      .eq('email', email)
      .eq('is_active', true)
      .single()

    if (error || !user) {
      return {
        success: false,
        message: 'Utilisateur non trouvé',
        data: null,
      }
    }

    // Vérifier le mot de passe
    const isPasswordValid = await bcrypt.compare(pwd, user.password_hash)

    if (!isPasswordValid) {
      return {
        success: false,
        message: 'Mot de passe incorrect',
        data: null,
      }
    }

    // Retourner les données utilisateur sans le mot de passe
    const { password_hash, ...userWithoutPassword } = user

    return {
      success: true,
      data: serializeData(userWithoutPassword),
      message: 'Authentification réussie',
    }
  } catch (error: any) {
    console.error('[VERIFY_EMAIL_PASSWORD]', error)
    throw new Error(`Erreur lors de la vérification: ${error.message}`)
  }
}

async function getSessionServer() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    throw new Error('Non authentifié')
  }

  return { user }
}

function normalizeRecipientInfo(recipientInfo: any[]) {
  return recipientInfo.map((recipient) => ({
    firstname: recipient.firstname,
    lastname: recipient.lastname,
  }))
}
