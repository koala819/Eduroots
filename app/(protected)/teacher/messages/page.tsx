import { getStudentsByTeacher } from '@/app/actions/context/teachers'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'
import { redirect } from 'next/navigation'
import { Student } from '@/types/user'
import { MessagesCenter } from '@/components/pages/client/MessagesCenter'

interface Session {
  sessionId: string
  subject: string
  level: string
  students: Student[]
  timeSlot: {
    dayOfWeek: string
    startTime: string
    endTime: string
  }
}

interface Group {
  id: string
  name: string
  students: Student[]
}

export function groupSimilarSessions(sessions: Session[]): Group[] {
  const groupedSessions = new Map<string, Group>()

  sessions.forEach((session) => {
    const dayOfWeek = session.timeSlot.dayOfWeek
    const existingGroup = groupedSessions.get(dayOfWeek)

    if (existingGroup) {
      // Vérifie si les étudiants sont les mêmes
      const areStudentsSame = session.students.length === existingGroup.students.length &&
        session.students.every((student) =>
          existingGroup.students.some((existingStudent) =>
            existingStudent._id === student._id,
          ),
        )

      if (areStudentsSame) {
        // Si les étudiants sont les mêmes, on garde le groupe existant
        // Les étudiants sont déjà dans le groupe
      } else {
        // Si les étudiants sont différents, on crée un nouveau groupe avec le sujet
        groupedSessions.set(`${dayOfWeek}_${session.subject}`, {
          id: session.sessionId,
          name: `${dayOfWeek}_${session.subject}`,
          students: session.students,
        })
      }
    } else {
      // Premier groupe pour ce dayOfWeek
      groupedSessions.set(dayOfWeek, {
        id: session.sessionId,
        name: dayOfWeek,
        students: session.students,
      })
    }
  })

  return Array.from(groupedSessions.values())
}

export default async function TeacherMessagesPage() {
  const session = await getServerSession(authOptions)

  if (!session || !session.user?.email) {
    redirect('/')
  }

  const response = await getStudentsByTeacher(session.user.id)

  if (!response.success) {
    throw new Error(response.message || 'Erreur lors de la récupération des étudiants')
  }

  // Extraire les étudiants uniques de tous les cours
  const allStudents = new Set<string>()
  const coursesTeachersWithChildren = response.data as any[]

  coursesTeachersWithChildren.forEach((course) => {
    course.sessions.forEach((session: any) => {
      session.students.forEach((student: Student) => {
        allStudents.add(JSON.stringify(student))
      })
    })
  })

  const uniqueStudents = Array
    .from(allStudents)
    .map((student: string) => JSON.parse(student) as Student)

  // Regrouper les sessions similaires
  const groupedSessions = groupSimilarSessions(coursesTeachersWithChildren[0].sessions)

  return <MessagesCenter
    students={uniqueStudents}
    coursesTeachersWithChildren={groupedSessions}
    userType="teacher"
  />
}
