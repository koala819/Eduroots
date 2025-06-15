'use client'

import { Header } from '@/components/atoms/StudentHeader'
import StudentNavbar from '@/components/atoms/StudentNavbar'

export default function StudentLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <div className="flex flex-col relative bg-gray-50 min-h-screen">
      <Header />
      <main className="flex-1 pb-16">{children}</main>
      <StudentNavbar />
    </div>
  )
}
