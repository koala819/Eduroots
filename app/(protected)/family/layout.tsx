'use client'

import { Header } from '@/zUnused/StudentHeader'
import StudentNavbar from '@/zUnused/StudentNavbar'

export default function FamilyLayout({
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
