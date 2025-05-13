'use client'

import { ArrowPathIcon } from '@heroicons/react/24/outline'
import { useEffect } from 'react'
import { toast } from 'react-toastify'

export function UpdateNotification() {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      // Écouter les messages du Service Worker
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
                // Recharger la page pour appliquer la mise à jour
                window.location.reload()
              },
            },
          )
        }
      })
    }
  }, [])

  return null
}
