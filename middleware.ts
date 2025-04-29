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
const STUDENT_ROUTES = ['/student']

// Définir des routes de messages spécifiques à chaque rôle
const ADMIN_MESSAGE_ROUTES = [
  '/admin/messages',
  '/admin/messages/inbox',
  '/admin/messages/sent',
  '/admin/messages/write',
]
const TEACHER_MESSAGE_ROUTES = [
  '/teacher/messages',
  '/teacher/messages/inbox',
  '/teacher/messages/sent',
  '/teacher/messages/write',
]
const STUDENT_MESSAGE_ROUTES = [
  '/student/messages',
  '/student/messages/inbox',
  '/student/messages/sent',
  '/student/messages/write',
]

export async function middleware(req: NextRequest) {
  const token = await getToken({req, secret: process.env.NEXTAUTH_SECRET})
  if (!token) {
    return NextResponse.redirect(new URL('/', req.url))
  }

  const userRole = (token.user as {role?: string})?.role ?? ''
  const pathname = req.nextUrl.pathname

  // Redirection pour les routes racines de messages selon le rôle
  if (pathname === '/messages') {
    // Rediriger vers la boîte de réception appropriée selon le rôle
    if (ADMIN_ROLES.includes(userRole)) {
      return NextResponse.redirect(new URL('/admin/messages/inbox', req.url))
    } else if (userRole === TEACHER_ROLE) {
      return NextResponse.redirect(new URL('/teacher/messages/inbox', req.url))
    } else if (userRole === STUDENT_ROLE) {
      return NextResponse.redirect(new URL('/student/messages/inbox', req.url))
    } else {
      return NextResponse.redirect(new URL('/unauthorized?error=AccessDenied', req.url))
    }
  }

  // Redirections pour les pages de messages racines de chaque rôle
  if (pathname === '/admin/messages') {
    return NextResponse.redirect(new URL('/admin/messages/inbox', req.url))
  }
  if (pathname === '/teacher/messages') {
    return NextResponse.redirect(new URL('/teacher/messages/inbox', req.url))
  }
  if (pathname === '/student/messages') {
    return NextResponse.redirect(new URL('/student/messages/inbox', req.url))
  }

  // Vérification des routes SuperUser (SU)
  if (SU_ROUTES.some((route) => pathname.startsWith(route))) {
    if (userRole !== SU_ROLE) {
      return NextResponse.redirect(new URL('/unauthorized?error=AccessDenied', req.url))
    }
  }

  // Vérification des routes admin
  else if (
    ADMIN_ROUTES.some((route) => pathname.startsWith(route)) ||
    ADMIN_MESSAGE_ROUTES.some((route) => pathname.startsWith(route))
  ) {
    if (!ADMIN_ROLES.includes(userRole)) {
      return NextResponse.redirect(new URL('/unauthorized?error=AccessDenied', req.url))
    }
  }

  // Vérification des routes teacher
  else if (
    TEACHER_ROUTES.some((route) => pathname.startsWith(route)) ||
    TEACHER_MESSAGE_ROUTES.some((route) => pathname.startsWith(route))
  ) {
    if (userRole !== TEACHER_ROLE) {
      return NextResponse.redirect(new URL('/unauthorized?error=AccessDenied', req.url))
    }
  }

  // Vérification des routes student
  else if (
    STUDENT_ROUTES.some((route) => pathname.startsWith(route)) ||
    STUDENT_MESSAGE_ROUTES.some((route) => pathname.startsWith(route))
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
    '/student/:path*',
    '/messages/:path*',
    '/admin/logs',
  ],
}
