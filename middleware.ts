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
  const pathname = req.nextUrl.pathname

  // Si c'est la page d'accueil, on laisse passer
  if (pathname === '/') {
    return response
  }

  // Vérifier l'utilisateur de manière sécurisée
  const { data: { user }, error } = await supabase.auth.getUser()
  // const pathname = req.nextUrl.pathname

  // console.log('Middleware - pathname:', pathname)
  // console.log('Middleware - user:', user?.email)

  if (error || !user) {
    console.log('Middleware - Pas d\'utilisateur authentifié, redirection vers /')
    return NextResponse.redirect(new URL('/', req.url))
  }

  // Récupérer le rôle depuis les métadonnées utilisateur
  const userRole = user.user_metadata?.role
  // console.log('Middleware - userRole from metadata:', userRole)

  if (!userRole) {
    console.log('Middleware - Aucun rôle trouvé dans les métadonnées')
    return NextResponse.redirect(new URL('/unauthorized?error=AccessDenied', req.url))
  }

  // Vérification des routes SuperUser (SU)
  if (SU_ROUTES.some((route) => pathname.startsWith(route))) {
    console.log('Middleware - Route SU détectée')
    if (userRole !== SU_ROLE) {
      // console.log(`Middleware - Accès refusé SU. Role: ${userRole}, requis: ${SU_ROLE}`)
      return NextResponse.redirect(new URL('/unauthorized?error=AccessDenied', req.url))
    }
  }

  // Vérification des routes admin
  else if (
    ADMIN_ROUTES.some((route) => pathname.startsWith(route))
  ) {
    console.log('Middleware - Route ADMIN détectée')
    if (!ADMIN_ROLES.includes(userRole)) {
      // console.log(`Middleware - Accès refusé ADMIN. Role: ${userRole}`)
      return NextResponse.redirect(new URL('/unauthorized?error=AccessDenied', req.url))
    }
  }

  // Vérification des routes teacher
  else if (
    TEACHER_ROUTES.some((route) => pathname.startsWith(route))
  ) {
    console.log('Middleware - Route TEACHER détectée')
    if (userRole !== TEACHER_ROLE) {
      // console.log(`Middleware - Accès refusé TEACHER. Role: ${userRole}`)
      return NextResponse.redirect(new URL('/unauthorized?error=AccessDenied', req.url))
    }
  }

  // Vérification des routes student
  else if (
    STUDENT_ROUTES.some((route) => pathname.startsWith(route))
  ) {
    console.log('Middleware - Route STUDENT détectée')
    if (userRole !== STUDENT_ROLE) {
      // console.log(`Middleware - Accès refusé STUDENT. Role: ${userRole}`)
      return NextResponse.redirect(new URL('/unauthorized?error=AccessDenied', req.url))
    }
  }

  // console.log('Middleware - Accès autorisé, poursuite de la requête')

  // Gérer l'IP
  const ip = req.headers.get('x-forwarded-for')
    || req.headers.get('x-real-ip')
    || req.nextUrl.hostname
  req.headers.set('x-real-ip', ip)

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public/).*)',
  ],
}
