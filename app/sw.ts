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
      // Supprimer les anciens caches
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            return caches.delete(cacheName)
          }),
        )
      }),
      // Prendre le contrôle des clients
      self.clients.claim(),
    ]),
  )
})

self.addEventListener('fetch', (event) => {
  if (event.request.url.includes('/manifest.json')) {
    const manifestUrl = new URL(event.request.url)
    manifestUrl.searchParams.set('v', '2')

    event.respondWith(
      fetch(event.request)
        .then((response) => {
          return caches.open('manifest').then((cache) => {
            cache.put(event.request, response.clone())
            return response
          })
        })
        .catch(() => {
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
