interface ContactProps {
  label: string
  value: string
  icon?: React.ReactNode
}

export const Contact = ({ label, value, icon }: ContactProps) => {
  return (
    <div className="rounded-lg bg-background border border-border p-3">
      <div className="flex items-center gap-3 mb-2">
        {icon && (
          <div className="w-6 h-6 rounded-lg bg-primary/10 flex items-center justify-center
          text-primary">
            {icon}
          </div>
        )}
        <div className={[
          'text-xs font-medium text-muted-foreground',
          'uppercase tracking-wide',
        ].join(' ')}>
          {label}
        </div>
      </div>
      <div className="text-sm font-semibold text-foreground">
        {value || 'Non renseigné'}
      </div>
    </div>
  )
}

