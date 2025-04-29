import {NextRequest, NextResponse} from 'next/server'

import {User} from '@/backend/models/user.model'
import {validateRequest} from '@/lib/api.utils'

export async function DELETE(req: NextRequest) {
  const authError = await validateRequest(req)
  if (authError) return authError

  try {
    const {id} = await req.json()

    const deletedTeacher = await User.findOneAndDelete({
      _id: id,
      role: 'teacher',
    })

    if (!deletedTeacher) {
      return NextResponse.json({
        status: 404,
        statusText: 'Teacher not found',
      })
    }

    // Mettre à jour les étudiants qui ont ce professeur en supprimant l'ID du professeur
    await User.updateMany(
      {teacher: id, role: 'student'},
      {$unset: {teacher: ''}}, // Enlève l'ID du professeur
    )

    return NextResponse.json({
      status: 200,
      data: deletedTeacher,
      statusText: 'Enseignant supprimé avec succès',
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
  const authError = await validateRequest(req)
  if (authError) return authError

  try {
    // console.log('\n\n\nin GET /user/teacher')
    const {searchParams} = new URL(req.url)
    // console.log('searchParams', searchParams)
    const id = searchParams.get('id')
    // console.log('id', id)

    if (id) {
      return getTeacherById(id)
    }

    const teachers = await User.find({role: 'teacher'})

    if (teachers.length > 0) {
      return NextResponse.json({status: 200, data: teachers})
    } else {
      return NextResponse.json({status: 404, message: 'No teachers found'})
    }
  } catch (error: any) {
    return NextResponse.json({
      statusText: error.message,
      status: 405,
    })
  }
}

export async function PATCH(req: NextRequest) {
  const authError = await validateRequest(req)
  if (authError) return authError

  try {
    const {id} = await req.json()

    if (!id) {
      return NextResponse.json({
        status: 400,
        statusText: 'Missing id',
      })
    }
    const password = process.env.TEACHER_PWD

    if (!password) {
      return NextResponse.json({
        status: 500,
        statusText: 'Password not set in environment variables',
      })
    }

    const updatedTeacher = await User.findOneAndUpdate(
      {_id: id, role: 'teacher'},
      {password},
      {new: true},
    )

    if (!updatedTeacher) {
      return NextResponse.json({
        status: 404,
        statusText: 'Enseignant non trouvé',
      })
    }

    return NextResponse.json({
      status: 200,
      data: updatedTeacher,
      statusText: 'Mot de passe mis à jour avec succès',
    })
  } catch (error: any) {
    return NextResponse.json({
      status: 500,
      message: 'Internal Server Error',
      statusText: error.message,
    })
  }
}

export async function POST(req: NextRequest) {
  const authError = await validateRequest(req)
  if (authError) return authError

  try {
    const {email, firstname, lastname, password, teacherSessions} = await req.json()

    const existingUser = await User.findOne({email, role: 'teacher'})

    if (existingUser) {
      return NextResponse.json({
        statusText: 'Un Enseignant avec cet e-mail existe déjà',
        statusCode: 400,
      })
    }

    const newTeacher = new User({
      email,
      firstname,
      lastname,
      password,
      role: 'teacher',
      teacherSessions: teacherSessions.map((session: {level: string; sessionTime: string}) => ({
        level: session.level,
        sessionTime: session.sessionTime,
      })),
    })

    await newTeacher.save()

    return NextResponse.json({
      status: 200,
      data: newTeacher,
      statusText: 'Enseignant créé avec succès',
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
  const authError = await validateRequest(req)
  if (authError) return authError

  try {
    const {id, email, firstname, lastname, teacherSessions} = await req.json()

    const updatedTeacher = await User.findOneAndUpdate(
      {_id: id, role: 'teacher'},
      {
        email,
        firstname,
        lastname,
        teacherSessions: teacherSessions.map(
          (session: {level: string; sessionTime: string; id: string}) => ({
            _id: session.id,
            level: session.level,
            sessionTime: session.sessionTime,
          }),
        ),
      },
      {new: true},
    )

    // console.log('update Teacher is', updatedTeacher)

    if (!updatedTeacher) {
      return NextResponse.json({
        status: 404,
        statusText: 'Enseignant non trouvé',
      })
    }

    return NextResponse.json({
      status: 200,
      data: updatedTeacher,
      statusText: 'Enseignant mis à jour avec succès',
    })
  } catch (error: any) {
    return NextResponse.json({
      status: 500,
      message: 'Internal Server Error',
      statusText: error.message,
    })
  }
}

async function getTeacherById(id: string) {
  try {
    const teacher = await User.findOne({_id: id, role: 'teacher'})
    if (!teacher) {
      return NextResponse.json({
        status: 404,
        statusText: 'Teacher not found',
      })
    }

    return NextResponse.json({
      status: 200,
      data: teacher,
      statusText: 'Teacher fetched successfully',
    })
  } catch (error: any) {
    console.error('Error fetching teacher by ID:', error)
    return NextResponse.json({
      status: 500,
      message: 'Internal Server Error',
      statusText: error.message,
    })
  }
}
