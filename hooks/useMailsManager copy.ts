// // hooks/useMailsManager.ts
// import { useCallback, useMemo, useState } from 'react'
// import { toast } from 'react-toastify'

// import { Mail } from '@/types/models'

// import { fetchWithAuth } from '@/lib/fetchWithAuth'
// import { fetchMailsLogic } from '@/lib/mails/utils'

// export function useMailsManager(session: any, isSentbox: boolean) {
//   const [rawMessages, setRawMessages] = useState<Mail[]>([])

//   // Filtrer et trier les messages
//   const messages = useMemo(() => {
//     return rawMessages
//       .filter((message: Mail) => {
//         if (!message.isDeleted) return true
//         if (typeof message.isDeleted === 'object') {
//           return !message.isDeleted[session?.user?._id as string]
//         }
//         return !message.isDeleted
//       })
//       .sort(
//         (a, b) =>
//           new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
//       )
//   }, [rawMessages, session?.user?._id])

//   // Récupérer les emails
//   const fetchMails = useCallback(async () => {
//     try {
//       let fetchedMails: Mail[]

//       if (isSentbox) {
//         const response = await fetchWithAuth(`/api/mail/sendbox`, {
//           method: 'GET',
//         })

//         if (response.status !== 200) {
//           if (response.status === 404) {
//             fetchedMails = []
//           } else {
//             throw new Error(
//               'Erreur lors de la récupération des e-mails envoyés',
//             )
//           }
//         } else {
//           fetchedMails = response.data
//         }
//       } else {
//         fetchedMails = await fetchMailsLogic(session)
//       }

//       setRawMessages(fetchedMails)
//       return fetchedMails
//     } catch (error) {
//       throw error
//     }
//   }, [session, isSentbox])

//   // Supprimer un email
//   const handleDelete = useCallback(
//     async (index: number) => {
//       try {
//         const messageToDelete = messages[index]
//         if (!messageToDelete) return

//         const response = await fetchWithAuth(
//           `/api/mail/${messageToDelete._id}`,
//           {
//             method: 'DELETE',
//           },
//         )

//         if (response.status === 200) {
//           setRawMessages((prev) => {
//             const updatedMessages = [...prev]
//             const targetMessage = updatedMessages.find(
//               (msg) => msg._id === messageToDelete._id,
//             )

//             if (targetMessage) {
//               if (typeof targetMessage.isDeleted === 'object') {
//                 targetMessage.isDeleted = {
//                   ...targetMessage.isDeleted,
//                   [session?.user?._id as string]: true,
//                 }
//               } else {
//                 targetMessage.isDeleted = {
//                   [session?.user?._id as string]: true,
//                 }
//               }
//             }

//             return updatedMessages
//           })

//           toast.success('Email supprimé avec succès')
//         } else {
//           toast.error("Erreur lors de la suppression de l'email")
//         }
//       } catch (error) {
//         toast.error("Erreur lors de la suppression de l'email")
//       }
//     },
//     [messages, session?.user?._id],
//   )

//   // Gérer le clic sur un message
//   const handleMessageClick = useCallback(
//     async (index: number, currentIndex: number | null) => {
//       try {
//         const clickedMessage = messages[index]
//         if (!clickedMessage) return

//         if (!clickedMessage.isRead && !isSentbox) {
//           const response = await fetchWithAuth(
//             `/api/mail/${clickedMessage._id}/read`,
//             {
//               method: 'PATCH',
//             },
//           )

//           if (response.status === 200) {
//             setRawMessages((prev) => {
//               const updatedMessages = [...prev]
//               const targetMessage = updatedMessages.find(
//                 (msg) => msg._id === clickedMessage._id,
//               )

//               if (targetMessage) {
//                 targetMessage.isRead = true
//               }

//               return updatedMessages
//             })
//           } else {
//             toast.error("Erreur lors du marquage de l'email comme lu")
//           }
//         }
//       } catch (error) {
//         toast.error("Erreur lors du marquage de l'email comme lu")
//       }
//     },
//     [messages, isSentbox],
//   )

//   // Marquer comme non lu
//   const handleMarkAsUnread = useCallback(
//     async (index: number) => {
//       try {
//         const messageToMark = messages[index]
//         if (!messageToMark) return

//         const response = await fetchWithAuth(
//           `/api/mail/${messageToMark._id}/unread`,
//           {
//             method: 'PATCH',
//           },
//         )

//         if (response.status === 200) {
//           setRawMessages((prev) => {
//             const updatedMessages = [...prev]
//             const targetMessage = updatedMessages.find(
//               (msg) => msg._id === messageToMark._id,
//             )

//             if (targetMessage) {
//               targetMessage.isRead = false
//             }

//             return updatedMessages
//           })

//           toast.success('Email marqué comme non lu avec succès')
//         } else {
//           toast.error("Erreur lors du marquage de l'email comme non lu")
//         }
//       } catch (error) {
//         toast.error("Erreur lors du marquage de l'email comme non lu")
//       }
//     },
//     [messages],
//   )

//   return {
//     messages,
//     fetchMails,
//     handleDelete,
//     handleMessageClick,
//     handleMarkAsUnread,
//   }
// }
