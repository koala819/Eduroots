import {getToken} from 'next-auth/jwt'
import {NextRequest, NextResponse} from 'next/server'

import dbConnect from '@/backend/config/dbConnect'
import {User} from '@/backend/models/user.model'
import {validateRequest} from '@/lib/api.utils'
import {formatName} from '@/lib/utils'

export async function DELETE(req: NextRequest) {
  const token = await getToken({req, secret: process.env.NEXTAUTH_SECRET})

  if (!token || !token.user) {
    return NextResponse.json({
      statusText: "Identifiez-vous d'abord pour accéder à cette ressource",
      status: 401,
    })
  }

  await dbConnect()

  try {
    const {id} = await req.json()

    const deletedStudent = await User.findOneAndDelete({
      _id: id,
      role: 'student',
    })

    if (!deletedStudent) {
      return NextResponse.json({
        status: 404,
        statusText: 'Student not found',
      })
    }

    return NextResponse.json({
      status: 200,
      data: deletedStudent,
      statusText: 'Elève supprimé avec succès',
    })
  } catch (error: any) {
    return NextResponse.json({
      status: 500,
      message: 'Internal Server Error',
      statusText: error.message,
    })
  }
}

export async function GET(req: NextRequest) {
  const token = await getToken({req, secret: process.env.NEXTAUTH_SECRET})

  if (!token || !token.user) {
    return NextResponse.json({
      statusText: "Identifiez-vous d'abord pour accéder à cette ressource",
      status: 401,
    })
  }
  // console.log('\n\n\ntoken', token)

  const {role, _id: userId} = token.user as {role: string; _id: string}
  // console.log('\n\n\napi/users/student\nrole', role, '\nuserId', userId)

  try {
    await dbConnect()

    const {searchParams} = new URL(req.url)
    const id = searchParams.get('id')
    const page = searchParams.get('page')
    const limit = searchParams.get('limit')
    const teacherId = searchParams.get('teacherId')
    const sessionId = searchParams.get('sessionId')

    // Vérification des autorisations
    if (role !== 'admin' && role !== 'bureau') {
      if (!teacherId && !sessionId && role !== 'teacher') {
        return NextResponse.json({
          statusText: "Vous n'avez pas les droits pour accéder à tous les étudiants",
          status: 403,
        })
      }

      // Logique spécifique pour les enseignants
      if (role === 'teacher' && sessionId) {
        const teacherStudents = await User.find({
          role: 'student',
          teacher: userId,
          session: sessionId,
        })
        return NextResponse.json({
          status: 200,
          statusText: "Vous ne pouvez accéder qu'à vos propres étudiants",
          data: teacherStudents,
          userRole: role,
        })
      }
    }

    // Search student by id
    if (id) {
      return fetchStudentFromDatabase(id)
    }

    // Display all students
    else if (page && limit) {
      const pageNumber = parseInt(page)
      const limitNumber = parseInt(limit)
      const skip = (pageNumber - 1) * limitNumber

      const students = await User.find({role: 'student'}).skip(skip).limit(limitNumber).lean()

      const totalStudents = await User.countDocuments({role: 'student'})

      return NextResponse.json({
        status: 200,
        data: students,
        totalPages: Math.ceil(totalStudents / limitNumber),
        currentPage: pageNumber,
      })
    }
    // Display students for a specific teacher
    else {
      if (teacherId) {
        const students = await User.find({
          role: 'student',
          teacher: teacherId,
        })
        return NextResponse.json({status: 200, data: students})
      }

      const students = await User.find({role: 'student'})

      if (students.length > 0) {
        return NextResponse.json({status: 200, data: students})
      } else {
        return NextResponse.json({status: 404, message: 'No students found'})
      }
    }
  } catch (error: any) {
    return NextResponse.json({
      statusText: error.message,
      status: 405,
    })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const token = await getToken({req, secret: process.env.NEXTAUTH_SECRET})
    if (!token || !token.user) {
      return NextResponse.json({
        statusText: "Identifiez-vous d'abord pour accéder à cette ressource",
        status: 401,
      })
    }
    await dbConnect()
    const body = await req.json()
    // console.log('\n\n\nbody', body)
    const id = req.nextUrl.searchParams.get('id')
    // console.log('\n\n\nid', id)
    if (!id) {
      return NextResponse.json({
        status: 400,
        statusText: 'Missing id',
      })
    }

    // Vérifier si le genre est fourni et valide
    if (!body || !['masculin', 'féminin'].includes(body)) {
      return NextResponse.json({
        status: 400,
        statusText: 'Genre invalide ou manquant',
      })
    }

    // Récupérer l'étudiant actuel
    const currentStudent = await User.findOne({_id: id, role: 'student'})
    if (!currentStudent) {
      return NextResponse.json({
        status: 404,
        statusText: 'Elève non trouvé',
      })
    }

    // Formater le prénom et le nom
    const {firstName, lastName} = formatName(currentStudent.firstname, currentStudent.lastname)

    const updatedStudent = await User.findOneAndUpdate(
      {_id: id, role: 'student'},
      {
        gender: body,
        firstname: firstName,
        lastname: lastName,
      },
      {new: true},
    )

    if (!updatedStudent) {
      return NextResponse.json({
        status: 404,
        statusText: 'Elève non trouvé',
      })
    }
    console.log('\n\n\nupdatedStudent', updatedStudent)

    return NextResponse.json({
      status: 200,
      statusText: 'Étudiant mis à jour avec succès',
      data: updatedStudent,
    })
  } catch (error) {
    console.error("Erreur lors de la mise à jour de l'étudiant:", error)
    return NextResponse.json({
      status: 500,
      statusText: "Erreur serveur lors de la mise à jour de l'étudiant",
    })
  }
}

