'use server'

import {getServerSession} from 'next-auth'

import {ApiResponse} from '@/types/api'
import {CourseSession} from '@/types/course'
import {Teacher} from '@/types/user'

import {Course} from '@/zOLDbackend/models/zOLDcourse.model'
import {User} from '@/zOLDbackend/models/zOLDuser.model'
import {SerializedValue, serializeData} from '@/lib/serialization'
import {isValidObjectId} from 'mongoose'

async function getSessionServer() {
  const session = await getServerSession()
  if (!session || !session.user) {
    throw new Error('Non authentifié')
  }
  return session
}

export async function createTeacher(
  teacherData: Omit<Teacher, 'id' | '_id' | 'createdAt' | 'updatedAt'>,
): Promise<ApiResponse<SerializedValue>> {
  await getSessionServer()
  try {
    const validation = validateRequiredFields('teacher', teacherData)

    if (!validation.isValid) {
      return {
        success: false,
        message: validation.message as string,
        data: null,
      }
    }

    const newUser = await User.create(teacherData)
    if (!newUser) {
      return {
        success: false,
        message: 'Professeur non créé',
        data: null,
      }
    }
    return {
      success: true,
      data: serializeData({id: newUser._id}),
      message: 'Professeur créé avec succès',
    }
  } catch (error) {
    console.error('[CREATE_TEACHER]', error)
    throw new Error('Erreur lors de la création du professeur')
  }
}

export async function deleteTeacher(teacherId: string): Promise<ApiResponse<SerializedValue>> {
  await getSessionServer()
  try {
    if (!teacherId || !isValidObjectId(teacherId)) {
      return {
        success: false,
        message: 'Id invalide',
        data: null,
      }
    }

    const deletedUser = await User.findOneAndUpdate(
      {
        _id: teacherId,
        role: 'teacher',
        isActive: true,
      },
      {
        isActive: false,
        deletedAt: new Date(),
      },
      {new: true},
    ).select('-password')

    if (!deletedUser) {
      return {
        success: false,
        message: 'Professeur non trouvé',
        data: null,
      }
    }

    return {
      success: true,
      data: null,
      message: 'Professeur supprimé avec succès',
    }
  } catch (error) {
    console.error('[DELETE_TEACHER]', error)
    throw new Error('Erreur lors de la suppression du professeur')
  }
}

export async function getAllTeachers(): Promise<ApiResponse<SerializedValue>> {
  await getSessionServer()
  try {
    const users = await User.find({
      isActive: true,
      role: 'teacher',
    })
      .select('-password')
      .sort({firstname: 1, lastname: 1})

    if (!users) {
      return {
        success: false,
        message: 'Professeurs non trouvés',
        data: null,
      }
    }
    return {
      success: true,
      data: users ? serializeData(users) : null,
      message: 'Tous les Professeurs récupérés avec succès',
    }
  } catch (error) {
    console.error('[GET_ALL_TEACHERS]', error)
    throw new Error('Erreur lors de la récupération des professeurs')
  }
}

export async function getOneTeacher(teacherId: string): Promise<ApiResponse<SerializedValue>> {
  await getSessionServer()
  try {
    if (!isValidObjectId(teacherId)) {
      return {
        success: false,
        message: 'Id invalide',
        data: null,
      }
    }

    const user = await User.findOne({
      isActive: true,
      role: 'teacher',
      _id: teacherId,
    }).select('-password')

    if (!user) {
      return {
        success: false,
        message: 'Professeur non trouvé',
        data: null,
      }
    }
    return {
      success: true,
      data: user ? serializeData(user) : null,
      message: 'Professeur récupéré avec succès',
    }
  } catch (error) {
    console.error('[GET_ONE_TEACHER]', error)
    throw new Error('Erreur lors de la récupération du professeur')
  }
}

export async function getStudentsByTeacher(
  teacherId: string,
): Promise<ApiResponse<SerializedValue>> {
  await getSessionServer()

  try {
    const teacher = await User.findOne({
      _id: teacherId,
      role: 'teacher',
      isActive: true,
    })

    if (!teacher) {
      return {
        success: false,
        message: 'Professeur non trouvé',
        data: null,
      }
    }

    const courses = await Course.find({
      teacher: teacherId,
      isActive: true,
    }).populate({
      path: 'sessions.students',
      select: 'secondaryEmail email firstname lastname dateOfBirth gender',
      match: {isActive: true},
    })

    // Nouvelle structure : regrouper par cours
    const coursesWithStudents = courses.map((course) => {
      // Transformer les sessions du cours
      const sessionsWithStudents = course.sessions.map((session: CourseSession) => {
        // Transformer les étudiants de la session
        const students = session.students.map((student: any) => ({
          _id: student._id,
          firstname: student.firstname,
          lastname: student.lastname,
          email: student.email,
          secondaryEmail: student.secondaryEmail,
          gender: student.gender,
          dateOfBirth: student.dateOfBirth,
        }))

        return {
          sessionId: session.id,
          subject: session.subject,
          level: session.level,
          timeSlot: session.timeSlot,
          students,
        }
      })

      return {
        courseId: course._id,
        academicYear: course.academicYear,
        sessions: sessionsWithStudents,
      }
    })

    return {
      success: true,
      data: coursesWithStudents ? serializeData(coursesWithStudents) : null,
      message: 'Cours et leurs étudiants récupérés avec succès',
    }
  } catch (error) {
    console.error('[GET_STUDENTS_BY_TEACHER]', error)
    throw new Error('Erreur lors de la récupération des étudiants du professeur')
  }
}

export async function updateTeacher(
  teacherId: string,
  teacherData: Partial<Teacher>,
): Promise<ApiResponse<SerializedValue>> {
  await getSessionServer()
  try {
    if (!teacherId || !isValidObjectId(teacherId)) {
      return {
        success: false,
        message: 'Id invalide',
        data: null,
      }
    }

    const updatedUser = await User.findOneAndUpdate(
      {
        _id: teacherId,
        role: 'teacher',
        isActive: true,
      },
      {$set: teacherData},
      {new: true},
    ).select('-password')

    if (!updatedUser) {
      return {
        success: false,
        message: 'Professeur non trouvé',
        data: null,
      }
    }

    return {
      success: true,
      data: updatedUser ? serializeData(updatedUser) : null,
      message: 'Professeur mis à jour avec succès',
    }
  } catch (error) {
    console.error('[UPDATE_TEACHER]', error)
    throw new Error('Erreur lors de la mise à jour du professeur')
  }
}

function validateRequiredFields(type: string, data: any): {isValid: boolean; message?: string} {
  const baseFields = ['email', 'firstname', 'lastname', 'password']
  const requiredFields = type === 'teacher' ? [...baseFields, 'subjects'] : [...baseFields, 'type']

  const missingFields = requiredFields.filter((field) => !data[field])

  return missingFields.length > 0
    ? {
        isValid: false,
        message: `Champs manquants: ${missingFields.join(', ')}`,
      }
    : {isValid: true}
}
