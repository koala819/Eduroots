'use server'

import {getServerSession} from 'next-auth'
import {revalidatePath} from 'next/cache'

import {ApiResponse} from '@/types/api'
import {BehaviorRecord, CreateBehaviorPayload, UpdateBehaviorPayload} from '@/types/behavior'
import {CourseSession} from '@/types/course'

import {Behavior} from '@/backend/models/behavior.model'
import {Course} from '@/backend/models/course.model'
import {GlobalStats} from '@/backend/models/global-stats.model'
import {StudentStats} from '@/backend/models/student-stats.model'
import {SerializedValue, serializeData} from '@/lib/serialization'
import {Types} from 'mongoose'

async function getSessionServer() {
  const session = await getServerSession()
  if (!session || !session.user) {
    throw new Error('Non authentifié')
  }
  return session
}

export async function createBehaviorRecord(
  data: CreateBehaviorPayload,
): Promise<ApiResponse<SerializedValue>> {
  await getSessionServer()

  try {
    const {course, sessionId, date, records} = data

    // Validation des données requises
    if (!course || !date || !Array.isArray(records)) {
      return {
        success: false,
        message: 'Données invalides',
        data: null,
      }
    }

    // Vérification si un enregistrement existe déjà pour ce cours à cette date
    const existingBehavior = await Behavior.findOne({
      course: new Types.ObjectId(course),
      date: {
        // On utilise $gte et $lt pour comparer la date sans l'heure
        $gte: new Date(new Date(date).setHours(0, 0, 0, 0)),
        $lt: new Date(new Date(date).setHours(23, 59, 59, 999)),
      },
    })

    if (existingBehavior) {
      return {
        success: false,
        message: 'Un enregistrement existe déjà pour ce cours à cette date',
        data: null,
      }
    }

    // Calcul des statistiques
    const totalStudents = records.length
    // Moyenne des ratings (sur 100)
    const behaviorRate = records.reduce((acc, record) => acc + record.rating, 0) / totalStudents

    // Mise à jour des stats pour chaque étudiant
    const updatePromises = records.map(async (record: any) => {
      const studentId = record.student

      // Récupérer tous les comportements de l'étudiant pour calculer la vraie moyenne
      const allBehaviors = await Behavior.find({
        'records.student': new Types.ObjectId(studentId),
      })

      // Calculer la vraie moyenne
      let totalRating = 0
      let totalSessions = 0

      allBehaviors.forEach((behavior) => {
        const studentRecord = behavior.records.find(
          (r: BehaviorRecord) => r.student.toString() === studentId.toString(),
        )
        if (studentRecord?.rating) {
          totalRating += studentRecord.rating
          totalSessions++
        }
      })

      // Ajouter le nouveau record
      totalRating += record.rating
      totalSessions++

      const behaviorAverage = totalRating / totalSessions

      await StudentStats.findOneAndUpdate(
        {
          userId: new Types.ObjectId(studentId),
        },
        {
          $set: {
            behaviorAverage,
            lastActivity: new Date(date),
            lastUpdate: new Date(),
          },
        },
        {
          upsert: true,
          new: true,
        },
      )
    })

    // Créer le behavior record
    const behavior = new Behavior({
      course: new Types.ObjectId(course),
      date: new Date(date),
      records: records.map((record: any) => ({
        student: new Types.ObjectId(record.student),
        rating: record.rating,
        comment: record.comment,
      })),
      stats: {
        behaviorRate,
        totalStudents,
        lastUpdate: new Date(),
      },
    })

    await behavior.save()

    // Mise à jour des stats du cours
    const courseDoc = await Course.findById(course)
    if (courseDoc) {
      // Trouver la session correspondante
      const sessionIndex = courseDoc.sessions.findIndex(
        (session: CourseSession) => session.id.toString() === sessionId.toString(),
      )

      if (sessionIndex !== -1) {
        // Calculer la moyenne de comportement pour cette session
        const allBehaviors = await Behavior.find({
          course: course,
          date: {
            $gte: new Date(new Date(date).setHours(0, 0, 0, 0)),
            $lt: new Date(new Date(date).setHours(23, 59, 59, 999)),
          },
        })

        const sessionBehaviorRate =
          allBehaviors.reduce((sum, beh) => sum + ((beh as any).stats?.behaviorRate || 0), 0) /
          allBehaviors.length

        // Mise à jour des stats de la session
        await Course.updateOne(
          {
            _id: course,
            'sessions._id': data.sessionId,
          },
          {
            $set: {
              'sessions.$.stats.averageBehavior': sessionBehaviorRate,
              'sessions.$.stats.lastUpdated': new Date(),
            },
          },
        )
      }
    }
    // Mise à jour des stats globales
    const globalStats = await GlobalStats.findOne({})
    if (globalStats) {
      // Calculer la nouvelle moyenne globale de comportement
      const allBehaviors = await Behavior.find({})
      const totalBehaviorRates = allBehaviors.reduce(
        (sum, beh) => sum + ((beh as any).stats?.behaviorRate || 0),
        0,
      )
      const averageBehaviorRate =
        allBehaviors.length > 0 ? totalBehaviorRates / allBehaviors.length : 0

      // Mise à jour des stats globales
      await GlobalStats.updateOne(
        {},
        {
          $set: {
            lastUpdate: new Date(),
            'statsData.behaviorAverage': averageBehaviorRate,
          },
        },
      )
    }

    // Attendre que toutes les mises à jour soient terminées
    await Promise.all(updatePromises)

    // Revalidate paths that might be affected
    revalidatePath('/courses/[courseId]/behavior')
    revalidatePath('/courses/[courseId]')

    return {
      success: true,
      message: 'Comportement et statistiques enregistrés avec succès',
      data: null,
    }
  } catch (error) {
    console.error('[CREATE_BEHAVIOR_RECORD]', error)
    throw new Error('Failed to create behavior record')
  }
}

