import {getToken} from 'next-auth/jwt'
import {NextRequest, NextResponse} from 'next/server'

import dbConnect from '@/backend/config/dbConnect'
import {User} from '@/backend/models/zOLDuser.model'

export async function GET(req: NextRequest) {
  const token = await getToken({req, secret: process.env.NEXTAUTH_SECRET})

  if (!token || !token.user) {
    return NextResponse.json({
      statusText: "Identifiez-vous d'abord pour accéder à cette ressource",
      status: 401,
    })
  }

  try {
    await dbConnect()

    // Récupérer tous les étudiants
    const allStudents = await User.find({role: 'student'})

    // Filtrer les étudiants
    const studentsWithoutValidTeacher = await Promise.all(
      allStudents.map(async (student) => {
        const isValid = await isValidTeacherSession(student)
        return isValid ? null : student
      }),
    )

    // Supprimer les valeurs null du tableau
    const filteredStudents = studentsWithoutValidTeacher.filter((student) => student !== null)

    if (filteredStudents.length > 0) {
      return NextResponse.json({status: 200, data: filteredStudents})
    } else {
      return NextResponse.json({
        status: 200,
        message: 'Tous les élèves ont un professeur valide',
      })
    }
  } catch (error: any) {
    return NextResponse.json({
      statusText: error.message,
      status: 405,
    })
  }
}

async function isValidTeacherSession(student: any): Promise<boolean> {
  if (!student.teacher || !student.session) return false

  const teacher = await User.findOne({
    _id: student.teacher,
    role: 'teacher',
    'teacherSessions._id': student.session,
  })

  return !!teacher
}
