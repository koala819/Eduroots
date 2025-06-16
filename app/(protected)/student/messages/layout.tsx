import MailboxLayout from '@/zUnused/MailboxLayout'

export default function AdminMailboxLayout({ children }: {children: React.ReactNode}) {
  return <MailboxLayout basePath="/student/messages">{children}</MailboxLayout>
}
