'use client'

import {BarChart3, Clock, Star} from 'lucide-react'
import {ReactNode} from 'react'

import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card'

type IconType = 'chart' | 'clock' | 'star' | string

// Map icon types to Lucide components
const iconMap: Record<IconType, ReactNode> = {
  chart: <BarChart3 size={20} />,
  clock: <Clock size={20} />,
  star: <Star size={20} />,
}

type ColorScheme = {
  bg: string
  text: string
  gradient: string
}

// Color schemes for different card types
const colorSchemes: Record<string, ColorScheme> = {
  blue: {
    bg: 'bg-gradient-to-br from-blue-50 to-sky-50',
    text: 'text-sky-600',
    gradient: 'from-sky-400 to-blue-500',
  },
  purple: {
    bg: 'bg-gradient-to-br from-purple-50 to-violet-50',
    text: 'text-purple-600',
    gradient: 'from-purple-400 to-violet-500',
  },
  teal: {
    bg: 'bg-gradient-to-br from-teal-50 to-emerald-50',
    text: 'text-teal-600',
    gradient: 'from-teal-400 to-emerald-500',
  },
  amber: {
    bg: 'bg-gradient-to-br from-amber-50 to-yellow-50',
    text: 'text-amber-600',
    gradient: 'from-amber-400 to-yellow-500',
  },
  gold: {
    bg: 'bg-gradient-to-br from-yellow-50 to-amber-50',
    text: 'text-yellow-600',
    gradient: 'from-yellow-300 to-amber-300',
  },
}

export function StatCard({
  icon,
  color = 'blue',
  title,
  value,
  description,
}: {
  icon: IconType
  color?: 'blue' | 'purple' | 'teal' | 'amber' | 'gold'
  title: string
  value: string | number
  description: string
}) {
  const scheme = colorSchemes[color]

  // Get the appropriate icon
  const iconElement = typeof icon === 'string' && icon in iconMap ? iconMap[icon] : icon

  return (
    <Card className="border-none shadow-lg hover:shadow-xl hover:translate-y-[-5px] transition-all duration-300 overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between pb-2 pt-4 px-6">
        <CardTitle className="text-sm font-bold text-slate-700">{title}</CardTitle>
        <div
          className={`w-10 h-10 rounded-full flex items-center justify-center ${scheme.bg} ${scheme.text} shadow-sm`}
        >
          {iconElement}
        </div>
      </CardHeader>
      <CardContent className="px-6 pt-2 pb-6">
        <div className="flex items-end gap-2">
          <div className="text-3xl font-extrabold">{value}</div>
          <div className="text-xs text-slate-500 mb-1">{description}</div>
        </div>
      </CardContent>
    </Card>
  )
}
