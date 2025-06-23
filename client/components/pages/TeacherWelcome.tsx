'use client'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import {
  BookOpen,
  MessageSquareMore,
  UserCog,
  Users,
} from 'lucide-react'
import { useState } from 'react'

import ActionCard from '@/client/components/atoms/ActionCard'
import LoadingOverlay from '@/client/components/atoms/LoadingOverlay'

// Simulation des données - dans votre vraie app, ces données viendraient de votre API
// const mockStats = {
//   totalCourses: 12,
//   totalStudents: 145,
//   weeklyHours: 18,
//   upcomingClasses: 3,
// }

// const mockUpcomingClasses = [
//   { id: 1, subject: 'Mathématiques', class: '6èmeA', time: '09:00', students: 25 },
//   { id: 2, subject: 'Physique', class: '3èmeB', time: '14:30', students: 22 },
//   { id: 3, subject: 'Mathématiques', class: '5èmeC', time: '16:00', students: 28 },
// ]

// const mockRecentMessages = [
//   {
//     id: 1,
//     from: 'Ahmed El-Khatib',
//     subject: 'Question sur l\'exercice 3',
//     time: 'Il y a 2h',
//     avatar: 'A',
//     isOnline: true,
//   },
//   {
//     id: 2,
//     from: 'Fatima Zahra',
//     subject: 'Absence demain',
//     time: 'Il y a 4h',
//     avatar: 'F',
//     isOnline: false,
//   },
//   {
//     id: 3,
//     from: 'Direction',
//     subject: 'Réunion pédagogique',
//     time: 'Il y a 1j',
//     avatar: 'D',
//     isOnline: true,
//   },
// ]

// Citations islamiques inspirantes
const islamicQuotes = [
  {
    text: 'Allah ne charge une âme que selon sa capacité.',
    source: 'Coran 2:286',
  },
  {
    text: 'Et c\'est en Allah qu\'il faut placer sa confiance, si vous êtes croyants.',
    source: 'Coran 5:23',
  },
  {
    text: 'Certes, avec la difficulté il y a une facilité.',
    source: 'Coran 94:6',
  },
  {
    text: 'Celui qui apprend et enseigne, Allah lui facilite le chemin vers le Paradis.',
    source: 'Hadith',
  },
  {
    text: 'Recherchez la science du berceau jusqu\'au tombeau.',
    source: 'Hadith du Prophète ﷺ',
  },
  {
    text: 'Le meilleur des hommes est celui qui est utile aux autres.',
    source: 'Hadith',
  },
]

const actionsData = [
  {
    href: '/teacher/classroom',
    icon: <BookOpen className="w-8 h-8" />,
    title: 'Mes cours',
    description: 'Gérez votre planning et vos contenus',
    gradientFrom: 'primary',
    gradientTo: 'primary-dark',
    textColor: 'primary-foreground',
  },
  {
    href: '/teacher/settings/classroom',
    icon: <Users className="w-8 h-8" />,
    title: 'Mes élèves',
    description: 'Suivez la progression de vos classes',
    gradientFrom: 'success',
    gradientTo: 'success-dark',
    textColor: 'success-foreground',
  },
  {
    href: '/teacher/messages',
    icon: <MessageSquareMore className="w-8 h-8" />,
    title: 'Messages',
    description: 'Communiquez avec vos élèves',
    gradientFrom: 'secondary',
    gradientTo: 'secondary-dark',
    textColor: 'secondary-foreground',
  },
  {
    href: '/teacher/settings',
    icon: <UserCog className="w-8 h-8" />,
    title: 'Paramètres',
    description: 'Paramètres et préférences',
    gradientFrom: 'purple',
    gradientTo: 'purple-dark',
    textColor: 'purple-foreground',
  },
]

interface TeacherWelcomeProps {
  user: {
    firstname: string
    lastname: string
  }
}

