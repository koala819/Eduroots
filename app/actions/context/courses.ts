'use server'

import {getServerSession} from 'next-auth'
import {revalidatePath} from 'next/cache'

import {ApiResponse} from '@/types/api'
import {CourseSession, TimeSlot} from '@/types/course'
import {GradeRecord} from '@/types/grade'
import {CourseDocument, GradeDocument} from '@/types/mongoose'

import {Course} from '@/backend/models/course.model'
import {Grade} from '@/backend/models/grade.model'
import {SerializedValue, serializeData} from '@/lib/serialization'
import {Types} from 'mongoose'

async function getSessionServer() {
  const session = await getServerSession()
  if (!session || !session.user) {
    throw new Error('Non authentifié')
  }
  return session
}

export async function addStudentToCourse(
  courseId: string,
  studentId: string,
  timeSlot: {
    dayOfWeek: string
    startTime: string
    endTime: string
    subject: string
  },
): Promise<ApiResponse<SerializedValue>> {
  await getSessionServer()

  try {
    const {dayOfWeek, startTime, endTime, subject} = timeSlot

    // Utiliser findOneAndUpdate au lieu de findById + save
    const updatedCourse = await Course.findOneAndUpdate(
      {
        _id: courseId,
        'sessions.timeSlot.dayOfWeek': dayOfWeek,
        'sessions.timeSlot.startTime': startTime,
        'sessions.timeSlot.endTime': endTime,
        'sessions.subject': subject,
      },
      {
        $addToSet: {
          'sessions.$.students': new Types.ObjectId(studentId),
        },
      },
      {
        new: true,
        runValidators: true,
      },
    )

    if (!updatedCourse) {
      // Add this line to revalidate affected paths
      revalidatePath(`/courses/${courseId}`)

      return {
        success: false,
        message: 'Cours ou session non trouvé',
        data: null,
      }
    }

    // Add this line to revalidate affected paths
    revalidatePath(`/courses/${courseId}`)

    return {
      success: true,
      data: updatedCourse ? serializeData(updatedCourse) : null,
      message: 'Étudiant ajouté avec succès',
    }
  } catch (error) {
    console.error('[ADD_STUDENT_TO_COURSE]', error)
    throw new Error('Failed to add student to course')
  }
}

export async function checkTimeSlotOverlap(
  timeSlot: TimeSlot,
  userId: string,
  excludeCourseId?: string,
): Promise<ApiResponse<SerializedValue>> {
  await getSessionServer()

  try {
    // 1. Trouvons tous les cours du prof pour ce jour
    const teacherCoursesQuery = {
      _id: {$ne: excludeCourseId},
      isActive: true,
      teacher: {$in: [userId]},
      'sessions.timeSlot.dayOfWeek': timeSlot.dayOfWeek,
    }

    const teacherCourses = await Course.find(teacherCoursesQuery)

    // 2. Vérifions les chevauchements
    const hasOverlap = false
    const newStartTime = timeToMinutes(timeSlot.startTime)
    const newEndTime = timeToMinutes(timeSlot.endTime)

    for (const course of teacherCourses) {
      const existingStartTime = timeToMinutes(course.sessions[0].timeSlot.startTime)
      const existingEndTime = timeToMinutes(course.sessions[0].timeSlot.endTime)

      // Il y a chevauchement si :
      // le nouveau cours commence avant la fin d'un cours existant
      // ET se termine après le début d'un cours existant
      if (newStartTime < existingEndTime && newEndTime > existingStartTime) {
        // console.log('Chevauchement détecté avec le cours:', {
        //   courseId: course._id,
        //   existingTime: `${course.sessions[0].timeSlot.startTime}-${course.sessions[0].timeSlot.endTime}`,
        //   newTime: `${timeSlot.startTime}-${timeSlot.endTime}`,
        // })
        return {
          success: false,
          message: 'Ce crédneau horaire est déjà occupé',
          data: {hasOverlap: true},
        }
      }
    }

    return {
      success: true,
      message: 'Aucun chevauchement rencontré',
      data: null,
    }
  } catch (error) {
    console.error('[CHECK_TIME_SLOT_OVERLAPS]', error)
    throw new Error('Failed to check time slot overlaps')
  }
}

