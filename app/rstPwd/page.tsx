import {Metadata} from 'next'

import PasswordReset from '@/components/organisms/PasswordReset'

export const metadata: Metadata = {
  title: 'Mot de Passe perdu',
  alternates: {
    canonical: `${process.env.CLIENT_URL}/rstPwd`,
  },
}
const RefoundPwdPage = () => {
  return (
    <div className="min-h-screen flex justify-center items-center bg-gradient-to-r from-blue-400 to-purple-500">
      <PasswordReset />
    </div>
  )
}

export default RefoundPwdPage
