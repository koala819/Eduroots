'use client'

import {ReactNode} from 'react'

interface InfoCardProps {
  title: string
  icon: ReactNode
  items: {label: string; value: string}[]
  color?: 'indigo' | 'rose' | 'emerald' | 'orange' | 'slate'
}

export const InfoCard = ({title, icon, items, color}: InfoCardProps) => {
  const colorSchemes = {
    indigo: {
      bg: 'bg-gradient-to-br from-indigo-50 to-blue-50',
      text: 'text-indigo-600',
      gradient: 'from-indigo-400 to-blue-400',
      border: 'border-indigo-100',
    },
    rose: {
      bg: 'bg-gradient-to-br from-rose-50 to-pink-50',
      text: 'text-rose-600',
      gradient: 'from-rose-400 to-pink-400',
      border: 'border-rose-100',
    },
    emerald: {
      bg: 'bg-gradient-to-br from-emerald-50 to-green-50',
      text: 'text-emerald-600',
      gradient: 'from-emerald-400 to-green-400',
      border: 'border-emerald-100',
    },
    orange: {
      bg: 'bg-gradient-to-br from-orange-50 to-amber-50',
      text: 'text-orange-600',
      gradient: 'from-orange-400 to-amber-400',
      border: 'border-orange-100',
    },
    slate: {
      bg: 'bg-gradient-to-br from-slate-100 to-gray-100',
      text: 'text-slate-800',
      gradient: 'from-slate-600 to-slate-800',
      border: 'border-slate-200',
    },
  }

  const scheme = colorSchemes[color ?? 'indigo']

  return (
    <div className="border-none rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden bg-white">
      <div className={`h-1 w-full bg-gradient-to-r ${scheme.gradient}`}></div>
      <div className="flex flex-row items-center justify-between px-6 py-4">
        <div className="flex items-center gap-3">
          <div
            className={`w-9 h-9 rounded-full flex items-center justify-center ${scheme.bg} ${scheme.text}`}
          >
            {icon}
          </div>
          <div className="text-base font-bold text-slate-700">{title}</div>
        </div>
      </div>
      <div className="px-6 py-4">
        <ul className="space-y-4">
          {items.map((item, index) => (
            <li
              key={index}
              className={`flex justify-between items-center pb-3 ${
                index !== items.length - 1 ? `border-b ${scheme.border}` : ''
              } last:pb-0 group hover:bg-slate-50 -mx-2 px-2 py-1 rounded-md transition-colors duration-200`}
            >
              <span className="text-slate-500 text-sm">{item.label}</span>
              <span className={`font-semibold ${scheme.text}`}>{item.value}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