export async function createCourse(
  courseData: Omit<CourseDocument, 'id' | '_id' | 'createdAt' | 'updatedAt'>,
): Promise<ApiResponse<SerializedValue>> {
  await getSessionServer()

  try {
    // Vérification des créneaux avant création
    const course = new Course(courseData)
    await Course.create(course)

    return {
      success: true,
      message: 'Cours ajouté avec succès',
      data: null,
    }
  } catch (error) {
    console.error('[CREATE_COURSE]', error)
    throw new Error('Failed to create course')
  }
}

export async function deleteCourse(courseId: string): Promise<ApiResponse<SerializedValue>> {
  await getSessionServer()

  try {
    const deletedCourse = await Course.findByIdAndDelete(courseId)

    if (!deletedCourse) {
      return {
        success: false,
        message: 'Cours non trouvé',
        data: null,
      }
    }

    return {
      success: true,
      message: 'Cours supprimé avec succès',
      data: null,
    }
  } catch (error) {
    console.error('[DELETE_COURSE]', error)
    throw new Error('Failed to delete course')
  }
}

export async function getCourseById(
  id: string,
  fields?: string,
): Promise<ApiResponse<SerializedValue>> {
  await getSessionServer()

  try {
    const course = await Course.findOne({'sessions._id': id})
      .select({
        teacher: 1,
        'sessions.$': 1,
      })
      .populate({
        path: 'sessions.students',
        model: 'userNEW',
      })
      .populate({
        path: 'teacher',
        model: 'userNEW',
      })

    if (!course) {
      return {
        success: false,
        message: 'Cours non trouvé',
        data: null,
      }
    }

    // If stats are requested, calculate and return them
    if (fields === 'stats') {
      const stats = await calculateCourseStats(id)
      return {
        success: true,
        data: stats ? serializeData(stats) : null,
        message: 'Cours récupéré avec succès',
      }
    }

    return {
      success: true,
      data: course ? serializeData(course) : null,
      message: 'Cours récupéré avec succès',
    }
  } catch (error) {
    console.error('[GET_COURSE_BY_ID]', error)
    throw new Error('Failed to fetch course by id')
  }
}

export async function getStudentCourses(studentId: string): Promise<ApiResponse<SerializedValue>> {
  await getSessionServer()

  try {
    // Convertir le studentId en ObjectId
    const studentObjectId = new Types.ObjectId(studentId)

    const courses = await Course.find({
      'sessions.students': studentObjectId,
      isActive: true,
    })
      .populate({
        path: 'teacher',
        select: 'firstname lastname email subjects',
      })
      .populate({
        path: 'sessions.students',
        model: 'userNEW', // Utiliser le bon nom de modèle
        select: 'firstname lastname email', // Sélectionner uniquement les champs nécessaires
      })
      .lean() // Pour de meilleures performances

    if (!courses || courses.length === 0) {
      return {
        success: false,
        message: 'Aucun cours trouvé pour cet étudiant',
        data: null,
      }
    }

    return {
      success: true,
      data: courses ? serializeData(courses) : null,
      message: 'Cours récupéré avec succès',
    }
  } catch (error) {
    console.error('[GET_STUDENT_COURSES]', error)
    throw new Error('Failed to get student courses')
  }
}

export async function getTeacherCourses(teacherId: string): Promise<ApiResponse<SerializedValue>> {
  await getSessionServer()

  try {
    const courses = await Course.find({
      teacher: teacherId,
      isActive: true,
    })
      .populate('teacher')
      .populate({
        path: 'sessions.students',
        model: 'userNEW',
      })

    return {
      success: true,
      data: courses ? serializeData(courses) : null,
      message: 'Cours du prof récupéré avec succès',
    }
  } catch (error) {
    console.error('[GET_TEACHER_COURSES]', error)
    throw new Error('Failed to get teacher courses')
  }
}

