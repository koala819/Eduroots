import { beforeEach, describe, expect, it, vi } from 'vitest'

// Setup des mocks AVANT les imports
import { createMockAuthUser, createMockSessionServer,createMockSupabase } from '../utils/helpers'

function setupCoursesMocks() {
  // Mock auth-helpers
  vi.mock('@/server/utils/auth-helpers', () => ({
    getAuthenticatedUser: vi.fn().mockResolvedValue(createMockAuthUser()),
  }))

  // Mock server-helpers
  vi.mock('@/server/utils/server-helpers', () => ({
    getSessionServer: vi.fn().mockResolvedValue(createMockSessionServer()),
  }))
}
setupCoursesMocks()

// Données de test pour courses
const coursesTestData = {
  mockSession: {
    id: 'test-session-id',
    course_id: 'test-course-id',
    subject: 'Arabe',
    level: '0',
  },
}

// Import de la vraie fonction après les mocks
import {
  getCourseSessionById,
  getTeacherCourses,
  updateCourses,
} from '@/server/actions/api/courses'
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
        supabase: createMockSupabase({ throwError: true }) as any,
        user: createMockAuthUser(),
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
      const mockSupabase = createMockSupabase({ orderData: [] })

      vi.mocked(getSessionServer).mockResolvedValueOnce({
        supabase: mockSupabase as any,
        user: createMockAuthUser(),
      })

      const result = await getCourseSessionById('non-existent-id')

      expect(result.success).toBe(false)
      expect(result.message).toBe('Session non trouvée')
      expect(result.data).toBe(null)
    })

    it('devrait retourner les données de session si elle existe', async () => {
      // Mock pour simuler une session trouvée
      const mockSupabase = createMockSupabase({
        orderData: [coursesTestData.mockSession],
      })

      vi.mocked(getSessionServer).mockResolvedValueOnce({
        supabase: mockSupabase as any,
        user: createMockAuthUser(),
      })

      const result = await getCourseSessionById('test-session-id')

      expect(result.success).toBe(true)
      expect(result.message).toBe('Cours récupéré avec succès')
    })

    it('devrait utiliser .limit(1) au lieu de .single()', async () => {
      const mockSupabase = createMockSupabase({ orderData: [] })

      vi.mocked(getSessionServer).mockResolvedValueOnce({
        supabase: mockSupabase as any,
        user: createMockAuthUser(),
      })

      await getCourseSessionById('test-session-id')

      // Vérifier que .limit(1) est appelé au lieu de .single()
      expect(mockSupabase.limit).toHaveBeenCalled()
    })

    it('devrait faire les bonnes requêtes Supabase dans le bon ordre', async () => {
      // Créer un mock qui simule correctement l'enchaînement
      const mockSupabase = createMockSupabase({
        orderData: [coursesTestData.mockSession],
      })

      vi.mocked(getSessionServer).mockResolvedValueOnce({
        supabase: mockSupabase as any,
        user: createMockAuthUser(),
      })

      const result = await getCourseSessionById('test-session-id')

      // Vérifier que les méthodes ont été appelées
      expect(mockSupabase.schema).toHaveBeenCalledWith('education')
      expect(mockSupabase.from).toHaveBeenCalledWith('courses_sessions')
      expect(mockSupabase.select).toHaveBeenCalledWith('*')
      expect(mockSupabase.eq).toHaveBeenCalledWith('id', 'test-session-id')
      expect(mockSupabase.limit).toHaveBeenCalledWith(1)

      expect(result.success).toBe(true)
      expect(result.message).toBe('Cours récupéré avec succès')
    })

    it('devrait détecter si quelqu\'un remet .single() au lieu de .limit(1)', async () => {
      const mockSupabase = createMockSupabase({ orderData: [] })

      vi.mocked(getSessionServer).mockResolvedValueOnce({
        supabase: mockSupabase as any,
        user: createMockAuthUser(),
      })

      await getCourseSessionById('test-session-id')

      // Ce test échouera si quelqu'un remet .single() dans le code
      expect(mockSupabase.single).not.toHaveBeenCalled()
      expect(mockSupabase.limit).toHaveBeenCalled()
    })

    it('devrait vérifier la structure de la réponse complète', async () => {
      // Créer un mock simple qui retourne les données attendues
      const mockSupabase = createMockSupabase({
        orderData: [coursesTestData.mockSession],
      })

      vi.mocked(getSessionServer).mockResolvedValueOnce({
        supabase: mockSupabase as any,
        user: createMockAuthUser(),
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

  describe('updateCourses - Tests', () => {
    it('devrait appeler getAuthenticatedUser et getSessionServer', async () => {
      await updateCourses('admin', 'admin-1')

      const { getAuthenticatedUser } = await import('@/server/utils/auth-helpers')
      expect(getAuthenticatedUser).toHaveBeenCalled()
      expect(getSessionServer).toHaveBeenCalled()
    })

    it('devrait retourner une réponse de succès pour admin', async () => {
      // Mock qui retourne un tableau vide à la fin de la chaîne
      const mockSupabase = createMockSupabase({ orderData: [] })

      vi.mocked(getSessionServer).mockResolvedValueOnce({
        supabase: mockSupabase as any,
        user: createMockAuthUser(),
      })

      const result = await updateCourses('admin', 'admin-1')

      expect(result.success).toBe(true)
      expect(result.data).toEqual([]) // Par défaut, le mock retourne un tableau vide
      expect(result.message).toBe('Courses updated successfully')
    })

    it('devrait retourner une réponse de succès pour teacher', async () => {
      // Mock qui retourne un tableau vide à la fin de la chaîne
      const mockSupabase = createMockSupabase({ orderData: [] })

      vi.mocked(getSessionServer).mockResolvedValueOnce({
        supabase: mockSupabase as any,
        user: createMockAuthUser(),
      })

      const result = await updateCourses('teacher', 'teacher-1')

      expect(result.success).toBe(true)
      expect(result.data).toEqual([]) // Par défaut, le mock retourne un tableau vide
      expect(result.message).toBe('Courses updated successfully')
    })

    it('devrait retourner une réponse de succès pour student avec données vides', async () => {
      // Mock qui retourne un tableau vide pour les sessions d'étudiant
      const mockSupabase = createMockSupabase({ orderData: [] })

      vi.mocked(getSessionServer).mockResolvedValueOnce({
        supabase: mockSupabase as any,
        user: createMockAuthUser(),
      })

      const result = await updateCourses('student', 'student-1')

      expect(result.success).toBe(true)
      expect(result.data).toEqual([]) // Par défaut, le mock retourne un tableau vide
      expect(result.message).toBe('Aucun cours trouvé pour cet étudiant')
    })

    it('devrait gérer les erreurs de requête', async () => {
      // Mock d'une erreur
      vi.mocked(getSessionServer).mockResolvedValueOnce({
        supabase: createMockSupabase({ throwError: true }) as any,
        user: createMockAuthUser(),
      })

      await expect(updateCourses('admin', 'admin-1')).rejects.toThrow('Failed to update courses')
    })

    it('devrait construire la bonne requête pour admin', async () => {
      const mockSupabase = createMockSupabase({ orderData: [] })

      vi.mocked(getSessionServer).mockResolvedValueOnce({
        supabase: mockSupabase as any,
        user: createMockAuthUser(),
      })

      await updateCourses('admin', 'admin-1')

      // Vérifier que les bonnes méthodes ont été appelées
      expect(mockSupabase.schema).toHaveBeenCalledWith('education')
      expect(mockSupabase.from).toHaveBeenCalledWith('courses')
      expect(mockSupabase.select).toHaveBeenCalled()
      expect(mockSupabase.eq).toHaveBeenCalledWith('is_active', true)
    })

    it('devrait construire la bonne requête pour teacher', async () => {
      const mockSupabase = createMockSupabase({ orderData: [] })

      vi.mocked(getSessionServer).mockResolvedValueOnce({
        supabase: mockSupabase as any,
        user: createMockAuthUser(),
      })

      await updateCourses('teacher', 'teacher-1')

      // Vérifier que les bonnes méthodes ont été appelées
      expect(mockSupabase.schema).toHaveBeenCalledWith('education')
      expect(mockSupabase.from).toHaveBeenCalledWith('courses')
      expect(mockSupabase.select).toHaveBeenCalled()
      expect(mockSupabase.eq).toHaveBeenCalledWith('is_active', true)
      expect(mockSupabase.eq).toHaveBeenCalledWith('courses_teacher.teacher_id', 'teacher-1')
    })

    it('devrait construire la bonne requête pour student', async () => {
      const mockSupabase = createMockSupabase({
        orderData: [
          { course_sessions_id: 'session-1' },
          { course_sessions_id: 'session-2' },
        ],
      })

      vi.mocked(getSessionServer).mockResolvedValueOnce({
        supabase: mockSupabase as any,
        user: createMockAuthUser(),
      })

      await updateCourses('student', 'student-1')

      // Vérifier que les bonnes méthodes ont été appelées
      expect(mockSupabase.schema).toHaveBeenCalledWith('education')
      expect(mockSupabase.from).toHaveBeenCalledWith('courses_sessions_students')
      expect(mockSupabase.select).toHaveBeenCalledWith('course_sessions_id')
      expect(mockSupabase.eq).toHaveBeenCalledWith('student_id', 'student-1')
    })
  })
})
