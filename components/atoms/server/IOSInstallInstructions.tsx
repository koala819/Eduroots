import { Share } from 'lucide-react'

import { Card, CardContent } from '@/components/ui/card'

import { IOSInstallInstructionsClient } from '../client/IOSInstallInstructions'

interface IOSInstallInstructionsContentProps {
  isInstalled: boolean
}

export const IOSInstallInstructionsContent = ({
  isInstalled,
}: IOSInstallInstructionsContentProps) => {
  if (isInstalled) {
    return null
  }

  return (
    <IOSInstallInstructionsClient>
      <Card className="bg-slate-50">
        <CardContent className="p-6 space-y-4">
          <div className="flex items-center space-x-3 text-slate-800">
            <Share className="w-6 h-6 text-blue-500" />
            <p className="text-lg font-medium">
              Installez l&apos;application sur votre iPhone
            </p>
          </div>
          <ol className="space-y-4 text-slate-700">
            <li className="flex items-start space-x-3">
              <span className="flex h-6 w-6 mt-0.5 shrink-0 items-center justify-center rounded-full bg-blue-500 text-white text-sm">
                1
              </span>
              <span>
                Appuyez sur le bouton Partager{' '}
                <Share className="w-4 h-4 inline-block text-blue-500 mx-1" />{' '}
                dans la barre Safari
              </span>
            </li>
            <li className="flex items-start space-x-3">
              <span className="flex h-6 w-6 mt-0.5 shrink-0 items-center justify-center rounded-full bg-blue-500 text-white text-sm">
                2
              </span>
              <span>
                Dans le menu qui apparaît, faites défiler et sélectionnez
                &ldquo;Sur l&apos;écran d&apos;accueil&ldquo;
              </span>
            </li>
            <li className="flex items-start space-x-3">
              <span className="flex h-6 w-6 mt-0.5 shrink-0 items-center justify-center rounded-full bg-blue-500 text-white text-sm">
                3
              </span>
              <span>
                Appuyez sur &ldquo;Ajouter&ldquo; pour installer
                l&apos;application sur votre écran d&apos;accueil
              </span>
            </li>
          </ol>
          <div className="mt-6 text-sm text-slate-600 bg-blue-50 p-3 rounded-lg flex items-center">
            <div className="shrink-0 mr-3">ℹ️</div>
            <div>
              Une fois installée, vous pourrez accéder à l&apos;application
              directement depuis votre écran d&apos;accueil
            </div>
          </div>
        </CardContent>
      </Card>
    </IOSInstallInstructionsClient>
  )
}
