'use client'

import { useEffect, useState } from 'react'

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/client/components/ui/alert-dialog'

const STORAGE_KEY_VERSION = 'eduroots_app_version'
const STORAGE_KEY_LAST_CHECK = 'eduroots_last_version_check'
const CHECK_INTERVAL_WEEK = 7 * 24 * 60 * 60 * 1000 // 7 jours en millisecondes

/**
 * Fonction utilitaire pour vérifier la version de l'application depuis la console
 * Usage: window.checkAppVersion()
 */
if (typeof window !== 'undefined') {
  ;(window as any).checkAppVersion = async () => {
    try {
      const response = await fetch('/manifest.json?v=' + Date.now(), {
        cache: 'no-store',
      })
      const manifest = await response.json()
      const storedVersion = localStorage.getItem(STORAGE_KEY_VERSION)
      console.log('📱 Version actuelle (serveur):', manifest.version)
      console.log('💾 Version stockée (locale):', storedVersion || 'Aucune')
      console.log('🔄 Mise à jour nécessaire:', manifest.version !== storedVersion)
      return {
        serverVersion: manifest.version,
        storedVersion: storedVersion,
        updateNeeded: manifest.version !== storedVersion,
      }
    } catch (error) {
      console.error('Erreur lors de la vérification:', error)
      return null
    }
  }
}

interface ManifestData {
  version: string
}

/**
 * Composant de gestion des mises à jour automatiques du service worker
 * - Vérifie la version au lancement de l'application
 * - Vérifie une fois par semaine si l'app reste ouverte
 * - Détecte les événements natifs du service worker
 * - Affiche une notification pour permettre la mise à jour
 */
