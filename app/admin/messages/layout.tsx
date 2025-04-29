import MailboxLayout from '@/components/template/MailboxLayout'

export default function AdminMailboxLayout({children}: {children: React.ReactNode}) {
  return (
    <div className="w-full h-full flex flex-col">
      <MailboxLayout basePath="/admin/messages">{children}</MailboxLayout>
    </div>
  )
}
