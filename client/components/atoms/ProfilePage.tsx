'use client'

import { BarChart, Calendar, LogOut, PenSquare, Users } from 'lucide-react'
import { useRouter } from 'next/navigation'

import { createClient } from '@/client/utils/supabase'

const Profile = () => {
  const router = useRouter()

  async function logoutHandler() {
    const supabase = createClient()
    await supabase.auth.signOut()
    window.location.href = process.env.NEXT_PUBLIC_CLIENT_URL || '/'
  }

  const actions = [
    {
      icon: <Users className="h-10 w-10" />,
      title: 'Détail des élèves',
      onClick: () => {
        handleNavClick('/teacher/settings/classroom')
      },
    },
    {
      icon: <PenSquare className="h-10 w-10" />,
      title: 'Devoirs & Contrôles',
      onClick: () => {
        handleNavClick('/teacher/settings/grades')
      },
    },
    {
      icon: <Calendar className="h-10 w-10" />,
      title: 'Emploi du temps',
      onClick: () => {
        handleNavClick('/teacher/settings/planning')
      },
    },
    {
      icon: <BarChart className="h-10 w-10" />,
      title: 'Mettre à jour les statistiques',
      onClick: () => {
        router.push('/teacher/settings/update')
      },
    },
  ]

  function handleNavClick(href: string) {
    router.push(href)
  }

  return (
    <div className="flex flex-col gap-2 h-[77vh] md:grid md:grid-cols-2 w-full
     md:h-[86vh] md:gap-4">
      {actions.map((item) => {
        return (
          <button
            key={item.title}
            onClick={item.onClick}
            className="flex flex-col items-center justify-center
            rounded-2xl sm:shadow-lg border-1 border-primary/30 w-full h-full text-xl
            font-semibold transition-all hover:cursor-pointer
           hover:bg-primary hover:text-primary-foreground"
          >
            {item.icon}
            <span className="mt-3 text-center px-2">{item.title}</span>
          </button>
        )
      })}
      <button
        key="Déconnexion"
        onClick={logoutHandler}
        className="flex flex-col items-center justify-center rounded-2xl
        shadow-lg w-full h-full text-xl font-semibold transition-all col-span-2 bg-error-light
        hover:cursor-pointer hover:bg-error hover:text-error-foreground"

      >
        <LogOut className="h-10 w-10" style={{ color: 'var(--color-error-foreground)' }} />
        <span className="mt-3 text-center px-2">Déconnexion</span>
      </button>
    </div>
  )
}

export default Profile