export default function TeacherWelcome({ user }: TeacherWelcomeProps) {
  const [isLoading, setIsLoading] = useState(false)
  // Sélectionner une citation aléatoire basée sur le jour de l'année
  const today = new Date()
  const dayOfYear = Math.floor(
    (today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / 86400000,
  )
  const dailyQuote = islamicQuotes[dayOfYear % islamicQuotes.length]

  if (isLoading) {
    return (
      <LoadingOverlay title="Chargement en cours..." />
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30
     p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* Header avec salutation et heure */}
        <div className="bg-gradient-to-r from-primary via-primary-accent to-primary-dark rounded-2xl
         p-6 md:p-8 text-primary-foreground shadow-lg">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold mb-2">
                Salam Aleykoum {user.firstname} {user.lastname}
              </h1>
              <p className="text-primary-foreground/90 text-lg">
                {format(today, 'EEEE d MMMM yyyy', { locale: fr })}
              </p>
            </div>
          </div>
        </div>

        {/* Statistiques rapides */}
        {/* <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-border/50
          hover:shadow-md transition-all duration-300">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{mockStats.totalCourses}</p>
                <p className="text-xs text-muted-foreground">Cours</p>
              </div>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-border/50
          hover:shadow-md transition-all duration-300">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-accent/10 rounded-lg flex items-center justify-center">
                <Users className="w-5 h-5 text-accent" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{mockStats.totalStudents}</p>
                <p className="text-xs text-muted-foreground">Élèves</p>
              </div>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-border/50
          hover:shadow-md transition-all duration-300">
            <div className="flex items-center gap-3">
              <div
              className="w-10 h-10 bg-secondary/10 rounded-lg flex items-center justify-center">
                <Clock className="w-5 h-5 text-secondary" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{mockStats.weeklyHours}h</p>
                <p className="text-xs text-muted-foreground">Cette semaine</p>
              </div>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-border/50
          hover:shadow-md transition-all duration-300">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-warning/10 rounded-lg flex items-center justify-center">
                <Calendar className="w-5 h-5 text-warning" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{mockStats.upcomingClasses}</p>
                <p className="text-xs text-muted-foreground">Prochains cours</p>
              </div>
            </div>
          </div>
        </div> */}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Colonne principale - Actions rapides */}
          <div className="lg:col-span-2 space-y-6">

            {/* Actions principales */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-border/50
             shadow-sm">
              {/* <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-primary" />
                Actions rapides
              </h2> */}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {actionsData.map((action, index) => (
                  <ActionCard
                    key={index}
                    href={action.href}
                    icon={action.icon}
                    title={action.title}
                    description={action.description}
                    gradientFrom={action.gradientFrom}
                    gradientTo={action.gradientTo}
                    textColor={action.textColor}
                    setIsLoading={setIsLoading}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Colonne latérale - Informations contextuelles */}
          <div className="space-y-6">

            {/* Prochains cours */}
            {/* <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-border/50
            shadow-sm">
              <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-primary" />
                Aujourd'hui
              </h3>

              <div className="space-y-3">
                {mockUpcomingClasses.map((class_) => (
                  <div key={class_.id} className="flex items-center gap-3 p-3 bg-muted/30
                  rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="w-2 h-8 bg-primary rounded-full"></div>
                    <div className="flex-1">
                      <p className="font-medium text-foreground text-sm">{class_.subject}</p>
                      <p className="text-xs text-muted-foreground">
                        {class_.class} • {class_.students} élèves
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-mono text-sm font-semibold text-primary">{class_.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div> */}

            {/* Messages récents - Style WhatsApp */}
            {/* <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-border/50
            shadow-sm">
              <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                <MessageSquareMore className="w-5 h-5 text-info" />
                Messages récents
              </h3>

              <div className="space-y-3">
                {mockRecentMessages.map((message) => (
                  <div key={message.id} className="flex items-center gap-3 p-3 bg-muted/20
                  rounded-lg hover:bg-muted/40 transition-colors cursor-pointer group">
                    <div className="relative">
                      <div className="w-10 h-10 bg-gradient-to-br from-primary to-primary-dark
                      rounded-full flex items-center justify-center text-primary-foreground
                      font-semibold text-sm">
                        {message.avatar}
                      </div>
                      {message.isOnline && (
                        <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-success
                        rounded-full border-2 border-white"></div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <p className="font-medium text-foreground text-sm truncate">
                        {message.from}
                        </p>
                        <p className="text-xs text-muted-foreground shrink-0">{message.time}</p>
                      </div>
                      <p className="text-xs text-muted-foreground truncate">{message.subject}</p>
                    </div>
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                      <ArrowRight className="w-4 h-4 text-muted-foreground" />
                    </div>
                  </div>
                ))}

                <a href="/teacher/messages" className="flex items-center justify-center gap-2 py-3
                text-info hover:text-info-dark text-sm font-medium transition-colors rounded-lg
                hover:bg-info/5">
                  <MessageSquareMore className="w-4 h-4" />
                  Voir toutes les conversations
                </a>
              </div>
            </div> */}

            {/* Citation islamique du jour */}
            <div className="bg-gradient-to-br from-success/10 to-success/5 rounded-2xl p-6 border
            border-success/20">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-success/20 rounded-full flex items-center justify-center
                shrink-0">
                  <span className="text-success text-lg">☪</span>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-success mb-3">Citation du jour</h3>
                  <blockquote className="text-foreground font-medium mb-3 italic leading-relaxed">
                    "{dailyQuote.text}"
                  </blockquote>
                  <cite className="text-muted-foreground text-sm">— {dailyQuote.source}</cite>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
