import { NextResponse } from 'next/server'

import { MessageBody } from '@/types/models'

import { Message } from '@/backend/models/message'

export async function recordMessageToDb(
  body: MessageBody,
  attachmentUrl: string | null,
  isRead: boolean = false,
  parentMessageId: string | null = null,
) {
  try {
    const newMessage = new Message<MessageBody>({
      senderId: body.senderId,
      senderType: body.senderType,
      recipientId: body.recipientId,
      recipientType: body.recipientType,
      subject: body.subject,
      message: body.message,
      isRead: isRead,
      attachmentUrl: attachmentUrl ? attachmentUrl : null,
      parentMessageId: parentMessageId,
    })
    // console.log('\n\nnewMessage', newMessage)
    await newMessage.save()

    return NextResponse.json({
      status: 200,
      statusText: 'Enregistrement en base avec succès',
    })
  } catch (error: any) {
    console.error('Error details', error)
    return NextResponse.json({
      status: 500,
      statusText: `Error to save in db : ${error.message}`,
      errorDetails: error.stack,
    })
  }
}
