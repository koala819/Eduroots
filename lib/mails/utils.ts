import {ReceiverName} from '@/types/models'

export function formatDate(isoDate: string): string {
  const date = new Date(isoDate)
  return new Intl.DateTimeFormat('fr-FR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
  }).format(date)
}

export function getReceiverName(recipientType: string): string {
  const recipientNames: ReceiverName = {
    admin: 'Bureau',
    teacher: 'tous les enseignants',
    all: 'tout le monde',
    student: 'tous les élèves',
    default: 'inconnu',
  }

  return recipientNames[recipientType] || recipientNames.default
}

// export function useDeleteEmail(
//   messages: Mail[],
//   setMessages: React.Dispatch<React.SetStateAction<Mail[]>>,
//   setDisplayPostIndex: (index: number | null) => void,
//   fetchWithAuth: any,
//   toast: any,
// ) {
//   return async (index: number) => {
//     console.log('go to delete email', index)
//     console.log('messageId', messages[index]._id)
//     try {
//       const response = await fetchWithAuth('/api/mail/softDelete', {
//         method: 'POST',
//         body: {
//           messageId: messages[index]._id,
//         },
//       })
//       console.log('response', response)
//       if (response.status !== 200) {
//         throw new Error('Failed to mark email as deleted')
//       }
//       toast.success('Email supprimé avec succès !')
//       setMessages((prevMessages) => prevMessages.filter((_, i) => i !== index))
//       setDisplayPostIndex(null)
//     } catch (error) {
//       console.error('Error marking email as deleted:', error)
//       toast.error("Échec de la suppression de l'email")
//     }
//   }
// }

// export function useHandleEmailClick(
//   messages: Mail[],
//   setMessages: React.Dispatch<React.SetStateAction<Mail[]>>,
//   fetchWithAuth: any,
//   toast: any,
// ) {
//   return async (
//     index: number,
//     displayPostIndex: number | null,
//     setDisplayPostIndex: (index: number | null) => void,
//   ) => {
//     if (!messages[index].isRead) {
//       try {
//         const response = await fetchWithAuth('/api/mail', {
//           method: 'PATCH',
//           body: {
//             id: messages[index]._id,
//             isRead: true,
//           },
//         })

//         if (response.status !== 200) {
//           throw new Error(
//             'Failed to update email status with error: ' + response.statusText,
//           )
//         }
//         setMessages((prevMessages) =>
//           prevMessages.map((msg, i) =>
//             i === index ? { ...msg, isRead: true } : msg,
//           ),
//         )
//       } catch (error) {
//         console.error('Error updating email status:', error)
//         toast.error('Failed to update email status', error)
//       }
//     }
//     setDisplayPostIndex(displayPostIndex === index ? null : index)
//   }
// }

// export function useMarkAsUnread(
//   messages: Mail[],
//   setMessages: React.Dispatch<React.SetStateAction<Mail[]>>,
//   setDisplayPostIndex: (index: number | null) => void,
//   fetchWithAuth: any,
//   toast: any,
// ) {
//   return async (index: number) => {
//     try {
//       const response = await fetchWithAuth('/api/mail', {
//         method: 'PATCH',
//         body: {
//           id: messages[index]._id,
//           isRead: false,
//         },
//       })
//       // console.log('response', response)
//       if (response.status !== 200) {
//         throw new Error(
//           'Failed to mark email as unread with error',
//           response.message,
//         )
//       }
//       setMessages((prevMessages) =>
//         prevMessages.map((msg, i) =>
//           i === index ? { ...msg, isRead: false } : msg,
//         ),
//       )
//       setDisplayPostIndex(null)
//     } catch (error) {
//       console.error('Error marking email as unread:', error)
//       toast.error('Failed to mark email as unread')
//     }
//   }
// }
// export async function fetchMailsLogic(session: any): Promise<Mail[]> {
//   try {
//     const url = '/api/mail'
//     const response = await fetchWithAuth(url, { method: 'GET' })

//     // console.log('check status from inbox', response)
//     if (response.status !== 200) {
//       if (response.status === 404) {
//         return []
//       }
//       throw new Error('Erreur lors de la récupération des e-mails')
//     }

//     // console.log('check mails from inbox', response.data)
//     let fetchedMessages: Mail[] = response.data

//     fetchedMessages = await Promise.all(
//       fetchedMessages.map(async (message) => {
//         // console.log('check sender type', message.senderType)
//         if (
//           message.senderType === 'teacher' ||
//           message.senderType === 'student'
//         ) {
//           // console.log('check sender type', message.senderType)
//           const senderData = await getBasicUserInfo(
//             message.senderType,
//             message.senderId,
//           )

//           if (!senderData) {
//             throw new Error(
//               `Failed to fetch sender data for ${message.senderType} ${message.senderId}`,
//             )
//           }

//           return {
//             ...message,
//             senderName: `${senderData.firstname} ${senderData.lastname}`,
//           }
//         }
//         // ADMIN
//         else if (
//           message.senderType === 'admin' ||
//           message.senderType === 'bureau'
//         ) {
//           return {
//             ...message,
//             senderName: 'La Direction de la Mosquée de Colomiers',
//           }
//         } else {
//           throw new Error(`Invalid senderType: ${message.senderType}`)
//         }
//       }),
//     )

//     // console.log('Messages with sender data:', fetchedMessages)
//     const filteredMessages = fetchedMessages.filter((message: any) => {
//       const isNotDeletedForUser = !message.isDeleted?.[session?.user?._id]
//       let isRecipient = false
//       // console.log('check recipient id', message.recipientId)
//       if (message.recipientId.includes(session?.user?._id)) {
//         isRecipient = true
//       } else {
//         if (message.recipientId.includes('mosqueecolomiers@gmail.com')) {
//           isRecipient = true
//         }
//       }

//       // console.log(
//       //   `Message ${message._id}: isNotDeletedForUser=${isNotDeletedForUser}, isRecipient=${isRecipient}`,
//       // )

//       return isNotDeletedForUser && isRecipient
//     })
//     // console.log('Final filtered messages:', filteredMessages)
//     return filteredMessages
//   } catch (err) {
//     console.error(err)
//     throw new Error('Erreur lors de la récupération des e-mails')
//   }
// }
