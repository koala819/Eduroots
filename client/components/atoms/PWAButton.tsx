'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { CheckCircle, Download, InfoIcon } from 'lucide-react'
import { useEffect, useState } from 'react'

import { IOSInstallInstructionsClient } from '@/client/components/atoms/IOSInstallInstructions'
import { Alert, AlertDescription, AlertTitle } from '@/client/components/ui/alert'
import { Badge } from '@/client/components/ui/badge'
import { Button } from '@/client/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/client/components/ui/tooltip'

type InstallPromptEvent = Event & {
  prompt: () => Promise<{ outcome: 'accepted' | 'dismissed' }>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

type Platform = 'desktop' | 'mobile' | 'ios' | 'unknown'
type InstallStatus = 'not-installed' | 'installing' | 'installed' | 'dismissed'

export const PWAButtonClient: React.FC = () => {
  const [installPrompt, setInstallPrompt] = useState<InstallPromptEvent | null>(
    null,
  )
  const [installStatus, setInstallStatus] =
    useState<InstallStatus>('not-installed')
  const [showInstructions, setShowInstructions] = useState(false)
  const [browser, setBrowser] = useState<string>('')
  const [platform, setPlatform] = useState<Platform>('unknown')
  const [recentlyInstalled, setRecentlyInstalled] = useState(false)

  useEffect(() => {
    const detectPlatform = (): Platform => {
      const ua = window.navigator.userAgent.toLowerCase()
      if (ua.includes('iphone') || ua.includes('ipad') || ua.includes('ipod')) {
        return 'ios'
      }
      if (ua.includes('android')) {
        return 'mobile'
      }
      if (
        ua.includes('windows') ||
        ua.includes('macintosh') ||
        ua.includes('linux')
      ) {
        return 'desktop'
      }
      return 'unknown'
    }

    const detectBrowser = () => {
      const ua = window.navigator.userAgent.toLowerCase()
      if (ua.includes('firefox')) return 'firefox'
      if (ua.includes('chrome')) return 'chrome'
      if (ua.includes('safari')) return 'safari'
      return 'default'
    }

    setPlatform(detectPlatform())
    setBrowser(detectBrowser())

    // Auto-afficher les instructions pour iOS
    if (detectPlatform() === 'ios') {
      setShowInstructions(true)
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      // Ne pas appeler preventDefault() ici
      const promptEvent = e as InstallPromptEvent
      setInstallPrompt(promptEvent)
      console.log('beforeinstallprompt event was fired')
    }

    const handleAppInstalled = () => {
      setInstallStatus('installed')
      setRecentlyInstalled(true)
      setInstallPrompt(null)
      setShowInstructions(false)
      console.log('App was installed')

      // Reset the recently installed flag after 5 seconds
      setTimeout(() => {
        setRecentlyInstalled(false)
      }, 5000)
    }

    if (window.matchMedia('(display-mode: standalone)').matches) {
      setInstallStatus('installed')
      console.log('App is already installed')
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    window.addEventListener('appinstalled', handleAppInstalled)

    return () => {
      window.removeEventListener(
        'beforeinstallprompt',
        handleBeforeInstallPrompt,
      )
      window.removeEventListener('appinstalled', handleAppInstalled)
    }
  }, [])

  const getInstallInstructions = () => {
    if (platform === 'mobile') {
      if (browser === 'firefox') {
        return 'Appuyez sur les trois points (⋮) en haut à droite, puis sur' +
          '\'Ajouter à l\'écran d\'accueil\''
      }
      return 'Utilisez le menu du navigateur pour \'Ajouter à l\'écran d\'accueil\''
    }

    if (platform === 'desktop') {
      if (browser === 'firefox') {
        return 'Pour une meilleure expérience d\'installation PWA, nous vous recommandons ' +
        'd\'utiliser Google Chrome ou Microsoft Edge.'
      }
      if (browser === 'chrome') {
        return 'Cliquez sur l\'icône d\'installation dans la barre d\'URL (à droite) ou utilisez ' +
        'le bouton ci - dessous'
      }
    }

    return 'Utilisez l\'option \'Installer\' ou \'Ajouter à l\'écran d\'accueil\' dans le menu ' +
    'de votre navigateur'
  }

  const handleInstallClick = async () => {
    if (installPrompt) {
      console.log('Prompting for installation')
      setInstallStatus('installing')
      try {
        const result = await installPrompt.prompt()
        console.log(`Install prompt was: ${result.outcome}`)
        setInstallPrompt(null)
        if (result.outcome === 'accepted') {
          setInstallStatus('installed')
          setRecentlyInstalled(true)
          // Reset the recently installed flag after 5 seconds
          setTimeout(() => {
            setRecentlyInstalled(false)
          }, 5000)
        } else {
          setInstallStatus('dismissed')
          // Reset status after a delay
          setTimeout(() => {
            setInstallStatus('not-installed')
          }, 5000)
        }
      } catch (err) {
        console.error('Error during installation prompt:', err)
        setShowInstructions(true)
        setInstallStatus('not-installed')
      }
    } else if (installStatus !== 'installed') {
      console.log('Install prompt not available, showing manual instructions')
      setShowInstructions(true)
    }
  }

  const handleDismissInstructions = () => {
    setShowInstructions(false)
  }

  if (installStatus === 'installed' && !recentlyInstalled) {
    return null
  }

  const isIOS = platform === 'ios'
  const isFirefoxDesktop = browser === 'firefox' && platform === 'desktop'

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
  }

  const successVariants = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: {
        duration: 0.5,
        ease: 'easeOut',
      },
    },
    exit: {
      opacity: 0,
      scale: 0.8,
      transition: {
        duration: 0.3,
      },
    },
  }

  // Installation success message
  if (recentlyInstalled) {
    return (
      <AnimatePresence>
        <motion.div
          variants={successVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center space-x-3"
        >
          <CheckCircle className="h-6 w-6 text-green-500" />
          <div className="flex-1">
            <h4 className="font-medium text-green-800">
              Installation réussie !
            </h4>
            <p className="text-sm text-green-600">
              L&apos;application est maintenant disponible sur votre appareil
            </p>
          </div>
        </motion.div>
      </AnimatePresence>
    )
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-4 mt-2"
    >
      {isIOS ? (
        // Pour iOS, on utilise le composant serveur
        <IOSInstallInstructionsClient
          isInstalled={installStatus === 'installed'}
        />
      ) : (
        // Pour les autres plateformes
        <>
          {showInstructions && (
            <Alert
              className={`mb-4 ${isFirefoxDesktop ? 'bg-yellow-50' : 'bg-blue-50'}`}
              variant="default"
            >
              {isFirefoxDesktop && (
                <AlertTitle className="text-amber-700">
                  Compatibilité limitée
                </AlertTitle>
              )}
              {!isFirefoxDesktop && (
                <AlertTitle className="text-blue-700">
                  Comment installer
                </AlertTitle>
              )}
              <AlertDescription className="whitespace-pre-line pt-2">
                {getInstallInstructions()}
              </AlertDescription>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDismissInstructions}
                className="mt-2 text-xs"
              >
                Fermer
              </Button>
            </Alert>
          )}

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <motion.div
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  className="relative"
                >
                  <Button
                    onClick={handleInstallClick}
                    disabled={installStatus === 'installing'}
                    className={`w-full font-bold py-2 px-4 rounded-lg transition-all duration-300
                      flex items-center justify-center gap-2 ${
        isFirefoxDesktop
          ? 'bg-gray-500 hover:bg-gray-600'
          : installStatus === 'installing'
            ? 'bg-indigo-400'
            : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700' +
            'hover:to-indigo-700 shadow-md hover:shadow-lg'
        } text-white`}
                  >
                    {installStatus === 'installing' ? (
                      <>
                        <div
                          className="h-5 w-5 border-2 border-white border-t-transparent rounded-full
                           animate-spin"/>
                        <span>Installation...</span>
                      </>
                    ) : (
                      <>
                        <Download className="h-5 w-5" />
                        <span>
                          {isFirefoxDesktop
                            ? 'Voir les options d\'installation'
                            : 'Installer l\'application'}
                        </span>
                      </>
                    )}
                  </Button>

                  {installPrompt && !isFirefoxDesktop && (
                    <Badge className="absolute -top-2 -right-2 bg-green-500 px-2 py-1 text-xs
                    animate-pulse">
                      Prêt à installer
                    </Badge>
                  )}
                </motion.div>
              </TooltipTrigger>
              <TooltipContent
                side="bottom"
                className="bg-slate-800 text-white p-2"
              >
                <p>Accédez plus rapidement à l&apos;application</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          {!showInstructions && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.3 }}
              className="flex justify-center mt-2"
            >
              <Button
                variant="link"
                size="sm"
                className="text-xs text-slate-500 flex items-center gap-1"
                onClick={() => setShowInstructions(true)}
              >
                <InfoIcon className="h-3 w-3" />
                <span>Plus d&apos;informations</span>
              </Button>
            </motion.div>
          )}
        </>
      )}
    </motion.div>
  )
}
