'use client'

import {
  Cake,
  Calendar,
  ChartLine,
  Clock,
  GraduationCap,
  History,
  LogOut,
  LucideIcon,
  MessageSquare,
  Palette,
  Search,
  ShieldCheck,
  Squirrel,
  TreePalm,
  UserPlus,
  UserRoundPlus,
  Users,
} from 'lucide-react'
import { signOut, useSession } from 'next-auth/react'
import { useState } from 'react'

import { useRouter } from 'next/navigation'

import { EntityType } from '@/types/stats'
import { Student, Teacher } from '@/types/user'

import { UserListDialog } from '@/components/admin/atoms/client/UserListDialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

import { useStudents } from '@/context/Students/client'
import { useTeachers } from '@/context/Teachers/client'

// Définition des types pour les actions
type ActionVariant =
  | 'secondary'
  | 'ghost'
  | 'link'
  | 'default'
  | 'destructive'
  | 'outline'
  | 'teacherCancel'
  | 'teacherDefault'
  | 'teacherSecondary'
  | 'teacherTertiary'
  | 'teacherWarning'
  | 'teacherFooter'

interface BaseAction {
  icon: LucideIcon
  label: string
  description: string
  variant: ActionVariant
  isAdmin?: boolean
}

interface ActionWithHref extends BaseAction {
  href: string
  onClick?: undefined
}

interface ActionWithOnClick extends BaseAction {
  onClick: () => void
  href?: undefined
}

type Action = ActionWithHref | ActionWithOnClick

interface ActionGroup {
  title: string
  description: string
  actions: Action[]
}

