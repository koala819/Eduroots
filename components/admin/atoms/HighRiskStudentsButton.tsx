'use client'

import {AlertCircle} from 'lucide-react'
import React from 'react'

import Link from 'next/link'

import {cn} from '@/utils/helpers'
import {motion} from 'framer-motion'

interface HighRiskStudentsButtonProps {
  className?: string
  variant?: 'default' | 'sidebar' | 'dashboard'
  showExternalIcon?: boolean
}

export const HighRiskStudentsButton = ({
  className,
  //   variant = 'default',
  //   showExternalIcon = false,
}: HighRiskStudentsButtonProps) => {
  //   const isActive = pathname === '/admin/highRiskAbsenceStudents'
  const baseUrl = process.env.NEXT_PUBLIC_CLIENT_URL || ''
  const targetUrl = `${baseUrl}/admin/highRiskAbsenceStudents`

  return (
    <Link href={targetUrl} passHref>
      <motion.div
        className={cn(
          'flex flex-col items-center justify-center gap-2 bg-white hover:bg-red-50 rounded-xl shadow p-4 border border-gray-200 hover:border-red-200 transition-all duration-200 group h-full',
          className,
        )}
        // className={cn(buttonStyles[variant], className)}
        whileHover={{scale: 1.02}}
        whileTap={{scale: 0.98}}
        initial={{opacity: 0}}
        animate={{opacity: 1}}
        transition={{duration: 0.2}}
      >
        {/* {renderContent()} */}

        <div className="flex items-center justify-center w-12 h-12 rounded-full bg-red-100 text-red-600 group-hover:bg-red-200 transition-colors duration-200 mx-auto">
          {/* <div className={iconContainerStyles[variant]}> */}
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

// Variants pour les différents styles du bouton
//   const buttonStyles = {
//     default:
//       'flex items-center gap-3 bg-white hover:bg-red-50 rounded-lg shadow-sm border border-gray-200 hover:border-red-200 px-4 py-3 transition-all duration-200 group',
//     sidebar:
//       'flex items-center gap-3 w-full px-3 py-2 rounded-md text-left text-sm hover:bg-red-50 transition-all duration-200 group',
//     dashboard:
//       'flex flex-col items-center justify-center gap-2 bg-white hover:bg-red-50 rounded-xl shadow p-4 border border-gray-200 hover:border-red-200 transition-all duration-200 group h-full',
//   }

// Styles pour l'icône principale
//   const iconContainerStyles = {
//     default:
//       'flex items-center justify-center w-10 h-10 rounded-lg bg-red-100 text-red-600 group-hover:bg-red-200 transition-colors duration-200',
//     sidebar:
//       'text-gray-500 group-hover:text-red-600 transition-colors duration-200',
//     dashboard:
//       'flex items-center justify-center w-12 h-12 rounded-full bg-red-100 text-red-600 group-hover:bg-red-200 transition-colors duration-200 mx-auto',
//   }

// Contenu différent selon le variant
//   const renderContent = () => {
//     switch (variant) {
//       case 'dashboard':
//         return (
//           <>
//             <div className="flex items-center justify-center w-12 h-12 rounded-full bg-red-100 text-red-600 group-hover:bg-red-200 transition-colors duration-200 mx-auto">
//               {/* <div className={iconContainerStyles[variant]}> */}
//               <AlertCircle className="h-6 w-6" />
//             </div>
//             <div className="text-center">
//               <h3 className="font-medium text-gray-900">Étudiants à risque</h3>
//               <p className="text-xs text-gray-500 mt-1">
//                 Absences multiples de 3
//               </p>
//             </div>
//           </>
//         )
//       case 'sidebar':
//         return (
//           <>
//             <AlertCircle
//               className={
//                 'flex items-center justify-center w-12 h-12 rounded-full bg-red-100 text-red-600 group-hover:bg-red-200 transition-colors duration-200 mx-auto'
//               }
//               //   className={cn('h-5 w-5 ', iconContainerStyles[variant])}
//             />
//             <div className="flex-1">
//               <span
//                 className={cn(
//                   'font-medium',
//                   isActive ? 'text-red-600' : 'text-gray-700',
//                 )}
//               >
//                 Étudiants à risque
//               </span>
//             </div>
//             {showExternalIcon && (
//               <ExternalLink className="h-4 w-4 text-gray-400" />
//             )}
//           </>
//         )
//       default:
//         return (
//           <>
//             <div
//               className="flex items-center justify-center w-12 h-12 rounded-full bg-red-100 text-red-600 group-hover:bg-red-200 transition-colors duration-200 mx-auto"
//               // className={iconContainerStyles[variant]}
//             >
//               <AlertCircle className="h-5 w-5" />
//             </div>
//             <div>
//               <h3 className="font-medium text-gray-900">
//                 Étudiants à risque élevé d'absences
//               </h3>
//               <p className="text-sm text-gray-500">
//                 Nombre d'absences multiple de 3
//               </p>
//             </div>
//             {showExternalIcon && (
//               <ExternalLink className="h-4 w-4 ml-auto text-gray-400" />
//             )}
//           </>
//         )
//     }
//   }

// Exemple d'utilisation:
// <HighRiskStudentsButton />  // Version par défaut
// <HighRiskStudentsButton variant="sidebar" /> // Version pour une barre latérale
// <HighRiskStudentsButton variant="dashboard" /> // Version pour une carte de tableau de bord
