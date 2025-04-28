/**
 * Types d'usage des emails supportés par l'application
 */
export type EmailUsageType =
  | 'standard'
  | 'bureau'
  | 'attendanceError'
  | 'behaviorError'
  | 'checkAdminCo'
  | 'fixNewEmail'
  | 'rstPwd'

/**
 * Configuration globale pour les emails
 */
export const EMAIL_CONFIG = {
  // Destinataires spéciaux
  specialRecipients: {
    bureau: {
      id: 'bureau',
      _id: 'bureau',
      role: 'admin',
      type: 'admin',
      firstname: process.env.CONFIG_EMAIL_FIRSTNAME,
      lastname: process.env.CONFIG_EMAIL_LASTNAME,
      email: process.env.TECH_SUPPORT_EMAIL,
    },
  },

  // Emails par défaut
  defaultSender: process.env.DEFAULT_SENDER,
  techSupportEmail: process.env.TECH_SUPPORT_EMAIL,

  // URLs
  websiteUrl: process.env.WEBSITE_URL,

  // Limites
  maxAttachmentSize: 10 * 1024 * 1024, // 10MB
}
