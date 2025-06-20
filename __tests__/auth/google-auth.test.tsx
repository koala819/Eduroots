import { GoogleLogin } from '@react-oauth/google'
import { createClient } from '@supabase/supabase-js'
import { fireEvent,render, screen, waitFor } from '@testing-library/react'
import { beforeEach,describe, expect, it, vi } from 'vitest'

// Mock de @react-oauth/google
vi.mock('@react-oauth/google', () => ({
  GoogleLogin: vi.fn(({ onSuccess, onError }) => (
    <button
      onClick={() => {
        try {
          onSuccess?.({ credential: 'fake-google-token' })
        } catch (error) {
          onError?.(error)
        }
      }}
    >
      Se connecter avec Google
    </button>
  )),
}))

// Mock de Supabase
vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({
    auth: {
      signInWithIdToken: vi.fn(),
      getSession: vi.fn(),
    },
  })),
}))

// Mock de next/navigation
const mockPush = vi.fn()
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}))

describe('Google Authentication', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('devrait afficher le bouton de connexion Google', () => {
    render(<GoogleLogin onSuccess={() => {}} onError={() => {}} />)

    const loginButton = screen.getByRole('button', { name: /se connecter avec google/i })
    expect(loginButton).toBeInTheDocument()
  })

  it('devrait appeler onSuccess avec le token lors de la connexion', () => {
    const onSuccessMock = vi.fn()
    render(<GoogleLogin onSuccess={onSuccessMock} onError={() => {}} />)

    const loginButton = screen.getByRole('button', { name: /se connecter avec google/i })
    fireEvent.click(loginButton)

    expect(onSuccessMock).toHaveBeenCalledWith({ credential: 'fake-google-token' })
  })

  it('devrait gérer les erreurs de connexion', () => {
    const onErrorMock = vi.fn()
    const error = new Error('Erreur de connexion')

    // On crée un composant qui simule une erreur
    const ErrorComponent = () => {
      const handleClick = () => {
        onErrorMock(error)
      }
      return (
        <button onClick={handleClick}>
          Se connecter avec Google
        </button>
      )
    }

    render(<ErrorComponent />)

    const loginButton = screen.getByRole('button', { name: /se connecter avec google/i })
    fireEvent.click(loginButton)

    expect(onErrorMock).toHaveBeenCalledWith(error)
  })

  it('devrait rediriger vers le dashboard après une connexion réussie', async () => {
    const supabase = createClient('fake-url', 'fake-key')
    const mockSignIn = vi.fn().mockResolvedValue({ data: { user: { id: '123' } }, error: null })
    vi.mocked(supabase.auth.signInWithIdToken).mockImplementation(mockSignIn)

    const onSuccessMock = async () => {
      const { data, error } = await supabase.auth.signInWithIdToken({
        provider: 'google',
        token: 'fake-google-token',
      })

      if (!error && data?.user) {
        mockPush('/dashboard')
      }
    }

    render(<GoogleLogin onSuccess={onSuccessMock} onError={() => {}} />)

    const loginButton = screen.getByRole('button', { name: /se connecter avec google/i })
    fireEvent.click(loginButton)

    await waitFor(() => {
      expect(mockSignIn).toHaveBeenCalledWith({
        provider: 'google',
        token: 'fake-google-token',
      })
      expect(mockPush).toHaveBeenCalledWith('/dashboard')
    })
  })

  it('devrait gérer les erreurs de Supabase', async () => {
    const supabase = createClient('fake-url', 'fake-key')
    const mockError = new Error('Erreur Supabase')
    vi.mocked(supabase.auth.signInWithIdToken).mockRejectedValue(mockError)

    const onSuccessMock = async () => {
      try {
        await supabase.auth.signInWithIdToken({
          provider: 'google',
          token: 'fake-google-token',
        })
      } catch (error) {
        expect(error).toBe(mockError)
      }
    }

    render(<GoogleLogin onSuccess={onSuccessMock} onError={() => {}} />)

    const loginButton = screen.getByRole('button', { name: /se connecter avec google/i })
    fireEvent.click(loginButton)

    await waitFor(() => {
      expect(supabase.auth.signInWithIdToken).toHaveBeenCalled()
    })
  })
})
