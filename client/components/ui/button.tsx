import { Slot } from '@radix-ui/react-slot'
import { cva } from 'class-variance-authority'
import { type VariantProps } from 'class-variance-authority'
import * as React from 'react'

// import { useConfig } from '@/context/ConfigContext'
import { cn } from '@/server/utils/helpers'

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<ReturnType<typeof createButtonVariants>> {
  asChild?: boolean
}

function createButtonVariants(themeVariants: Map<string, string> | Record<string, string>) {
  const variantsRecord =
    themeVariants instanceof Map ? Object.fromEntries(themeVariants) : themeVariants

  return cva(
    'inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ' +
    'ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 ' +
    'focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none ' +
    'disabled:opacity-50 hover:cursor-pointer',
    {
      variants: {
        variant: {
          default: 'bg-primary text-primary-foreground hover:bg-success/90',
          destructive: 'bg-error text-primary-foreground hover:bg-error-light/90',
          outline: 'border border-input bg-background hover:bg-accent ' +
            'hover:text-accent-foreground',
          secondary: 'bg-[var(--color-secondary)] text-[var(--color-secondary-foreground)] ' +
            'hover:bg-[var(--color-secondary-dark)]',
          ghost: 'hover:bg-accent hover:text-accent-foreground',
          link: 'text-primary underline-offset-4 hover:underline',
          teacherCancel: '',
          teacherDefault: '',
          teacherFooter: '',
          teacherSecondary: '',
          teacherTertiary: '',
          teacherWarning: 'bg-red-500 text-destructive-foreground ' +
            'hover:bg-red-800/90',
          ...variantsRecord,
        },
        size: {
          default: 'h-10 px-4 py-2',
          sm: 'h-9 rounded-md px-3',
          lg: 'h-11 rounded-md px-8',
          icon: 'h-10 w-10',
        },
      },
      defaultVariants: {
        variant: 'default',
        size: 'default',
      },
    },
  )
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    // const { theme } = useConfig()
    const Comp = asChild ? Slot : 'button'
    // const buttonVariants = React.useMemo(
    //   () => createButtonVariants(theme?.buttonVariants || {}),
    //   [theme?.buttonVariants],
    // )
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  },
)
Button.displayName = 'Button'

// Export buttonVariants function for use in other components
export const buttonVariants = createButtonVariants({})

export { Button, createButtonVariants }
