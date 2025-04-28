'use server'

import { getServerSession } from 'next-auth'

import { ApiResponse } from '@/types/api'
import { MessageBody } from '@/types/models'

import { Message } from '@/backend/models/message'
import { User } from '@/backend/models/user.model'
import { getBasicUserInfo } from '@/lib/getBasicUserInfo'
import { EMAIL_CONFIG } from '@/lib/mails/config'
import { sendEmailNotification } from '@/lib/mails/emailService'
import { recordMessageToDb } from '@/lib/mails/recordMessageToDb'
import { uploadToCloudinary } from '@/lib/mails/uploadToCloudinary'
import { SerializedValue, serializeData } from '@/lib/serialization'
import bcrypt from 'bcryptjs'

type ReceiverInfo = {
  firstname: string
  lastname: string
} | null

/**
 * Suppression des emails
 */
export async function deleteMail(
  messageId: string,
  userId: string,
): Promise<ApiResponse<SerializedValue>> {
  await getSessionServer()

  try {
    const updatedMessage = await Message.findOneAndUpdate(
      { _id: messageId },
      { $set: { [`isDeleted.${userId}`]: true } },
      { new: true },
    )

    if (!updatedMessage) {
      return {
        success: false,
        message: 'Message non trouvé',
        data: null,
      }
    }

    return {
      success: true,
      data: updatedMessage ? serializeData(updatedMessage) : null,
      message: "Message marqué comme supprimé pour l'utilisateur",
    }
  } catch (error: any) {
    console.error('[SOFT_DELETE_MAIL]', error)
    throw new Error(`Erreur lors de la suppresion des mails: ${error.message}`)
  }
}

/**
 * Réception des emails
 */
