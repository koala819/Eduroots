import { Metadata } from 'next'

import { MessageWrite } from '@/client//components/organisms/MessageWrite'

export const metadata: Metadata = {
  title: 'Ecrire un nouveau message',
  alternates: {
    canonical: `${process.env.CLIENT_URL}/admin/messages/write`,
  },
}

export default function WriteMessagePage() {
  return <MessageWrite />
}
