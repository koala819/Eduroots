'use client'

import { ReactNode } from 'react'

import { motion } from 'framer-motion'

interface IOSInstallInstructionsClientProps {
  children: ReactNode
}

export const IOSInstallInstructionsClient = ({
  children,
}: IOSInstallInstructionsClientProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {children}
    </motion.div>
  )
}
