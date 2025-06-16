import { cn, formatAdminConfigTitle } from '@/server/utils/helpers'

export const ButtonPreview: React.FC<{className: string; title: string}> = ({
  className,
  title,
}) => {
  return (
    <button
      type="button"
      className={cn(
        'inline-flex items-center justify-center'+
        'whitespace-nowrap rounded-md text-sm font-medium'+
        'ring-offset-background transition-colors'+
        'focus-visible:outline-none focus-visible:ring-2'+
        'focus-visible:ring-ring focus-visible:ring-offset-2'+
        'disabled:pointer-events-none disabled:opacity-50',
        'w-full h-16',
        className,
      )}
    >
      {formatAdminConfigTitle(title)}
    </button>
  )
}
