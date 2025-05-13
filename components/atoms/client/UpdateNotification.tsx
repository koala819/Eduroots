'use client'

import { ArrowPathIcon } from '@heroicons/react/24/outline'
import { useEffect } from 'react'
import { toast } from 'react-toastify'

// Fonction pour vérifier les mises à jour
const isUpdateAvailable = () => {
  return new Promise((resolve) => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then((registration) => {
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (
                newWorker.state === 'installed' &&
                navigator.serviceWorker.controller
              ) {
                resolve(true)
              }
            })
          }
        })
      })
    }
    resolve(false)
  })
}

export function UpdateNotification() {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      // Vérifier les mises à jour au chargement
      isUpdateAvailable().then((hasUpdate) => {
        if (hasUpdate) {
          toast.info(
            <div className="flex items-center gap-2">
              <ArrowPathIcon className="h-5 w-5 animate-spin" />
              <div>
                <p className="font-semibold">Mise à jour disponible</p>
                <p className="text-sm text-muted-foreground">
                  Cliquez pour installer la nouvelle version
                </p>
              </div>
            </div>,
            {
              position: 'bottom-right',
              autoClose: false,
              closeOnClick: false,
              draggable: false,
              className: 'bg-background border border-border shadow-lg',
              bodyClassName: 'p-0',
              progressClassName: 'bg-primary',
              onClick: () => {
                window.location.reload()
              },
            },
          )
        }
      })

      // Attendre un peu avant d'écouter les messages
      setTimeout(() => {
        navigator.serviceWorker.addEventListener('message', (event) => {
          if (event.data && event.data.type === 'SW_UPDATED') {
            toast.info(
              <div className="flex items-center gap-2">
                <ArrowPathIcon className="h-5 w-5 animate-spin" />
                <div>
                  <p className="font-semibold">Mise à jour disponible</p>
                  <p className="text-sm text-muted-foreground">
                    Cliquez pour installer la nouvelle version
                  </p>
                </div>
              </div>,
              {
                position: 'bottom-right',
                autoClose: false,
                closeOnClick: false,
                draggable: false,
                className: 'bg-background border border-border shadow-lg',
                bodyClassName: 'p-0',
                progressClassName: 'bg-primary',
                onClick: () => {
                  window.location.reload()
                },
              },
            )
          }
        })
      }, 1000) // Attendre 1 seconde
    }
  }, [])

  return null
}
