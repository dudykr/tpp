'use client'

import { signIn, signOut, useSession } from 'next-auth/react'

export function Login() {
  const { data: session } = useSession()

  if (session) {
    return (
      <div>
        Signed in as {session.user?.email} <br />
        <button onClick={() => signOut()}>Sign out</button>
      </div>
    )
  }
  return (
    <div>
      Not signed in <br />
      <button onClick={() => signIn()}>Sign in</button>
    </div>
  )
}