export async function deleteBehaviorRecord(id: string): Promise<ApiResponse<SerializedValue>> {
  await getSessionServer()

  try {
    if (!id) {
      return {
        success: false,
        message: 'ID invalide',
        data: null,
      }
    }

    const deletedBehavior = await Behavior.findByIdAndDelete(id)

    if (!deletedBehavior) {
      return {
        success: false,
        message: 'Comportement non trouvé',
        data: null,
      }
    }

    // Revalidate paths that might be affected
    revalidatePath('/courses/[courseId]/behavior')
    revalidatePath('/courses/[courseId]')

    return {
      success: true,
      message: 'Comportement supprimé avec succès',
      data: null,
    }
  } catch (error) {
    console.error('[DELETE_BEHAVIOR_RECORD]', error)
    throw new Error('Failed to delete behavior record')
  }
}
export async function fetchBehaviorsByCourse(
  courseId: string,
): Promise<ApiResponse<SerializedValue>> {
  await getServerSession()
  try {
    const behaviors = await Behavior.find({course: courseId})

    return {
      success: true,
      data: behaviors ? serializeData(behaviors) : null,
      message: 'Cours supprimé avec succès',
    }
  } catch (error) {
    console.error('[FETCH_BEHAVIORS_BY_COURSE]', error)
    throw new Error('Failed to fetch behaviors')
  }
}

export async function getBehaviorByIdAndDate(
  courseId: string,
  date: string,
): Promise<ApiResponse<SerializedValue>> {
  await getSessionServer()
  try {
    const query: any = {course: courseId}

    if (date) {
      const searchDate = date.split('T')[0] // garde juste YYYY-MM-DD
      query.$expr = {
        $eq: [{$dateToString: {format: '%Y-%m-%d', date: '$date'}}, searchDate],
      }
    }

    const behaviors = date ? await Behavior.findOne(query) : await Behavior.find(query)

    return {
      success: true,
      data: behaviors ? serializeData(behaviors) : null,
      message: 'Comportement récupéré avec succès',
    }
  } catch (error) {
    console.error('[GET_BEHAVIOR_BY_ID]', error)
    throw new Error('Failed to fetch behavior by id')
  }
}

export async function getStudentBehaviorHistory(
  studentId: string,
): Promise<ApiResponse<SerializedValue>> {
  await getSessionServer()
  try {
    const behaviors = await Behavior.find({
      'records.student': studentId,
    })
      .populate('records.student')
      .lean()

    // Pour chaque behavior, trouvons le cours parent
    const behaviorsWithCourses = await Promise.all(
      behaviors.map(async (behavior) => {
        const parentCourse = await Course.findOne({
          'sessions._id': behavior.course,
        }).lean()

        if (parentCourse) {
          // Trouvons la session spécifique
          const session = parentCourse.sessions.find(
            (s: any) => s._id.toString() === behavior.course.toString(),
          )

          return {
            _id: behavior._id,
            id: behavior._id, // Ajout explicite de l'id
            date: behavior.date,
            records: behavior.records,
            stats: (behavior as any).stats,
            courseDetails: {
              id: parentCourse._id,
              academicYear: parentCourse.academicYear,
              session: session
                ? {
                    id: session._id,
                    subject: session.subject,
                    level: session.level,
                    timeSlot: session.timeSlot,
                  }
                : null,
            },
          }
        }
        return behavior
      }),
    )

    // console.log('Premier behavior avec détails:', {
    //   id: behaviorsWithCourses[0]?._id,
    //   courseId: behaviorsWithCourses[0]?.courseDetails?.id,
    //   sessionId: behaviorsWithCourses[0]?.courseDetails?.session?.id,
    //   date: behaviorsWithCourses[0]?.date,
    // })

    return {
      success: true,
      data: behaviorsWithCourses ? serializeData(behaviorsWithCourses) : null,
      message: "Comportement de l'étudiant récupéré avec succès",
    }
  } catch (error) {
    console.error('[GET_STUDENT_BEHAVIOR_HISTORY]', error)
    throw new Error('Erreur lors de la récupération du cours')
  }
}

