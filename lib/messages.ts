import { getAllStudents } from '@/app/actions/context/students'
import { Student } from '@/types/user'

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


export async function getFamilyStudents(email: string): Promise<Student[]> {
  try {
    const studentsResponse = await getAllStudents()

    let studentsArray: Student[] = []

    if (Array.isArray(studentsResponse)) {
      studentsArray = studentsResponse
    } else if (studentsResponse && typeof studentsResponse === 'object') {
      // Cas où c'est un objet de réponse API comme { success: true, data: [...] }
      if ('data' in studentsResponse && Array.isArray(studentsResponse.data)) {
        studentsArray = studentsResponse.data as unknown as Student[]
      } else {
        // Peut-être un autre format - à adapter selon votre API
        console.error('Format de données inattendu:', studentsResponse)
        return []
      }
    }

    return studentsArray.filter(
      (student) =>
        student.email === email && student.role === 'student' && student.isActive === true,
    )
  } catch (error) {
    console.error('Erreur lors de la récupération des étudiants:', error)
    return []
  }
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
