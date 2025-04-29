'use client'

import {Eye, EyeOff} from 'lucide-react'
import {useEffect, useState} from 'react'
import {useForm} from 'react-hook-form'
import {toast} from 'react-toastify'

import {Button} from '@/components/ui/button'
import {Form, FormControl, FormField, FormItem, FormLabel, FormMessage} from '@/components/ui/form'
import {Input} from '@/components/ui/input'
import {LoadingSpinner} from '@/components/ui/loading-spinner'

import {verifyEmailAndPassword} from '@/app/actions/mails'
import {sendEmailNotification} from '@/lib/mails/emailService'
import {zodResolver} from '@hookform/resolvers/zod'
import * as z from 'zod'

interface CheckMailProps {
  onEmailSent: (email: string, otp: number) => void
}

const formSchema = z.object({
  email: z.string().email({message: 'Adresse e-mail invalide'}),
  currentPassword: z.string().min(1, 'Le mot de passe actuel est requis'),
})

const CheckMail: React.FC<CheckMailProps> = ({onEmailSent}) => {
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [otp, setOTP] = useState<number>(Math.floor(Math.random() * 9000 + 1000))
  const [showPassword, setShowPassword] = useState<boolean>(false)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
      currentPassword: '',
    },
  })

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true)
    try {
      const userExist = await verifyEmailAndPassword(
        values.email.toLowerCase(),
        values.currentPassword,
      )
      if (!userExist.success) {
        toast.error('email introuvable')

        form.setError('email', {
          message: "Cette adresse e-mail n'existe pas dans notre base de données",
        })
      }
      //   console.log('userExist', userExist)

      const receiver = {
        firstname: '',
        lastname: '',
        email: values.email.toLowerCase(),
      }
      const response = await sendEmailNotification({
        receiver,
        usage: 'rstPwd',
        otp,
      })

      if (!response.success) toast.error('error to send email with')

      toast.success('Un email avec un code temporaire vient de vous être envoyé !')
      onEmailSent(values.email.toLowerCase(), otp)
    } catch (error) {
      console.error("Erreur lors de la vérification de l'e-mail:", error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    const intervalId = setInterval(() => {
      setOTP(Math.floor(Math.random() * 9000 + 1000))
    }, 300000) // 300000 ms = 5 minutes

    // Clean up the interval when the component unmounts
    return () => {
      clearInterval(intervalId)
    }
  }, [])

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="email"
          render={({field}) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input placeholder="exemple@email.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="currentPassword"
          render={({field}) => (
            <FormItem>
              <FormLabel>Mot de passe actuel</FormLabel>
              <FormControl>
                <div className="relative">
                  <Input type={showPassword ? 'text' : 'password'} {...field} />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                    aria-label={
                      showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'
                    }
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? <LoadingSpinner /> : 'Continuer'}
        </Button>
      </form>
    </Form>
  )
}

export default CheckMail
