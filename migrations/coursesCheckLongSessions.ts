import dbConnect from '@/backend/config/dbConnect'
import {Course} from '@/backend/models/course.model'

interface CheckResult {
  success: boolean
  message: string
  backupPath: string | null
  stats?: {
    total: number
    morning: number
    afternoon: number
    sessions?: Array<{
      courseId: string
      sessionId: string
      type: string
      dayOfWeek: string
      time: string
      studentsCount: number
      classroom: string
    }>
  }
  error?: {
    code: string
    details: string
  }
}

async function checkRemainingFullSessions(): Promise<CheckResult> {
  try {
    await dbConnect()
    console.log('\n🔍 Recherche des sessions longues restantes...')

    const coursesWithFullSessions = await Course.find({
      isActive: true,
      deletedAt: null,
      sessions: {
        $elemMatch: {
          $or: [
            {
              'timeSlot.startTime': '09:00',
              'timeSlot.endTime': '12:30',
            },
            {
              'timeSlot.startTime': '14:00',
              'timeSlot.endTime': '17:30',
            },
          ],
        },
      },
    }).lean()

    if (coursesWithFullSessions.length === 0) {
      console.log('✅ Aucune session longue trouvée !')
      return {
        success: true,
        message: 'Aucune session longue trouvée',
        backupPath: null,
        stats: {
          total: 0,
          morning: 0,
          afternoon: 0,
          sessions: [],
        },
      }
    }

    // Extraire et organiser les sessions trouvées
    const foundSessions = []
    for (const course of coursesWithFullSessions) {
      const fullSessions = course.sessions.filter(
        (session: any) =>
          (session.timeSlot.startTime === '09:00' && session.timeSlot.endTime === '12:30') ||
          (session.timeSlot.startTime === '14:00' && session.timeSlot.endTime === '17:30'),
      )

      for (const session of fullSessions) {
        foundSessions.push({
          courseId: course._id,
          sessionId: session._id,
          type: session.timeSlot.startTime === '09:00' ? 'Matin' : 'Après-midi',
          dayOfWeek: session.timeSlot.dayOfWeek,
          time: `${session.timeSlot.startTime}-${session.timeSlot.endTime}`,
          studentsCount: session.students.length,
          classroom: session.timeSlot.classroomNumber,
        })
      }
    }

    // Grouper par période (matin/après-midi)
    const morning = foundSessions.filter((s) => s.type === 'Matin')
    const afternoon = foundSessions.filter((s) => s.type === 'Après-midi')

    // Afficher les résultats
    console.log('\n📊 SESSIONS LONGUES TROUVÉES:')
    console.log(`\nNombre total de sessions: ${foundSessions.length}`)

    if (morning.length > 0) {
      console.log('\n🌅 Sessions du matin (9h-12h30):')
      morning.forEach((session) => {
        console.log(`\n🔹 Session ${session.sessionId}:`)
        console.log(`   • Cours ID: ${session.courseId}`)
        console.log(`   • Jour: ${session.dayOfWeek}`)
        console.log(`   • Horaire: ${session.time}`)
        console.log(`   • Nombre d'étudiants: ${session.studentsCount}`)
        console.log(`   • Salle: ${session.classroom}`)
      })
    }

    if (afternoon.length > 0) {
      console.log("\n🌇 Sessions de l'après-midi (14h-17h30):")
      afternoon.forEach((session) => {
        console.log(`\n🔹 Session ${session.sessionId}:`)
        console.log(`   • Cours ID: ${session.courseId}`)
        console.log(`   • Jour: ${session.dayOfWeek}`)
        console.log(`   • Horaire: ${session.time}`)
        console.log(`   • Nombre d'étudiants: ${session.studentsCount}`)
        console.log(`   • Salle: ${session.classroom}`)
      })
    }

    return {
      success: true,
      message: `${foundSessions.length} sessions longues trouvées`,
      backupPath: null,
      stats: {
        total: foundSessions.length,
        morning: morning.length,
        afternoon: afternoon.length,
        sessions: foundSessions as any,
      },
    }
  } catch (error) {
    console.error('❌ Erreur:', error)
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Erreur inconnue',
      backupPath: null,
      error: {
        code: 'CHECK_ERROR',
        details: error instanceof Error ? error.message : 'Détails non disponibles',
      },
    }
  }
}

export default checkRemainingFullSessions
