'use client'

import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'react-toastify'

import { CheckOTPProps } from '@/types/mongo/models'

import { Button } from '@/components/ui/button'
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'

import { sendEmailNotification } from '@/lib/mails/emailService'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'

const formSchema = z.object({
  otp: z.array(z.string().length(1)).length(4),
})

const CheckOTP: React.FC<CheckOTPProps> = ({ email, otp, onOTPVerified, otpExpirationTime }) => {
  const [isResendDisabled, setIsResendDisabled] = useState<boolean>(true)
  const [remainingTime, setRemainingTime] = useState<number>(0)
  const [timerCount, setTimerCount] = useState<number>(300) // 5 minutes

  useEffect(() => {
    const timer = setInterval(() => {
      const now = Date.now()
      const timeLeft = Math.max(0, otpExpirationTime - now)
      setRemainingTime(timeLeft)

      if (timeLeft === 0) {
        clearInterval(timer)
      }
    }, 1000)

    return () => clearInterval(timer)
  }, [otpExpirationTime])

  useEffect(() => {
    const timer = setInterval(() => {
      setTimerCount((prevCount) => {
        if (prevCount <= 1) {
          clearInterval(timer)
          setIsResendDisabled(false)
          return 0
        }
        return prevCount - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      otp: ['', '', '', ''],
    },
  })

  function onSubmit(values: z.infer<typeof formSchema>) {
    const enteredOTP = parseInt(values.otp.join(''))
    if (enteredOTP === otp) {
      onOTPVerified()
    } else {
      toast.error('Code OTP incorrect')
    }
  }

  function handleInputChange(index: number, value: string) {
    form.setValue(`otp.${index}`, value)
    if (value && index < 3) {
      const nextInput = document.querySelector(`input[name="otp.${index + 1}"]`) as HTMLInputElement
      if (nextInput) {
        nextInput.focus()
      }
    }
  }

  async function resendOTP() {
    if (isResendDisabled) return

    setIsResendDisabled(true)
    setTimerCount(300)

    const newOTP = Math.floor(Math.random() * 9000 + 1000)

    try {
      const receiver = {
        firstname: '',
        lastname: '',
        email: email,
      }
      const response = await sendEmailNotification({
        receiver,
        usage: 'rstPwd',
        otp: newOTP,
      })

      if (!response.success) {
        throw new Error('Failed to send email')
      }

      toast.success('Nouveau code OTP envoyé')
    } catch (error) {
      console.error('Erreur lors de l\'envoi du mail:', error)
      toast.error('Erreur lors de l\'envoi du nouveau code OTP')
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <div className="flex flex-row items-center justify-between mx-auto w-full max-w-xs">
          {[0, 1, 2, 3].map((index) => (
            <FormField
              key={index}
              control={form.control}
              name={`otp.${index}`}
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input
                      {...field}
                      maxLength={1}
                      className="w-16 h-16 text-center text-lg border-2 border-gray-200"
                      onChange={(e) => handleInputChange(index, e.target.value)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          ))}
        </div>

        <div className="text-center text-sm">
          {remainingTime > 0 ? (
            <span>
              Temps restant : {Math.floor(remainingTime / 60000)}:
              {String(Math.floor((remainingTime % 60000) / 1000)).padStart(2, '0')}
            </span>
          ) : (
            <span>Le code OTP a expiré</span>
          )}
        </div>

        <Button type="submit" className="w-full">
          Vérifier
        </Button>
        <div className="text-center text-sm">
          <span className="text-gray-500">Vous n&apos;avez pas reçu le code ? </span>
          <Button
            variant="link"
            className="p-0 h-auto"
            onClick={resendOTP}
            disabled={isResendDisabled}
          >
            Renvoyer le code{' '}
            {isResendDisabled &&
              `(${Math.floor(timerCount / 60)}:${
                timerCount % 60 < 10 ? '0' : ''
              }${timerCount % 60})`}
          </Button>
        </div>
      </form>
    </Form>
  )
}

export default CheckOTP
