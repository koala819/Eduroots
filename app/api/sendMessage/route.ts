import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization')
    const body = await req.json()

    const res = await fetch(`${process.env.NEXT_PUBLIC_SERVER_URL}/conversations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(authHeader ? { Authorization: authHeader } : {}),
      },
      body: JSON.stringify(body),
    })
    if (!res.ok) {
      const errorText = await res.text()
      return NextResponse.json({ success: false, error: errorText }, { status: res.status })
    }
    const data = await res.json()
    return NextResponse.json({ success: true, result: data })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
