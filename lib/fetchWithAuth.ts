import { createClient } from '@/utils/supabase/server'

type FetchOptions = {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'
  body?: any
  noHeader?: boolean
  skipAuthCheck?: boolean
}

type FetchResponse<T = any> = {
  data: T | null
  error: string | null
}

export async function fetchWithAuth<T = any>(
  url: string | URL,
  {
    method,
    body,
    noHeader,
    skipAuthCheck = false,
  }: FetchOptions,
): Promise<FetchResponse<T>> {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError) {
      console.error('Erreur d\'authentification:', authError.message)
      return { data: null, error: 'Erreur lors de la vérification de l\'authentification' }
    }

    if (!skipAuthCheck && !user) {
      console.error('Session non authentifiée')
      return { data: null, error: 'Veuillez vous connecter pour accéder à cette fonctionnalité' }
    }

    const finalUrl =
      url instanceof URL ? url : new URL(`${process.env.NEXT_PUBLIC_CLIENT_URL}${url}`)

    const headers: Record<string, string> = {
      ...(noHeader ? {} : { 'Content-Type': 'application/json' }),
      ...(user ? { 'Authorization': `Bearer ${user.id}` } : {}),
    }

    const options = {
      method,
      headers,
      body: body ? (noHeader ? body : JSON.stringify(body)) : undefined,
    }
    // console.log(`Fetching: ${finalUrl}`); // Pour debug

    const res = await fetch(finalUrl, options)

    if (!res.ok) {
      const errorText = await res.text()
      console.error(`Erreur HTTP ${res.status}:`, errorText)
      return {
        data: null,
        error: `Erreur lors de la requête: ${errorText || res.statusText}`,
      }
    }

    const data = await res.json()
    // console.log('fetchWithAuth res', data)

    return { data, error: null }
  } catch (error: any) {
    console.error('Erreur lors de la requête:', error)
    return {
      data: null,
      error: 'Une erreur est survenue lors de la requête. Veuillez réessayer.',
    }
  }
}
