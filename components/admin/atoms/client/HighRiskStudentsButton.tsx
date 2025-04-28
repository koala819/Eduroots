'use client'

import { AlertCircle } from 'lucide-react'

import Link from 'next/link'

import { cn } from '@/lib/utils'
import { motion } from 'framer-motion'

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
          'flex flex-col items-center justify-center gap-2 bg-white hover:bg-red-50 rounded-xl shadow p-4 border border-gray-200 hover:border-red-200 transition-all duration-200 group h-full',
          className,
        )}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.2 }}
      >
        <div className="flex items-center justify-center w-12 h-12 rounded-full bg-red-100 text-red-600 group-hover:bg-red-200 transition-colors duration-200 mx-auto">
          <AlertCircle className="h-6 w-6" />
        </div>
        <div className="text-center">
          <h3 className="font-medium text-gray-900">Étudiants à risque</h3>
          <p className="text-xs text-gray-500 mt-1">Absences multiples de 3</p>
        </div>
      </motion.div>
    </Link>
  )
}
