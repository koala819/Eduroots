import { FamilyLayout } from '@/components/template/FamilyLayout'

export default function CustomLayout({ children }: { children: React.ReactNode }) {
  return (
    <FamilyLayout>
      {children}
    </FamilyLayout>
  )
}