'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export function withAuth<P extends object>(
  WrappedComponent: React.ComponentType<P>
) {
  return function WithAuth(props: P) {
    const { data: session, status } = useSession()
    const router = useRouter()

    useEffect(() => {
      if (status === 'loading') return // Do nothing while loading
      if (!session) router.push('/') // Redirect to home if not authenticated
    }, [session, status, router])

    if (status === 'loading') {
      return <div>Loading...</div>
    }

    if (!session) {
      return null
    }

    return <WrappedComponent {...props} />
  }
}

