import {Metadata} from 'next'

import MessageContainer from '@/components/pages/client/MessageContainer'

export const metadata: Metadata = {
  title: "Boîte d'envois",
}

const SendboxPage: React.FC = () => {
  return <MessageContainer isSentbox={true} />
}

export default SendboxPage
