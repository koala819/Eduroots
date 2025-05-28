'use server'

import {getServerSession} from 'next-auth'

import {ApiResponse} from '@/types/api'
import {CreateGradeDTO, PopulatedGrade, UpdateGradeDTO} from '@/types/grade'
import {GradeDocument} from '@/types/mongoose'

import {Grade as GradeModel} from '@/backend/models/grade.model'
import {calculateAndUpdateGradeStats, calculateGradeStats} from '@/lib/api.utils'
import {SerializedValue, serializeData} from '@/lib/serialization'

async function getSessionServer() {
  const session = await getServerSession()
  if (!session || !session.user) {
    throw new Error('Non authentifié')
  }
  return session
}

export async function getTeacherGrades(teacherId: string): Promise<ApiResponse<SerializedValue>> {
  await getSessionServer()
  try {
    const grades = await GradeModel.find<GradeDocument>({})
      .populate({
        path: 'course',
        match: {teacher: teacherId},
        model: 'courseNEW',
      })
      .populate('records.student')
      .lean()

    // Filtrer les grades qui correspondent au teacher
    const teacherGrades = grades.filter((grade) => grade.course)

    const populatedGrades = teacherGrades.map((grade) => ({
      id: grade._id.toString(),
      isDraft: grade.isDraft,
      sessionId: grade.sessionId,
      course: {
        ...grade.course,
        id: (grade.course as any)._id.toString(),
      },
      date: grade.date,
      type: grade.type,
      stats: grade.stats,
      records: grade.records.map((record: any) => ({
        value: record.value,
        isAbsent: record.isAbsent,
        comment: record.comment,
        student: {
          ...record.student,
          id: record.student._id.toString(),
        },
      })),
      createdAt: grade.createdAt,
      updatedAt: grade.updatedAt,
      isActive: grade.isActive,
    }))

    return {
      success: true,
      data: populatedGrades ? serializeData(populatedGrades) : null,
      message: 'Cours récupéré avec succès',
    }

    // return NextResponse.json({
    //   status: 200,
    //   data: populatedGrades,
    // })
  } catch (error) {
    console.error('[GET_TEACHER_GRADES]', error)
    throw new Error('Erreur lors de la récupération des grades du prof')
  }
}

export async function createGradeRecord(
  data: CreateGradeDTO,
): Promise<ApiResponse<SerializedValue>> {
  await getSessionServer()
  try {
    const stats = calculateGradeStats(data.records)

    // Création du document avec typage strict
    // Créer et sauvegarder le document avec les stats en une seule opération
    const gradeRecord = new GradeModel({
      course: data.course,
      sessionId: data.sessionId,
      date: new Date(data.date),
      type: data.type,
      isDraft: data.isDraft,
      records: data.records,
      stats: stats,
    })

    await gradeRecord.save()
    return {
      success: true,
      message: 'Note enregistrée avec succès',
      data: null,
    }
  } catch (error) {
    console.error('[CREATE_GRADE_RECORD]', error)
    throw new Error('Erreur lors de la création du grade')
  }
}

