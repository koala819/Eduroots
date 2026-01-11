import { defaultCache } from '@serwist/next/worker'
import type { PrecacheEntry, SerwistGlobalConfig } from 'serwist'
import { Serwist } from 'serwist'

// This declares the value of `injectionPoint` to TypeScript.
// `injectionPoint` is the string that will be replaced by the
// actual precache manifest. By default, this string is set to
// `"self.__SW_MANIFEST"`.
declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined
  }
}

// eslint-disable-next-line no-undef
declare const self: ServiceWorkerGlobalScope

// Version 1.0.4 - Ajout des notifications push
const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: defaultCache,
})

serwist.addEventListeners()

// Gestion des mises à jour
self.addEventListener('activate', (event) => {
  event.waitUntil(
    Promise.all([
      // Supprimer uniquement les anciens caches qui ne sont plus dans le manifest
      caches.keys().then((cacheNames) => {
        const currentCachePrefix = 'serwist-precache'
        return Promise.all(
          cacheNames.map((cacheName) => {
            // Garder les caches Serwist actuels, supprimer les anciens
            if (cacheName.startsWith(currentCachePrefix)) {
              // Vérifier si c'est un cache obsolète en comparant avec le scope
              const currentScope = self.registration.scope
              if (!cacheName.includes(currentScope)) {
                return caches.delete(cacheName)
              }
              return Promise.resolve()
            }
            // Supprimer les autres caches obsolètes (comme 'manifest')
            if (cacheName === 'manifest') {
              return caches.delete(cacheName)
            }
            return Promise.resolve()
          }),
        )
      }),
      // Prendre le contrôle des clients
      self.clients.claim(),
    ]),
  )
})

// Écouter les messages du client (notamment SKIP_WAITING)
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting()
  }
})

// Gestion du manifest.json - Ne pas le mettre en cache pour permettre la vérification de version
self.addEventListener('fetch', (event) => {
  if (event.request.url.includes('/manifest.json')) {
    // Toujours récupérer depuis le réseau pour avoir la dernière version
    event.respondWith(
      fetch(event.request, { cache: 'no-store' })
        .then((response) => {
          // Ne pas mettre en cache pour permettre la détection de nouvelles versions
          return response
        })
        .catch(() => {
          // En cas d'erreur réseau, essayer le cache en dernier recours
          return caches.match(event.request).then((response) => {
            if (response) {
              return response
            }
            throw new Error('The cached response that was expected is missing.')
          })
        }),
    )
  }
})
