// import { NextResponse } from 'next/server'

// import { MessageBody } from '@/types/models'

// import { mailBugAttendance } from '@/components/template/skinBugAttendance'
// import { mailBugBehavior } from '@/@/lib/mails/templates/skinBugAttendance
// import { mailCheckAdminCo } from @/lib/mails/templates/skinBugBehaviorCo'
// import { sendOTP } from '@/components/template/skinOTP'
// import { skinUpdateStudentEmail } from '@/components/template/skinUpdateStudentEmail'

// import { mailMessage } from '@/lib/mails/templates/skin'
// import nodemailer from 'nodemailer'

// export async function sendMail({
//   body,
//   sender,
//   receiver,
//   usage,
//   otp,
//   detailedBody,
// }: {
//   body?: MessageBody
//   sender?: string
//   receiver: {
//     firstname: string | undefined
//     lastname: string | undefined
//     email: string | undefined
//   }
//   usage: string
//   file?: File
//   attachmentUrl?: string | null
//   otp?: number
//   detailedBody?: any
// }) {
//   try {
//     const user = process.env.MAIL_USER
//     const pass = process.env.MAIL_PWD
//     const host = process.env.MAIL_HOST
//     const port = process.env.MAIL_PORT

//     if (!user || !pass || !host || !port) {
//       return NextResponse.json({
//         status: 405,
//         statusText: 'One or more required environment variables are not set.',
//       })
//     }

//     const transporter = nodemailer.createTransport({
//       host: host,
//       port: parseInt(port),
//       secure: true,
//       auth: {
//         user: user,
//         pass,
//       },
//       // tls: { rejectUnauthorized: false },
//     })

//     let mailOptions = {}
//     switch (usage) {
//       case 'attendanceError':
//         mailOptions = {
//           from: 'mosqueeColomiers@gmail.com',
//           to: 'contact@dix31.com',
//           subject: 'BUG with attendance',
//           html: mailBugAttendance(detailedBody),
//         }
//         break
//       case 'behaviorError':
//         mailOptions = {
//           from: 'mosqueeColomiers@gmail.com',
//           to: 'contact@dix31.com',
//           subject: 'BUG with behavior',
//           html: mailBugBehavior(detailedBody),
//         }
//         break
//       case 'checkAdminCo':
//         mailOptions = {
//           from: 'watching@col.dix31.com',
//           to: 'contact@dix31.com',
//           subject: ` ${detailedBody.mail} - Connexion à l'idg ADMIN`,
//           html: mailCheckAdminCo(detailedBody),
//         }
//         break
//       case 'fixNewEmail':
//         mailOptions = {
//           from: 'mosqueeColomiers@gmail.com',
//           to: 'mosqueeColomiers@gmail.com',
//           bcc: 'contact@dix31.com',
//           subject: `Fix new email for ${detailedBody.firstname} ${detailedBody.lastname}`,
//           html: skinUpdateStudentEmail(detailedBody),
//         }
//         break
//       case 'standard':
//       case 'bureau':
//         mailOptions = {
//           from: `${sender} <${user}>`,
//           to: receiver.email,
//           subject: `${body?.subject}`,
//           text: `${body?.message}`,
//           html: mailMessage(
//             body?.subject,
//             sender,
//             'https://mosquee-colomiers.vercel.app/',
//             usage,
//           ),
//         }
//         break
//       case 'rstPwd':
//         mailOptions = {
//           from: 'mosqueeColomiers@gmail.com',
//           to: receiver.email,
//           bcc: 'contact@dix31.com',
//           subject: 'Votre code pour définir un nouveau mot de passe',
//           html: sendOTP(otp),
//         }
//         break
//     }

//     await transporter.sendMail(mailOptions)

//     return NextResponse.json({
//       status: 200,
//       statusText: 'Send the email with success',
//     })
//   } catch (error: any) {
//     console.error('Email send error:', error)
//     return NextResponse.json({
//       status: 500,
//       statusText: `Error to email send : ${error.message}`,
//     })
//   }
// }
