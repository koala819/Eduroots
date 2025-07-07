'use client'
import Link from 'next/link'


interface ActionCardProps {
  href: string
  icon: React.ReactNode
  title: string
  description: string
  gradientFrom: string
  gradientTo: string
  textColor: string
  setIsLoading: (isLoading: boolean) => void
}

// Mapping des couleurs avec les vraies valeurs HSL du thème app.css
const colorMap = {
  primary: 'hsl(212.7, 25%, 35%)',
  'primary-dark': 'hsl(212.7, 25%, 25%)',
  'primary-foreground': 'hsl(210, 20%, 98%)',
  secondary: 'hsl(32.7, 25%, 35%)',
  'secondary-dark': 'hsl(32.7, 25%, 25%)',
  'secondary-foreground': 'hsl(210, 20%, 98%)',
  success: 'hsl(162.7, 25%, 35%)',
  'success-dark': 'hsl(162.7, 25%, 25%)',
  'success-foreground': 'hsl(210, 20%, 98%)',
  purple: 'hsl(280, 25%, 35%)',
  'purple-dark': 'hsl(280, 25%, 25%)',
  'purple-foreground': 'hsl(210, 20%, 98%)',
}

export default function ActionCard({
  href,
  icon,
  title,
  description,
  gradientFrom,
  gradientTo,
  textColor,
  setIsLoading,
}: ActionCardProps) {


  // Utilisation du colorMap avec les vraies valeurs du thème
  const fromColor = colorMap[gradientFrom as keyof typeof colorMap] || 'hsl(212.7, 25%, 35%)'
  const toColor = colorMap[gradientTo as keyof typeof colorMap] || 'hsl(212.7, 25%, 25%)'
  const textColorValue = colorMap[textColor as keyof typeof colorMap] || 'hsl(210, 20%, 98%)'

  const gradientStyle = {
    background: `linear-gradient(to right, ${fromColor}, ${toColor})`,
    color: textColorValue,
  }

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setTimeout(() => {
      window.location.href = href
    }, 600)
  }

  const baseClasses = 'group block rounded-xl p-6 hover:shadow-lg transition-all ' +
    'duration-300 hover:-translate-y-1'



  return (
    <Link
      href={href}
      className={baseClasses}
      style={gradientStyle}
      onClick={handleClick}
    >
      <div>
        <div className="flex items-center justify-between mb-4">
          {icon}
        </div>
        <h3 className="text-lg font-semibold mb-2">{title}</h3>
        <p className="text-sm opacity-80">
          {description}
        </p>
      </div>
    </Link>
  )
}
