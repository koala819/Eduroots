'use client'

import Image from 'next/image'

import DashboardCard from '@/components/atoms/client/TeacherDashBoardCard'
import { Card } from '@/components/ui/card'

interface TeacherWelcomeProps {
  user: {
    firstname: string
    lastname: string
  }
}

export function TeacherWelcome({ user }: Readonly<TeacherWelcomeProps>) {


  return (
    <div className="min-h-screen p-4 md:p-8 bg-gradient-to-b from-slate-50 to-white">
      <div className="max-w-7xl mx-auto">
        {/* Hero Image Section */}
        <Card className="overflow-hidden border-none shadow-lg mb-12">
          <div className="relative h-64 md:h-80">
            <div className="absolute inset-0 bg-gradient-to-r from-slate-900/80 to-slate-800/80
             z-10" />
            <Image
              src="https://images.unsplash.com/photo-1629273229664-11fabc0becc0?q=80&w=2062"
              alt="Teaching"
              fill
              priority
              className="object-cover"
            />
            <div className="absolute inset-0 flex items-center justify-center p-6 text-center z-20">
              <div className="max-w-2xl">
                <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">
                  Bienvenue {user.firstname} {user.lastname} dans votre espace enseignant
                </h1>
                <p className="text-white text-lg md:text-xl">
                  Retrouvez tous vos outils pédagogiques en un seul endroit
                </p>
              </div>
            </div>
          </div>
        </Card>

        {/* Cards Grid avec Suspense */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <DashboardCard
            icon="BookOpen"
            title="Mes cours"
            description="Consultez vos cours et gérez votre planning d'enseignement"
            href="/teacher/classroom"
          />

          <DashboardCard
            icon="Users"
            title="Mes élèves"
            description="Suivez la progression des élèves et gérez vos classes"
            href="/teacher/profiles/classroom"
          />

          <DashboardCard
            icon="UserCog"
            title="Mon profil"
            description="Personnalisez votre profil et accédez à vos paramètres"
            href="/teacher/profiles"
          />
        </div>
      </div>
    </div>
  )
}
