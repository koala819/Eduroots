export const AdminResume = ({ title, value }: { title: string, value: number | string }) => {
  return (
    <div className="flex justify-between items-center p-2 md:p-3 rounded-lg
                  bg-muted/30 hover:bg-muted/50 transition-colors duration-200">
      <span className="text-xs md:text-sm font-medium text-muted-foreground">
        {title}
      </span>
      <span className="font-semibold text-foreground text-base md:text-lg">
        {value}
      </span>
    </div>
  )
}


