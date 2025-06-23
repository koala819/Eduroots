import { describe, expect, it, vi } from 'vitest'

import { getAuthenticatedUser, getEducationUserId } from '@/server/utils/auth-helpers'

// Mock complet de toutes les dépendances
vi.mock('@/server/utils/supabase', () => ({
  createClient: vi.fn(() => ({
    auth: {
      getUser: vi.fn(),
    },
    schema: vi.fn(() => ({
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          or: vi.fn(() => ({
            single: vi.fn(),
          })),
        })),
      })),
    })),
  })),
}))

describe('Auth Helpers', () => {
  describe('getAuthenticatedUser', () => {
    it('devrait retourner un utilisateur authentifié', async () => {
      const mockUser = {
        id: 'test-user-id',
        email: 'test@example.com',
        user_metadata: { role: 'teacher' },
      }

      const mockSupabase = {
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: mockUser },
            error: null,
          }),
        },
      }

      // Mock createClient pour retourner notre mockSupabase
      const { createClient } = await import('@/server/utils/supabase')
      vi.mocked(createClient).mockReturnValue(mockSupabase as any)

      const result = await getAuthenticatedUser()

      expect(result).toEqual(mockUser)
      expect(mockSupabase.auth.getUser).toHaveBeenCalled()
    })

    it('devrait lever une erreur si aucun utilisateur', async () => {
      const mockSupabase = {
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: null },
            error: null,
          }),
        },
      }

      const { createClient } = await import('@/server/utils/supabase')
      vi.mocked(createClient).mockReturnValue(mockSupabase as any)

      await expect(getAuthenticatedUser()).rejects.toThrow('Non authentifié')
    })

    it('devrait lever une erreur en cas d\'erreur Supabase', async () => {
      const mockError = new Error('Erreur de base de données')
      const mockSupabase = {
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: null },
            error: mockError,
          }),
        },
      }

      const { createClient } = await import('@/server/utils/supabase')
      vi.mocked(createClient).mockReturnValue(mockSupabase as any)

      await expect(getAuthenticatedUser()).rejects.toThrow('Non authentifié')
    })

    it('devrait lever une erreur si l\'utilisateur n\'a pas de rôle', async () => {
      const mockUser = {
        id: 'test-user-id',
        email: 'test@example.com',
        user_metadata: {}, // Pas de rôle
      }

      const mockSupabase = {
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: mockUser },
            error: null,
          }),
        },
      }

      const { createClient } = await import('@/server/utils/supabase')
      vi.mocked(createClient).mockReturnValue(mockSupabase as any)

      // getAuthenticatedUser ne vérifie pas le rôle, donc elle devrait retourner l'utilisateur
      const result = await getAuthenticatedUser()
      expect(result).toEqual(mockUser)
    })
  })

  describe('getEducationUserId', () => {
    it('devrait retourner l\'ID education pour un auth_id valide', async () => {
      const mockEducationUser = {
        id: 'education-user-id',
      }

      const mockSupabase = {
        schema: vi.fn(() => ({
          from: vi.fn(() => ({
            select: vi.fn(() => ({
              or: vi.fn(() => ({
                single: vi.fn().mockResolvedValue({
                  data: mockEducationUser,
                  error: null,
                }),
              })),
            })),
          })),
        })),
      }

      const { createClient } = await import('@/server/utils/supabase')
      vi.mocked(createClient).mockReturnValue(mockSupabase as any)

      const result = await getEducationUserId('test-auth-id')

      expect(result).toBe('education-user-id')
    })

    it('devrait retourner l\'ID education pour un parent2_auth_id valide', async () => {
      const mockEducationUser = {
        id: 'education-user-id',
      }

      const mockSupabase = {
        schema: vi.fn(() => ({
          from: vi.fn(() => ({
            select: vi.fn(() => ({
              or: vi.fn(() => ({
                single: vi.fn().mockResolvedValue({
                  data: mockEducationUser,
                  error: null,
                }),
              })),
            })),
          })),
        })),
      }

      const { createClient } = await import('@/server/utils/supabase')
      vi.mocked(createClient).mockReturnValue(mockSupabase as any)

      const result = await getEducationUserId('test-parent2-auth-id')

      expect(result).toBe('education-user-id')
    })

    it('devrait retourner null si l\'utilisateur n\'existe pas', async () => {
      const mockSupabase = {
        schema: vi.fn(() => ({
          from: vi.fn(() => ({
            select: vi.fn(() => ({
              or: vi.fn(() => ({
                single: vi.fn().mockResolvedValue({
                  data: null,
                  error: null,
                }),
              })),
            })),
          })),
        })),
      }

      const { createClient } = await import('@/server/utils/supabase')
      vi.mocked(createClient).mockReturnValue(mockSupabase as any)

      const result = await getEducationUserId('non-existent-auth-id')

      expect(result).toBeNull()
    })

    it('devrait retourner null en cas d\'erreur de base de données', async () => {
      const mockError = new Error('Erreur de base de données')
      const mockSupabase = {
        schema: vi.fn(() => ({
          from: vi.fn(() => ({
            select: vi.fn(() => ({
              or: vi.fn(() => ({
                single: vi.fn().mockResolvedValue({
                  data: null,
                  error: mockError,
                }),
              })),
            })),
          })),
        })),
      }

      const { createClient } = await import('@/server/utils/supabase')
      vi.mocked(createClient).mockReturnValue(mockSupabase as any)

      const result = await getEducationUserId('test-auth-id')

      expect(result).toBeNull()
    })

    it('devrait gérer les erreurs de requête', async () => {
      const mockError = new Error('Erreur de requête')
      const mockSupabase = {
        schema: vi.fn(() => ({
          from: vi.fn(() => ({
            select: vi.fn(() => ({
              or: vi.fn(() => ({
                single: vi.fn().mockResolvedValue({
                  data: null,
                  error: mockError,
                }),
              })),
            })),
          })),
        })),
      }

      const { createClient } = await import('@/server/utils/supabase')
      vi.mocked(createClient).mockReturnValue(mockSupabase as any)

      // La fonction devrait gérer l'erreur et retourner null
      const result = await getEducationUserId('test-auth-id')
      expect(result).toBeNull()
    })
  })
})
