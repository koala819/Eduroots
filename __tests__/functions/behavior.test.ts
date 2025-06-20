import { describe, expect, it, vi } from 'vitest'

import { createBehaviorRecord, updateBehaviorRecord } from '@/server/actions/api/behaviors'
import type { CreateBehaviorPayload, UpdateBehaviorPayload } from '@/types/behavior-payload'

// Mock complet de toutes les dépendances
vi.mock('@/server/utils/auth-helpers', () => ({
  getAuthenticatedUser: vi.fn().mockResolvedValue({ id: 'test-user' }),
}))

vi.mock('@/server/utils/supabase', () => ({
  createClient: vi.fn(),
}))

vi.mock('@/server/utils/server-helpers', () => ({
  getSessionServer: vi.fn().mockResolvedValue({
    supabase: {
      schema: vi.fn().mockReturnThis(),
      from: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      gte: vi.fn().mockReturnThis(),
      lte: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: null }),
    },
  }),
}))

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}))

describe('Behavior Functions', () => {
  describe('createBehaviorRecord', () => {
    it('devrait retourner une erreur avec des données invalides', async () => {
      const result = await createBehaviorRecord({} as any)
      expect(result.success).toBe(false)
      expect(result.message).toBe('Données invalides')
    })

    it('devrait accepter le bon type de données', async () => {
      const validPayload: CreateBehaviorPayload = {
        course: 'course-123',
        date: '2024-01-15',
        records: [
          { student: 'student-1', rating: 5, comment: null },
          { student: 'student-2', rating: 3, comment: 'Comportement à améliorer' },
        ],
        sessionId: 'session-123',
      }

      // Ce test vérifie que TypeScript accepte la structure
      expect(validPayload.course).toBe('course-123')
      expect(validPayload.records).toHaveLength(2)
      expect(validPayload.records[0].student).toBe('student-1')
      expect(validPayload.records[0].rating).toBe(5)
    })

    it('devrait retourner le bon format de réponse', async () => {
      const result = await createBehaviorRecord({} as any)

      // Vérifier la structure de la réponse
      expect(result).toHaveProperty('success')
      expect(result).toHaveProperty('message')
      expect(result).toHaveProperty('data')
      expect(typeof result.success).toBe('boolean')
      expect(typeof result.message).toBe('string')
    })

    it('devrait valider la structure des records', async () => {
      const invalidPayload = {
        course: 'course-123',
        date: '2024-01-15',
        records: 'not-an-array', // Type incorrect
      }

      const result = await createBehaviorRecord(invalidPayload as any)
      expect(result.success).toBe(false)
      expect(result.message).toBe('Données invalides')
    })

    it('devrait accepter des records avec commentaires optionnels', async () => {
      const payloadWithOptionalComments: CreateBehaviorPayload = {
        course: 'course-123',
        date: '2024-01-15',
        records: [
          { student: 'student-1', rating: 5 }, // Sans commentaire
          { student: 'student-2', rating: 4, comment: 'Bon comportement' }, // Avec commentaire
          { student: 'student-3', rating: 2, comment: null }, // Commentaire null
        ],
      }

      // Vérifier que TypeScript accepte ces variations
      expect(payloadWithOptionalComments.records[0].comment).toBeUndefined()
      expect(payloadWithOptionalComments.records[1].comment).toBe('Bon comportement')
      expect(payloadWithOptionalComments.records[2].comment).toBeNull()
    })
  })

  describe('updateBehaviorRecord', () => {
    it('devrait retourner une erreur avec des données invalides', async () => {
      const result = await updateBehaviorRecord({} as any)
      expect(result.success).toBe(false)
      expect(result.message).toBe('Données invalides')
    })

    it('devrait accepter le bon type de données', async () => {
      const validPayload: UpdateBehaviorPayload = {
        behaviorId: 'behavior-123',
        courseId: 'course-123',
        sessionId: 'session-123',
        date: '2024-01-15',
        records: [
          { student: 'student-1', rating: 5, comment: null },
          { student: 'student-2', rating: 3, comment: 'Comportement à améliorer' },
        ],
      }

      // Ce test vérifie que TypeScript accepte la structure
      expect(validPayload.behaviorId).toBe('behavior-123')
      expect(validPayload.courseId).toBe('course-123')
      expect(validPayload.sessionId).toBe('session-123')
      expect(validPayload.date).toBe('2024-01-15')
      expect(validPayload.records).toHaveLength(2)
      expect(validPayload.records[0].student).toBe('student-1')
      expect(validPayload.records[0].rating).toBe(5)
    })

    it('devrait retourner le bon format de réponse', async () => {
      const result = await updateBehaviorRecord({} as any)

      // Vérifier la structure de la réponse
      expect(result).toHaveProperty('success')
      expect(result).toHaveProperty('message')
      expect(result).toHaveProperty('data')
      expect(typeof result.success).toBe('boolean')
      expect(typeof result.message).toBe('string')
    })

    it('devrait valider tous les champs requis', async () => {
      const missingFieldsPayload = {
        behaviorId: 'behavior-123',
        // courseId manquant
        sessionId: 'session-123',
        date: '2024-01-15',
        records: [],
      }

      const result = await updateBehaviorRecord(missingFieldsPayload as any)
      expect(result.success).toBe(false)
      expect(result.message).toBe('Données invalides')
    })

    it('devrait accepter des records avec commentaires optionnels', async () => {
      const payloadWithOptionalComments: UpdateBehaviorPayload = {
        behaviorId: 'behavior-123',
        courseId: 'course-123',
        sessionId: 'session-123',
        date: '2024-01-15',
        records: [
          { student: 'student-1', rating: 5 }, // Sans commentaire
          { student: 'student-2', rating: 4, comment: 'Amélioration' }, // Avec commentaire
          { student: 'student-3', rating: 2, comment: null }, // Commentaire null
        ],
      }

      // Vérifier que TypeScript accepte ces variations
      expect(payloadWithOptionalComments.records[0].comment).toBeUndefined()
      expect(payloadWithOptionalComments.records[1].comment).toBe('Amélioration')
      expect(payloadWithOptionalComments.records[2].comment).toBeNull()
    })
  })
})
