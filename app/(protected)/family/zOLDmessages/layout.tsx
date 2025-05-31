import MailboxLayout from '@/components/template/MailboxLayout'

export default function AdminMailboxLayout({children}: {children: React.ReactNode}) {
  return <MailboxLayout basePath="/student/messages">{children}</MailboxLayout>
}
