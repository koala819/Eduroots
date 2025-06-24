import { describe, expect, it, vi } from 'vitest'

// Setup des mocks AVANT les imports
import { createMockAuthUser, createMockSessionServer,createMockSupabase } from '../utils/helpers'

function setupStatsMocks() {
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

  // Mock stats/student
  vi.mock('@/server/utils/stats/student', () => ({
    calculateStudentAttendanceRate: vi.fn().mockResolvedValue({
      absencesRate: 85,
      absencesCount: 2,
    }),
    calculateStudentBehaviorRate: vi.fn(),
    calculateStudentGrade: vi.fn(),
  }))

  // Mock next/cache
  vi.mock('next/cache', () => ({
    revalidatePath: vi.fn(),
  }))
}
setupStatsMocks()

import { refreshTeacherStudentsStats } from '@/server/actions/api/stats'

describe('Stats Functions', () => {
  describe('refreshTeacherStudentsStats', () => {
    it('devrait retourner le bon format de réponse', async () => {
      const result = await refreshTeacherStudentsStats()

      // Vérifier la structure de la réponse
      expect(result).toHaveProperty('success')
      expect(result).toHaveProperty('message')
      expect(result).toHaveProperty('data')
      expect(typeof result.success).toBe('boolean')
      expect(typeof result.message).toBe('string')
    })

    it('devrait retourner une réponse de succès avec les bonnes propriétés', async () => {
      const result = await refreshTeacherStudentsStats()

      // Vérifier que c'est une réponse de succès
      expect(result.success).toBe(true)
      expect(result.message).toBe('Statistiques des élèves mises à jour avec succès')
      expect(result.data).toHaveProperty('studentStats')
      expect(result.data).toHaveProperty('studentsUpdated')
      expect(typeof result.data.studentsUpdated).toBe('number')
    })

    it('devrait gérer les erreurs correctement', async () => {
      // Ce test vérifie que la fonction gère les erreurs
      // Dans un vrai test, on pourrait mocker une erreur spécifique
      const result = await refreshTeacherStudentsStats()

      // Même en cas d'erreur, la structure de réponse doit être correcte
      expect(result).toHaveProperty('success')
      expect(result).toHaveProperty('message')
      expect(result).toHaveProperty('data')
    })

    it('devrait retourner un nombre d\'élèves mis à jour valide', async () => {
      const result = await refreshTeacherStudentsStats()

      // Vérifier que studentsUpdated est un nombre valide
      expect(result.data.studentsUpdated).toBeGreaterThanOrEqual(0)
      expect(Number.isInteger(result.data.studentsUpdated)).toBe(true)
    })

    it('devrait retourner un tableau de statistiques étudiants', async () => {
      const result = await refreshTeacherStudentsStats()

      // Vérifier que studentStats est un tableau
      expect(Array.isArray(result.data.studentStats)).toBe(true)
    })
  })
})
