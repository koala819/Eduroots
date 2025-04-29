import {getSession} from 'next-auth/react'

export async function fetchWithAuth(
  url: string | URL,
  {
    method,
    body,
    noHeader,
    skipAuthCheck = false,
  }: {
    method: string
    body?: any
    noHeader?: boolean
    skipAuthCheck?: boolean
  },
) {
  try {
    const session = await getSession()

    if (!skipAuthCheck && (!session || !session.user)) {
      console.error('Session non authentifiée')
      return null
    }

    const finalUrl =
      url instanceof URL ? url : new URL(`${process.env.NEXT_PUBLIC_CLIENT_URL}${url}`)

    const headers: Record<string, string> = {
      ...(noHeader ? {} : {'Content-Type': 'application/json'}),
    }

    const options = {
      method,
      headers,
      body: body ? (noHeader ? body : JSON.stringify(body)) : undefined,
    }
    // console.log(`Fetching: ${finalUrl}`); // Pour debug

    const res = await fetch(finalUrl, options)

    if (res.status !== 200) {
      console.log('error in fetchWithAuth', res.statusText)
      return null
    } else {
      const datares = await res.json()
      // console.log('fetchWithAuth res', datares)

      return datares
    }
  } catch (error: any) {
    console.error('Error fetching data:', error)
    return null
  }
}
