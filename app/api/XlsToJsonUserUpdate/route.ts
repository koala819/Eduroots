import { getToken } from 'next-auth/jwt'
import { NextRequest, NextResponse } from 'next/server'

import dbConnect from '@/backend/config/dbConnect'
import { User } from '@/backend/models/user.model'
import readline from 'readline'

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
})

function waitForUserInput(prompt: string) {
  return new Promise<void>((resolve) => {
    rl.question(prompt, () => {
      resolve()
    })
  })
}

export async function POST(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })
  if (!token || !token.user) {
    return NextResponse.json({
      statusText: "Identifiez-vous d'abord pour accéder à cette ressource",
      status: 401,
    })
  }
  await dbConnect()
  try {
    // Backup current students
    const currentStudents = await User.find({ role: 'student' })
    const backup = JSON.parse(JSON.stringify(currentStudents))

    // Update students
    const updates = await req.json()

    for (const update of updates) {
      const updatedStudent = await User.findOneAndUpdate(
        { _id: update._id, role: 'student' },
        { dateOfBirth: update.dateOfBirth },
        { new: true },
      )
      console.log('updatedStudent', updatedStudent)

      // Wait for user confirmation
      await waitForUserInput('Press Enter to continue to the next update...')
    }

    rl.close()

    return NextResponse.json({
      status: 200,
      statusText: 'Backup created and students updated successfully',
      backup: backup,
    })
  } catch (error: any) {
    rl.close()
    return NextResponse.json({
      status: 500,
      message: 'Internal Server Error',
      statusText: error.message,
    })
  }
}

export async function PUT(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })

  if (!token || !token.user) {
    return NextResponse.json({
      statusText: "Identifiez-vous d'abord pour accéder à cette ressource",
      status: 401,
    })
  }

  await dbConnect()

  try {
    const { backup } = await req.json()

    // Delete all current students
    await User.deleteMany({ role: 'student' })

    // Restore from backup
    await User.insertMany(backup)

    return NextResponse.json({
      status: 200,
      statusText: 'Backup restored successfully',
    })
  } catch (error: any) {
    return NextResponse.json({
      status: 500,
      message: 'Internal Server Error',
      statusText: error.message,
    })
  }
}
