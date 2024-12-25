import { getServerSession } from 'next-auth/next'
import { authOptions } from './api/auth/[...nextauth]/route'
import { redirect } from 'next/navigation'
import { Login } from '@/components/Login'

export default async function Home() {
  const session = await getServerSession(authOptions)

  if (session) {
    redirect('/app')
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100">
      <h1 className="text-4xl font-bold mb-4">Welcome to Dudy Trustable</h1>
      <p className="text-xl mb-8">An open-proposal demonstration by @kdy1</p>
      <Login />
    </div>
  )
}

