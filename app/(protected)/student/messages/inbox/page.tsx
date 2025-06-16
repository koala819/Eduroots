import { Metadata } from 'next'

import MessageContainer from '@/client//components/pages/MessageContainer'

export const metadata: Metadata = {
  title: 'Boîte de réception',
  alternates: {
    canonical: `${process.env.CLIENT_URL}/messages/inbox`,
  },
}

export default function InboxPage() {
  return <MessageContainer />
}
