import { MenuHeader } from '@/client/components/organisms/HeaderMenu'

interface CourseLayoutProps {
  children: React.ReactNode
}

export default async function CourseLayout({ children }: CourseLayoutProps) {
  return (
    <div className="flex flex-col h-full bg-muted">
      <header className="sticky top-0 z-30">
        <MenuHeader />
      </header>

      <div className="flex-1 p-4 overflow-auto pb-20 sm:pb-4 mt-20">
        <div className="max-w-[1200px] mx-auto bg-background rounded-lg shadow-sm">
          {children}
        </div>
      </div>
    </div>
  )
}
