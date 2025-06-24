import { expect, vi } from 'vitest'

import type { ApiResponse } from '@/types/api'

// Types pour les mocks
type AuthenticatedUser = {
  id: string
  email: string
  user_metadata: { role: string }
  app_metadata: Record<string, unknown>
  aud: string
  created_at: string
  updated_at: string
}

type SupabaseError = {
  message: string
  details?: string
  hint?: string
  code?: string
} | null

type SupabaseResponse<T> = {
  data: T | null
  error: SupabaseError
}

type MockSupabaseClient = {
  schema: ReturnType<typeof vi.fn>
  from: ReturnType<typeof vi.fn>
  select: ReturnType<typeof vi.fn>
  insert: ReturnType<typeof vi.fn>
  update: ReturnType<typeof vi.fn>
  delete: ReturnType<typeof vi.fn>
  eq: ReturnType<typeof vi.fn>
  gte: ReturnType<typeof vi.fn>
  lte: ReturnType<typeof vi.fn>
  in: ReturnType<typeof vi.fn>
  single: ReturnType<typeof vi.fn>
  limit: ReturnType<typeof vi.fn>
  order: ReturnType<typeof vi.fn>
}

interface MockSupabaseOptions {
  data?: unknown[]
  error?: SupabaseError
  throwError?: boolean
  singleData?: unknown
  orderData?: unknown[]
}

interface MockSessionServerOptions {
  user?: AuthenticatedUser
  supabaseOptions?: MockSupabaseOptions
}

interface MockAuthUserOptions {
  id?: string
  email?: string
  role?: string
  metadata?: Record<string, unknown>
}

// Mock Supabase centralisé
export function createMockSupabase(options: MockSupabaseOptions = {}): MockSupabaseClient {
  const {
    error = null,
    throwError = false,
    singleData = null,
    orderData = [],
  } = options

  if (throwError) {
    return {
      schema: vi.fn().mockImplementation(() => {
        throw new Error('Erreur Supabase')
      }),
    } as MockSupabaseClient
  }

  return {
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
    single: vi.fn().mockResolvedValue({ data: singleData, error } as SupabaseResponse<unknown>),
    limit: vi.fn().mockResolvedValue({ data: orderData, error } as SupabaseResponse<unknown[]>),
    order: vi.fn().mockResolvedValue({ data: orderData, error } as SupabaseResponse<unknown[]>),
  }
}

// Mock SessionServer centralisé
export function createMockSessionServer(options: MockSessionServerOptions = {}) {
  const {
    user = {
      id: 'test-user-id',
      email: 'teacher@test.com',
      user_metadata: { role: 'teacher' },
      app_metadata: {},
      aud: 'authenticated',
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
    } as AuthenticatedUser,
    supabaseOptions = {},
  } = options

  return {
    supabase: createMockSupabase(supabaseOptions),
    user,
  }
}

// Mock AuthUser centralisé
export function createMockAuthUser(overrides: MockAuthUserOptions = {}): AuthenticatedUser {
  return {
    id: 'test-auth-user-id',
    email: 'teacher@test.com',
    user_metadata: { role: 'teacher' },
    app_metadata: {},
    aud: 'authenticated',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    ...overrides,
  }
}

// Fonctions utilitaires pour les tests avec les vrais types
export const testUtils = {
  // Vérifier la structure de réponse standard
  expectStandardResponse: (result: ApiResponse) => {
    expect(result).toHaveProperty('success')
    expect(result).toHaveProperty('message')
    expect(result).toHaveProperty('data')
    expect(typeof result.success).toBe('boolean')
    expect(typeof result.message).toBe('string')
  },

  // Vérifier une réponse de succès
  expectSuccessResponse: (result: ApiResponse, expectedMessage?: string) => {
    expect(result.success).toBe(true)
    if (expectedMessage) {
      expect(result.message).toBe(expectedMessage)
    }
  },

  // Vérifier une réponse d'erreur
  expectErrorResponse: (result: ApiResponse, expectedMessage?: string) => {
    expect(result.success).toBe(false)
    if (expectedMessage) {
      expect(result.message).toBe(expectedMessage)
    }
  },
}

// Types d'export pour les mocks
export type MockSupabase = ReturnType<typeof createMockSupabase>
export type MockSessionServer = ReturnType<typeof createMockSessionServer>
export type MockAuthUser = ReturnType<typeof createMockAuthUser>
