import { ClientLayout } from '@/components/template/TeacherLayout'

export default function TeacherLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <ClientLayout>
      <div className="flex flex-col relative bg-gray-50  h-full">{children}</div>
    </ClientLayout>
  )
}