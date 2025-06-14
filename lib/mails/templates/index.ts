import {MessageBody} from '@/types/mongo/models'

import {EMAIL_CONFIG, EmailUsageType} from '../config'
import {mailBugAttendance} from './skinBugAttendance'
import {mailBugBehavior} from './skinBugBehavior'
import {mailCheckAdminCo} from './skinCheckAdminCo'
import {sendOTP} from './skinOTP'
import {skinUpdateStudentEmail} from './skinUpdateStudentEmail'

import {mailMessage} from '@/lib/mails/templates/skin'

interface TemplateParams {
  body?: MessageBody
  sender?: string
  receiver: {
    firstname?: string
    lastname?: string
    email?: string
  }
  usage: EmailUsageType
  file?: File
  attachmentUrl?: string | null
  otp?: number
  detailedBody?: Record<string, any>
}

/**
 * Factory pattern pour les templates d'emails
 * Retourne le HTML du template en fonction du type d'usage
 */
export function getEmailTemplate(usage: EmailUsageType, params: TemplateParams): string {
  const templateFunctions = {
    standard: () =>
      mailMessage(params.body?.subject, params.sender, EMAIL_CONFIG.websiteUrl || '', 'standard'),

    bureau: () =>
      mailMessage(params.body?.subject, params.sender, EMAIL_CONFIG.websiteUrl || '', 'bureau'),

    attendanceError: () => mailBugAttendance(params.detailedBody),

    behaviorError: () => mailBugBehavior(params.detailedBody),

    checkAdminCo: () => mailCheckAdminCo(params.detailedBody),

    fixNewEmail: () => skinUpdateStudentEmail(params.detailedBody),

    rstPwd: () => sendOTP(params.otp),
  }

  const templateFunction = templateFunctions[usage]

  if (!templateFunction) {
    throw new Error(`Template for usage type "${usage}" not found`)
  }

  return templateFunction()
}

// Exporter les templates individuels pour une utilisation directe si nécessaire
export {
  mailMessage,
  mailBugAttendance,
  mailBugBehavior,
  mailCheckAdminCo,
  sendOTP,
  skinUpdateStudentEmail,
}