export default function SettingsPage() {
  const { students } = useStudents()
  const { teachers } = useTeachers()
  const router = useRouter()
  const { data: session } = useSession()
  const isAdmin = session?.user?.role === 'admin'

  const [selectedType, setSelectedType] = useState<EntityType | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedEntity, setSelectedEntity] = useState<
    Student | Teacher | null
  >(null)

  // Groupes d'actions
  const actionGroups: ActionGroup[] = [
    {
      title: 'Gestion des utilisateurs',
      description: 'Gérer les professeurs et les élèves',
      actions: [
        {
          icon: GraduationCap,
          label: 'Liste des élèves',
          description: 'Voir les profils étudiants',
          onClick: () => setSelectedType('students'),
          variant: 'ghost',
        },
        {
          icon: Users,
          label: 'Liste des professeurs',
          description: 'Voir les profils enseignants',
          onClick: () => setSelectedType('teachers'),
          variant: 'ghost',
        },
      ],
    },
    {
      title: 'Organisation',
      description: 'Gérer les emplois du temps et communications',
      actions: [
        {
          icon: Calendar,
          label: 'Emplois du temps',
          description: 'Consulter et gérer les plannings',
          href: '/admin/schedule',
          variant: 'secondary',
        },
        {
          icon: MessageSquare,
          label: 'Messagerie',
          description: 'Accéder aux messages et notifications',
          href: '/admin/messages',
          variant: 'secondary',
        },
      ],
    },
    {
      title: 'Mise à jour de la db',
      description: 'A utiliser avec précaution',
      actions: [
        {
          icon: ChartLine,
          label: 'Update Stats',
          description: 'Mise à jour des stats',
          href: '/admin/root/update-stats',
          variant: 'ghost',
        },
      ],
    },
    // Actions réservées à admin
    ...(isAdmin
      ? ([
          {
            title: 'ADMIN',
            description: 'Section réservée aux admins',
            actions: [
              {
                icon: UserPlus,
                label: 'Ajouter un élève',
                description: 'Créer un nouveau profil étudiant',
                href: '/admin/root/student/new',
                variant: 'secondary',
                isAdmin: true,
              },
              {
                icon: UserPlus,
                label: 'Ajouter un professeur',
                description: 'Créer un nouveau profil enseignant',
                href: '/admin/root/teacher/new',
                variant: 'secondary',
                isAdmin: true,
              },
              {
                icon: Clock,
                label: 'Éditer horaires',
                description: 'Voir et modifier les horaires',
                href: '/admin/root/schedule/edit',
                variant: 'ghost',
                isAdmin: true,
              },
              {
                icon: TreePalm,
                label: 'Éditer vacances',
                description: 'Voir et modifier les vacances & jours fériés',
                href: '/admin/root/schedule/holidays',
                variant: 'ghost',
                isAdmin: true,
              },
              {
                icon: Squirrel,
                label: 'Migration',
                description:
                  "Migrer les data de l'ancienne db vers la nouvelle",
                href: '/admin/root/migration',
                variant: 'secondary',
                isAdmin: true,
              },
              {
                icon: History,
                label: 'Voir les logs de connexion',
                description:
                  "Affichage de toutes les connexions depuis le début de l'application",
                href: '/admin/root/logs',
                variant: 'secondary',
                isAdmin: true,
              },

              {
                icon: Search,
                label: 'Check students sans cours',
                description: 'Affiche les étudiants sans cours',
                href: '/admin/root/xtra',
                variant: 'ghost',
                isAdmin: true,
              },
              {
                icon: Cake,
                label: 'Convertir dates de naissance',
                description:
                  "Script pour convertir les dates de naissance à partir d'un fichier XLS",
                href: '/admin/root/convert',
                variant: 'secondary',
                isAdmin: true,
              },
              {
                icon: UserRoundPlus,
                label: 'Nouvel Utilisateur',
                description: "Ajouter d'un nouveau membre à l'application",
                href: '/admin/root/register',
                variant: 'secondary',
                isAdmin: true,
              },
              {
                icon: Palette,
                label: 'Gérer le thème graphique',
                description: 'Projet abandonné pour le moment',
                href: '/admin/root/config',
                variant: 'ghost',
                isAdmin: true,
              },
            ],
          },
        ] as ActionGroup[])
      : []),
  ]

  const filteredData = selectedType
    ? (selectedType === 'students' ? students : teachers).filter((item) =>
        `${item.firstname} ${item.lastname}`
          .toLowerCase()
          .includes(searchQuery.toLowerCase()),
      )
    : []

  function handleLogout() {
    signOut({
      redirect: true,
      callbackUrl: `${process.env.NEXT_PUBLIC_CLIENT_URL}/`,
    })
  }

  function handleActionClick(action: Action) {
    if ('href' in action && action.href) {
      router.push(action.href)
    } else if ('onClick' in action && action.onClick) {
      action.onClick()
    }
  }

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-6">
      {isAdmin && (
        <div className="bg-gradient-to-r from-amber-100 to-amber-50 dark:from-amber-950/30 dark:to-amber-900/20 rounded-lg p-4 mb-6 flex items-center gap-3 shadow-sm">
          <ShieldCheck className="h-6 w-6 text-amber-600 dark:text-amber-400" />
          <p className="text-sm text-amber-800 dark:text-amber-300">
            Vous avez accès aux fonctionnalités administrateur
          </p>
        </div>
      )}

      {actionGroups.map((group) => (
        <Card
          key={group.title}
          className="shadow-sm overflow-hidden border border-zinc-200 dark:border-zinc-800"
        >
          <CardHeader className="bg-zinc-50 dark:bg-zinc-900/50">
            <CardTitle className="text-xl">{group.title}</CardTitle>
            <CardDescription>{group.description}</CardDescription>
          </CardHeader>
          <CardContent className="p-4">
            <div className="grid gap-3 sm:grid-cols-2">
              {group.actions.map((action) => {
                const Icon = action.icon
                const isAdminAction = action.isAdmin === true

                return (
                  <Button
                    key={action.label}
                    variant={action.variant}
                    className={`relative h-auto w-full p-4 flex flex-col items-start gap-2 whitespace-normal group transition-all duration-200 ${
                      isAdminAction
                        ? 'bg-gradient-to-r from-rose-50 to-orange-50 dark:from-rose-950/40 dark:to-orange-950/30 hover:from-rose-100 hover:to-orange-100 dark:hover:from-rose-950/50 dark:hover:to-orange-950/40 border-rose-200 dark:border-rose-800'
                        : ''
                    }`}
                    onClick={() => handleActionClick(action)}
                  >
                    <div className="flex items-center gap-2 text-base font-medium">
                      <Icon
                        className={`h-5 w-5 transition-transform group-hover:scale-110 ${
                          isAdminAction
                            ? 'text-rose-600 dark:text-rose-400'
                            : ''
                        }`}
                      />
                      {action.label}
                      {isAdminAction && (
                        <Badge
                          variant="outline"
                          className="ml-1 bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-900/30 dark:text-rose-300 dark:border-rose-800 text-[10px] py-0 px-1.5"
                        >
                          Admin
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-left text-muted-foreground group-hover:text-foreground transition-colors">
                      {action.description}
                    </p>
                  </Button>
                )
              })}
            </div>
          </CardContent>
        </Card>
      ))}

      {selectedType && (
        <UserListDialog
          type={selectedType}
          people={filteredData}
          selectedEntity={selectedEntity}
          onSelectEntity={setSelectedEntity}
          searchQuery={searchQuery}
          onSearch={setSearchQuery}
          onClose={() => setSelectedType(null)}
        />
      )}

      <Card className="shadow-sm border border-zinc-200 dark:border-zinc-800">
        <CardContent className="pt-6">
          <Button
            variant="destructive"
            className="w-full flex items-center justify-center gap-2 group"
            onClick={handleLogout}
          >
            <LogOut className="h-5 w-5 transition-transform group-hover:scale-110" />
            Se déconnecter
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
