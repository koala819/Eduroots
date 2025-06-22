'use client'
import { motion } from 'framer-motion'
import { ArrowLeft } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface HeaderBackBtnProps {
  returnBackName?: string
  returnBackUrl?: string
  className?: string
}

export const HeaderBackBtn = ({
  returnBackName = 'Accueil',
  returnBackUrl = '/teacher/classroom',
  className = '',
}: HeaderBackBtnProps) => {
  const router = useRouter()

  return (
    <motion.button
      whileHover={{ scale: 1.05, backgroundColor: 'rgba(255,255,255,0.15)' }}
      whileTap={{ scale: 0.95 }}
      onClick={() => router.push(returnBackUrl)}
      className={`group flex items-center gap-2 px-4 py-2 rounded-xl bg-primary-foreground/10
        hover:bg-primary-foreground/15 transition-all duration-200 border
        border-primary-foreground/20 flex-shrink-0 ${className}`}
    >
      <ArrowLeft className="w-4 h-4 text-primary-foreground
        group-hover:text-primary-foreground transition-colors" />
      <span className="text-sm font-medium text-primary-foreground/90
        group-hover:text-primary-foreground">
        {returnBackName}
      </span>
    </motion.button>
  )
}
