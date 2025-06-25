'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

import { Button } from '@/client/components/ui/button'
import { Input } from '@/client/components/ui/input'
import { useToast } from '@/client/hooks/use-toast'
import { createClient } from '@/client/utils/supabase'
import { migrateUserAction } from '@/server/actions/migrate-user'

export default function WriteNewPassword() {
  const [password, setPassword] = useState<string>('')
  const [loading, setLoading] = useState<boolean>(false)
  const { toast } = useToast()
  const router = useRouter()
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    console.log('password', password)

    try {
      const { data: { user } } = await supabase.auth.getUser()

      if (!user || !user.email) {
        throw new Error('Utilisateur non trouvé')
      }

      console.log('user', user)

      const result = await migrateUserAction(user.id, user.email, user.user_metadata.role, password)

      if (result.success) {
        router.push(`/${user.user_metadata.role}`)

        toast({
          variant: 'success',
          title: 'Succès',
          description: 'Votre mot de passe a été mis à jour',
        })

        // Redirection après un court délai
        setTimeout(() => {
          router.push('/')
        }, 2000)
      } else {
        toast({
          variant: 'destructive',
          title: 'Erreur',
          description: 'Une erreur est survenue',
        })
        throw new Error('Erreur lors de la mise à jour du user', result.error)

      }
    } catch (error) {
      console.error('Erreur lors de la récupération de l\'utilisateur:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="max-w-md w-full space-y-8 p-8 bg-background/80 backdrop-blur-sm
        rounded-lg shadow-lg border border-border/30">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-foreground">
            Nouveau mot de passe
          </h2>
          <p className="mt-2 text-center text-sm text-muted-foreground">
            Veuillez entrer votre nouveau mot de passe
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="password" className="sr-only">
              Nouveau mot de passe
            </label>
            <Input
              id="password"
              name="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-input border-border text-foreground
                focus:border-primary focus:ring-primary/50"
              placeholder="Nouveau mot de passe"
            />
            {password.length > 0 && password.length < 8 && (
              <p className="text-xs text-error mt-1">
                Le mot de passe doit contenir au moins 8 caractères
              </p>
            )}
          </div>

          <div className="flex flex-col">
            <Button
              type="submit"
              disabled={loading || !password.trim() || password.length < 8}
              variant="default"
            >
              {loading ? 'Mise à jour...' : 'Mettre à jour le mot de passe'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
