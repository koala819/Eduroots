import { NextRequest, NextResponse } from 'next/server'

import { CourseSession } from '@/types/course'
import { GenderEnum, Student } from '@/types/user'

import { Course } from '@/backend/models/course.model'
import { TeacherStats } from '@/backend/models/teacher-stats.model'
import { validateRequest } from '@/lib/api.utils'

function calculateAge(dateOfBirth: string): number {
  const today = new Date()
  const birthDate = new Date(dateOfBirth)
  let age = today.getFullYear() - birthDate.getFullYear()
  const month = today.getMonth() - birthDate.getMonth()
  if (month < 0 || (month === 0 && today.getDate() < birthDate.getDate())) {
    age--
  }
  return age
}

export async function POST(req: NextRequest) {
  const authError = await validateRequest(req)
  if (authError) return authError

  try {
    // console.log('Début de la récupération des cours...')

    // Modifier le populate pour s'adapter à la structure
    const courses = await Course.find()
      .populate({
        path: 'sessions.students',
        model: 'userNEW',
        select: 'gender dateOfBirth', // On sélectionne uniquement les champs nécessaires
      })
      .populate({
        path: 'teacher',
        model: 'userNEW',
      })
      .lean() // Pour de meilleures performances

    // console.log(`Nombre de cours trouvés: ${courses.length}`)

    const teacherStats = new Map()

    courses.forEach((course) => {
      // Gérer le cas où teacher est un tableau
      const teacherArray = Array.isArray(course.teacher)
        ? course.teacher
        : [course.teacher]

      teacherArray.forEach((teacher: any) => {
        if (!teacher || !teacher._id) {
          //   console.log('Teacher invalide trouvé:', teacher)
          return
        }

        const teacherId = teacher._id.toString()

        // Initialiser les stats si nécessaire
        if (!teacherStats.has(teacherId)) {
          teacherStats.set(teacherId, {
            totalStudents: 0,
            genderDistribution: {
              counts: {
                [GenderEnum.Masculin]: 0,
                [GenderEnum.Feminin]: 0,
                undefined: 0,
              },
              percentages: {
                [GenderEnum.Masculin]: '0',
                [GenderEnum.Feminin]: '0',
                undefined: '0',
              },
            },
            totalAge: 0,
            validAgeCount: 0,
          })
        }

        const stats = teacherStats.get(teacherId)
        stats.courseCount++

        // Traiter les sessions
        course.sessions?.forEach((session: CourseSession) => {
          if (!session.students) return

          const students = Array.isArray(session.students)
            ? session.students
            : [session.students]

          students.forEach((student: Student) => {
            if (!student) return

            if (student.gender) {
              stats.genderDistribution[student.gender]++
            }

            if (student.dateOfBirth) {
              try {
                const age = calculateAge(student.dateOfBirth)
                stats.totalAge += age
                stats.validAgeCount++
              } catch (e) {
                console.error('Erreur calcul age:', e)
              }
            }
          })

          stats.studentCount += students.length
        })
      })
    })

    // console.log('Stats calculées pour', teacherStats.size, 'professeurs')

    // Mise à jour des stats dans la base
    const updatePromises = Array.from(teacherStats.entries()).map(
      async ([teacherId, stats]) => {
        const statsData = {
          studentCount: stats.studentCount,
          averageAge:
            stats.validAgeCount > 0 ? stats.totalAge / stats.validAgeCount : 0,
          genderDistribution: stats.genderDistribution,
          courseCount: stats.courseCount,
          lastUpdate: new Date(),
        }

        // console.log(`Mise à jour stats pour prof ${teacherId}:`, statsData)

        return TeacherStats.findOneAndUpdate(
          {
            userId: teacherId,
            type: 'teacher',
          },
          {
            $set: {
              statsData,
              lastUpdate: new Date(),
            },
          },
          {
            upsert: true,
            new: true,
          },
        )
      },
    )

    const results = await Promise.all(updatePromises)
    // console.log(`${results.length} stats mises à jour avec succès`)

    return NextResponse.json({
      status: 200,
      message: 'Stats calculated and updated successfully',
      count: results.length,
    })
  } catch (error: any) {
    console.error('[CALCULATE_STATS]', error)
    return NextResponse.json({
      status: 500,
      message: error.message || 'Internal Error',
    })
  }
}
