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
        <section className="p-4 text-center w-full">
          <h1 className="text-xl font-bold text-foreground sm:text-2xl">
            {teacher.firstname} {teacher.lastname}
          </h1>
          <p className="text-muted-foreground text-sm sm:text-base">
            Professeur de Al&apos;Ihsane
          </p>
        </section>

        <section className="w-full flex-1 flex flex-col justify-center p-4">
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
