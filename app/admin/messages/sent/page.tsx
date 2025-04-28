import { Metadata } from 'next'

import MessageContainer from '@/components/pages/client/MessageContainer'

export const metadata: Metadata = {
  title: "Boîte d'envois",
  alternates: {
    canonical: `${process.env.CLIENT_URL}/admin/messages/sent`,
  },
}

const SendboxAdminPage: React.FC = () => {
  return <MessageContainer isSentbox={true} />
}

export default SendboxAdminPage
