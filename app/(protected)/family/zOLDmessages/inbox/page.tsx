import {Metadata} from 'next'

import MessageContainer from '@/components/pages/client/MessageContainer'

export const metadata: Metadata = {
  title: 'Boîte de réception',
  alternates: {
    canonical: `${process.env.CLIENT_URL}/messages/inbox`,
  },
}

export default function InboxPage() {
  return <MessageContainer />
}