export async function refreshGradeData(
  id?: string,
  fields?: string,
): Promise<ApiResponse<SerializedValue>> {
  await getSessionServer()
  try {
    if (id && id !== 'grade') {
      const grade = await GradeModel.findById(id)
        .populate({
          path: 'course',
          model: 'courseNEW',
        })
        .populate({
          path: 'records.student',
          model: 'userNEW',
        })
        .lean()

      if (!grade) {
        return {
          success: false,
          message: 'Aucune Note non trouvée',
          data: null,
        }
      }

      // Si on demande uniquement les stats
      if (fields === 'stats') {
        return {
          success: true,
          message: 'Statistiques récupérées avec succès',
          data: grade.stats ? serializeData(grade.stats) : null,
        }
      }

      // Transformation en PopulatedGrade avec typage strict
      const formattedGrade: PopulatedGrade = {
        id: grade._id.toString(),
        sessionId: grade.sessionId,
        course: {
          ...grade.course,
          id: (grade.course as any)._id?.toString(),
        },
        date: grade.date,
        type: grade.type,
        isDraft: grade.isDraft,
        records: grade.records.map((record: any) => ({
          value: record.value,
          isAbsent: record.isAbsent,
          comment: record.comment,
          student: {
            ...record.student,
            id: record.student?._id?.toString(),
          },
        })),
        stats: grade.stats,
        createdAt: grade.createdAt,
        updatedAt: grade.updatedAt,
        isActive: grade.isActive,
      }

      return {
        success: true,
        data: formattedGrade ? serializeData(formattedGrade) : null,
        message: 'Notes récupérées avec succès',
      }
    }

    // Si c'est une requête pour toutes les notes
    const grades = await GradeModel.find()
      .populate({
        path: 'course',
        model: 'courseNEW',
      })
      .populate({
        path: 'records.student',
        model: 'userNEW',
      })
      .lean()

    const formattedGrades: PopulatedGrade[] = grades.map((grade) => ({
      id: grade._id.toString(),
      sessionId: grade.sessionId,
      course: {
        ...grade.course,
        id: (grade.course as any)._id?.toString(),
      },
      date: grade.date,
      type: grade.type,
      isDraft: grade.isDraft,
      records: grade.records.map((record: any) => ({
        value: record.value,
        isAbsent: record.isAbsent,
        comment: record.comment,
        student: {
          ...record.student,
          id: record.student?._id?.toString(),
        },
      })),
      stats: grade.stats,
      createdAt: grade.createdAt,
      updatedAt: grade.updatedAt,
      isActive: grade.isActive,
    }))

    return {
      success: true,
      data: formattedGrades ? serializeData(formattedGrades) : null,
      message: 'Notes récupérées avec succès',
    }
  } catch (error) {
    console.error('[REFRESH_GRADE_DATA]', error)
    throw new Error('Erreur de la mise à jour des grades')
  }
}

export async function updateGradeRecord(
  gradeId: string,
  data: UpdateGradeDTO,
): Promise<ApiResponse<SerializedValue>> {
  await getSessionServer()
  try {
    // Validation des données reçues
    if (!data.date || !data.type || !Array.isArray(data.records)) {
      return {
        success: false,
        message: 'Données invalides',
        data: null,
      }
    }

    // Mise à jour de la note
    const updatedGrade = await GradeModel.findByIdAndUpdate(
      gradeId,
      {
        date: data.date,
        type: data.type,
        isDraft: data.isDraft,
        records: data.records,
        updatedAt: new Date(),
      },
      {
        new: true, // Retourne le document mis à jour
        runValidators: true, // Exécute les validateurs du schéma
      },
    )

    if (!updatedGrade) {
      return {
        success: false,
        message: 'Note non trouvée',
        data: null,
      }
    }

    // Calculer les stats
    const gradeWithStats = await calculateAndUpdateGradeStats(updatedGrade)

    if (!gradeWithStats) {
      return {
        success: false,
        message: 'Note non trouvée',
        data: null,
      }
    }

    // Maintenant on peut faire le populate et lean
    const populatedGrade = await GradeModel.findById(gradeWithStats._id)
      .populate({
        path: 'course',
        model: 'courseNEW',
      })
      .populate('records.student')
      .lean()

    if (!populatedGrade) {
      return {
        success: false,
        message: 'Note non trouvée',
        data: null,
      }
    }

    // Formatage de la réponse
    const formattedGrade = {
      id: updatedGrade._id.toString(),
      isDraft: updatedGrade.isDraft,
      course: {
        ...updatedGrade.course,
        id: (updatedGrade.course as any)._id.toString(),
      },
      date: updatedGrade.date,
      type: updatedGrade.type,
      records: updatedGrade.records.map((record: any) => ({
        value: record.value,
        isAbsent: record.isAbsent,
        comment: record.comment,
        student: {
          ...record.student,
          id: record.student._id.toString(),
        },
      })),
      stats: populatedGrade.stats,
      createdAt: updatedGrade.createdAt,
      updatedAt: updatedGrade.updatedAt,
      isActive: updatedGrade.isActive,
    }

    return {
      success: true,
      data: formattedGrade ? serializeData(formattedGrade) : null,
      message: 'Note mise à jour avec succès',
    }
  } catch (error) {
    console.error('[UPDATE_GRADE_RECORD]', error)
    throw new Error('Erreur lors de la mise à jour du grade')
  }
}
