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
      return { data: null, error: 'Erreur d\'authentification' }
    }

    if (!skipAuthCheck && !user) {
      console.error('Session non authentifiée')
      return { data: null, error: 'Session non authentifiée' }
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
        error: `Erreur ${res.status}: ${errorText || res.statusText}`,
      }
    }

    const data = await res.json()
    // console.log('fetchWithAuth res', data)

    return { data, error: null }
  } catch (error: any) {
    console.error('Erreur lors de la requête:', error)
    return {
      data: null,
      error: error.message || 'Erreur inconnue lors de la requête',
    }
  }
}
