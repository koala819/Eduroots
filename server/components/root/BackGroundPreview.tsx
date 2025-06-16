import { cn } from '@/utils/helpers'

export const BackGroundPreview: React.FC<{className: string}> = ({ className }) => {
  return <div className={cn('w-full h-16 rounded-md mb-2', className)} />
}
