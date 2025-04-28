import { IMessage, MessageModel } from '@/types/models'

import { decrypt, encrypt, isValidEncryptedFormat } from '@/lib/mails/encrypt'
import { Schema, model, models } from 'mongoose'

const messageSchema = new Schema<IMessage>({
  senderId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  senderType: { type: String, required: true },
  recipientId: [{ type: String, required: true }],
  recipientType: [{ type: String, required: true }],
  subject: { type: String, required: true },
  message: { type: String, required: true },
  isRead: { type: Boolean, default: false },
  isDeleted: { type: Map, of: Boolean, default: {} },
  isSentbox: { type: Boolean, default: false },
  attachmentUrl: { type: String, default: null },
  createdAt: { type: Date, default: Date.now },
  parentMessageId: {
    type: Schema.Types.ObjectId,
    ref: 'Message',
    default: null,
  },
})

// Méthode statique pour chiffrer les champs sensibles
messageSchema.statics.encryptFields = function (message: IMessage) {
  if (message.subject) {
    const encryptedSubject = encrypt(message.subject)
    if (!isValidEncryptedFormat(encryptedSubject)) {
      throw new Error('Encrypted subject is not in the expected format')
    }
    message.subject = encryptedSubject
  }
  if (message.message) {
    const encryptedMessage = encrypt(message.message)
    if (!isValidEncryptedFormat(encryptedMessage)) {
      throw new Error('Encrypted message is not in the expected format')
    }
    message.message = encryptedMessage
  }
}

// Méthode statique pour déchiffrer les champs sensibles
messageSchema.statics.decryptFields = function (message: IMessage) {
  if (message.subject && isValidEncryptedFormat(message.subject)) {
    message.subject = decrypt(message.subject)
  } else {
    message.subject = 'Erreur de déchiffrement'
  }
  if (message.message && isValidEncryptedFormat(message.message)) {
    message.message = decrypt(message.message)
  } else {
    message.message = "Le contenu n'a pas pu être déchiffré"
  }
}

// Middleware pour chiffrer les champs avant la sauvegarde
messageSchema.pre('save', function (next) {
  if (this.isModified('subject') || this.isModified('message')) {
    try {
      ;(this.constructor as MessageModel).encryptFields(this)
    } catch (error) {
      return next(error as Error)
    }
  }
  next()
})

// Middleware pour déchiffrer les champs après la récupération
messageSchema.post('find', function (docs) {
  docs.forEach((doc: IMessage) => {
    try {
      Message.decryptFields(doc)
    } catch (error: any) {
      console.error('Error decrypting document:', error.message)
      doc.subject = 'Erreur de déchiffrement'
      doc.message = "Le contenu n'a pas pu être déchiffré"
    }
  })
})

messageSchema.post('findOne', function (doc: IMessage | null) {
  if (doc) {
    try {
      Message.decryptFields(doc)
    } catch (error:any) {
      console.error('Error decrypting document:', error.message)
      doc.subject = 'Erreur de déchiffrement'
      doc.message = "Le contenu n'a pas pu être déchiffré"
    }
  }
})

export const Message = (models.Message ||
  model<IMessage, MessageModel>('Message', messageSchema)) as MessageModel
