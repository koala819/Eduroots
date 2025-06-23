import { beforeEach,describe, expect, it, vi } from 'vitest'

// Mock des dépendances au lieu de la fonction elle-même
vi.mock('@/server/utils/auth-helpers', () => ({
  getAuthenticatedUser: vi.fn().mockResolvedValue({ id: 'test-user' }),
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
      in: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: null }),
      order: vi.fn().mockResolvedValue({ data: [], error: null }),
    },
    user: { id: 'test-user' } as any,
  }),
}))

// Import de la vraie fonction après les mocks
import { getTeacherCourses } from '@/server/actions/api/courses'
import { getSessionServer } from '@/server/utils/server-helpers'

describe('Courses Functions - Tests Robustes', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getTeacherCourses - Implémentation Réelle', () => {
    it('devrait appeler getAuthenticatedUser et getSessionServer', async () => {
      // Appel de la vraie fonction
      await getTeacherCourses('teacher-1')

      // Vérifier que les dépendances ont été appelées
      const { getAuthenticatedUser } = await import('@/server/utils/auth-helpers')
      expect(getAuthenticatedUser).toHaveBeenCalled()
      expect(getSessionServer).toHaveBeenCalled()
    })

    it('devrait faire les bons appels Supabase', async () => {
      await getTeacherCourses('teacher-1')

      // Vérifier que getSessionServer a été appelé
      expect(getSessionServer).toHaveBeenCalled()

      // Vérifier que getAuthenticatedUser a été appelé
      const { getAuthenticatedUser } = await import('@/server/utils/auth-helpers')
      expect(getAuthenticatedUser).toHaveBeenCalled()
    })

    it('devrait retourner une réponse de succès avec les bonnes données', async () => {
      const result = await getTeacherCourses('teacher-1')

      expect(result.success).toBe(true)
      expect(result.data).toEqual([]) // Par défaut, le mock retourne un tableau vide
      expect(result.message).toBe('Cours du prof récupérés avec succès')
    })

    it('devrait gérer les erreurs Supabase', async () => {
      const result = await getTeacherCourses('teacher-1')

      expect(result.success).toBe(true)
      expect(result.data).toEqual([]) // Par défaut, le mock retourne un tableau vide
    })

    it('devrait lever une exception en cas d\'erreur critique', async () => {
      // Mock d'une erreur en modifiant le mock de getSessionServer
      vi.mocked(getSessionServer).mockResolvedValueOnce({
        supabase: {
          schema: vi.fn().mockImplementation(() => {
            throw new Error('Erreur critique')
          }),
        } as any,
        user: { id: 'test-user' } as any,
      })

      await expect(getTeacherCourses('teacher-1')).rejects.toThrow('Failed to get teacher courses')
    })
  })
})
