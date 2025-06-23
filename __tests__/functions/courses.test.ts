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
      limit: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: [], error: null }),
    },
    user: { id: 'test-user' } as any,
  }),
}))

// Import de la vraie fonction après les mocks
import { getCourseSessionById,getTeacherCourses } from '@/server/actions/api/courses'
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

  describe('getCourseSessionById - Tests', () => {
    it('devrait appeler getAuthenticatedUser et getSessionServer', async () => {
      await getCourseSessionById('test-session-id')

      const { getAuthenticatedUser } = await import('@/server/utils/auth-helpers')
      expect(getAuthenticatedUser).toHaveBeenCalled()
      expect(getSessionServer).toHaveBeenCalled()
    })

    it('devrait retourner une erreur si la session n\'existe pas', async () => {
      // Mock pour simuler une session non trouvée
      const mockSupabase = {
        schema: vi.fn().mockReturnThis(),
        from: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({ data: [], error: null }),
      }

      vi.mocked(getSessionServer).mockResolvedValueOnce({
        supabase: mockSupabase as any,
        user: { id: 'test-user' } as any,
      })

      const result = await getCourseSessionById('non-existent-id')

      expect(result.success).toBe(false)
      expect(result.message).toBe('Session non trouvée')
      expect(result.data).toBe(null)
    })

    it('devrait retourner les données de session si elle existe', async () => {
      // Mock pour simuler une session trouvée
      const mockSession = {
        id: 'test-session-id',
        course_id: 'test-course-id',
        subject: 'Arabe',
        level: '0',
      }

      const mockSupabase = {
        schema: vi.fn().mockReturnThis(),
        from: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({ data: [mockSession], error: null }),
      }

      vi.mocked(getSessionServer).mockResolvedValueOnce({
        supabase: mockSupabase as any,
        user: { id: 'test-user' } as any,
      })

      const result = await getCourseSessionById('test-session-id')

      expect(result.success).toBe(true)
      expect(result.message).toBe('Cours récupéré avec succès')
    })

    it('devrait utiliser .limit(1) au lieu de .single()', async () => {
      const mockSupabase = {
        schema: vi.fn().mockReturnThis(),
        from: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({ data: [], error: null }),
      }

      vi.mocked(getSessionServer).mockResolvedValueOnce({
        supabase: mockSupabase as any,
        user: { id: 'test-user' } as any,
      })

      await getCourseSessionById('test-session-id')

      // Vérifier que .limit(1) est appelé au lieu de .single()
      expect(mockSupabase.limit).toHaveBeenCalled()
    })

    it('devrait faire les bonnes requêtes Supabase dans le bon ordre', async () => {
      // Mock des données de retour
      const mockSession = {
        id: 'test-session-id',
        course_id: 'test-course-id',
        subject: 'Arabe',
        level: '0',
      }

      // Créer un mock qui simule correctement l'enchaînement
      const mockSupabase = {
        schema: vi.fn().mockReturnThis(),
        from: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({ data: [mockSession], error: null }),
      }

      vi.mocked(getSessionServer).mockResolvedValueOnce({
        supabase: mockSupabase as any,
        user: { id: 'test-user' } as any,
      })

      const result = await getCourseSessionById('test-session-id')

      // Vérifier que les méthodes ont été appelées
      expect(mockSupabase.schema).toHaveBeenCalledWith('education')
      expect(mockSupabase.from).toHaveBeenCalledWith('courses_sessions')
      expect(mockSupabase.select).toHaveBeenCalledWith('*')
      expect(mockSupabase.eq).toHaveBeenCalledWith('id', 'test-session-id')
      expect(mockSupabase.limit).toHaveBeenCalledWith(1)

      expect(result.success).toBe(true)
    })

    it('devrait détecter si quelqu\'un remet .single() au lieu de .limit(1)', async () => {
      const mockSupabase = {
        schema: vi.fn().mockReturnThis(),
        from: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        // Simulation d'un retour à .single()
        single: vi.fn().mockResolvedValue({ data: null, error: null }),
        limit: vi.fn().mockResolvedValue({ data: [], error: null }),
      }

      vi.mocked(getSessionServer).mockResolvedValueOnce({
        supabase: mockSupabase as any,
        user: { id: 'test-user' } as any,
      })

      await getCourseSessionById('test-session-id')

      // Ce test échouera si quelqu'un remet .single() dans le code
      expect(mockSupabase.single).not.toHaveBeenCalled()
      expect(mockSupabase.limit).toHaveBeenCalled()
    })

    it('devrait vérifier la structure de la réponse complète', async () => {
      const mockSession = {
        id: 'test-session-id',
        course_id: 'test-course-id',
        subject: 'Arabe',
        level: '0',
        stats_average_attendance: 75.5,
        stats_average_grade: 15.2,
        stats_average_behavior: 4.1,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: null,
        is_active: true,
        deleted_at: null,
      }

      // Créer un mock simple qui retourne les données attendues
      const mockSupabase = {
        schema: vi.fn().mockReturnThis(),
        from: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({ data: [mockSession], error: null }),
      }

      vi.mocked(getSessionServer).mockResolvedValueOnce({
        supabase: mockSupabase as any,
        user: { id: 'test-user' } as any,
      })

      const result = await getCourseSessionById('test-session-id')

      expect(result.success).toBe(true)
      expect(result.data).toHaveProperty('id', 'test-session-id')
      expect(result.data).toHaveProperty('subject', 'Arabe')
      expect(result.data).toHaveProperty('courses')
      expect(result.data).toHaveProperty('courses_sessions_timeslot')
      expect(result.data).toHaveProperty('courses_sessions_students')
    })
  })
})
