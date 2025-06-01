import { Course } from '@/backend/models/course.model'
import { getFamilyStudents } from '@/lib/messages'


export async function getStudentsByFamily(familyEmail: string) {
  // 1. Récupérer les étudiants de la famille
  const familyStudents = await getFamilyStudents(familyEmail)

  // 2. Récupérer tous les cours où ces étudiants sont inscrits
  const courses = await Course.find({
    'sessions.students': { $in: familyStudents.map((s) => s._id) },
    isActive: true,
  }).populate({
    path: 'sessions.students',
    select: 'secondaryEmail email firstname lastname dateOfBirth gender',
    match: { isActive: true },
  })

  // 3. Retourner la même structure que getStudentsByTeacher
  return {
    success: true,
    data: courses.map((course) => ({
      courseId: course._id,
      academicYear: course.academicYear,
      sessions: course.sessions.map((session) => ({
        sessionId: session.id,
        subject: session.subject,
        level: session.level,
        timeSlot: session.timeSlot,
        students: session.students,
      })),
    })),
  }
}
