import {NextRequest, NextResponse} from 'next/server'

import {statsGradesClean} from '@/lib/stats/grade'
import {checkAttendances} from '@/migrations/attendanceCHECK'
import checkRemainingFullSessions from '@/migrations/coursesCheckLongSessions'
import {checkGradesDuplicates} from '@/migrations/gradeDuplicate'
import {statsGradesUpdate} from '@/migrations/stats-Grades-update'
import {statsStudentCheck} from '@/migrations/stats-Students-check'
import {statsTeacherCheck} from '@/migrations/stats-Teachers-check'
import {statsTeacherUpdate} from '@/migrations/stats-Teachers-update'
import {statsStudentUpdate} from '@/migrations/stats-student-update'
import {checkStats} from '@/migrations/statsCHECK'

type MigrationFunction = () => Promise<{
  success: boolean
  message: string
  backupPath: string | null
  satst?: any
  data?: any
}>

const migrations: Record<string, MigrationFunction> = {
  checkRemainingFullSessions,
  checkGradesDuplicates,
  statsGradesClean,
  statsGradesUpdate,
  statsStudentCheck,
  statsStudentUpdate,
  statsTeacherCheck,
  statsTeacherUpdate,
  checkAttendances,
  checkStats,
}

export async function POST(req: NextRequest) {
  // const secretHeader = req.headers.get('X-Migration-Secret')
  // if (secretHeader !== process.env.MIGRATION_SECRET) {
  //   return NextResponse.json(
  //     { error: 'Accès non autorisé à la migration.' },
  //     { status: 401 },
  //   )
  // }

  try {
    const body = await req.json()
    console.log('body', body)
    const migrationType = body.type

    if (!migrationType || !migrations[migrationType]) {
      return NextResponse.json(
        {error: 'Type de migration non valide ou non spécifié.'},
        {status: 400},
      )
    }

    // Capture console.log output
    const logs: string[] = []
    const originalConsoleLog = console.log
    console.log = (...args: any[]) => {
      logs.push(
        args.map((arg) => (typeof arg === 'object' ? JSON.stringify(arg, null, 2) : arg)).join(' '),
      )
      originalConsoleLog(...args)
    }

    const migrationFunction = migrations[migrationType]
    const result = await migrationFunction()

    console.log('result', result)
    // Restore original console.log
    console.log = originalConsoleLog

    if (result.success) {
      return NextResponse.json({
        message: result.message,
        backupPath: result.backupPath,
        logs,
        data: result.data,
      })
    } else {
      return NextResponse.json(
        {
          error: result.message,
          backupPath: result.backupPath,
          logs,
        },
        {status: 500},
      )
    }
  } catch (error) {
    console.error('Erreur inattendue lors de la migration:', error)
    return NextResponse.json(
      {
        error: "Une erreur inattendue s'est produite lors de la migration",
      },
      {status: 500},
    )
  }
}
