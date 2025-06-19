'use client'
import { ArrowRight, BookOpen, UserCog, Users } from 'lucide-react'
import Link from 'next/link'

import { Card, CardContent } from '@/client/components/ui/card'

type DashboardCardProps = {
  icon: keyof typeof iconComponents
  title: string
  description: string
  href: string
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
}: Readonly<DashboardCardProps>) {
  const IconComponent = iconComponents[icon]

  return (
    <Link href={href} className="block">
      <Card className="group bg-gradient-to-br from-primary to-primary-dark hover:-translate-y-1
        cursor-pointer overflow-hidden relative transition-all duration-300 hover:shadow-xl
        border border-primary-accent/20">
        <CardContent className="p-8 relative z-10">
          <div className="relative mb-6">
            <div className="relative rounded-2xl p-4 w-16 h-16 flex items-center justify-center
              bg-primary-foreground/10 backdrop-blur-sm group-hover:bg-primary-foreground/20
              transition-all duration-300 border border-primary-foreground/20">
              <IconComponent className="w-8 h-8 text-primary-foreground group-hover:scale-105
                transition-transform duration-300" />
            </div>
          </div>

          <h2 className="text-2xl font-bold mb-3 text-primary-foreground">
            {title}
          </h2>

          <p className="text-primary-foreground/80 mb-6 leading-relaxed">
            {description}
          </p>

          <div className="flex items-center justify-between">
            <div className="flex items-center text-primary-foreground font-semibold">
              <span className="text-sm tracking-wide">Accéder</span>
              <div className="ml-3 w-8 h-8 rounded-full bg-primary-foreground/10 flex items-center
                justify-center group-hover:bg-primary-foreground/20 transition-all duration-300
                border border-primary-foreground/20">
                <ArrowRight className="w-4 h-4 text-primary-foreground group-hover:translate-x-0.5
                  transition-transform duration-300" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
