'use client'

import { motion } from 'framer-motion'
import { Loader } from 'lucide-react'
import Image from 'next/image'

interface LoadingOverlayProps {
  title?: string
  loadingContexts?: string[]
}

export default function LoadingOverlay({
  title = 'Chargement en cours...',
  loadingContexts = [],
}: Readonly<LoadingOverlayProps>) {
  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex
    items-center justify-center z-[90]">
      <div className="p-4 sm:p-6 rounded-xl sm:rounded-2xl shadow-lg flex flex-col
      items-center space-y-3 sm:space-y-4 border border-border mx-4 max-w-sm
      sm:max-w-md bg-background">
        {/* Logo */}
        <picture
          // initial={{ scale: 0.8, opacity: 0 }}
          // animate={{ scale: 1, opacity: 0 }}
          // transition={{ duration: 0.3 }}
          className="relative h-72 w-72 animate-pulse"
        >
          <Image
            src="/Logo.jpg"
            alt="Logo"
            fill
            sizes="(max-width: 768px) 288px, 288px"
            className="rounded-md object-cover"
            priority
          />
        </picture>

        {/* Spinner */}
        <motion.div
          initial={{ rotate: 0 }}
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
        >
          <Loader className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
        </motion.div>

        {/* Title */}
        <p className="text-base sm:text-lg font-semibold text-foreground text-center">
          {title}
        </p>

        {/* Loading contexts */}
        {loadingContexts.length > 0 && (
          <p className="text-xs sm:text-sm text-muted-foreground text-center max-w-full">
            En attente : {loadingContexts.join(', ')}
          </p>
        )}
      </div>
    </div>
  )
}
