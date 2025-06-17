import { NextRequest, NextResponse } from 'next/server'

import { createClient } from '@/server/utils/supabase'
import { Database } from '@/types/db'

export async function GET() {
  try {
    const supabase = await createClient()

    const { data: logs, error } = await supabase
      .schema('logs')
      .from('connection_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100)

    if (error) {
      console.error('Error fetching connection logs:', error)
      return NextResponse.json({
        status: 500,
        message: 'Error fetching connection logs',
      })
    }

    return NextResponse.json({
      status: 200,
      logs: logs,
    })
  } catch (error) {
    console.error('Error fetching connection logs:', error)
    return NextResponse.json({
      status: 500,
      message: 'Error fetching connection logs',
    })
  }
}

export async function POST(req: NextRequest) {
  try {

    const body = await req.json()
    const { user, isSuccessful, userAgent } = body

    const supabase = await createClient()
    const { data: userData, error: userError } = await supabase
      .schema('education')
      .from('users')
      .select('firstname, lastname, email, role')
      .eq('id', user.Id)
      .single()

    if (userError) {
      console.error('Error fetching user:', userError)
      return NextResponse.json({
        status: 500,
        message: 'Error fetching user',
      })
    }

    const logData: Database['logs']['Tables']['connection_logs']['Insert'] = {
      user_id: user.Id,
      is_successful: isSuccessful,
      timestamp: new Date(),
      user_agent: userAgent,
      firstname: userData.firstname,
      lastname: userData.lastname,
      email: userData.email,
      role: userData.role,
    }
    // console.log('\n\n\nlogData', logData)

    const { error: logError } = await supabase
      .schema('logs')
      .from('connection_logs')
      .insert(logData)

    if (logError) {
      console.error('Error logging connection attempt:', logError)
      return NextResponse.json({
        status: 500,
        message: 'Error logging connection attempt',
      })
    }

    return NextResponse.json({
      status: 200,
      statusText: 'Connection attempt logged',
    })
  } catch (error) {
    console.error('Error logging connection attempt:', error)
    if (error instanceof Error) {
      console.error('Error details:', error.message)
    }
    return NextResponse.json({
      status: 500,
      statusText: 'Error logging connection attempt',
    })
  }
}
