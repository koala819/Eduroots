'use client'

import { CalendarIcon, MessageSquareMore, Settings } from 'lucide-react'

type FooterProps = {
  handleNavClick: (href: string) => void
  currentRoute: string | null
}

const FooterTeacher = ({ handleNavClick, currentRoute }: FooterProps) => {
  const navItems = [
    {
      href: '/teacher/classroom',
      label: 'Cours',
      Icon: CalendarIcon,
    },
    {
      href: '/messages',
      label: 'Messages',
      Icon: MessageSquareMore,
    },
    {
      href: '/teacher/profiles',
      label: 'Profil',
      Icon: Settings,
    },
  ]

  return (
    <div className="bg-white border-t shadow-lg h-16">
      <nav className="h-full max-w-lg mx-auto">
        <div className="flex justify-around items-center h-full relative">
          {navItems.map(({ href, label, Icon }) => {
            const isActive = currentRoute?.startsWith(href) ?? false

            return (
              <button
                key={href}
                onClick={() => !isActive && handleNavClick(href)}
                disabled={isActive}
                aria-current={isActive ? 'page' : undefined}
                className={`
                  h-full w-1/3 flex flex-col items-center justify-center group transition-all duration-300
                  hover:bg-gray-50 relative
                  ${isActive ? 'pointer-events-none bg-blue-50' : 'bg-white'}
                `}
              >
                {isActive && (
                  <span className="absolute top-0 left-0 w-full h-1 bg-blue-600 rounded-t-md" />
                )}

                <div
                  className={`
                    p-2 rounded-lg transition-colors
                    ${isActive ? 'bg-blue-100' : 'group-hover:bg-blue-50 group-active:bg-blue-100'}
                  `}
                >
                  <Icon
                    className={`
                      h-5 w-5 transition-colors
                      ${isActive ? 'text-blue-600' : 'text-gray-600 group-hover:text-blue-600'}
                    `}
                  />
                </div>
                <span
                  className={`
                    text-xs font-medium transition-colors
                    ${isActive ? 'text-blue-700 font-semibold' : 'text-gray-600 group-hover:text-blue-600'}
                  `}
                >
                  {label}
                </span>
              </button>
            )
          })}
        </div>
      </nav>
    </div>
  )
}

export default FooterTeacher
