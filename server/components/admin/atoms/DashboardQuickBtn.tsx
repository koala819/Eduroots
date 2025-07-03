import { useRouter } from 'next/navigation'
import React from 'react'

import { Button } from '@/client/components/ui/button'

const DashboardQuickBtn = ({
  icon,
  label,
  href,
}: {
  icon: React.ReactNode
  label: string
  href: string
  }) => {
  const router = useRouter()

  return (
    <Button
      variant="default"
      className="group h-16 md:h-20 flex flex-col gap-1 md:gap-2"
      onClick={() => router.push(href)}
    >
      <div className="w-4 md:w-5 h-4 md:h-5 text-secondary-foreground relative z-10">
        {icon}
      </div>
      <span className="text-xs text-secondary-foreground font-medium relative z-10">
        {label}
      </span>
    </Button>
  )
}

export default DashboardQuickBtn
