'use server'

import {getServerSession} from 'next-auth'

import {ApiResponse} from '@/types/api'
import {Student} from '@/types/user'

import {Course} from '@/backend/models/course.model'
import {User} from '@/backend/models/user.model'
import {SerializedValue, serializeData} from '@/lib/serialization'
import {isValidObjectId} from 'mongoose'

async function getSessionServer() {
  const session = await getServerSession()
  if (!session || !session.user) {
    throw new Error('Non authentifié')
  }
  return session
}

export async function createStudent(
  studentData: Omit<Student, 'id' | '_id' | 'createdAt' | 'updatedAt'>,
): Promise<ApiResponse<SerializedValue>> {
  await getSessionServer()

  try {
    const validation = validateRequiredFields('student', studentData)

    if (!validation.isValid) {
      return {
        success: false,
        message: validation.message as string,
        data: null,
      }
    }

    const newUser = await User.create(studentData)
    if (!newUser) {
      return {
        success: false,
        message: 'Etudiant non créé',
        data: null,
      }
    }
    return {
      success: true,
      data: serializeData({id: newUser._id}),
      message: 'Etudiant créé avec succès',
    }
  } catch (error) {
    console.error('[CREATE_STUDENT]', error)
    throw new Error("Erreur lors de la création de l'étudiant")
  }
}

export async function deleteStudent(studentId: string): Promise<ApiResponse<SerializedValue>> {
  await getSessionServer()
  try {
    if (!studentId || !isValidObjectId(studentId)) {
      return {
        success: false,
        message: 'Id invalide',
        data: null,
      }
    }

    const deletedUser = await User.findOneAndUpdate(
      {
        _id: studentId,
        role: 'student',
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
        message: 'Etudiant non trouvé',
        data: null,
      }
    }

    return {
      success: true,
      data: null,
      message: 'Etudiant supprimé avec succès',
    }
  } catch (error) {
    console.error('[DELETE_STUDENT]', error)
    throw new Error("Erreur lors de la suppression de l'étudiant")
  }
}

export async function getAllStudents(): Promise<ApiResponse<SerializedValue>> {
  await getSessionServer()
  try {
    const users = await User.find({
      isActive: true,
      role: 'student',
    })
      .select('-password')
      .sort({firstname: 1, lastname: 1})

    if (!users) {
      return {
        success: false,
        message: 'Etudiants non trouvés',
        data: null,
      }
    }
    return {
      success: true,
      data: users ? serializeData(users) : null,
      message: 'Tous les Etudiants récupérés avec succès',
    }
  } catch (error) {
    console.error('[GET_ALL_STUDENTS]', error)
    throw new Error('Erreur lors de la récupération des étudiants')
  }
}

export async function getOneStudent(studentId: string): Promise<ApiResponse<SerializedValue>> {
  await getSessionServer()
  try {
    if (!isValidObjectId(studentId)) {
      return {
        success: false,
        message: 'Id invalide',
        data: null,
      }
    }

    const user = await User.findOne({
      isActive: true,
      role: 'student',
      _id: studentId,
    }).select('-password')

    if (!user) {
      return {
        success: false,
        message: 'Etudiant non trouvé',
        data: null,
      }
    }
    return {
      success: true,
      data: user ? serializeData(user) : null,
      message: 'Etudiant récupéré avec succès',
    }
  } catch (error) {
    console.error('[GET_ONE_STUDENT]', error)
    throw new Error("Erreur lors de la récupération de l'étudiant")
  }
}

export async function getTeachersForStudent(
  studentId: string,
): Promise<ApiResponse<SerializedValue>> {
  try {
    const studentCourses = await Course.find({
      'sessions.students': studentId,
      isActive: true,
    })

    if (!studentCourses || studentCourses.length === 0) {
      return {
        success: false,
        message: 'Aucun cours trouvé pour cet étudiant',
        data: null,
      }
    }

    // Extraire les IDs des professeurs
    const teacherIds = studentCourses.flatMap((course) => course.teacher)

    if (teacherIds.length === 0) {
      return {
        success: false,
        message: 'Aucun professeur trouvé pour cet étudiant',
        data: null,
      }
    }

    const teachers = await User.find({
      _id: {$in: teacherIds},
      role: 'teacher',
      isActive: true,
    }).select('-password')

    if (!teachers || teachers.length === 0) {
      return {
        success: false,
        message: 'Aucun professeur trouvé',
        data: null,
      }
    }

    return {
      success: true,
      data: teachers ? serializeData(teachers) : null,
      message: 'Professeur récupéré avec succès',
    }
  } catch (error) {
    console.error('[GET_TEACHERS_FOR_STUDENT]', error)
    return {
      success: false,
      message: 'Erreur lors de la récupération des professeurs',
      data: null,
    }
  }
}

export async function updateStudent(
  studentId: string,
  studentData: Partial<Student>,
): Promise<ApiResponse<SerializedValue>> {
  await getSessionServer()
  try {
    if (!studentId || !isValidObjectId(studentId)) {
      return {
        success: false,
        message: 'Id invalide',
        data: null,
      }
    }

    const updatedUser = await User.findOneAndUpdate(
      {
        _id: studentId,
        role: 'student',
        isActive: true,
      },
      {$set: studentData},
      {new: true},
    ).select('-password')

    if (!updatedUser) {
      return {
        success: false,
        message: 'Etudiant non trouvé',
        data: null,
      }
    }

    return {
      success: true,
      data: updatedUser ? serializeData(updatedUser) : null,
      message: 'Etudiant mis à jour avec succès',
    }
  } catch (error) {
    console.error('[UPDATE_STUDENT]', error)
    throw new Error("Erreur lors de la mise à jour de l'étudiant")
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
