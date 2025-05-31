import {getToken} from 'next-auth/jwt'
import type {NextRequest} from 'next/server'
import {NextResponse} from 'next/server'

const SU_ROLE = 'admin'
const ADMIN_ROLES = ['admin', 'bureau']
const TEACHER_ROLE = 'teacher'
const STUDENT_ROLE = 'student'

const SU_ROUTES = ['/admin/root/logs']
const ADMIN_ROUTES = ['/admin', '/admin/register', '/admin/student', '/admin/teacher']
const TEACHER_ROUTES = ['/teacher', '/teacher/attendance']
const STUDENT_ROUTES = ['/family']



export async function middleware(req: NextRequest) {
  const token = await getToken({req, secret: process.env.NEXTAUTH_SECRET})
  if (!token) {
    return NextResponse.redirect(new URL('/', req.url))
  }

  const userRole = (token.user as {role?: string})?.role ?? ''
  const pathname = req.nextUrl.pathname


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

  // Vérification des routes family
  else if (
    STUDENT_ROUTES.some((route) => pathname.startsWith(route))
  ) {
    if (userRole !== STUDENT_ROLE) {
      return NextResponse.redirect(new URL('/unauthorized?error=AccessDenied', req.url))
    }
  }

  // Pour obtenir l'adresse IP et les autres informations requises
  const ip =
    req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || req.nextUrl.hostname
  req.headers.set('x-real-ip', ip)

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/teacher/:path*',
    '/family/:path*',
    '/admin/logs',
  ],
}
