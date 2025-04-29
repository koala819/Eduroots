'use client'

import {Calendar, LogOut, PenSquare, Users} from 'lucide-react'
import {signOut} from 'next-auth/react'
import {useSession} from 'next-auth/react'

import {useRouter} from 'next/navigation'

import {useToast} from '@/hooks/use-toast'

import {ProfileSection} from '@/components/molecules/server/ProfileSection'

export type MenuItem = {
  icon: React.ReactNode
  title: string
  color?: string
  onClick: () => void
}

const ProfilePage = () => {
  const router = useRouter()
  const {data: session} = useSession()

  const {toast} = useToast()

  function logoutHandler() {
    signOut({
      redirect: true,
      callbackUrl: `${process.env.NEXT_PUBLIC_CLIENT_URL}/`,
    })
  }

  const actions: MenuItem[] = [
    {
      icon: <Users className="h-5 w-5" />,
      title: 'Détail des élèves',
      // color: 'text-green-600',
      onClick: () => {
        router.push(`${process.env.NEXT_PUBLIC_CLIENT_URL}/teacher/profiles/classroom`)
        // console.log('Détail élèves')
      },
    },
    {
      icon: <PenSquare className="h-5 w-5" />,
      title: 'Devoirs & Contrôles',
      // color: 'text-orange-600',
      onClick: () => {
        router.push(`${process.env.NEXT_PUBLIC_CLIENT_URL}/teacher/profiles/grades`)
        // console.log('Gérer notes')
      },
    },
    {
      icon: <Calendar className="h-5 w-5" />,
      title: 'Emploi du temps',
      // color: 'text-purple-600',
      onClick: () => {
        router.push(`${process.env.NEXT_PUBLIC_CLIENT_URL}/teacher/profiles/edit`)
        // console.log('Gérer matières')
      },
    },
    // {
    //   icon: <ArrowUpRight className="h-5 w-5" />,
    //   title: 'Transférer ma session',
    //   color: 'text-gray-400', // Couleur grisée pour indiquer l'état désactivé
    //   onClick: () => {
    //     toast({
    //       variant: 'success',
    //       title: 'En dev',
    //       description: 'Bientôt fonctionnel :)',
    //       duration: 3000,
    //     })
    //     // console.log('Transfert session')
    //   },
    // },
  ]

  const settings: MenuItem[] = [
    {
      icon: <LogOut className="h-5 w-5" />,
      title: 'Déconnexion',
      color: 'text-red-600',
      onClick: () => logoutHandler(),
    },
  ]

  if (!session) {
    return (
      <div className="h-[calc(100vh-8rem)] flex items-center justify-center">
        <div className="flex items-center justify-center gap-2">
          <div className="w-2 h-2 bg-gray-500 rounded-full animate-ping"></div>
          <div
            className="w-2 h-2 bg-gray-500 rounded-full animate-ping"
            style={{animationDelay: '0.2s'}}
          ></div>
          <div
            className="w-2 h-2 bg-gray-500 rounded-full animate-ping"
            style={{animationDelay: '0.4s'}}
          ></div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto p-4">
      <div className="hidden md:block mb-8 text-center">
        <h1 className="text-2xl font-bold text-gray-900 space-x-4">
          {session.user.firstname + ' ' + session.user.lastname}
        </h1>
        <p className="text-gray-500">Professeur de Al&apos;Ihsane</p>
      </div>

      <ProfileSection title="Actions" items={actions} />
      <ProfileSection title="Paramètres" items={settings} />
    </div>
  )
}

export default ProfilePage
