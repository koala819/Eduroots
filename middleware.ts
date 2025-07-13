import { createServerClient } from '@supabase/ssr'
import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

export async function middleware(req: NextRequest) {
  const pathname = req.nextUrl.pathname

  // Exclure TOUS les fichiers statiques et PWA
  if (
    pathname.startsWith('/_next/') ||
    pathname === '/manifest.json' ||
    pathname === '/sw.js' ||
    pathname.startsWith('/icon-') ||
    pathname.startsWith('/touch-icon-') ||
    pathname === '/splash.png' ||
    pathname === '/favicon.ico' ||
    pathname.match(/\.(svg|png|jpg|jpeg|gif|webp|woff|woff2|ttf|eot|css|js)$/)
  ) {
    return NextResponse.next()
  }

  // Logique d'authentification simplifiée
  let response = NextResponse.next({
    request: {
      headers: req.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return req.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options)
          })
        },
      },
    },
  )

  // Routes publiques
  const PUBLIC_ROUTES = [
    '/link-account',
    '/auth',
    '/unauthorized',
    '/forgot-password',
    '/write-new-password',
    '/terms',
    '/license',
  ]

  // Si c'est la page d'accueil ou une route publique
  if (pathname === '/' || PUBLIC_ROUTES.some((route) => pathname.startsWith(route))) {
    await supabase.auth.getSession()
    return response
  }

  // Vérification de l'authentification
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
    return NextResponse.redirect(
      new URL('/unauthorized?error=AccessDenied', req.url),
    )
  }

  // Vérification des autorisations par rôle
  const ADMIN_ROLES = ['admin', 'bureau']
  const ADMIN_ROUTES = ['/admin']
  const TEACHER_ROUTES = ['/teacher']
  const STUDENT_ROUTES = ['/family']

  // Vérification des routes admin
  if (ADMIN_ROUTES.some((route) => pathname.startsWith(route))) {
    if (!ADMIN_ROLES.includes(userRole)) {
      return NextResponse.redirect(
        new URL('/unauthorized?error=AccessDenied', req.url),
      )
    }
    return response
  }

  // Vérification des routes teacher
  if (TEACHER_ROUTES.some((route) => pathname.startsWith(route))) {
    if (userRole !== 'teacher') {
      return NextResponse.redirect(
        new URL('/unauthorized?error=AccessDenied', req.url),
      )
    }
    return response
  }

  // Vérification des routes family
  if (STUDENT_ROUTES.some((route) => pathname.startsWith(route))) {
    if (userRole !== 'student') {
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
     * - _next/webpack-hmr (hot module replacement)
     * - favicon.ico (favicon file)
     * - manifest.json (PWA manifest)
     * - sw.js (service worker)
     * - public folder assets (images, etc.)
     */
    // eslint-disable-next-line max-len
    '/((?!_next/static|_next/image|_next/webpack-hmr|favicon.ico|manifest.json|sw.js|icon-|touch-icon-|splash.png).*)',
  ],
}
