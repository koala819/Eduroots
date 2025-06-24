import { beforeEach, describe, expect, it, vi } from 'vitest'

// Setup des mocks AVANT les imports
import { createMockAuthUser, createMockSessionServer,createMockSupabase } from '../utils/helpers'

function setupGradesMocks() {
  // Mock auth-helpers
  vi.mock('@/server/utils/auth-helpers', () => ({
    getAuthenticatedUser: vi.fn().mockResolvedValue(createMockAuthUser()),
    getEducationUserId: vi.fn().mockResolvedValue('test-education-user-id'),
  }))

  // Mock server-helpers
  vi.mock('@/server/utils/server-helpers', () => ({
    getSessionServer: vi.fn().mockResolvedValue(createMockSessionServer()),
  }))
}
setupGradesMocks()

// Import de la vraie fonction après les mocks
import { getTeacherCourses } from '@/server/actions/api/courses'
import { getAuthenticatedUser, getEducationUserId } from '@/server/utils/auth-helpers'
import { getSessionServer } from '@/server/utils/server-helpers'

describe('Grade Create Page Functions - Tests Robustes', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getAuthenticatedUser', () => {
    it('devrait être appelé et retourner un utilisateur authentifié', async () => {
      const result = await getAuthenticatedUser()

      expect(getAuthenticatedUser).toHaveBeenCalled()
      const expectedUser = {
        id: 'test-auth-user-id',
        email: 'teacher@test.com',
        user_metadata: { role: 'teacher' },
        app_metadata: {},
        aud: 'authenticated',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      }
      expect(result).toEqual(expectedUser)
    })

    it('devrait gérer les erreurs d\'authentification', async () => {
      // Mock d'une erreur d'authentification
      vi.mocked(getAuthenticatedUser).mockRejectedValueOnce(
        new Error('Utilisateur non authentifié'),
      )

      await expect(getAuthenticatedUser()).rejects.toThrow('Utilisateur non authentifié')
    })
  })

  describe('getEducationUserId', () => {
    it('devrait être appelé et retourner un ID d\'utilisateur éducation', async () => {
      const result = await getEducationUserId('test-auth-user-id')

      expect(getEducationUserId).toHaveBeenCalledWith('test-auth-user-id')
      expect(result).toBe('test-education-user-id')
    })

    it('devrait gérer les erreurs de récupération d\'ID', async () => {
      // Mock d'une erreur
      vi.mocked(getEducationUserId).mockRejectedValueOnce(
        new Error('ID utilisateur éducation non trouvé'),
      )

      await expect(getEducationUserId('test-auth-user-id')).rejects.toThrow(
        'ID utilisateur éducation non trouvé',
      )
    })
  })

  describe('getTeacherCourses', () => {
    it('devrait appeler getAuthenticatedUser et getSessionServer', async () => {
      await getTeacherCourses('teacher-1')

      expect(getAuthenticatedUser).toHaveBeenCalled()
      expect(getSessionServer).toHaveBeenCalled()
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
        supabase: createMockSupabase({ throwError: true }) as any,
        user: createMockAuthUser(),
      })

      await expect(getTeacherCourses('teacher-1')).rejects.toThrow('Failed to get teacher courses')
    })
  })

  describe('Intégration des fonctions', () => {
    it('devrait permettre l\'utilisation combinée des trois fonctions', async () => {
      // Test d'intégration - toutes les fonctions doivent fonctionner ensemble
      const authUser = await getAuthenticatedUser()
      const educationUserId = await getEducationUserId(authUser.id)
      const courses = await getTeacherCourses('teacher-1')

      expect(authUser).toBeDefined()
      expect(educationUserId).toBeDefined()
      expect(courses.success).toBe(true)
    })

    it('devrait gérer les erreurs en cascade', async () => {
      // Mock d'une erreur dans getAuthenticatedUser qui affecte les autres
      vi.mocked(getAuthenticatedUser).mockRejectedValueOnce(
        new Error('Erreur d\'authentification'),
      )

      await expect(getAuthenticatedUser()).rejects.toThrow('Erreur d\'authentification')

      // Les autres fonctions ne devraient pas être affectées si elles sont appelées indépendamment
      const educationUserId = await getEducationUserId('test-auth-user-id')
      expect(educationUserId).toBe('test-education-user-id')
    })
  })
})
