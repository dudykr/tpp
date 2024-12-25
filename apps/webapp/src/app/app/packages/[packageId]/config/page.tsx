'use client'

import { use, useState } from 'react'
import { trpc } from '@/utils/trpc'
import { withAuth } from '@/components/withAuth'

type Props={
  params: Promise<{
    packageId: string
  }>
};

function PackageApprovalConfig(props: Props) {
  const params=use(props.params);
  const [newGroupName, setNewGroupName] = useState('')
  const { data: packageDetails } = trpc.getPackageDetails.useQuery({ packageId: parseInt(params.packageId) })
  const { data: approvalGroups, isLoading, refetch } = trpc.getPackageApprovalGroups.useQuery({ packageId: parseInt(params.packageId) })
  const createGroupMutation = trpc.createApprovalGroup.useMutation()

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault()
    if (newGroupName.trim()) {
      try {
        await createGroupMutation.mutateAsync({ packageId: parseInt(params.packageId), name: newGroupName.trim() })
        setNewGroupName('')
        refetch()
      } catch (error) {
        console.error('Error creating group:', error)
        alert('Failed to create group. Please try again.')
      }
    }
  }

  if (isLoading) return <div>Loading...</div>

  if (!packageDetails?.isOwner) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Package Approval Configuration</h1>
        <p className="text-red-500">You do not have permission to modify this package&apos;s approval configuration.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Package Approval Configuration</h1>
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">Approval Groups</h2>
        <ul className="space-y-2 mb-4">
          {approvalGroups?.map((group) => (
            <li key={group.id} className="bg-gray-50 p-3 rounded-md">
              {group.name}
            </li>
          ))}
        </ul>
        <form onSubmit={handleCreateGroup} className="flex space-x-2">
          <input
            type="text"
            value={newGroupName}
            onChange={(e) => setNewGroupName(e.target.value)}
            placeholder="New group name"
            className="flex-grow px-3 py-2 border border-gray-300 rounded-md"
          />
          <button
            type="submit"
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          >
            Create Group
          </button>
        </form>
      </div>
    </div>
  )
}

export default withAuth(PackageApprovalConfig)

