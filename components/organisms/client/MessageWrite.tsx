'use client'

import {CircleArrowLeft, Loader2} from 'lucide-react'
import {useSession} from 'next-auth/react'
import {useState} from 'react'
import {useForm} from 'react-hook-form'

import {useRouter} from 'next/navigation'

import {useToast} from '@/hooks/use-toast'

import {MessageAttachmentUploader as AttachmentField} from '@/components/atoms/client/MessageAttachmentUploader '
import {MessageEditor} from '@/components/atoms/client/MessageEditor'
import {SubjectField} from '@/components/atoms/client/MessageSubjectField'
import {StepsNavigation} from '@/components/atoms/server/MessageStepsNavigation'
import {RecipientSelection} from '@/components/molecules/client/MessageRecipientSelection'
import {Button} from '@/components/ui/button'
import {Card} from '@/components/ui/card'
import {Form} from '@/components/ui/form'

import {sendMail} from '@/app/actions/mails'
import {zodResolver} from '@hookform/resolvers/zod'
import {z} from 'zod'

const messageSchema = z.object({
  recipients: z.array(z.string()).min(1, {message: 'Sélectionnez au moins un destinataire'}),
  subject: z.string().min(1, {message: 'Le sujet est requis'}),
  message: z.string().min(1, {message: 'Le message ne peut pas être vide'}),
  attachment: z.any().optional(),
})

export type MessageFormData = z.infer<typeof messageSchema>

export function MessageWrite() {
  const {data: session} = useSession()

  const {toast} = useToast()
  const router = useRouter()

  const [currentStep, setCurrentStep] = useState<number>(1)
  const [isSending, setIsSending] = useState<boolean>(false)
  const [loadingStatus, setLoadingStatus] = useState<string>('')
  const [validEmails, setValidEmails] = useState<string[]>([])
  const [formState, setFormState] = useState<{
    recipients: string[]
    validEmails: string[]
  }>({
    recipients: [],
    validEmails: [],
  })

  const recipientsForm = useForm<Pick<MessageFormData, 'recipients'>>({
    resolver: zodResolver(
      z.object({
        recipients: z.array(z.string()).min(1),
      }),
    ),
    defaultValues: {recipients: []},
  })

  const messageForm = useForm<Pick<MessageFormData, 'subject' | 'message' | 'attachment'>>({
    resolver: zodResolver(
      z.object({
        subject: z.string().min(1),
        message: z.string().min(1),
        attachment: z.any().optional(),
      }),
    ),
    defaultValues: {
      subject: '',
      message: '',
      attachment: null,
    },
  })

  if (!session || !session.user) {
    return null
  }

  function handleStep1Submit(data: Pick<MessageFormData, 'recipients'>) {
    const newFormState = {
      recipients: data.recipients,
      validEmails,
    }
    setFormState(newFormState)
    setCurrentStep(2)
  }

  async function handleStep2Submit(
    data: Pick<MessageFormData, 'subject' | 'message' | 'attachment'>,
  ) {
    if (isSending) return

    try {
      setIsSending(true)
      // Afficher l'indicateur de chargement
      setLoadingStatus('Préparation du message...')

      const formData = new FormData()

      // Formatage des destinataires
      const recipientInfo = formState.validEmails.map((email) => {
        // Si c'est le bureau
        if (email === 'bureau') {
          return {
            id: 'bureau',
            type: 'bureau',
            details: null,
          }
        }

        // Cas des élèves
        return {
          id: email,
          type: 'student',
          details: {
            email: email,
          },
        }
      })
      formData.append('recipientInfo', JSON.stringify(recipientInfo))
      formData.append('recipientId', session?.user?.id ?? '')
      formData.append('recipientType', session?.user?.role ?? '')
      formData.append('subject', data.subject)
      formData.append('message', data.message)

      if (data.attachment) {
        setLoadingStatus('Chargement de la pièce jointe...')
        formData.append('attachment', data.attachment)
      }

      setLoadingStatus('Envoi en cours...')

      // Utilisation de l'action serveur
      const result = await sendMail(formData, {
        firstname: session?.user?.firstname ?? '',
        lastname: session?.user?.lastname ?? '',
      })

      if (result.success) {
        toast({
          title: 'Message envoyé !',
          description: result.message || 'Votre message a été envoyé avec succès.',
        })
        // Rediriger vers la page des messages envoyés
        if (session?.user?.role === 'bureau')
          router.push(`${process.env.NEXT_PUBLIC_CLIENT_URL}/admin/messages/sent`)
        else
          router.push(`${process.env.NEXT_PUBLIC_CLIENT_URL}/${session?.user?.role}/messages/sent`)
        messageForm.reset()
      } else {
        throw new Error(result.message || "Une erreur est survenue lors de l'envoi du message")
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description:
          error instanceof Error
            ? error.message
            : "Une erreur est survenue lors de l'envoi du message",
      })
      console.error('Erreur:', error)
    } finally {
      setIsSending(false)
      setLoadingStatus('')
    }
  }

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <StepsNavigation currentStep={currentStep} />
      <div className="p-6">
        {currentStep === 1 && (
          <Form {...recipientsForm}>
            <form onSubmit={recipientsForm.handleSubmit(handleStep1Submit)} className="space-y-6">
              <RecipientSelection
                form={recipientsForm}
                session={session}
                onValidEmailsChange={setValidEmails}
                userRole={session?.user.role}
              />
              <Button type="submit" className="w-full" disabled={!validEmails.length}>
                {validEmails.length ? 'Continuer' : 'Choisir un destinataire'}
              </Button>
            </form>
          </Form>
        )}

        {currentStep === 2 && (
          <Form {...messageForm}>
            <form onSubmit={messageForm.handleSubmit(handleStep2Submit)} className="space-y-6">
              <SubjectField form={messageForm} />
              <MessageEditor form={messageForm} />
              {session?.user?.role === 'teacher' && <AttachmentField form={messageForm} />}
              {loadingStatus && (
                <div className="flex items-center justify-center text-sm text-muted-foreground">
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {loadingStatus}
                </div>
              )}
              <div className="flex gap-4">
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={() => setCurrentStep(1)}
                  disabled={isSending}
                >
                  <CircleArrowLeft className="mr-2 h-4 w-4" />
                  Retour
                </Button>
                <Button type="submit" className="w-full" disabled={isSending}>
                  {isSending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Envoi en cours...
                    </>
                  ) : (
                    'Envoyer'
                  )}
                </Button>
              </div>
            </form>
          </Form>
        )}
      </div>
    </Card>
  )
}
