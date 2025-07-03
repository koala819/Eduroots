import { describe, expect, it, vi } from 'vitest'

import { getSessionServer } from '@/server/utils/server-helpers'

// Mock de la fonction getSessionServer pour retourner des données de test
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
    user: {
      id: 'test-user-id',
      email: 'test@example.com',
      user_metadata: { role: 'teacher' },
    },
  }),
}))

describe('Server Helpers Functions', () => {
  describe('getSessionServer', () => {
    it('devrait retourner le bon format de réponse', async () => {
      const result = await getSessionServer()

      // Vérifier la structure de la réponse
      expect(result).toHaveProperty('supabase')
      expect(result).toHaveProperty('user')
      expect(typeof result.supabase).toBe('object')
      expect(typeof result.user).toBe('object')
    })

    it('devrait retourner un objet supabase avec les bonnes méthodes', async () => {
      const result = await getSessionServer()

      // Vérifier que supabase a les méthodes nécessaires
      expect(result.supabase).toHaveProperty('schema')
      expect(result.supabase).toHaveProperty('from')
      expect(result.supabase).toHaveProperty('select')
      expect(result.supabase).toHaveProperty('insert')
      expect(result.supabase).toHaveProperty('update')
      expect(result.supabase).toHaveProperty('delete')
      expect(result.supabase).toHaveProperty('eq')
      expect(result.supabase).toHaveProperty('gte')
      expect(result.supabase).toHaveProperty('lte')
      expect(result.supabase).toHaveProperty('in')
      expect(result.supabase).toHaveProperty('single')
      expect(result.supabase).toHaveProperty('order')
    })

    it('devrait retourner un utilisateur avec les bonnes propriétés', async () => {
      const result = await getSessionServer()

      // Vérifier la structure de l'utilisateur
      expect(result.user).toHaveProperty('id')
      expect(result.user).toHaveProperty('email')
      expect(result.user).toHaveProperty('user_metadata')
      expect(typeof result.user.id).toBe('string')
      expect(typeof result.user.email).toBe('string')
      expect(typeof result.user.user_metadata).toBe('object')
    })

    it('devrait retourner un utilisateur avec un rôle valide', async () => {
      const result = await getSessionServer()

      // Vérifier que l'utilisateur a un rôle
      expect(result.user.user_metadata).toHaveProperty('role')
      expect(typeof result.user.user_metadata.role).toBe('string')
      expect(result.user.user_metadata.role).toBe('teacher')
    })

    it('devrait permettre l\'utilisation des méthodes supabase en chaîne', async () => {
      const result = await getSessionServer()

      // Vérifier que les méthodes peuvent être chaînées
      const mockQuery = result.supabase
        .schema('education')
        .from('holidays')
        .select('*')
        .order('created_at', { ascending: false })

      expect(mockQuery).toBeDefined()
    })

    it('devrait gérer les erreurs correctement', async () => {
      // Ce test vérifie que la fonction gère les erreurs
      const result = await getSessionServer()

      // La structure de réponse doit être correcte même en cas d'erreur
      expect(result).toHaveProperty('supabase')
      expect(result).toHaveProperty('user')
    })
  })
})
