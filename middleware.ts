import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'

const SU_ROLE = 'admin'
const ADMIN_ROLES = ['admin', 'bureau']
const TEACHER_ROLE = 'teacher'
const STUDENT_ROLE = 'family'

// Routes qui ne nécessitent pas d'authentification
const PUBLIC_ROUTES = ['/', '/link-account', '/auth/callback']

const SU_ROUTES = ['/admin/root/logs']
const ADMIN_ROUTES = ['/admin']
const TEACHER_ROUTES = ['/teacher']
const STUDENT_ROUTES = ['/family']

export async function middleware(req: NextRequest) {
  const response = NextResponse.next()
  const cookieStore = await cookies()

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options)
          })
        },
      },
    },
  )

  const pathname = req.nextUrl.pathname

  // Si c'est une route publique, on laisse passer
  if (PUBLIC_ROUTES.some((route) => pathname.startsWith(route))) {
    return response
  }

  // Vérifier l'utilisateur de manière sécurisée
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    console.log(
      'Middleware - Pas d\'utilisateur authentifié, redirection vers /',
    )
    return NextResponse.redirect(new URL('/', req.url))
  }

  // Récupérer le rôle depuis les métadonnées utilisateur
  const userRole = user.user_metadata?.role

  if (!userRole) {
    return NextResponse.redirect(
      new URL('/unauthorized?error=AccessDenied', req.url),
    )
  }

  // Vérification des routes SuperUser (SU)
  if (SU_ROUTES.some((route) => pathname.startsWith(route))) {
    if (userRole !== SU_ROLE) {
      return NextResponse.redirect(
        new URL('/unauthorized?error=AccessDenied', req.url),
      )
    }
  }

  // Vérification des routes admin
  else if (ADMIN_ROUTES.some((route) => pathname.startsWith(route))) {
    if (!ADMIN_ROLES.includes(userRole)) {
      return NextResponse.redirect(
        new URL('/unauthorized?error=AccessDenied', req.url),
      )
    }
  }

  // Vérification des routes teacher
  else if (TEACHER_ROUTES.some((route) => pathname.startsWith(route))) {
    if (userRole !== TEACHER_ROLE) {
      return NextResponse.redirect(
        new URL('/unauthorized?error=AccessDenied', req.url),
      )
    }
  }

  // Vérification des routes family
  else if (STUDENT_ROUTES.some((route) => pathname.startsWith(route))) {
    if (userRole !== STUDENT_ROLE) {
      return NextResponse.redirect(
        new URL('/unauthorized?error=AccessDenied', req.url),
      )
    }
  }

  // Gérer l'IP
  const ip =
    req.headers.get('x-forwarded-for') ||
    req.headers.get('x-real-ip') ||
    req.nextUrl.hostname
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
