'use client'

import { motion } from 'framer-motion'
import { AlertCircle } from 'lucide-react'
import Link from 'next/link'

import { cn } from '@/server/utils/helpers'

interface HighRiskStudentsButtonClientProps {
  className?: string
  targetUrl: string
}

export const HighRiskStudentsButtonClient = ({
  className,
  targetUrl,
}: HighRiskStudentsButtonClientProps) => {
  return (
    <Link href={targetUrl} passHref>
      <motion.div
        className={cn(
          'flex flex-col items-center justify-center gap-3 p-6',
          'bg-background border border-border rounded-lg',
          'hover:border-error hover:bg-error/5 transition-all duration-200',
          'group h-full cursor-pointer',
          className,
        )}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.2 }}
      >
        <div className={cn(
          'flex items-center justify-center w-12 h-12 rounded-full',
          'bg-error/10 text-error group-hover:bg-error/20 transition-colors duration-200',
        )}>
          <AlertCircle className="h-6 w-6" />
        </div>
        <div className="text-center">
          <h3 className="font-semibold text-foreground text-base">
            Étudiants à risque
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            Absences multiples de 3 jours
          </p>
        </div>
      </motion.div>
    </Link>
  )
}
