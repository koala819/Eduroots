import {Metadata} from 'next'

import {MessageWrite} from '@/components/organisms/client/MessageWrite'

export const metadata: Metadata = {
  title: 'Ecrire un nouveau message',
}

export default function WriteMessagePage() {
  return <MessageWrite />
}