export async function removeStudentFromCourse(
  courseId: string,
  studentId: string,
): Promise<ApiResponse<SerializedValue>> {
  await getSessionServer()
  try {
    const course = await Course.findById(courseId)

    if (!course) {
      return {
        success: false,
        message: 'Cours non trouvé',
        data: null,
      }
    }

    const studentObjectId = new Types.ObjectId(studentId)

    // Retirer l'étudiant de toutes les sessions
    course.sessions.forEach((session: any) => {
      const studentIndex = session.students.findIndex((sid: any) => sid.equals(studentObjectId))
      if (studentIndex !== -1) {
        session.students.splice(studentIndex, 1)
      }
    })

    await course.save()
    // await course.updateStats()
    return {
      success: true,
      message: 'Session supprimé avec success',
      data: null,
    }
  } catch (error) {
    console.error('[REMOVE_STUDENT_FROM_COURSE]', error)
    throw new Error('Failed to remove student from course')
  }
}

export async function updateCourse(
  courseId: string,
  courseData: Omit<CourseDocument, 'students' | 'stats'>,
  sameStudents: boolean,
): Promise<ApiResponse<SerializedValue>> {
  await getSessionServer()

  try {
    const sessionIds = courseData.sessions.map((session: CourseSession) => session.id)
    // console.log('🚀 ~ sessionIds:', sessionIds)
    // console.log(
    //   '🚀 ~ classroom Number:',
    //   courseData.sessions[0].timeSlot.classroomNumber,
    // )

    if (!courseData) {
      return {
        success: false,
        message: 'Données de cours invalides',
        data: null,
      }
    }
    //todo teacher with courseID ???
    const existingCourse = await Course.findOne({
      teacher: courseId,
    })

    if (!existingCourse) {
      return {
        success: false,
        message: 'Cours non trouvé',
        data: null,
      }
    }

    // Trouver l'index de la session à mettre à jour
    // const sessionIndex = existingCourse.sessions.findIndex(
    //   (session: CourseSession) => {
    //     console.log('🚀 ~ session:', session.id)
    //     return session.id === params.id
    //   },
    // )
    // console.log('🚀 ~ sessionIndex:', sessionIndex)

    // if (sessionIndex === -1) {
    //   return NextResponse.json({
    //     status: 404,
    //     statusText: 'Session non trouvée dans le cours',
    //   })
    // }

    // Mise à jour des sessions existantes
    existingCourse.sessions = existingCourse.sessions.map((session: any) => {
      if (sessionIds.includes(session.id)) {
        const newSessionData = courseData.sessions.find((s: any) => s.id === session.id)
        return {
          ...session,
          timeSlot: {...session.timeSlot, ...(newSessionData?.timeSlot || {})},
          subject: newSessionData?.subject,
          level: newSessionData?.level,
          sameStudents: sameStudents,
          stats: {...session.stats, lastUpdated: new Date()},
        }
      }
      return session
    })

    // // Met à jour la session spécifique avec les nouvelles données
    // existingCourse.sessions[sessionIndex] = {
    //   ...existingCourse.sessions[sessionIndex],
    //   timeSlot: {
    //     ...existingCourse.sessions[sessionIndex].timeSlot,
    //     ...courseData.timeSlot,
    //   },
    //   subject: courseData.subject,
    //   level: courseData.level,
    //   students: existingCourse.sessions[sessionIndex].students,
    //   sameStudents: sameStudents,
    //   stats: {
    //     ...existingCourse.sessions[sessionIndex].stats,
    //     lastUpdated: new Date(),
    //   },
    // }

    // Sauvegarde les modifications
    const savedCourse = await existingCourse.save()

    return {
      success: true,
      data: savedCourse ? serializeData(savedCourse) : null,
      message: 'Cours mis à jour avec succès',
    }
  } catch (error) {
    console.error('[UPDATE_COURSE]', error)
    throw new Error('Failed to update course')
  }
}

