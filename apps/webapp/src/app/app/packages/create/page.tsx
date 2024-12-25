'use client'

import { useState } from 'react'
import { trpc } from '@/utils/trpc'
import { withAuth } from '@/components/withAuth'
import { useRouter } from 'next/navigation'

function CreatePackage() {
  const [packageName, setPackageName] = useState('')
  const createPackageMutation = trpc.createPackage.useMutation()
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (packageName.trim()) {
      try {
        const newPackage = await createPackageMutation.mutateAsync({ name: packageName.trim() })
        router.push(`/app/packages/${newPackage.id}`)
      } catch (error) {
        console.error('Error creating package:', error)
        alert('Failed to create package. Please try again.')
      }
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Create New Package</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="packageName" className="block text-sm font-medium text-gray-700">
            Package Name
          </label>
          <input
            type="text"
            id="packageName"
            value={packageName}
            onChange={(e) => setPackageName(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
            required
          />
        </div>
        <button
          type="submit"
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        >
          Create Package
        </button>
      </form>
    </div>
  )
}

export default withAuth(CreatePackage)

