import { getToken } from 'next-auth/jwt'
import { NextRequest, NextResponse } from 'next/server'

import dbConnect from '@/zOLDbackend/config/dbConnect'
import { Grade } from '@/zOLDbackend/models/zOLDgrade.model'

export async function GET(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })
  if (!token || !token.user) {
    return NextResponse.json({
      statusText: 'Identifiez-vous d\'abord pour accéder à cette ressource',
      status: 401,
    })
  }

  const { searchParams } = new URL(req.url)
  const teacherId = searchParams.get('id')

  try {
    await dbConnect()
    let grades

    if (teacherId) {
      grades = await Grade.find({ teacher: teacherId })
    } else {
      grades = await Grade.find({})
    }

    return NextResponse.json({
      status: 200,
      data: grades,
    })
  } catch (error: any) {
    return NextResponse.json({
      status: 500,
      message: 'Internal Server Error',
      error: error.message,
    })
  }
}

export async function POST(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })
  if (!token || !token.user) {
    return NextResponse.json({
      statusText: 'Identifiez-vous d\'abord pour accéder à cette ressource',
      status: 401,
    })
  }
  try {
    await dbConnect()
    const body = await req.json()
    const { students, teacher, subject, date, session } = body
    const gradeRecord = new Grade({
      students: students.map((student: {studentId: any; grade: string | number}) => ({
        studentId: student.studentId,
        grade: student.grade === 'Absent' ? 'Absent' : parseInt(student.grade.toString(), 10),
      })),
      teacher,
      subject,
      date,
      session,
    })
    await gradeRecord.save()
    return NextResponse.json({
      status: 200,
      message: 'Note enregistrée avec succès',
    })
  } catch (error: any) {
    return NextResponse.json({
      status: 500,
      message: 'Internal Server Error',
      error: error.message,
    })
  }
}

export async function PUT(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })
  if (!token || !token.user) {
    return NextResponse.json({
      statusText: 'Identifiez-vous d\'abord pour accéder à cette ressource',
      status: 401,
    })
  }
  try {
    await dbConnect()
    const body = await req.json()
    const { _id, students, subject, date, session } = body
    // console.log('\n\n\nbody of PUT method', body)

    if (!_id) {
      return NextResponse.json({
        status: 400,
        message: 'ID is required for update',
      })
    }

    const updatedGrade = await Grade.findByIdAndUpdate(
      _id,
      { $set: { students, subject, date, session } },
      { new: true, runValidators: true },
    )

    if (!updatedGrade) {
      return NextResponse.json({ status: 404, message: 'Grade not found' })
    }

    return NextResponse.json({
      status: 200,
      message: 'Notes mises à jour avec succès',
      data: updatedGrade,
    })
  } catch (error: any) {
    return NextResponse.json({
      status: 500,
      message: 'Internal Server Error',
      error: error.message,
    })
  }
}
