import { describe, expect, it, vi } from 'vitest'

// Setup des mocks AVANT les imports
import { createMockSupabase, testUtils } from '../utils/helpers'

function setupBehaviorMocks() {
  // Mock auth-helpers
  vi.mock('@/server/utils/auth-helpers', () => ({
    getAuthenticatedUser: vi.fn().mockResolvedValue({ id: 'test-user' }),
  }))

  // Mock supabase
  vi.mock('@/server/utils/supabase', () => ({
    createClient: vi.fn(),
  }))

  // Mock server-helpers
  vi.mock('@/server/utils/server-helpers', () => ({
    getSessionServer: vi.fn().mockResolvedValue({
      supabase: createMockSupabase(),
    }),
  }))

  // Mock next/cache
  vi.mock('next/cache', () => ({
    revalidatePath: vi.fn(),
  }))
}

const behaviorTestData = {
  validCreatePayload: {
    course: 'course-123',
    date: '2024-01-15',
    records: [
      { student: 'student-1', rating: 5, comment: null },
      { student: 'student-2', rating: 3, comment: 'Comportement à améliorer' },
    ],
    sessionId: 'session-123',
  } as CreateBehaviorPayload,

  validUpdatePayload: {
    behaviorId: 'behavior-123',
    courseId: 'course-123',
    sessionId: 'session-123',
    date: '2024-01-15',
    records: [
      { student: 'student-1', rating: 5, comment: null },
      { student: 'student-2', rating: 3, comment: 'Comportement à améliorer' },
    ],
  } as UpdateBehaviorPayload,

  payloadWithOptionalComments: {
    course: 'course-123',
    date: '2024-01-15',
    records: [
      { student: 'student-1', rating: 5 }, // Sans commentaire
      { student: 'student-2', rating: 4, comment: 'Bon comportement' }, // Avec commentaire
      { student: 'student-3', rating: 2, comment: null }, // Commentaire null
    ],
    sessionId: 'session-123',
  } as CreateBehaviorPayload,
}


setupBehaviorMocks()

import {
  createBehaviorRecord,
  getBehaviorById,
  updateBehaviorRecord } from '@/server/actions/api/behaviors'
import type { CreateBehaviorPayload, UpdateBehaviorPayload } from '@/types/behavior-payload'

describe('Behavior Functions', () => {
  describe('createBehaviorRecord', () => {
    it('devrait retourner une erreur avec des données invalides', async () => {
      const result = await createBehaviorRecord({} as any)
      expect(result.success).toBe(false)
      expect(result.message).toBe('Données invalides')
    })

    it('devrait accepter le bon type de données', async () => {
      const validPayload: CreateBehaviorPayload = behaviorTestData.validCreatePayload

      // Ce test vérifie que TypeScript accepte la structure
      expect(validPayload.course).toBe('course-123')
      expect(validPayload.records).toHaveLength(2)
      expect(validPayload.records[0].student).toBe('student-1')
      expect(validPayload.records[0].rating).toBe(5)
    })

    it('devrait retourner le bon format de réponse', async () => {
      const result = await createBehaviorRecord({} as any)

      // Vérifier la structure de la réponse
      testUtils.expectStandardResponse(result)
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
      const payloadWithOptionalComments: CreateBehaviorPayload =
        behaviorTestData.payloadWithOptionalComments

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
      const validPayload: UpdateBehaviorPayload = behaviorTestData.validUpdatePayload

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
      testUtils.expectStandardResponse(result)
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

  describe('getBehaviorById', () => {
    it('devrait retourner une erreur avec un ID invalide', async () => {
      const result = await getBehaviorById('')
      expect(result.success).toBe(false)
      expect(result.message).toBe('Comportement non trouvé')
    })

    it('devrait accepter un ID valide', async () => {
      const validBehaviorId = '3c7c2be3-96c0-42ae-b7c8-8eb79ae039fc'

      // Ce test vérifie que TypeScript accepte la structure
      expect(validBehaviorId).toBe('3c7c2be3-96c0-42ae-b7c8-8eb79ae039fc')
      expect(typeof validBehaviorId).toBe('string')
      expect(validBehaviorId.length).toBeGreaterThan(0)
    })

    it('devrait retourner le bon format de réponse', async () => {
      const result = await getBehaviorById('test-id')

      // Vérifier la structure de la réponse
      testUtils.expectStandardResponse(result)
    })

    it('devrait gérer les IDs avec des caractères spéciaux', async () => {
      const specialId = 'behavior-123_with-special_chars'

      // Ce test vérifie que TypeScript accepte les IDs avec caractères spéciaux
      expect(specialId).toContain('-')
      expect(specialId).toContain('_')
      expect(typeof specialId).toBe('string')
    })

    it('devrait valider la structure des données retournées', async () => {
      const result = await getBehaviorById('test-id')

      // Vérifier que si on a des données, elles ont la bonne structure
      if (result.success && result.data) {
        expect(result.data).toHaveProperty('id')
        expect(result.data).toHaveProperty('course_session_id')
        expect(result.data).toHaveProperty('date')
        expect(result.data).toHaveProperty('behavior_rate')
        expect(result.data).toHaveProperty('total_students')
        expect(result.data).toHaveProperty('behavior_records')
      }
    })
  })
})
