import { describe, expect, it, vi } from 'vitest'

import { createAttendanceRecord, updateAttendanceRecord } from '@/server/actions/api/attendances'
import type { CreateAttendancePayload, UpdateAttendancePayload } from '@/types/attendance-payload'

// Mock complet de toutes les dépendances
vi.mock('@/server/utils/auth-helpers')
vi.mock('@/server/utils/supabase')
vi.mock('next/cache')

describe('Attendance Functions', () => {
  describe('createAttendanceRecord', () => {
    it('devrait retourner une erreur avec des données invalides', async () => {
      const result = await createAttendanceRecord({} as any)
      expect(result.success).toBe(false)
      expect(result.message).toBe('Données invalides')
    })

    it('devrait accepter le bon type de données', async () => {
      const validPayload: CreateAttendancePayload = {
        courseId: 'course-123',
        date: '2024-01-15',
        records: [
          { studentId: 'student-1', isPresent: true, comment: null },
          { studentId: 'student-2', isPresent: false, comment: 'Absent' },
        ],
        sessionId: 'session-123',
      }

      // Ce test vérifie que TypeScript accepte la structure
      expect(validPayload.courseId).toBe('course-123')
      expect(validPayload.records).toHaveLength(2)
      expect(validPayload.records[0].studentId).toBe('student-1')
    })

    it('devrait retourner le bon format de réponse', async () => {
      const result = await createAttendanceRecord({} as any)

      // Vérifier la structure de la réponse
      expect(result).toHaveProperty('success')
      expect(result).toHaveProperty('message')
      expect(result).toHaveProperty('data')
      expect(typeof result.success).toBe('boolean')
      expect(typeof result.message).toBe('string')
    })
  })

  describe('updateAttendanceRecord', () => {
    it('devrait retourner une erreur avec des données invalides', async () => {
      const result = await updateAttendanceRecord({} as any)
      expect(result.success).toBe(false)
      expect(result.message).toBe('Les données de présence sont invalides')
    })

    it('devrait accepter le bon type de données', async () => {
      const validPayload: UpdateAttendancePayload = {
        attendanceId: 'attendance-123',
        records: [
          { studentId: 'student-1', isPresent: true, comment: null },
          { studentId: 'student-2', isPresent: false, comment: 'Absent' },
        ],
      }

      // Ce test vérifie que TypeScript accepte la structure
      expect(validPayload.attendanceId).toBe('attendance-123')
      expect(validPayload.records).toHaveLength(2)
      expect(validPayload.records[0].studentId).toBe('student-1')
    })

    it('devrait retourner le bon format de réponse', async () => {
      const result = await updateAttendanceRecord({} as any)

      // Vérifier la structure de la réponse
      expect(result).toHaveProperty('success')
      expect(result).toHaveProperty('message')
      expect(result).toHaveProperty('data')
      expect(typeof result.success).toBe('boolean')
      expect(typeof result.message).toBe('string')
    })
  })
})