export async function POST(req: NextRequest) {
  const authError = await validateRequest(req)
  if (authError) return authError

  try {
    const body = await req.json()
    console.log('\n\n\nbody', body)
    const {
      dateOfBirth,
      firstname,
      gender,
      lastname,
      mail,
      password,
      secondaryEmail,
      session,
      teacher,
    } = body

    const newStudent = new User({
      dateOfBirth,
      email: mail.toLowerCase(),
      firstname,
      gender,
      lastname: lastname.toUpperCase(),
      password,
      role: 'student',
      secondaryEmail,
      session,
      teacher,
    })

    await newStudent.save()

    return NextResponse.json({
      status: 200,
      data: newStudent,
      statusText: 'Elève créé avec succès',
    })
  } catch (error: any) {
    return NextResponse.json({
      status: 500,
      message: 'Internal Server Error',
      statusText: error.message,
    })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const token = await getToken({req, secret: process.env.NEXTAUTH_SECRET})

    if (!token || !token.user) {
      return NextResponse.json({
        statusText: "Identifiez-vous d'abord pour accéder à cette ressource",
        status: 401,
      })
    }

    await dbConnect()

    const {dateOfBirth, email, gender, id, firstname, lastname, secondaryEmail, session, teacher} =
      await req.json()

    // console.log('\n\n\nsession', session)

    const updatedStudent = await User.findOneAndUpdate(
      {_id: id, role: 'student'},
      {
        dateOfBirth,
        gender,
        email,
        firstname,
        lastname,
        session,
        secondaryEmail,
        teacher,
      },
      {new: true},
    )

    if (!updatedStudent) {
      return NextResponse.json({
        status: 404,
        statusText: 'Elève non trouvé',
      })
    }

    return NextResponse.json({
      status: 200,
      data: updatedStudent,
      statusText: 'Elève mis à jour avec succès',
    })
  } catch (error: any) {
    return NextResponse.json({
      status: 500,
      message: 'Internal Server Error',
      statusText: error.message,
    })
  }
}

async function fetchStudentFromDatabase(id: string) {
  try {
    const student = await User.findOne({_id: id, role: 'student'})
    if (!student) {
      return NextResponse.json({
        status: 404,
        statusText: 'Student not found',
      })
    }

    return NextResponse.json({
      status: 200,
      data: student,
      statusText: 'Student fetched successfully',
    })
  } catch (error: any) {
    console.error('Error fetching student by ID:', error)
    return NextResponse.json({
      status: 500,
      message: 'Internal Server Error',
      statusText: error.message,
    })
  }
}
