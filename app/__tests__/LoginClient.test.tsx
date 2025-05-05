// Crée un mock partagé pour le toast
const toastMock = jest.fn()

jest.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: toastMock,
    dismiss: jest.fn(),
    toasts: [],
  }),
}))

import React from 'react'
import {render, screen, fireEvent, waitFor} from '@testing-library/react'
import '@testing-library/jest-dom'
import * as authActions from '@/app/actions/auth'
import * as toastHook from '@/hooks/use-toast'
import * as nextNavigation from 'next/navigation'
import userEvent from '@testing-library/user-event'

// Mock du motion.div de framer-motion pour éviter les erreurs d'animation en test
jest.mock('framer-motion', () => ({
  motion: {
    div: (props: any) => <div {...props} />,
  },
}))

// Mock des hooks et fonctions externes
jest.mock('next/navigation', () => ({
  useRouter: () => ({push: jest.fn()}),
}))
jest.mock('@/hooks/use-toast', () => ({
  useToast: () => ({toast: jest.fn()}),
}))
jest.mock('@/app/actions/auth', () => ({
  loginAction: jest.fn(() => Promise.resolve({success: true, status: 200})),
}))
jest.mock('next-auth/react', () => ({
  signIn: jest.fn(() => Promise.resolve({})),
}))

// Mock global pour window.matchMedia (jsdom)
beforeAll(() => {
  window.matchMedia =
    window.matchMedia ||
    function () {
      return {
        matches: false,
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        addListener: jest.fn(), // deprecated
        removeListener: jest.fn(), // deprecated
        dispatchEvent: jest.fn(),
      }
    }
})

// Test principal
describe('LoginClient', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    toastMock.mockClear()
  })

  it('affiche les champs du formulaire et permet la soumission', async () => {
    const {LoginClient} = await import('../../components/molecules/client/Login')
    render(<LoginClient />)

    // Vérifie la présence des champs
    expect(screen.getByPlaceholderText(/nom@email\.com/i)).toBeInTheDocument()
    expect(screen.getByPlaceholderText(/•{4,}/i)).toBeInTheDocument()
    expect(screen.getByText(/Je suis/i)).toBeInTheDocument()
    expect(screen.getByRole('button', {name: /Se connecter/i})).toBeInTheDocument()

    // Sélection du rôle (simulateur de Select)
    fireEvent.change(screen.getByRole('combobox'), {target: {value: 'admin'}})
    await waitFor(() => expect(screen.getByRole('combobox')).toHaveValue('admin'))
    fireEvent.change(screen.getByPlaceholderText(/nom@email\.com/i), {
      target: {value: 'test@email.com'},
    })
    await waitFor(() =>
      expect(screen.getByPlaceholderText(/nom@email\.com/i)).toHaveValue('test@email.com'),
    )
    fireEvent.change(screen.getByPlaceholderText(/•{4,}/i), {target: {value: 'motdepasse123'}})
    await waitFor(() => expect(screen.getByPlaceholderText(/•{4,}/i)).toHaveValue('motdepasse123'))

    // Soumettre le formulaire
    fireEvent.click(screen.getByRole('button', {name: /Se connecter/i}))

    // Attendre la fin de la soumission
    await waitFor(() => {
      expect(screen.getByRole('button', {name: /Se connecter/i})).not.toBeDisabled()
    })
  })

  it('affiche une erreur si un champ obligatoire est vide', async () => {
    const {LoginClient} = await import('../../components/molecules/client/Login')
    render(<LoginClient />)
    fireEvent.click(screen.getByRole('button', {name: /Se connecter/i}))
    await waitFor(() => {
      expect(screen.getAllByText(/obligatoire|choix|doit contenir/i).length).toBeGreaterThan(0)
    })
  })

  it('affiche une erreur si les identifiants sont incorrects', async () => {
    jest.spyOn(authActions, 'loginAction').mockImplementationOnce(() =>
      Promise.resolve({
        success: false,
        error: 'CredentialsSignin',
        message: 'Identifiants incorrects. Veuillez réessayer',
      }),
    )
    const {LoginClient} = await import('../../components/molecules/client/Login')
    const user = userEvent.setup()
    render(<LoginClient />)
    console.log('Après render:', document.body.innerHTML)
    await user.click(screen.getByTestId('role-combobox'))
    const adminOption = await screen.findByTestId('role-admin')
    console.log('Option admin trouvée:', adminOption ? adminOption.outerHTML : 'Non trouvée')
    await user.click(adminOption)
    console.log('Après click role-admin:', document.body.innerHTML)
    fireEvent.change(screen.getByTestId('login-email'), {target: {value: 'test@email.com'}})
    console.log('Après change email:', document.body.innerHTML)
    fireEvent.change(screen.getByTestId('login-password'), {target: {value: 'motdepasse123'}})
    console.log('Après change password:', document.body.innerHTML)
    fireEvent.click(screen.getByTestId('login-submit'))
    console.log('Après submit:', document.body.innerHTML)
    await waitFor(() => {
      expect(toastMock).toHaveBeenCalledWith(
        expect.objectContaining({
          variant: 'destructive',
          title: 'Erreur de connexion',
          description: expect.stringMatching(/Identifiants incorrects/),
        }),
      )
    })
  })

  // it('affiche une erreur générique si le backend renvoie une erreur inconnue', async () => {
  //     ...
  // })

  // it('affiche un message et redirige si le mot de passe par défaut est détecté', async () => {
  //     ...
  // })

  // it('affiche une erreur si le rôle n\'est pas sélectionné', async () => {
  //     ...
  // })

  it('affiche le DOM après le rendu', async () => {
    const {LoginClient} = await import('../../components/molecules/client/Login')
    render(<LoginClient />)
    console.log(document.body.innerHTML)
  })
})
