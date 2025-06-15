'use server'

import { MessageBody } from '@/types/mongo/models'

import { EMAIL_CONFIG, EmailUsageType } from './config'
import { getEmailTemplate } from './templates'

import nodemailer from 'nodemailer'

interface EmailSendParams {
  body?: MessageBody
  sender?: string
  receiver: {
    firstname?: string
    lastname?: string
    email?: string
    _id?: string
    type?: string
  }
  usage: EmailUsageType
  file?: File
  attachmentUrl?: string | null
  otp?: number
  detailedBody?: Record<string, any>
}

/**
 * Service d'envoi d'emails
 * Gère l'envoi technique des emails via Nodemailer
 */
export async function sendEmailNotification(params: EmailSendParams) {
  try {
    // Récupération des variables d'environnement
    const user = process.env.MAIL_USER
    const pass = process.env.MAIL_PWD
    const host = process.env.MAIL_HOST
    const port = process.env.MAIL_PORT

    // Validation des variables d'environnement
    if (!user || !pass || !host || !port) {
      return {
        success: false,
        message: 'One or more required environment variables are not set.',
        data: null,
      }
    }

    // Configuration du transporteur
    const transporter = nodemailer.createTransport({
      host: host,
      port: parseInt(port),
      secure: true,
      auth: {
        user: user,
        pass,
      },
    })

    // Obtenir les options d'email en fonction du type d'usage
    const mailOptions = getMailOptions(params, user)

    // Envoi de l'email
    await transporter.sendMail(mailOptions)

    return {
      success: true,
      data: null,
      message: 'Send the email with success',
    }
  } catch (error: any) {
    console.error('Email send error:', error)
    return {
      success: false,
      message: `Error to email send : ${error.message}`,
      data: null,
    }
  }
}

/**
 * Génère les options d'email en fonction du type d'utilisation
 */
function getMailOptions(params: EmailSendParams, defaultSender: string) {
  const { usage, sender, receiver, body, detailedBody, otp } = params
  const template = getEmailTemplate(usage, params)

  switch (usage) {
  case 'attendanceError':
    return {
      from: EMAIL_CONFIG.defaultSender,
      to: EMAIL_CONFIG.techSupportEmail,
      subject: 'BUG with attendance',
      html: template,
    }

  case 'behaviorError':
    return {
      from: EMAIL_CONFIG.defaultSender,
      to: EMAIL_CONFIG.techSupportEmail,
      subject: 'BUG with behavior',
      html: template,
    }

  case 'checkAdminCo':
    return {
      from: 'watching@col.dix31.com',
      to: EMAIL_CONFIG.techSupportEmail,
      subject: `${detailedBody?.mail} - Connexion à l'idg ADMIN`,
      html: template,
    }

  case 'fixNewEmail':
    return {
      from: EMAIL_CONFIG.defaultSender,
      to: EMAIL_CONFIG.defaultSender,
      bcc: EMAIL_CONFIG.techSupportEmail,
      subject: `Fix new email for ${detailedBody?.firstname} ${detailedBody?.lastname}`,
      html: template,
    }

  case 'standard':
  case 'bureau':
    return {
      from: `${sender} <${defaultSender}>`,
      to: receiver.email,
      subject: `${body?.subject}`,
      text: `${body?.message}`,
      html: template,
    }

  case 'rstPwd':
    return {
      from: EMAIL_CONFIG.defaultSender,
      to: receiver.email,
      bcc: EMAIL_CONFIG.techSupportEmail,
      subject: 'Votre code pour définir un nouveau mot de passe',
      html: template,
    }

  default:
    throw new Error(`Email usage type "${usage}" not supported`)
  }
}
