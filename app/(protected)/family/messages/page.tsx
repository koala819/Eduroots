import { getFamilyStudents } from '@/lib/messages'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'
import { redirect } from 'next/navigation'
import { getStudentsByFamily } from '@/app/actions/context/family'
import { getTeachersForStudent } from '@/app/actions/context/students'
import { Teacher } from '@/types/user'
import { groupSimilarSessions } from '@/lib/messages'
import { MessagesCenter } from '@/components/pages/client/MessagesCenter'
import { FamilyChildren } from '@/types/messages'


export default async function FamilyMessagesPage() {
  const session = await getServerSession(authOptions)

  if (!session || !session.user?.email) {
    redirect('/')
  }

  // 1. Récupérer les enfants de la famille
  const familyStudents = await getFamilyStudents(session.user.email)

  // 2. Pour chaque enfant, créer son "bot"
  const FamilyChildren: FamilyChildren[] = await Promise.all(
    familyStudents.map(async (child) => {
    // Récupérer les professeurs de l'enfant
      const teachersResponse = await getTeachersForStudent(child._id)
      const teachers = teachersResponse.success ? teachersResponse.data : []
      const teachersData = (teachers as unknown as Teacher[])?.map((teacher) => ({
        id: teacher._id.toString(),
        name: teacher.lastname as string,
        firstname: teacher.firstname as string,
      }))

      // Récupérer les cours de l'enfant
      const coursesResponse = await getStudentsByFamily(session.user.email)
      const courses = groupSimilarSessions(coursesResponse.data[0].sessions)
      const childIdString = child._id.toString()

      // Vérifier si l'enfant est dans chaque cours
      const coursesData = courses.filter((course) => {
        const isInCourse = course.students.some((student) => {
          const studentIdString = student._id.toString()
          return studentIdString === childIdString
        })
        return isInCourse
      }).map((course) => ({
        id: course.id,
        name: course.name,
        students: course.students.map((student) => ({
          _id: student._id.toString(),
          id: student._id.toString(),
          email: student.email,
          firstname: student.firstname,
          lastname: student.lastname,
          dateOfBirth: student.dateOfBirth?.toString(),
          gender: student.gender,
          secondaryEmail: student.secondaryEmail,
        })),
      }))

      return {
        id: child._id.toString(),
        name: child.lastname,
        firstname: child.firstname,
        teachers: teachersData,
        courses: coursesData,
      }
    }),
  )

  // Sérialiser l'objet final
  const serializedFamilyChildren = JSON.parse(JSON.stringify(FamilyChildren))


  return (
    <MessagesCenter
      FamilyChildren={serializedFamilyChildren}
      userType="family"
    />)
}
