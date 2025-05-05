import {reducer, toast} from '@/hooks/use-toast'

describe('toast (hook et logique)', () => {
  it('ajoute un toast et le retrouve dans le state', () => {
    const action = toast({
      title: 'Titre',
      description: 'Description',
      variant: 'destructive',
    })
    // On simule le state après ajout
    const state = reducer(
      {toasts: []},
      {
        type: 'ADD_TOAST',
        toast: {
          id: action.id,
          title: 'Titre',
          description: 'Description',
          variant: 'destructive',
          open: true,
          onOpenChange: expect.any(Function),
        },
      },
    )
    expect(state.toasts.length).toBe(1)
    expect(state.toasts[0].title).toBe('Titre')
    expect(state.toasts[0].description).toBe('Description')
    expect(state.toasts[0].variant).toBe('destructive')
  })

  it('ferme et supprime un toast', () => {
    const action = toast({
      title: 'À supprimer',
      description: 'Desc',
      variant: 'default',
    })
    let state = reducer(
      {toasts: []},
      {
        type: 'ADD_TOAST',
        toast: {
          id: action.id,
          title: 'À supprimer',
          description: 'Desc',
          variant: 'default',
          open: true,
          onOpenChange: expect.any(Function),
        },
      },
    )
    // Simule la fermeture
    state = reducer(state, {type: 'DISMISS_TOAST', toastId: action.id})
    expect(state.toasts[0].open).toBe(false)
    // Simule la suppression
    state = reducer(state, {type: 'REMOVE_TOAST', toastId: action.id})
    expect(state.toasts.length).toBe(0)
  })
})
