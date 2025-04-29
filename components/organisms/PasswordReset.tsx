'use client'

import {CircleArrowLeft} from 'lucide-react'
import {useState} from 'react'

import {useRouter} from 'next/navigation'

import CheckMail from '@/components/atoms/CheckMail'
import CheckOTP from '@/components/atoms/CheckOTP'
import NewPassword from '@/components/atoms/NewPwd'
import {Button} from '@/components/ui/button'

import {motion} from 'framer-motion'

export default function PasswordReset() {
  const [step, setStep] = useState<string>('checkMail')
  const [email, setEmail] = useState<string>('')
  const [otp, setOTP] = useState<number | null>(null)
  const [otpExpirationTime, setOtpExpirationTime] = useState<number>(0)
  const router = useRouter()

  const handleEmailSent = (sentEmail: string, sentOTP: number) => {
    setOtpExpirationTime(Date.now() + 5 * 60 * 1000) // 5 minutes from now
    setStep('checkOTP')
    setEmail(sentEmail)
    setOTP(sentOTP)
  }

  const handleOTPVerified = () => {
    setStep('newPassword')
  }

  const handlePasswordReset = () => {
    router.push('/')
  }

  return (
    <motion.div
      initial={{opacity: 0, y: -50}}
      animate={{opacity: 1, y: 0}}
      transition={{duration: 0.5}}
      className="w-full max-w-md mx-auto p-8 bg-white shadow-2xl rounded-xl"
    >
      <h2 className="text-3xl font-bold text-center mb-8 text-gray-800">
        {step === 'checkMail'
          ? 'Réinitialisation du mot de passe'
          : step === 'checkOTP'
            ? 'Vérification de votre email'
            : 'Nouveau mot de passe'}
      </h2>

      {step === 'checkMail' && <CheckMail onEmailSent={handleEmailSent} />}

      {step === 'checkOTP' && (
        <CheckOTP
          email={email}
          otp={otp}
          onOTPVerified={handleOTPVerified}
          otpExpirationTime={otpExpirationTime}
        />
      )}

      {step === 'newPassword' && (
        <NewPassword email={email} onPasswordReset={handlePasswordReset} />
      )}

      <div className="mt-6">
        <Button
          className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-lg transition-colors duration-300"
          onClick={() => router.push('/')}
        >
          <CircleArrowLeft className="mr-2 h-4 w-4" />
          Retour
        </Button>
      </div>
    </motion.div>
  )
}
