import {Button} from '@/components/ui/button'



export const ProfileItem = ({
  icon,
  title,
  color,
  onClick,
  variant = 'desktop',
}: any & {variant?: 'desktop' | 'mobile'}) => {
  // Styles conditionnels basés sur la variante
  const buttonStyle =
    variant === 'desktop'
      ? 'w-full justify-start gap-3 p-6 hover:bg-gray-50'
      : 'h-32 w-full flex flex-col items-center justify-center gap-3 p-4 hover:border-blue-500'

  const buttonVariant = variant === 'desktop' ? 'ghost' : 'outline'

  const iconStyle =
    variant === 'desktop'
      ? `p-2 rounded-lg bg-gray-50 ${color}`
      : `p-3 rounded-xl bg-gray-50 ${color}`

  const titleStyle =
    variant === 'mobile' ? 'text-xs font-medium whitespace-pre-line text-center leading-tight' : ''

  return (
    <Button variant={buttonVariant} className={buttonStyle} onClick={onClick}>
      <div className={iconStyle}>{icon}</div>
      <span className={titleStyle}>{title}</span>
    </Button>
  )
}
