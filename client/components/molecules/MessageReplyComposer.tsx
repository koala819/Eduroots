'use client'

import { useSession } from 'next-auth/react'
import { useCallback, useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'react-toastify'

import dynamic from 'next/dynamic'

import Loading from '@/server/components/admin/atoms/Loading'
import { Button } from '@/client/components/ui/button'
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/client/components/ui/form'

import { sendMail } from '@/server/actions/mails'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

interface MessageReplyComposerProps {
  recipientId: string
  recipientType: string
  subject: string
  parentMessageId: string | null
  onCancel: () => void
  onSendSuccess: () => void
}

const RichTextEditor = dynamic(() => import('@/client/components/atoms/MessageRichTextEditor'), {
  ssr: false,
  loading: () => <Loading name="l'éditeur de texte" />,
})

const FormSchema = z.object({
  message: z.string().min(1, { message: 'Le message ne peut pas être vide.' }),
})

export function MessageReplyComposer({
  recipientId,
  recipientType,
  subject,
  parentMessageId,
  onCancel,
  onSendSuccess,
}: MessageReplyComposerProps) {
  const { data: session } = useSession()

  const [isLoading, setIsLoading] = useState<boolean>(false)

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      message: '',
    },
  })

  const handleEditorChange = useCallback(
    (content: string) => {
      form.setValue('message', content, {
        shouldValidate: content.length > 0,
        shouldDirty: true,
      })
    },
    [form],
  )

  async function onSubmit(values: z.infer<typeof FormSchema>) {
    if (isLoading || !session || !session.user) return

    try {
      setIsLoading(true)
      const formData = new FormData()

      formData.append('recipientId', recipientId)
      formData.append('recipientType', recipientType)
      formData.append('subject', `Re: ${subject}`)
      formData.append('message', values.message)

      if (parentMessageId) {
        formData.append('parentMessageId', parentMessageId)
      }

      const result = await sendMail(formData, {
        firstname: session.user.firstname,
        lastname: session.user.lastname,
      })

      if (!result.success) {
        toast.error(result.message)
      } else {
        toast.success(result.message)
        onSendSuccess()
      }
    } catch (error) {
      console.error('Erreur lors de l\'envoi de la réponse:', error)
      toast.error('Une erreur est survenue lors de l\'envoi')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="message"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <RichTextEditor value={field.value} onChange={handleEditorChange} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex justify-end space-x-2">
          <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
            Annuler
          </Button>
          <Button type="submit" disabled={isLoading || !form.formState.isDirty}>
            {isLoading ? 'Envoi...' : 'Envoyer'}
          </Button>
        </div>
      </form>
    </Form>
  )
}
