'use client'

import { motion } from 'framer-motion'

import { Alert, AlertDescription, AlertTitle } from '@/client/components/ui/alert'

interface IOSInstallInstructionsClientProps {
  isInstalled: boolean;
}

export const IOSInstallInstructionsClient = (
  { isInstalled }: IOSInstallInstructionsClientProps) => {
  if (isInstalled) return null

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Alert className="mb-4 bg-blue-50" variant="default">
        <AlertTitle className="text-blue-700">
          Comment installer sur iOS
        </AlertTitle>
        <AlertDescription className="whitespace-pre-line pt-2">
          Pour installer l&apos;application sur votre iPhone ou iPad :
          {'\n\n'}
          1. Appuyez sur l&apos;icône de partage (⎋) dans Safari
          {'\n'}
          2. Faites défiler et appuyez sur &quot;Sur l&apos;écran d&apos;accueil&quot;
          {'\n'}
          3. Appuyez sur &quot;Ajouter&quot; pour confirmer
        </AlertDescription>
      </Alert>
    </motion.div>
  )
}
