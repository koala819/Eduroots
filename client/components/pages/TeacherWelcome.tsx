'use client'
import {
  ArrowRight,
  BookOpen,
  MessageSquareMore,
  UserCog,
  Users,
} from 'lucide-react'
import Link from 'next/link'
import { useEffect,useState } from 'react'

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

interface TeacherWelcomeProps {
  user: {
    firstname: string
    lastname: string
  }
}

export default function TeacherWelcome({ user }: TeacherWelcomeProps) {
  const [currentTime, setCurrentTime] = useState(new Date())
  const [dailyQuote] = useState(() => {
    // Sélectionne une citation différente chaque jour
    const dayOfYear = Math.floor(
      (currentTime.getTime() - new Date(currentTime.getFullYear(), 0, 0).getTime()) / 86400000,
    )
    return islamicQuotes[dayOfYear % islamicQuotes.length]
  })

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])



  const formatDate = (date: Date) => {
    return date.toLocaleDateString('fr-FR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
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
                {formatDate(currentTime)}
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
                <Link href="/teacher/classroom" className="group block">
                  <div className="bg-gradient-to-br from-primary to-primary-dark rounded-xl p-6
                  text-primary-foreground hover:shadow-lg transition-all duration-300
                  hover:-translate-y-1">
                    <div className="flex items-center justify-between mb-4">
                      <BookOpen className="w-8 h-8" />
                      <ArrowRight
                        className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2">Mes cours</h3>
                    <p className="text-primary-foreground/80 text-sm">
                      Gérez votre planning et vos contenus
                    </p>
                  </div>
                </Link>

                <Link href="/teacher/profiles/classroom" className="group block">
                  <div className="bg-gradient-to-br from-accent to-accent-dark rounded-xl p-6
                  text-accent-foreground hover:shadow-lg transition-all duration-300
                   hover:-translate-y-1">
                    <div className="flex items-center justify-between mb-4">
                      <Users className="w-8 h-8" />
                      <ArrowRight
                        className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2">Mes élèves</h3>
                    <p className="text-accent-foreground/80 text-sm">
                      Suivez la progression de vos classes
                    </p>
                  </div>
                </Link>

                <Link href="/teacher/messages" className="group block">
                  <div className="bg-gradient-to-br from-info to-info-dark rounded-xl p-6
                  text-info-foreground hover:shadow-lg transition-all duration-300
                  hover:-translate-y-1">
                    <div className="flex items-center justify-between mb-4">
                      <MessageSquareMore className="w-8 h-8" />
                      <ArrowRight
                        className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2">Messages</h3>
                    <p className="text-info-foreground/80 text-sm">
                      Communiquez avec vos élèves
                    </p>
                  </div>
                </Link>

                <Link href="/teacher/profiles" className="group block">
                  <div className="bg-gradient-to-br from-error to-error-dark rounded-xl p-6
                  text-error-foreground hover:shadow-lg transition-all duration-300
                  hover:-translate-y-1">
                    <div className="flex items-center justify-between mb-4">
                      <UserCog className="w-8 h-8" />
                      <ArrowRight
                        className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2">Mon profil</h3>
                    <p className="text-error-foreground/80 text-sm">
                      Paramètres et préférences
                    </p>
                  </div>
                </Link>
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