export function ServiceWorkerUpdateManager() {
  const [updateAvailable, setUpdateAvailable] = useState(false)
  const [isChecking, setIsChecking] = useState(false)

  // Fonction pour récupérer la version du manifest
  const fetchManifestVersion = async (): Promise<string | null> => {
    try {
      const response = await fetch('/manifest.json?v=' + Date.now(), {
        cache: 'no-store',
      })
      if (!response.ok) return null
      const manifest: ManifestData = await response.json()
      return manifest.version || null
    } catch (error) {
      console.error('Erreur lors de la récupération du manifest:', error)
      return null
    }
  }

  // Fonction pour vérifier si une mise à jour est disponible
  const checkForUpdate = async (): Promise<boolean> => {
    if (!('serviceWorker' in navigator)) return false

    try {
      // Récupérer la version actuelle du manifest
      const currentVersion = await fetchManifestVersion()
      if (!currentVersion) return false

      // Récupérer la version stockée localement
      const storedVersion = localStorage.getItem(STORAGE_KEY_VERSION)

      // Si pas de version stockée, on la sauvegarde et on continue
      if (!storedVersion) {
        localStorage.setItem(STORAGE_KEY_VERSION, currentVersion)
        return false
      }

      // Comparer les versions
      if (currentVersion !== storedVersion) {
        return true
      }

      // Vérifier aussi via le service worker
      const registrations = await navigator.serviceWorker.getRegistrations()
      for (const registration of registrations) {
        // Vérifier s'il y a un nouveau service worker en attente
        if (registration.waiting) {
          return true
        }
        // Vérifier s'il y a un nouveau service worker en installation
        if (registration.installing) {
          return true
        }
      }

      return false
    } catch (error) {
      console.error('Erreur lors de la vérification de mise à jour:', error)
      return false
    }
  }

  // Fonction pour appliquer la mise à jour
  const applyUpdate = async () => {
    if (!('serviceWorker' in navigator)) return

    try {
      const registrations = await navigator.serviceWorker.getRegistrations()

      for (const registration of registrations) {
        // Envoyer le message SKIP_WAITING au service worker
        if (registration.waiting) {
          registration.waiting.postMessage({ type: 'SKIP_WAITING' })
        }

        // Forcer la mise à jour
        await registration.update()
      }

      // Mettre à jour la version stockée avant le rechargement
      const currentVersion = await fetchManifestVersion()
      if (currentVersion) {
        localStorage.setItem(STORAGE_KEY_VERSION, currentVersion)
      }

      // Le nettoyage des caches sera fait automatiquement par le service worker lors de l'activation
      // Recharger la page après un court délai pour permettre au SW de s'activer
      setTimeout(() => {
        window.location.reload()
      }, 500)
    } catch (error) {
      console.error('Erreur lors de l\'application de la mise à jour:', error)
      // En cas d'erreur, recharger quand même
      window.location.reload()
    }
  }

  // Fonction principale de vérification
  const performCheck = async () => {
    if (isChecking) return
    setIsChecking(true)

    try {
      const hasUpdate = await checkForUpdate()
      if (hasUpdate) {
        setUpdateAvailable(true)
      }
    } catch (error) {
      console.error('Erreur lors de la vérification:', error)
    } finally {
      setIsChecking(false)
    }
  }

  useEffect(() => {
    if (!('serviceWorker' in navigator)) return

    // Vérification au lancement
    performCheck()

    // Vérification hebdomadaire si l'app reste ouverte
    const checkWeekly = () => {
      const lastCheck = localStorage.getItem(STORAGE_KEY_LAST_CHECK)
      const now = Date.now()

      if (!lastCheck) {
        // Première vérification, on la fait maintenant
        localStorage.setItem(STORAGE_KEY_LAST_CHECK, now.toString())
        return
      }

      const lastCheckTime = parseInt(lastCheck, 10)
      const timeSinceLastCheck = now - lastCheckTime

      // Si plus d'une semaine s'est écoulée, vérifier
      if (timeSinceLastCheck >= CHECK_INTERVAL_WEEK) {
        performCheck()
        localStorage.setItem(STORAGE_KEY_LAST_CHECK, now.toString())
      }
    }

    // Vérifier immédiatement si nécessaire
    checkWeekly()

    // Programmer la vérification hebdomadaire
    const weeklyInterval = setInterval(() => {
      checkWeekly()
    }, CHECK_INTERVAL_WEEK)

    // Écouter les événements du service worker
    const handleServiceWorkerUpdate = () => {
      performCheck()
    }

    const handleControllerChange = () => {
      // Le service worker a changé, vérifier la version
      performCheck()
    }

    // Écouter les événements de mise à jour du service worker
    navigator.serviceWorker.addEventListener('controllerchange', handleControllerChange)

    // Écouter les événements de mise à jour du service worker
    // Le navigateur déclenche automatiquement ces événements quand un nouveau SW est détecté
    let updateFoundHandlers: Array<() => void> = []
    navigator.serviceWorker.getRegistrations().then((registrations) => {
      for (const registration of registrations) {
        // Écouter l'événement updatefound qui se déclenche quand un nouveau SW est détecté
        const handler = () => {
          handleServiceWorkerUpdate()
        }
        registration.addEventListener('updatefound', handler)
        updateFoundHandlers.push(() => {
          registration.removeEventListener('updatefound', handler)
        })
      }
    })

    return () => {
      clearInterval(weeklyInterval)
      navigator.serviceWorker.removeEventListener('controllerchange', handleControllerChange)
      // Nettoyer les listeners updatefound
      updateFoundHandlers.forEach((cleanup) => cleanup())
    }
  }, [])

  return (
    <AlertDialog open={updateAvailable} onOpenChange={setUpdateAvailable}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Mise à jour disponible</AlertDialogTitle>
          <AlertDialogDescription>
            Une nouvelle version de l'application est disponible. Souhaitez-vous la mettre à jour
            maintenant ?
            <br />
            <br />
            L'application sera rechargée pour appliquer les modifications.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={() => setUpdateAvailable(false)}>
            Plus tard
          </AlertDialogCancel>
          <AlertDialogAction onClick={applyUpdate}>Mettre à jour maintenant</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