export async function updateBehaviorRecord(
  data: UpdateBehaviorPayload,
): Promise<ApiResponse<SerializedValue>> {
  await getSessionServer()

  try {
    const {courseId, records, behaviorId, sessionId, date} = data

    if (!courseId || !Array.isArray(records) || !behaviorId || !sessionId || !date) {
      return {
        success: false,
        message: 'Données invalides',
        data: null,
      }
    }

    // Récupérer l'ancien enregistrement pour comparer les changements
    const oldBehavior = await Behavior.findById(behaviorId)

    if (!oldBehavior) {
      return {
        success: false,
        message: 'Comportement non trouvé',
        data: null,
      }
    }

    // Calcul des statistiques
    const totalStudents = records.length

    const behaviorRate = records.reduce((acc, record) => acc + record.rating, 0) / totalStudents

    // Créer une map des anciens ratings pour comparaison
    const oldRatingsMap = new Map(
      oldBehavior.records.map((record: any) => [record.student.toString(), record.rating]),
    )

    // Mise à jour des stats pour chaque étudiant dont la note a changé
    const updatePromises = records.map(async (record: any) => {
      const studentId = record.student
      const oldRating = oldRatingsMap.get(studentId.toString())

      // Ne mettre à jour que si la note a changé
      if (oldRating !== record.rating) {
        // Récupérer tous les comportements de l'étudiant pour recalculer la moyenne
        const allBehaviors = await Behavior.find({
          'records.student': new Types.ObjectId(studentId),
        })

        let totalRating = 0
        let totalSessions = 0

        allBehaviors.forEach((behavior) => {
          const studentRecord = behavior.records.find(
            (r: BehaviorRecord) => r.student.toString() === studentId.toString(),
          )
          if (studentRecord?.rating) {
            totalRating += studentRecord.rating
            totalSessions++
          }
        })

        const behaviorAverage = totalRating / totalSessions

        // Mise à jour directe avec findOneAndUpdate
        await StudentStats.findOneAndUpdate(
          {
            userId: new Types.ObjectId(studentId),
          },
          {
            $set: {
              behaviorAverage,
              lastActivity: new Date(),
              lastUpdate: new Date(),
            },
          },
          {
            upsert: true,
            new: true,
          },
        )
      }
    })

    // Mise à jour du behavior record
    const updatedBehavior = await Behavior.findByIdAndUpdate(behaviorId, {
      course: new Types.ObjectId(courseId),
      updatedAt: new Date(),
      records: records.map((record: any) => ({
        student: new Types.ObjectId(record.student),
        rating: record.rating,
        comment: record.comment,
      })),
      stats: {
        behaviorRate,
        totalStudents,
        lastUpdate: new Date(),
      },
    })

    if (!updatedBehavior) {
      return {
        success: false,
        message: 'Comportement non trouvé',
        data: null,
      }
    }

    // Mise à jour des stats du cours
    const courseDoc = await Course.findById(courseId)
    if (courseDoc) {
      const sessionIndex = courseDoc.sessions.findIndex(
        (session: CourseSession) => session.id.toString() === sessionId.toString(),
      )

      if (sessionIndex !== -1) {
        const allBehaviors = await Behavior.find({
          course: courseId,
          date: {
            $gte: new Date(new Date(date).setHours(0, 0, 0, 0)),
            $lt: new Date(new Date(date).setHours(23, 59, 59, 999)),
          },
        })

        const sessionBehaviorRate =
          allBehaviors.reduce((sum, beh) => sum + ((beh as any).stats?.behaviorRate || 0), 0) /
          allBehaviors.length

        // Mise à jour des stats de la session
        await Course.updateOne(
          {
            _id: courseId,
            'sessions._id': data.sessionId,
          },
          {
            $set: {
              'sessions.$.stats.averageBehavior': sessionBehaviorRate,
              'sessions.$.stats.lastUpdated': new Date(),
            },
          },
        )
      }
    }

    // Mise à jour des stats globales
    const globalStats = await GlobalStats.findOne({})
    if (globalStats) {
      // Recalculer la moyenne globale de comportement
      const allBehaviors = await Behavior.find({})
      const totalBehaviorRates = allBehaviors.reduce(
        (sum, beh) => sum + ((beh as any).stats?.behaviorRate || 0),
        0,
      )
      const averageBehaviorRate =
        allBehaviors.length > 0 ? totalBehaviorRates / allBehaviors.length : 0

      // Mettre à jour les stats globales
      globalStats.lastUpdate = new Date()
      if (globalStats.statsData) {
        globalStats.statsData.behaviorAverage = averageBehaviorRate
      }
      await globalStats.save()
    }

    // Attendre que toutes les mises à jour soient terminées
    await Promise.all(updatePromises)

    // Revalidate paths that might be affected
    revalidatePath('/courses/[courseId]/behavior')
    revalidatePath('/courses/[courseId]')

    return {
      success: true,
      message: 'Fiche de comportement et statistiques mises à jour avec succèss',
      data: null,
    }
  } catch (error) {
    console.error('[UPDATE_BEHAVIOR_RECORD]', error)
    throw new Error('Failed to update behavior record')
  }
}
