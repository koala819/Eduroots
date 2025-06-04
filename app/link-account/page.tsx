// app/link-account/page.tsx
'use client'

import { useState } from 'react'
import { createClient } from '@/utils/supabase/client'

export default function LinkAccount({
  searchParams,
}: {
  searchParams: { email: string; role: string }
}) {
  const [baseEmail, setBaseEmail] = useState('')
  const [verificationCode, setVerificationCode] = useState('')
  const [isCodeSent, setIsCodeSent] = useState(false)
  const [error, setError] = useState('')

  const sendVerificationCode = async () => {
    const supabase = createClient()

    // Vérifier si l'email existe dans la base
    const { data: user } = await supabase
      .from('education.users')
      .select('*')
      .eq('email', baseEmail)
      .single()

    if (!user) {
      setError('Email non trouvé dans notre base')
      return
    }

    // Générer un code de vérification
    const code = Math.random().toString(36).substring(2, 8).toUpperCase()

    // Stocker le code temporairement (avec expiration)
    await supabase
      .from('system.verification_codes')  // Changé pour system.verification_codes
      .insert({
        email: baseEmail,
        code: code,
        expires_at: new Date(Date.now() + 15 * 60000), // 15 minutes
      })

    // Envoyer le code par email
    await supabase.functions.invoke('send-verification-code', {
      body: { email: baseEmail, code },
    })

    setIsCodeSent(true)
  }

  const verifyAndLink = async () => {
    const supabase = createClient()

    // Vérifier le code
    const { data: codeData } = await supabase
      .from('system.verification_codes')  // Changé pour system.verification_codes
      .select('*')
      .eq('email', baseEmail)
      .eq('code', verificationCode)
      .single()

    if (!codeData) {
      setError('Code invalide')
      return
    }

    // Lier les comptes
    const { data: { user } } = await supabase.auth.getUser()

    await supabase
      .from('education.users')
      .update({
        auth_id: user?.id,
        role: searchParams.role,
      })
      .eq('email', baseEmail)

    // Supprimer le code utilisé
    await supabase
      .from('system.verification_codes')  // Changé pour system.verification_codes
      .delete()
      .eq('id', codeData.id)

    window.location.href = '/dashboard'
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-xl shadow-lg">
        <div>
          <h2 className="text-center text-3xl font-bold">Lier votre compte</h2>
          <p className="mt-2 text-center text-gray-600">
            Votre email Google: {searchParams.email}
          </p>
        </div>

        {!isCodeSent ? (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Email dans notre base
              </label>
              <input
                type="email"
                value={baseEmail}
                onChange={(e) => setBaseEmail(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
              />
            </div>
            <button
              onClick={sendVerificationCode}
              className="w-full py-2 px-4 bg-blue-600 text-white rounded-md"
            >
              Envoyer le code de vérification
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Code de vérification
              </label>
              <input
                type="text"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
              />
            </div>
            <button
              onClick={verifyAndLink}
              className="w-full py-2 px-4 bg-blue-600 text-white rounded-md"
            >
              Vérifier et lier
            </button>
          </div>
        )}

        {error && (
          <p className="text-red-500 text-sm text-center">{error}</p>
        )}
      </div>
    </div>
  )
}
