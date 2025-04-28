'use client'

import { ArrowRight, BookOpen, UserCog, Users } from 'lucide-react'

import Link from 'next/link'

import { Card, CardContent } from '@/components/ui/card'

type DashboardCardProps = {
  icon: keyof typeof iconComponents
  title: string
  description: string
  href: string
  colorClass: string
}

const iconComponents = {
  BookOpen: BookOpen,
  Users: Users,
  UserCog: UserCog,
}

export default function DashboardCard({
  icon,
  title,
  description,
  href,
  colorClass,
}: DashboardCardProps) {
  const IconComponent = iconComponents[icon]

  return (
    <Link href={href} className="block">
      <Card
        className={`group hover:shadow-xl transition-all duration-300 border-none bg-white shadow-md hover:-translate-y-1 cursor-pointer`}
      >
        <CardContent className="p-6">
          <div
            className={`rounded-lg bg-${colorClass}-50 p-3 w-12 h-12 flex items-center justify-center mb-4 group-hover:bg-${colorClass}-100 transition-colors`}
          >
            <IconComponent className={`w-6 h-6 text-${colorClass}-700`} />
          </div>
          <h2 className="text-xl font-semibold mb-2 text-slate-800">{title}</h2>
          <p className="text-slate-600 mb-4">{description}</p>
          <div
            className={`flex items-center text-${colorClass}-700 group-hover:text-${colorClass}-800`}
          >
            <span className="text-sm font-medium">Accéder</span>
            <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
