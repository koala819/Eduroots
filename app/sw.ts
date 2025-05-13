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

// Version 1.0.1 - Test de mise à jour
const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: defaultCache,
})

serwist.addEventListeners()

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open('app-shell').then((cache) => {
      return cache.addAll([
        '/',
        '/index.html',
        '/manifest.json',
        '/icon-192x192.png',
        '/icon-512x512.png',
      ])
    }),
  )
})

self.addEventListener('activate', (event) => {
  // Supprimez explicitement les anciens caches lors de l'activation du nouveau SW
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          return caches.delete(cacheName)
        }),
      ).then(() => {
        return self.clients.claim().then(() => {
          self.clients.matchAll().then((clients) => {
            clients.forEach((client) => {
              if (client.type === 'window') {
                client.postMessage({ type: 'SW_UPDATED' })
              }
            })
          })
        })
      })
    }),
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
