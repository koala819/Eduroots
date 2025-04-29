import {Metadata} from 'next'

import MessageContainer from '@/components/pages/client/MessageContainer'

export const metadata: Metadata = {
  title: 'Boîte de réception',
}

export default function InboxPage() {
  return <MessageContainer />
}
