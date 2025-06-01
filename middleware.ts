import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { createClient } from './utils/supabase/middleware'

const SU_ROLE = 'admin'
const ADMIN_ROLES = ['admin', 'bureau']
const TEACHER_ROLE = 'teacher'
const STUDENT_ROLE = 'student'

const SU_ROUTES = ['/admin/root/logs']
const ADMIN_ROUTES = ['/admin', '/admin/register', '/admin/student', '/admin/teacher']
const TEACHER_ROUTES = ['/teacher', '/teacher/attendance']
const STUDENT_ROUTES = ['/student']

export async function middleware(req: NextRequest) {
  const { response, supabase } = await createClient(req)

  // Vérifier la session
  const { data: { session } } = await supabase.auth.getSession()
  const pathname = req.nextUrl.pathname

  if (!session) {
    return NextResponse.redirect(new URL('/', req.url))
  }

  const userRole = session.user.user_metadata.role

  // Vérification des routes SuperUser (SU)
  if (SU_ROUTES.some((route) => pathname.startsWith(route))) {
    if (userRole !== SU_ROLE) {
      return NextResponse.redirect(new URL('/unauthorized?error=AccessDenied', req.url))
    }
  }

  // Vérification des routes admin
  else if (
    ADMIN_ROUTES.some((route) => pathname.startsWith(route))
  ) {
    if (!ADMIN_ROLES.includes(userRole)) {
      return NextResponse.redirect(new URL('/unauthorized?error=AccessDenied', req.url))
    }
  }

  // Vérification des routes teacher
  else if (
    TEACHER_ROUTES.some((route) => pathname.startsWith(route))
  ) {
    if (userRole !== TEACHER_ROLE) {
      return NextResponse.redirect(new URL('/unauthorized?error=AccessDenied', req.url))
    }
  }

  // Vérification des routes student
  else if (
    STUDENT_ROUTES.some((route) => pathname.startsWith(route))
  ) {
    if (userRole !== STUDENT_ROLE) {
      return NextResponse.redirect(new URL('/unauthorized?error=AccessDenied', req.url))
    }
  }

  // Gérer l'IP
  const ip =
    req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || req.nextUrl.hostname
  req.headers.set('x-real-ip', ip)


  return response
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/teacher/:path*',
    '/student/:path*',
    '/admin/logs',
  ],
}
