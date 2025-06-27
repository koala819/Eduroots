import { formatDayOfWeek } from '@/server/utils/helpers'
import { ClassroomTimeSlot, CourseSessionWithRelations } from '@/types/courses'

export type RoutePattern = {
  title:
    | string
    | ((params: {
        selectedSession?: CourseSessionWithRelations
        classroomTimeSlots?: ClassroomTimeSlot[]
      }) => string)
  subtitle:
    | string
    | ((params: {
        selectedSession?: CourseSessionWithRelations
        classroomTimeSlots?: ClassroomTimeSlot[]
      }) => string)
  backButton: {
    name: string
  }
}

export const ROUTE_PATTERNS: Record<string, RoutePattern> = {
  '/admin': {
    title: 'Administration',
    subtitle: 'Gestion du l\'établissement',
    backButton: {
      name: 'Accueil',
    },
  },
  '/admin/highRisk': {
    title: 'Étudiants à risque',
    subtitle: 'Suivi des absences critiques',
    backButton: {
      name: 'Accueil',
    },
  },
  '/admin/people': {
    title: 'Personnel',
    subtitle: 'Gestion des membres',
    backButton: {
      name: 'Accueil',
    },
  },
  '/admin/root/logs': {
    title: 'Logs',
    subtitle: 'Gestion des logs',
    backButton: {
      name: 'Accueil',
    },
  },
  '/admin/schedule': {
    title: 'Planning',
    subtitle: 'Gestion du planning',
    backButton: {
      name: 'Accueil',
    },
  },
  '/admin/root/student/new': {
    title: 'Nouvel élève',
    subtitle: 'Créer un nouvel élève',
    backButton: {
      name: 'Accueil',
    },
  },
  '/admin/root/teacher/new': {
    title: 'Nouveau prof',
    subtitle: 'Créer un nouveau prof',
    backButton: {
      name: 'Accueil',
    },
  },
  '/family': {
    title: 'Scolarité',
    subtitle: 'Vue d\'ensemble',
    backButton: {
      name: 'Accueil',
    },
  },
  '/family/messages': {
    title: 'Messagerie',
    subtitle: 'Communication avec l\'école',
    backButton: {
      name: 'Accueil',
    },
  },
  '/family/profile': {
    title: 'Profil',
    subtitle: 'Informations personnelles',
    backButton: {
      name: 'Accueil',
    },
  },
  '/teacher/classroom': {
    title: 'Tableau de bord',
    subtitle: 'Vue d\'ensemble',
    backButton: {
      name: 'Accueil',
    },
  },
  '/teacher/classroom/course': {
    title: ({ selectedSession }) =>
      selectedSession?.subject || 'Cours',
    subtitle: ({ selectedSession }) =>
      selectedSession
        ? formatDayOfWeek(
          selectedSession.courses_sessions_timeslot[0].day_of_week,
        )
        : 'Chargement...',
    backButton: {
      name: 'Mes Cours',
    },
  },
  '/teacher/classroom/course/[id]': {
    title: ({ selectedSession }) =>
      selectedSession?.subject || 'Cours',
    subtitle: ({ selectedSession }) =>
      selectedSession
        ? formatDayOfWeek(
          selectedSession.courses_sessions_timeslot[0].day_of_week,
        )
        : 'Chargement...',
    backButton: {
      name: 'Mes Cours',
    },
  },
  '/teacher/classroom/course/[id]/attendance': {
    title: 'Présence',
    subtitle: 'Gestion des présences',
    backButton: {
      name: 'Mes Cours',
    },
  },
  '/teacher/classroom/course/[id]/behavior': {
    title: 'Comportement',
    subtitle: 'Gestion du comportement',
    backButton: {
      name: 'Mes Cours',
    },
  },
  '/teacher/classroom/course/[id]/attendance/create': {
    title: 'Nouvelle présence',
    subtitle: 'Créer une nouvelle présence',
    backButton: {
      name: 'Retour',
    },
  },
  '/teacher/classroom/course/[id]/behavior/create': {
    title: 'Nouveau comportement',
    subtitle: 'Créer un nouveau comportement',
    backButton: {
      name: 'Retour',
    },
  },
  '/teacher/classroom/course/[id]/attendance/[id]/edit': {
    title: 'Modifier présence',
    subtitle: 'Modifier la présence',
    backButton: {
      name: 'Retour',
    },
  },
  '/teacher/classroom/course/[id]/behavior/[id]/edit': {
    title: 'Modifier comportement',
    subtitle: 'Modifier le comportement',
    backButton: {
      name: 'Retour',
    },
  },
  '/teacher/settings': {
    title: 'Paramètres',
    subtitle: 'Changer vos paramètres',
    backButton: {
      name: 'Accueil',
    },
  },
  '/teacher/settings/classroom': {
    title: 'Mes Cours',
    subtitle: ({ classroomTimeSlots }) =>
      classroomTimeSlots && classroomTimeSlots.length > 0
        ? `${classroomTimeSlots.length} créneaux disponibles`
        : 'Chargement...',
    backButton: {
      name: 'Retour',
    },
  },
  '/teacher/settings/grades': {
    title: 'Notes',
    subtitle: 'Gestion des notes',
    backButton: {
      name: 'Retour',
    },
  },
  '/teacher/settings/grades/create': {
    title: 'Nouvelle évaluation',
    subtitle: 'Créer une évaluation',
    backButton: {
      name: 'Retour',
    },
  },
  '/teacher/settings/grades/edit/[id]': {
    title: 'Modifier évaluation',
    subtitle: 'Éditer les notes',
    backButton: {
      name: 'Retour',
    },
  },
  '/teacher/settings/planning': {
    title: 'Mon Planning',
    subtitle: 'Gestion de mes créneaux',
    backButton: {
      name: 'Retour',
    },
  },
  '/teacher/settings/update': {
    title: 'Mettre à jour les Stats',
    subtitle: 'A faire occasionnellement',
    backButton: {
      name: 'Retour',
    },
  },
}
