'use client'

import { motion } from 'framer-motion'
import { Loader } from 'lucide-react'

export default function LoadingFallback() {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 backdrop-blur-sm flex items-center
    justify-center z-50">
      <div className="bg-white p-6 rounded-2xl shadow-lg flex flex-col items-center space-y-4">
        <motion.div
          initial={{ rotate: 0 }}
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
        >
          <Loader className="h-12 w-12 text-primary" />
        </motion.div>
        <p className="text-lg font-semibold text-gray-700 text-center">Chargement en cours...</p>
        <p className="text-sm text-gray-500 text-center">Veuillez patienter</p>
      </div>
    </div>
  )
}
