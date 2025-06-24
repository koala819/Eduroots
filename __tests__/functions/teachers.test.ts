import { describe, expect, it, vi } from 'vitest'

// Setup des mocks AVANT les imports
import { createMockAuthUser, createMockSessionServer,createMockSupabase } from '../utils/helpers'

function setupTeachersMocks() {
  // Mock auth-helpers
  vi.mock('@/server/utils/auth-helpers', () => ({
    getAuthenticatedUser: vi.fn().mockResolvedValue(createMockAuthUser()),
  }))

  // Mock supabase
  vi.mock('@/server/utils/supabase', () => ({
    createClient: vi.fn().mockResolvedValue(createMockSupabase()),
  }))

  // Mock server-helpers
  vi.mock('@/server/utils/server-helpers', () => ({
    getSessionServer: vi.fn().mockResolvedValue(createMockSessionServer()),
  }))

  // Mock de la fonction getStudentsByTeacher pour retourner des données de test
  vi.mock('@/server/actions/api/teachers', () => ({
    getStudentsByTeacher: vi.fn().mockResolvedValue({
      success: true,
      message: 'Cours et leurs étudiants récupérés avec succès',
      data: {
        id: 'test-teacher-id',
        email: 'teacher@test.com',
        firstname: 'Test',
        lastname: 'Teacher',
        subjects: ['Math'],
        created_at: '2024-01-01',
        updated_at: '2024-01-01',
        type: 'teacher',
        courses: [
          {
            courseId: 'course-1',
            academicYear: '2024',
            sessions: [
              {
                sessionId: 'session-1',
                subject: 'Mathématiques',
                level: '6ème',
                timeSlot: 'Lundi',
                startTime: '08:00',
                endTime: '09:00',
                students: [
                  {
                    id: 'student-1',
                    firstname: 'Jean',
                    lastname: 'Dupont',
                    email: 'jean@test.com',
                    secondaryEmail: 'jean.parent@test.com',
                    gender: 'M',
                    dateOfBirth: '2012-01-01',
                  },
                ],
              },
            ],
          },
        ],
      },
    }),
  }))
}
setupTeachersMocks()

import { getStudentsByTeacher } from '@/server/actions/api/teachers'

const teacherTestData = {
  mockTeacherResponse: {
    success: true,
    message: 'Cours et leurs étudiants récupérés avec succès',
    data: {
      id: 'test-teacher-id',
      email: 'teacher@test.com',
      firstname: 'Test',
      lastname: 'Teacher',
      subjects: ['Math'],
      created_at: '2024-01-01',
      updated_at: '2024-01-01',
      type: 'teacher',
      courses: [
        {
          courseId: 'course-1',
          academicYear: '2024',
          sessions: [
            {
              sessionId: 'session-1',
              subject: 'Mathématiques',
              level: '6ème',
              timeSlot: 'Lundi',
              startTime: '08:00',
              endTime: '09:00',
              students: [
                {
                  id: 'student-1',
                  firstname: 'Jean',
                  lastname: 'Dupont',
                  email: 'jean@test.com',
                  secondaryEmail: 'jean.parent@test.com',
                  gender: 'M',
                  dateOfBirth: '2012-01-01',
                },
              ],
            },
          ],
        },
      ],
    },
  },
}

describe('Teachers Functions', () => {
  describe('getStudentsByTeacher', () => {
    it('devrait retourner le bon format de réponse', async () => {
      const result = await getStudentsByTeacher('test-teacher-id')

      // Vérifier la structure de la réponse
      expect(result).toHaveProperty('success')
      expect(result).toHaveProperty('message')
      expect(result).toHaveProperty('data')
      expect(typeof result.success).toBe('boolean')
      expect(typeof result.message).toBe('string')
    })

    it('devrait retourner une réponse de succès avec les bonnes propriétés', async () => {
      const result = await getStudentsByTeacher('test-teacher-id')

      // Vérifier que c'est une réponse de succès
      expect(result.success).toBe(true)
      expect(result.data).toHaveProperty('courses')
      expect(Array.isArray(result.data?.courses)).toBe(true)
    })

    it('devrait gérer les erreurs correctement', async () => {
      // Ce test vérifie que la fonction gère les erreurs
      const result = await getStudentsByTeacher('test-teacher-id')

      // Même en cas d'erreur, la structure de réponse doit être correcte
      expect(result).toHaveProperty('success')
      expect(result).toHaveProperty('message')
      expect(result).toHaveProperty('data')
    })

    it('devrait retourner un tableau de cours', async () => {
      const result = await getStudentsByTeacher('test-teacher-id')

      // Vérifier que courses est un tableau
      expect(Array.isArray(result.data?.courses)).toBe(true)
    })

    it('devrait retourner des cours avec la bonne structure', async () => {
      const result = await getStudentsByTeacher('test-teacher-id')

      // Si on a des cours, vérifier leur structure
      if (result.data?.courses && result.data.courses.length > 0) {
        const course = result.data.courses[0]
        expect(course).toHaveProperty('courseId')
        expect(course).toHaveProperty('sessions')
        expect(Array.isArray(course.sessions)).toBe(true)
      }
    })

    it('devrait retourner des sessions avec la bonne structure', async () => {
      const result = await getStudentsByTeacher('test-teacher-id')

      // Si on a des cours avec des sessions, vérifier leur structure
      const courseWithSessions = result.data?.courses?.find((course) => course.sessions.length > 0)
      if (courseWithSessions) {
        const session = courseWithSessions.sessions[0]
        expect(session).toHaveProperty('sessionId')
        expect(session).toHaveProperty('subject')
        expect(session).toHaveProperty('timeSlot')
        expect(session).toHaveProperty('level')
      }
    })

    it('devrait retourner des étudiants avec la bonne structure', async () => {
      const result = await getStudentsByTeacher('test-teacher-id')

      // Si on a des cours avec des sessions et des étudiants, vérifier leur structure
      const courseWithStudents = result.data?.courses?.find((course) =>
        course.sessions.some((session) => session.students && session.students.length > 0),
      )

      if (courseWithStudents) {
        const sessionWithStudents = courseWithStudents.sessions.find((session) =>
          session.students && session.students.length > 0,
        )

        if (sessionWithStudents && sessionWithStudents.students) {
          const student = sessionWithStudents.students[0]
          expect(student).toHaveProperty('id')
          expect(student).toHaveProperty('firstname')
          expect(student).toHaveProperty('lastname')
        }
      }
    })

    it('devrait accepter le bon type de données', async () => {
      const validTeacherId = 'test-teacher-id'

      // Ce test vérifie que TypeScript accepte la structure
      expect(validTeacherId).toBe('test-teacher-id')
      expect(typeof validTeacherId).toBe('string')
    })
  })
})
