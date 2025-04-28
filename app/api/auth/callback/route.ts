import { NextRequest, NextResponse } from 'next/server'

import { google } from 'googleapis'
import { setCookie } from 'nookies'

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI,
)

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const code = searchParams.get('code')

  if (!code) {
    console.error('No code provided')
    return NextResponse.json({ error: 'No code provided' }, { status: 400 })
  }

  try {
    const { tokens } = await oauth2Client.getToken(code as string)
    console.log('Authentication tokens received successfully')
    oauth2Client.setCredentials(tokens)

    if (!tokens.access_token) {
      throw new Error('No access token received')
    }

    const res = NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_CLIENT_URL}/home`,
    )
    setCookie({ res }, 'accessToken', tokens.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV !== 'development',
      path: '/',
      maxAge: 60 * 60 * 24 * 30, // 30 jours
    })

    return res
  } catch (error) {
    console.error('Error exchanging code for tokens:', error)
    return NextResponse.json(
      { error: 'Failed to exchange code for tokens' },
      { status: 500 },
    )
  }
}
