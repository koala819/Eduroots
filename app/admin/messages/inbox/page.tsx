import { Metadata } from 'next'

import MessageContainer from '@/components/pages/client/MessageContainer'

export const metadata: Metadata = {
  title: 'Boîte de réception',
  alternates: {
    canonical: `${process.env.CLIENT_URL}/admin/messages/inbox`,
  },
}

export default function InboxAdminPage() {
  return <MessageContainer />
}
