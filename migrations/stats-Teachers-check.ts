import { TimeSlotEnum } from '@/types/course'
import { TeacherStats } from '@/types/stats'
import { GenderEnum } from '@/types/user'

import {
  TeacherSession,
  TeacherSessionInfo,
  analyzeTeacherSessions,
  calculateTeacherStats,
  getTeacherCourseCount,
} from '@/lib/stats/teacher'

interface StatsCheckResult {
  success: boolean
  message: string
  backupPath: string | null
}

export async function statsTeacherCheck(): Promise<StatsCheckResult> {
  try {
    // Utiliser la nouvelle fonction d'analyse des sessions
    const analytics = await analyzeTeacherSessions()

    console.log(`Nombre total de professeurs: ${analytics.teacherMap.size}`)
    console.log(
      `Nombre total de cours actifs: ${analytics.teacherCategories ? Object.values(analytics.teacherCategories).flat().length : 0}`,
    )

    // Afficher les professeurs remplaçants
    if (analytics.substituteTeachers.length > 0) {
      console.log('\n🔍 Professeurs remplaçants:')
      console.log(
        `Total de professeurs remplaçants: ${analytics.substituteTeachers.length}`,
      )
      analytics.substituteTeachers.forEach((teacher) => {
        console.log(`  ID: ${teacher.id} - Nom: ${teacher.name}`)
      })
    }

    // Définir les noms de catégories pour l'affichage
    const categoryNames = {
      [TimeSlotEnum.SATURDAY_MORNING]: 'Samedi Matin Only',
      [TimeSlotEnum.SATURDAY_AFTERNOON]: 'Samedi Après-midi Only',
      [TimeSlotEnum.SUNDAY_MORNING]: 'Dimanche Matin Only',
      [`${TimeSlotEnum.SATURDAY_MORNING}+${TimeSlotEnum.SATURDAY_AFTERNOON}`]:
        'Samedi Matin + Samedi Après-midi',
      [`${TimeSlotEnum.SATURDAY_MORNING}+${TimeSlotEnum.SUNDAY_MORNING}`]:
        'Samedi Matin + Dimanche Matin',
      [`${TimeSlotEnum.SATURDAY_AFTERNOON}+${TimeSlotEnum.SUNDAY_MORNING}`]:
        'Samedi Après-midi + Dimanche Matin',
      [`${TimeSlotEnum.SATURDAY_MORNING}+${TimeSlotEnum.SATURDAY_AFTERNOON}+${TimeSlotEnum.SUNDAY_MORNING}`]:
        'Samedi Matin + Samedi Après-midi + Dimanche Matin',
    }

    // Parcourir et afficher les catégories de professeurs
    for (const [category, teachers] of Object.entries(
      analytics.teacherCategories,
    )) {
      if (teachers.length > 0) {
        const categoryKey = category as keyof typeof categoryNames
        console.log(
          `\n📅 ${categoryNames[categoryKey] || category} (${teachers.length} professeurs):`,
        )
        await Promise.all(
          teachers.map(async (teacher) => {
            const teacherName =
              analytics.teacherMap.get(teacher.teacherId) || 'Nom inconnu'
            const courseInfo = getTeacherCourseCount(teacher)

            let teacherStudents: TeacherStats = {
              totalStudents: 0,
              genderDistribution: {
                counts: {
                  [GenderEnum.Masculin]: 0,
                  [GenderEnum.Feminin]: 0,
                  undefined: 0,
                },
                percentages: {
                  [GenderEnum.Masculin]: '0%',
                  [GenderEnum.Feminin]: '0%',
                  undefined: '0%',
                },
              },
              minAge: 0,
              maxAge: 0,
              averageAge: 0,
            }

            try {
              teacherStudents = await calculateTeacherStats(teacher.teacherId)
            } catch (error) {
              console.error(
                `Erreur lors de la collecte des étudiants pour 67937d4373ff32f60b3b7e16`,
                error,
              )
            }

            console.log(
              `  - Professeur: ${teacher.teacherId} - ${teacherName} (${courseInfo.courseCount} cours)`,
            )
            console.log(
              `📊 Statistiques:\n   Étudiants du professeur (${teacherStudents?.totalStudents}): \n${teacherStudents?.genderDistribution.percentages[GenderEnum.Masculin]}% garçons, ${teacherStudents?.genderDistribution.percentages[GenderEnum.Feminin]}% filles,  ${teacherStudents?.genderDistribution.percentages.undefined}% indéfini, \n plus jeune : ${teacherStudents?.minAge} ans, plus vieux : ${teacherStudents?.maxAge} ans, moyenne : ${teacherStudents?.averageAge} ans, \n\n\n`,
            )

            // Détecter les anomalies
            detectAnomalies(teacher, analytics.teacherMap)
          }),
        )
      }
    }

    return {
      success: true,
      message: 'Analyse des sessions des professeurs terminée avec succès',
      backupPath: null,
    }
  } catch (error) {
    console.error("Erreur lors de l'analyse des sessions:", error)

    return {
      success: false,
      message: `Erreur lors de l'analyse des sessions: ${error instanceof Error ? error.message : error}`,
      backupPath: null,
    }
  }
}

// Fonction pour détecter les anomalies
function detectAnomalies(
  teacher: TeacherSessionInfo,
  teacherMap: Map<string, string>,
) {
  const workDays = new Set(teacher.workDays)
  const expectedMaxCourses = workDays.size
  const realCourses = getTeacherCourseCount(teacher).courseCount

  if (realCourses > expectedMaxCourses) {
    console.log(`🚨 Exception pour ${teacherMap.get(teacher.teacherId)}:`)

    // Trouver les sessions supplémentaires
    const sessionsByDay: Record<string, TeacherSession[]> = {}
    teacher.courses.forEach((course) => {
      course.sessions.forEach((session) => {
        if (!sessionsByDay[session.dayOfWeek]) {
          sessionsByDay[session.dayOfWeek] = []
        }
        sessionsByDay[session.dayOfWeek].push(session)
      })
    })

    // Filtrer les jours avec des sessions différentes
    const daysWithUniqueStudents = Object.entries(sessionsByDay).filter(
      ([day, sessions]) =>
        sessions.length > 1 &&
        new Set(
          sessions.map((s) => JSON.stringify(s.students?.map((st) => st.id))),
        ).size > 1,
    )

    // Afficher uniquement les jours avec des sessions différentes
    daysWithUniqueStudents.forEach(([day]) => {
      console.log(`   avec le ${day}.`)
    })
  }
}