export async function updateCourses(
  role: string,
  userId: string,
): Promise<ApiResponse<SerializedValue>> {
  await getSessionServer()

  try {
    let courses
    // if (role === 'teacher') {
    //   courses = await Course.find({ teacher: userId, isActive: true })
    //     .populate('teacher')
    //     .populate({
    //       path: 'sessions.students',
    //       model: 'userNEW',
    //     })
    // } else
    if (['admin', 'bureau'].includes(role)) {
      courses = await Course.find().populate('teacher').populate({
        path: 'sessions.students',
        model: 'userNEW',
      })
    } else {
      courses = await Course.find({teacher: userId, isActive: true}).populate('teacher').populate({
        path: 'sessions.students',
        model: 'userNEW',
      })
      // return {
      //   success: false,
      //   message: "Vous n'avez pas les droits nécessaires",
      //   data: null,
      // }
    }

    return {
      success: true,
      data: courses ? serializeData(courses) : null,
      message: 'Cours récupéré avec succès',
    }
  } catch (error) {
    console.error('[UPDATE_COURSES]', error)
    throw new Error('Failed to update courses')
  }
}

export async function updateCourseSession(
  courseId: string,
  sessionIndex: number,
  sessionData: Partial<CourseSession>,
  role: string,
  userId: string,
): Promise<ApiResponse<SerializedValue>> {
  await getSessionServer()

  try {
    const course = await Course.findById(courseId)

    if (!course) {
      return {
        success: false,
        message: 'Cours non trouvé',
        data: null,
      }
    }

    // Vérifier les permissions
    if (role === 'teacher' && !course.teacher.includes(userId)) {
      return {
        success: false,
        message: "Vous n'avez pas les droits pour modifier ce cours",
        data: null,
      }
    }

    if (!['admin', 'bureau', 'teacher'].includes(role)) {
      return {
        success: false,
        message: "Vous n'avez pas les droits nécessaires",
        data: null,
      }
    }

    if (!course.sessions[sessionIndex]) {
      return {
        success: false,
        message: 'Session non trouvé',
        data: null,
      }
    }

    // Mettre à jour la session
    Object.assign(course.sessions[sessionIndex], sessionData)
    await course.save()

    const updatedCourse = await Course.findById(courseId).populate('teacher').populate({
      path: 'sessions.students',
      model: 'userNEW',
    })

    return {
      success: true,
      data: updatedCourse ? serializeData(updatedCourse) : null,
      message: 'Cours mis à jour avec succès',
    }
  } catch (error) {
    console.error('[UPDATE_COURSE_SESSION]', error)
    throw new Error('Failed to update course session')
  }
}

async function calculateCourseStats(courseId: string) {
  // Fetch all grades associated with this course
  const grades = await Grade.find({course: courseId}).populate('records').lean()

  if (!grades || grades.length === 0) {
    return {
      averageGrade: 0,
      totalAbsences: 0,
      participationRate: 0,
    }
  }

  // Calculate statistics
  let totalGrades = 0
  let totalStudents = 0
  let totalAbsences = 0
  let totalParticipation = 0

  grades.forEach((grade: GradeDocument) => {
    grade.records.forEach((record: GradeRecord) => {
      if (record.isAbsent) {
        totalAbsences++
      } else {
        totalGrades += record.value
        totalParticipation++
      }
      totalStudents++
    })
  })

  return {
    averageGrade: totalParticipation > 0 ? totalGrades / totalParticipation : 0,
    totalAbsences,
    participationRate: totalStudents > 0 ? (totalParticipation / totalStudents) * 100 : 0,
  }
}

function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number)
  return hours * 60 + minutes
}
