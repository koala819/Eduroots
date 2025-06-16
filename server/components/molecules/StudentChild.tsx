import { Calendar } from 'lucide-react'
import { BiFemale, BiMale } from 'react-icons/bi'

import { Course } from '@/zUnused/mongo/course'
import { GenderEnum, Student,Teacher } from '@/zUnused/mongo/user'

import StudentAvatar from '@/server/components/atoms/StudentAvatar'

import { getStudentCourses } from '@/server/actions/context/courses'
import { getTeachersForStudent } from '@/server/actions/context/students'

async function StudentChild({ child }: {child: Student}) {
  const studentId = child._id || child.id
  const teacherInfo = await getStudentInfo(studentId)

  async function getStudentInfo(studentId: string) {
    try {
      // Récupérer les cours de l'étudiant pour obtenir le niveau
      const courses = await getStudentCourses(studentId)

      // Récupérer les professeurs de l'étudiant
      const teachers = await getTeachersForStudent(studentId)

      if (!teachers || !courses) {
        return { teacherInfo: null }
      }

      // Récupérer le premier professeur
      // Vérifier si teachers.data est un tableau avant d'accéder à l'index 0
      let teacher: Teacher | null = null
      if (teachers.data && Array.isArray(teachers.data) && teachers.data.length > 0) {
        teacher = teachers.data[0] as unknown as Teacher
      } else {
        return null
      }

      // Chercher dans toutes les courses et sessions pour trouver celle qui contient l'étudiant
      let studentLevel = 'Non défini'

      // Vérifier si courses.data est un tableau avant de le parcourir
      if (!courses.data || !Array.isArray(courses.data) || courses.data.length === 0) {
        return {
          name: teacher.firstname + ' ' + teacher.lastname,
          level: studentLevel,
        }
      }

      // Parcourir tous les cours
      for (const course of courses.data as unknown as Course[]) {
        // Parcourir toutes les sessions de chaque cours
        for (const session of course.sessions) {
          // Vérifier si l'étudiant est dans cette session
          const studentInSession = session.students.some(
            (student) => student._id === studentId || student.id === studentId,
          )

          if (studentInSession) {
            studentLevel = session.level
            break
          }
        }
        if (studentLevel !== 'Non défini') break
      }

      const teacherInfo = {
        name: `${teacher.firstname} ${teacher.lastname}`,
        level: studentLevel,
      }

      return teacherInfo
    } catch (error: any) {
      console.error('Erreur lors de la récupération des informations:', error)
      return { teacherInfo: null, error: error.message }
    }
  }

  return (
    <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-100 hover:shadow-md hover:border-indigo-200 transition-all duration-300 group">
      {/* Le reste de votre JSX reste identique, sans les états de chargement */}
      <div className="flex gap-4">
        <div className="w-14 h-14 shrink-0 rounded-full bg-indigo-50 overflow-hidden flex items-center justify-center group-hover:scale-105 transition-transform duration-300">
          <StudentAvatar initials={child.lastname.charAt(0) + child.firstname.charAt(0)} />
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-base mb-2 group-hover:text-indigo-600 transition-colors flex items-center">
            {child.lastname + ' ' + child.firstname}
            <span className="ml-2">
              {child.gender === GenderEnum.Masculin ? (
                <BiMale className="text-blue-500 h-5 w-5" />
              ) : (
                <BiFemale className="text-pink-500 h-5 w-5" />
              )}
            </span>
          </h3>

          <div className="bg-indigo-50 rounded-md p-3 mb-3">
            {teacherInfo ? (
              <div className="flex flex-col gap-y-2">
                <div className="flex items-center">
                  <div className="w-4 h-4 bg-indigo-500 rounded-full mr-2"></div>
                  <span className="font-semibold text-indigo-800">
                    Enseignant: {teacherInfo.name}
                  </span>
                </div>
                <div className="flex items-center">
                  <div className="w-4 h-4 bg-indigo-300 rounded-full mr-2"></div>
                  <span className="text-indigo-700">
                    Niveau: <span className="font-medium">{teacherInfo.level}</span>
                  </span>
                </div>
              </div>
            ) : (
              <div className="text-center text-indigo-700 italic">
                Aucune information disponible
              </div>
            )}
          </div>

          <div className="text-sm text-slate-600 flex flex-wrap gap-4 mt-2">
            <div className="flex items-center gap-1.5 bg-gray-50 px-3 py-1.5 rounded-full">
              <Calendar className="w-4 h-4 text-indigo-500" />
              <span>
                {child.dateOfBirth
                  ? new Date(child.dateOfBirth).toLocaleDateString('fr-FR', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                  })
                  : 'Non spécifiée'}
              </span>
            </div>

            <div className="flex items-center gap-1.5 bg-gray-50 px-3 py-1.5 rounded-full">
              {child.gender === GenderEnum.Masculin ? (
                <span className="text-blue-700">Garçon</span>
              ) : (
                <span className="text-pink-700">Fille</span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default StudentChild
