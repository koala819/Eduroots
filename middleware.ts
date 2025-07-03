import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

const SU_ROLE = 'admin'
const ADMIN_ROLES = ['admin', 'bureau']
const TEACHER_ROLE = 'teacher'
const STUDENT_ROLE = 'student'

// Routes qui ne nécessitent pas d'authentification
const PUBLIC_ROUTES = [
  '/link-account',
  '/auth',
  '/unauthorized',
  '/forgot-password',
  '/write-new-password',
  '/terms',
  '/license',
]

const SU_ROUTES = ['/admin/root/logs']
const ADMIN_ROUTES = ['/admin']
const TEACHER_ROUTES = ['/teacher']
const STUDENT_ROUTES = ['/family']

export async function middleware(req: NextRequest) {
  // PARTIE 1: Gestion des sessions Supabase
  let response = NextResponse.next({
    request: {
      headers: req.headers,
    },
  })

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

  // Si c'est la page d'accueil ou une route publique
  if (pathname === '/' || PUBLIC_ROUTES.some((route) => pathname.startsWith(route))) {
    await supabase.auth.getSession()
    return response
  }

  // PARTIE 2: Vérification de l'authentification
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    return NextResponse.redirect(new URL('/', req.url))
  }

  // Récupérer le rôle depuis les métadonnées utilisateur
  const userRole = user.user_metadata?.role

  if (!userRole) {
    console.log('❌ Middleware - Pas de rôle dans les métadonnées')
    return NextResponse.redirect(
      new URL('/unauthorized?error=AccessDenied', req.url),
    )
  }

  // PARTIE 3: Vérification des autorisations par rôle

  // Vérification des routes SuperUser (SU)
  if (SU_ROUTES.some((route) => pathname.startsWith(route))) {
    if (userRole !== SU_ROLE) {
      console.log('❌ SU Access denied for role:', userRole)
      return NextResponse.redirect(
        new URL('/unauthorized?error=AccessDenied', req.url),
      )
    }
    return response
  }

  // Vérification des routes admin
  if (ADMIN_ROUTES.some((route) => pathname.startsWith(route))) {
    if (!ADMIN_ROLES.includes(userRole)) {
      console.log('❌ Admin Access denied for role:', userRole)
      return NextResponse.redirect(
        new URL('/unauthorized?error=AccessDenied', req.url),
      )
    }
    return response
  }

  // Vérification des routes teacher
  if (TEACHER_ROUTES.some((route) => pathname.startsWith(route))) {
    if (userRole !== TEACHER_ROLE) {
      console.log('❌ Teacher Access denied for role:', userRole)
      return NextResponse.redirect(
        new URL('/unauthorized?error=AccessDenied', req.url),
      )
    }
    return response
  }

  // Vérification des routes family
  if (STUDENT_ROUTES.some((route) => pathname.startsWith(route))) {
    if (userRole !== STUDENT_ROLE) {
      console.log('❌ Family Access denied for role:', userRole)
      return NextResponse.redirect(
        new URL('/unauthorized?error=AccessDenied', req.url),
      )
    }
    return response
  }
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
     * - images (svg, png, jpg, etc.)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
