'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

import { Button } from '@/client/components/ui/button'
import { Input } from '@/client/components/ui/input'
import { useToast } from '@/client/hooks/use-toast'
import { createClient } from '@/client/utils/supabase'

export default function WriteNewPassword() {
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()
  const router = useRouter()
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const { error } = await supabase.auth.updateUser({
        password: password,
      })

      if (error) {
        toast({
          variant: 'destructive',
          title: 'Erreur',
          description: error.message,
        })
      } else {
        toast({
          variant: 'success',
          title: 'Succès',
          description: 'Votre mot de passe a été mis à jour',
        })
        // Redirection après un court délai
        setTimeout(() => {
          router.push('/')
        }, 2000)
      }
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: error.message ??
          'Une erreur est survenue lors de la mise à jour du mot de passe',
      })
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
          </div>

          <div>
            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-primary to-primary-light
                hover:from-primary-dark hover:to-primary text-primary-foreground
                transition-all duration-200 shadow-md hover:shadow-lg"
            >
              {loading ? 'Mise à jour...' : 'Mettre à jour le mot de passe'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
