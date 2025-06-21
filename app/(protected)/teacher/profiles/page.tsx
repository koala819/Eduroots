import { Suspense } from 'react'

import Profile from '@/client/components/atoms/ProfilePage'
import { ErrorContent, LoadingContent } from '@/client/components/atoms/StatusContent'
import { getAuthenticatedUser } from '@/server/utils/auth-helpers'

const ProfilePage = async () => {
  try {
    const user = await getAuthenticatedUser()

    const teacher = {
      firstname: user?.user_metadata?.firstname || '',
      lastname: user?.user_metadata?.lastname || '',
    }

    return (
      <>
        <section className="p-2 text-center w-full">
          <h1 className="text-2xl font-bold text-foreground">
            {teacher.firstname} {teacher.lastname}
          </h1>
          <p style={{ color: 'var(--color-muted-foreground)' }}>Professeur de Al&apos;Ihsane</p>
        </section>

        <section className="w-full flex-1 flex flex-col justify-center md:p-4 p-2">
          <Suspense fallback={<LoadingContent />}>
            <Profile />
          </Suspense>
        </section>
      </>
    )
  } catch (error) {
    console.error('[PROFILE_PAGE]', error)
    return <ErrorContent message="Vous n'êtes pas authentifié" />
  }
}

export default ProfilePage
