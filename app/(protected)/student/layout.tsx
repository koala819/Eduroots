import SidebarMenu from '@/components/template/StudentLayoutMenu'

export default function FamilyLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
    <div className="flex min-h-screen">
      <SidebarMenu />
      <main className="flex-1 flex flex-col bg-slate-50 pb-16 md:pb-0">
        {children}
      </main>
    </div>
    </>
  )
}