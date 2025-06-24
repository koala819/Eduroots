import { vi } from 'vitest'

export interface MockSupabaseOptions {
  data?: any
  error?: any
  throwError?: boolean
}

export function createMockSupabase(options: MockSupabaseOptions = {}) {
  const { data = [], error = null, throwError = false } = options

  if (throwError) {
    return {
      schema: vi.fn().mockImplementation(() => {
        throw new Error('Erreur Supabase')
      }),
    }
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
    single: vi.fn().mockResolvedValue({ data: null, error: null }),
    limit: vi.fn().mockReturnThis(),
    order: vi.fn().mockResolvedValue({ data, error }),
  }
}

export function createMockSessionServer(options: MockSupabaseOptions = {}) {
  return {
    supabase: createMockSupabase(options),
    user: { id: 'test-user-id' } as any,
  }
}

export function createMockAuthUser(overrides: any = {}) {
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
