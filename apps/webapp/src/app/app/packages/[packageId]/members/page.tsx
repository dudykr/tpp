"use client";

import { useState } from "react";
import { trpc } from "@/utils/trpc";

export default function PackageMembers({
  params,
}: {
  params: { packageId: string };
}) {
  const [newMemberEmail, setNewMemberEmail] = useState("");
  const { data: packageDetails } = trpc.getPackageDetails.useQuery({
    packageId: parseInt(params.packageId),
  });
  const {
    data: members,
    isLoading,
    refetch,
  } = trpc.getPackageMembers.useQuery({
    packageId: parseInt(params.packageId),
  });
  const addMemberMutation = trpc.addPackageMember.useMutation();
  const removeMemberMutation = trpc.removePackageMember.useMutation();

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newMemberEmail.trim()) {
      try {
        await addMemberMutation.mutateAsync({
          packageId: parseInt(params.packageId),
          email: newMemberEmail.trim(),
        });
        setNewMemberEmail("");
        refetch();
      } catch (error) {
        console.error("Error adding member:", error);
        alert("Failed to add member. Please try again.");
      }
    }
  };

  const handleRemoveMember = async (userId: number) => {
    try {
      await removeMemberMutation.mutateAsync({
        packageId: parseInt(params.packageId),
        userId,
      });
      refetch();
    } catch (error) {
      console.error("Error removing member:", error);
      alert("Failed to remove member. Please try again.");
    }
  };

  if (isLoading) return <div>Loading...</div>;

  if (!packageDetails?.isMember) {
    return (
      <div>You do not have access to manage members for this package.</div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Package Members</h1>
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">Current Members</h2>
        <ul className="space-y-2 mb-4">
          {members?.map((member) => (
            <li
              key={member.id}
              className="flex justify-between items-center bg-gray-50 p-3 rounded-md"
            >
              <span>
                {member.name} ({member.email})
              </span>
              {packageDetails.isOwner &&
                packageDetails.ownerId !== member.id && (
                  <button
                    onClick={() => handleRemoveMember(member.id)}
                    className="text-red-500 hover:text-red-700"
                  >
                    Remove
                  </button>
                )}
            </li>
          ))}
        </ul>
        {packageDetails.isOwner && (
          <form onSubmit={handleAddMember} className="flex space-x-2">
            <input
              type="email"
              value={newMemberEmail}
              onChange={(e) => setNewMemberEmail(e.target.value)}
              placeholder="New member email"
              className="flex-grow px-3 py-2 border border-gray-300 rounded-md"
            />
            <button
              type="submit"
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
            >
              Add Member
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
