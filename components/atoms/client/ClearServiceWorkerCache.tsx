'use client'

import {useEffect} from 'react'

export function ClearServiceWorkerCache() {
  useEffect(() => {
    // Fonction à exécuter une seule fois au chargement
    const clearCache = async () => {
      if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations()
        for (const registration of registrations) {
          registration.update()
        }

        if ('caches' in window) {
          const cacheNames = await caches.keys()
          for (const cacheName of cacheNames) {
            if (cacheName.includes('manifest')) {
              await caches.delete(cacheName)
            }
          }
        }
      }
    }

    clearCache()
  }, [])

  return null
}