export async function getMail(
  userId: string,
): Promise<ApiResponse<SerializedValue>> {
  await getSessionServer()

  try {
    let mails
    // console.log('\n\ncheck recipientId user_id', userId)

    const user =
      (await getBasicUserInfo('teacher', userId)) ||
      (await getBasicUserInfo('student', userId))

    if (userId !== process.env.ADMIN_ID_USER) {
      // Rechercher par ID ou email
      mails = await Message.find({
        recipientId: {
          $in: [userId, user?.email || ''],
        },
      })
        .sort({ createdAt: -1 })
        .lean()

      // console.log(
      //   `Found ${mails.length} messages for user with ID ${userId} or email ${user?.email}`,
      // )
    } else {
      mails = await Message.find({
        recipientId: 'mosqueecolomiers@gmail.com',
      })
        .sort({ createdAt: -1 })
        .lean()
    }
    if (!mails) {
      return {
        success: false,
        message: 'Messages non trouvés',
        data: null,
      }
    }

    mails = await Promise.all(
      mails.map(async (message) => {
        // console.log('check sender type', message.senderType)
        if (
          message.senderType === 'teacher' ||
          message.senderType === 'student'
        ) {
          // console.log('check sender type', message.senderType)
          const senderData = await getBasicUserInfo(
            message.senderType,
            String(message.senderId),
          )

          if (!senderData) {
            throw new Error(
              `Failed to fetch sender data for ${message.senderType} ${message.senderId}`,
            )
          }

          return {
            ...message,
            senderName: `${senderData.firstname} ${senderData.lastname}`,
          }
        }
        // ADMIN
        else if (
          message.senderType === 'admin' ||
          message.senderType === 'bureau'
        ) {
          return {
            ...message,
            senderName: 'La Direction de la Mosquée de Colomiers',
          }
        } else {
          throw new Error(`Invalid senderType: ${message.senderType}`)
        }
      }),
    )

    // console.log('Messages with sender data:', fetchedMessages)
    const filteredMessages = mails.filter((message: any) => {
      const isNotDeletedForUser = !message.isDeleted?.[userId]
      let isRecipient = false
      // console.log('check recipient id', message.recipientId)
      if (message.recipientId.includes(userId)) {
        isRecipient = true
      } else {
        if (message.recipientId.includes('mosqueecolomiers@gmail.com')) {
          isRecipient = true
        }
      }

      // console.log(
      //   `Message ${message._id}: isNotDeletedForUser=${isNotDeletedForUser}, isRecipient=${isRecipient}`,
      // )

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
export async function getSentMails(
  userId: string,
): Promise<ApiResponse<SerializedValue>> {
  await getSessionServer()

  try {
    let mails
    // console.log('\n\ncheck senderId user_id', userId)

    // Obtenir les infos utilisateur pour le débogage
    // const user =
    //   (await getBasicUserInfo('teacher', userId)) ||
    //   (await getBasicUserInfo('student', userId))
    // console.log('User info:', user)

    if (userId !== process.env.ADMIN_ID_USER) {
      // Rechercher les messages envoyés par cet utilisateur
      mails = await Message.find({
        senderId: userId,
      })
        .sort({ createdAt: -1 })
        .lean()

      // console.log(
      //   `Found ${mails.length} sent messages for user with ID ${userId}`,
      // )
    } else {
      // Recherche par type d'expéditeur pour l'admin
      mails = await Message.find({
        senderType: { $in: ['admin', 'bureau'] },
      })
        .sort({ createdAt: -1 })
        .lean()
    }
    if (!mails) {
      return {
        success: false,
        message: 'Messages non trouvés',
        data: null,
      }
    }

    mails = await Promise.all(
      mails.map(async (message) => {
        // console.log('check sender type', message.senderType)
        if (
          message.senderType === 'teacher' ||
          message.senderType === 'student'
        ) {
          // console.log('check sender type', message.senderType)
          const senderData = await getBasicUserInfo(
            message.senderType,
            String(message.senderId),
          )

          if (!senderData) {
            throw new Error(
              `Failed to fetch sender data for ${message.senderType} ${message.senderId}`,
            )
          }

          return {
            ...message,
            senderName: `${senderData.firstname} ${senderData.lastname}`,
          }
        }
        // ADMIN
        else if (
          message.senderType === 'admin' ||
          message.senderType === 'bureau'
        ) {
          return {
            ...message,
            senderName: 'La Direction de la Mosquée de Colomiers',
          }
        } else {
          throw new Error(`Invalid senderType: ${message.senderType}`)
        }
      }),
    )

    // Débogage pour comprendre ce qu'il y a dans mails après Promise.all
    // console.log('getSentMails: Messages after Promise.all:', mails?.length)
    // if (mails?.length > 0) {
    //   console.log('getSentMails: First message sample:', {
    //     _id: mails[0]._id,
    //     senderId: mails[0].senderId,
    //     senderType: mails[0].senderType,
    //     recipientId: mails[0].recipientId,
    //     senderName: mails[0].senderName,
    //   })
    // }

    // Ne pas filtrer les messages envoyés par l'utilisateur lui-même
    const filteredMessages = mails.filter((message: any) => {
      // Vérifier uniquement si le message n'est pas supprimé
      const isNotDeletedForUser = !message.isDeleted?.[userId]
      return isNotDeletedForUser
    })

    // console.log(
    //   'getSentMails: Filtered messages length:',
    //   filteredMessages?.length,
    // )
    const serializedData = filteredMessages
      ? serializeData(filteredMessages)
      : null

    return {
      success: true,
      data: serializedData,
      message: 'Messages récupéré avec succès',
    }
  } catch (error: any) {
    console.error('[GET_SEND_MAIL]', error)
    throw new Error(
      `Erreur lors de la réception des mails envoyés: ${error.message}`,
    )
  }
}

/**
 * Récupère les informations d'un utilisateur avec mise en cache
 */
export async function fetchReceiver(
  recipientType: 'teacher' | 'student',
  recipientId: string,
): Promise<ReceiverInfo> {
  try {
    // Vérifier le cache si disponible dans le navigateur
    if (typeof window !== 'undefined' && window.sessionStorage) {
      const cacheKey = `user-${recipientType}-${recipientId}`
      const cachedData = sessionStorage.getItem(cacheKey)

      if (cachedData) {
        return JSON.parse(cachedData)
      }
    }

    // Récupérer les données
    const response = await getBasicUserInfo(recipientType, recipientId)

    // Vérifier que les données nécessaires sont présentes
    if (response && response.firstname && response.lastname) {
      const result = {
        firstname: response.firstname,
        lastname: response.lastname,
      }

      // Mettre en cache si possible
      if (typeof window !== 'undefined' && window.sessionStorage) {
        const cacheKey = `user-${recipientType}-${recipientId}`
        sessionStorage.setItem(cacheKey, JSON.stringify(result))
      }

      return result
    }

    return null
  } catch (error) {
    console.error(`Error fetching ${recipientType} information:`, error)
    return null
  }
}

/**
 * Gère le clic sur un mail pour le marquer comme lu/non lu
 */
export async function onClickMail(
  userId: number,
  mailId: number,
): Promise<ApiResponse<SerializedValue>> {
  await getSessionServer()

  try {
    //  const { id, isRead } = await req.json()
    // console.log('mail id', id, 'isRead', isRead, 'user Id', user._id)

    if (!mailId || !userId) {
      return {
        success: false,
        message: 'Missing id or invalid isRead',
        data: null,
      }
    }

    const updatedMail = await Message.findOneAndUpdate(
      {
        _id: mailId,
        $or: [{ recipientId: userId }, { senderId: userId }],
      },
      [{ $set: { isRead: { $not: '$isRead' } } }], // Utilise opérateur $not pour inverser la valeur
      { new: true },
    )

    if (!updatedMail) {
      return {
        success: false,
        message: 'Mail non trouvé',
        data: null,
      }
    }

    return {
      success: true,
      data: updatedMail ? serializeData(updatedMail) : null,
      message: 'Mail updated successfully',
    }
  } catch (error: any) {
    console.error('[ON_CLICK_MAIL]', error)
    throw new Error(`Erreur lors de du click sur le mail: ${error.message}`)
  }
}

export async function sendMail(
  formData: FormData,
  user: { firstname: string; lastname: string },
): Promise<ApiResponse<SerializedValue>> {
  await getSessionServer()

  try {
    // Extraction des données du formulaire
    const recipientId = formData.get('recipientId') as string
    const recipientType = formData.get('recipientType') as string
    const subject = formData.get('subject') as string
    const message = formData.get('message') as string
    const parentMessageId = formData.get('parentMessageId') as string | null
    const file = formData.get('attachment') as File | null

    // Validation de la taille du fichier
    if (file && file.size > 10 * 1024 * 1024) {
      return {
        success: false,
        message: 'Votre fichier doit faire moins de 10MB',
        data: null,
      }
    }

    // Upload du fichier si présent
    const attachmentUrl = file
      ? await uploadToCloudinary(file, file.name)
      : null

    // Traitement des destinataires
    let recipientInfo = JSON.parse(formData.get('recipientInfo') as string)
    const normalizedRecipients = normalizeRecipientInfo(recipientInfo)

    // Extraction des IDs et types pour l'enregistrement en base
    const receivers = normalizedRecipients.map((recipient) => ({
      email: recipient.email,
      _id: recipient._id,
      type: recipient.type,
      firstname: recipient.firstname,
      lastname: recipient.lastname,
    }))

    const recipientIds = receivers.map((r) => r._id).filter(Boolean)
    const recipientTypes = Array.from(new Set(receivers.map((r) => r.type)))

    // Construction du corps du message
    const body: MessageBody = {
      senderId: recipientId,
      senderType: recipientType,
      subject: subject,
      recipientId: recipientIds,
      recipientType: recipientTypes,
      message: message,
      parentMessageId: parentMessageId,
      isRead: false,
      attachmentUrl: attachmentUrl,
    }

    // Enregistrement en base de données
    const resRecDb = await recordMessageToDb(
      body,
      attachmentUrl,
      false,
      body.parentMessageId,
    )
    const nextStep = await resRecDb.json()

    if (nextStep.status !== 200) {
      return {
        success: false,
        message: `Internal Server Error : ${resRecDb.statusText}`,
        data: null,
      }
    }

    // Détermination de l'expéditeur
    const sender =
      recipientType === 'admin' || recipientType === 'bureau'
        ? 'La Direction de la Mosquée de Colomiers'
        : `${user.firstname} ${user.lastname}`

    // Envoi du mail à chaque destinataire
    for (const receiver of receivers) {
      const respMail = await sendEmailNotification({
        body,
        sender,
        receiver,
        usage: receiver.type === 'admin' ? 'bureau' : 'standard',
        file: file ?? undefined,
      })

      const finish = await respMail

      if (!finish.success) {
        return {
          success: false,
          message: "Erreur lors de l'envoi du mail",
          data: null,
        }
      }
    }

    return {
      success: true,
      data: null,
      message: 'Le message a bien été envoyé',
    }
  } catch (error: any) {
    console.error('[IS_EMAIL_EXIST]', error)
    throw new Error(
      `Erreur lors de la vérification de l'existence du mail: ${error.message}`,
    )
  }
}

export async function verifyEmailAndPassword(
  email: string,
  pwd: string,
): Promise<ApiResponse<SerializedValue>> {
  await getSessionServer()

  try {
    if (!email || !pwd) {
      return {
        success: false,
        message: 'Missing data',
        data: null,
      }
    }

    const userExists = await User.findOne({ email }).select('+password')
    // console.log('userExists', userExists)
    if (!userExists) {
      return {
        success: false,
        message: 'User not found',
        data: null,
      }
    }

    const isPasswordValid = await bcrypt.compare(pwd, userExists.password)
    // console.log('isPasswordValid', isPasswordValid)
    if (!isPasswordValid) {
      return {
        success: false,
        message: 'Incorrect password',
        data: null,
      }
    }
    return {
      success: true,
      data: null,
      message: 'AUthentification réussie',
    }
  } catch (error: any) {
    console.error('[VERIFIE_EMAIL_PASSWORD]', error)
    throw new Error(
      `Erreur lors de la vérification de l'email et du mot de passe : ${error.message}`,
    )
  }
}

async function getSessionServer() {
  const session = await getServerSession()
  if (!session || !session.user) {
    throw new Error('Non authentifié')
  }
  return session
}

/**
 * Normalise les informations des destinataires
 * @param recipientInfo Informations brutes des destinataires
 * @returns Destinataires normalisés
 */
function normalizeRecipientInfo(recipientInfo: any[]) {
  // Traitement spécial pour bureau/admin
  if (
    (recipientInfo.length === 1 && recipientInfo[0].id === 'bureau') ||
    recipientInfo[0].id === 'admin'
  ) {
    return [EMAIL_CONFIG.specialRecipients.bureau]
  }

  // Normalisation standard
  return recipientInfo.map((recipient: any) => {
    const details = recipient.details || recipient
    return {
      email: details.email,
      _id: details._id || recipient.id,
      type: details.role || recipient.type,
      firstname: details.firstname,
      lastname: details.lastname,
    }
  })
}
