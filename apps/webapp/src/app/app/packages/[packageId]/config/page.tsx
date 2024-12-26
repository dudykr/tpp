"use client";

import { use, useState } from "react";
import { trpc } from "@/utils/trpc";

type Props = {
  params: Promise<{
    packageId: string;
  }>;
};

type ApprovalGroup = {
  id: number;
  name: string;
};

type GroupMember = {
  userId: string;
  name: string | null;
};

type PackageMember = {
  userId: string;
  name: string | null;
  email: string | null;
};

export default function PackageApprovalConfig(props: Props) {
  const params = use(props.params);
  const [newGroupName, setNewGroupName] = useState("");
  const [selectedGroupId, setSelectedGroupId] = useState<number | null>(null);
  const { data: packageDetails } = trpc.packages.getPackageDetails.useQuery({
    packageId: parseInt(params.packageId),
  });
  const {
    data: approvalGroups,
    isLoading,
    refetch,
  } = trpc.approvals.getPackageApprovalGroups.useQuery({
    packageId: parseInt(params.packageId),
  });
  const { data: packageMembers } = trpc.packages.getPackageMembers.useQuery({
    packageId: parseInt(params.packageId),
  });
  const { data: groupMembers, refetch: refetchGroupMembers } =
    trpc.approvals.getGroupMembers.useQuery(
      { groupId: selectedGroupId! },
      { enabled: !!selectedGroupId },
    );
  const createGroupMutation = trpc.approvals.createApprovalGroup.useMutation();
  const addUserMutation = trpc.approvals.addUserToApprovalGroup.useMutation();
  const removeUserMutation =
    trpc.approvals.removeUserFromApprovalGroup.useMutation();

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newGroupName.trim()) {
      try {
        await createGroupMutation.mutateAsync({
          packageId: parseInt(params.packageId),
          name: newGroupName.trim(),
        });
        setNewGroupName("");
        void refetch();
      } catch (error) {
        console.error("Error creating group:", error);
        alert("Failed to create group. Please try again.");
      }
    }
  };

  const handleAddUser = async (userId: string) => {
    if (!selectedGroupId) return;
    try {
      await addUserMutation.mutateAsync({
        groupId: selectedGroupId,
        userId,
      });
      void refetch();
    } catch (error) {
      console.error("Error adding user:", error);
      alert("Failed to add user. A user can only be in one approval group.");
    }
    void refetchGroupMembers();
  };

  const handleRemoveUser = async (userId: string) => {
    if (!selectedGroupId) return;
    try {
      await removeUserMutation.mutateAsync({
        groupId: selectedGroupId,
        userId,
      });
      void refetch();
    } catch (error) {
      console.error("Error removing user:", error);
      alert("Failed to remove user. Please try again.");
    }
    void refetchGroupMembers();
  };

  if (isLoading) return <div>Loading...</div>;

  if (!packageDetails?.isOwner) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Package Approval Configuration</h1>
        <p className="text-red-500">
          You do not have permission to modify this package&apos;s approval
          configuration.
        </p>
      </div>
    );
  }

  const availableMembers = packageMembers?.filter(
    (member: PackageMember) =>
      !groupMembers?.some((gm: GroupMember) => gm.userId === member.userId),
  );

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Package Approval Configuration</h1>
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">Approval Groups</h2>
        <div className="grid grid-cols-2 gap-6">
          <div>
            <ul className="space-y-2 mb-4">
              {approvalGroups?.map((group: ApprovalGroup) => (
                <li
                  key={group.id}
                  className={`bg-gray-50 p-3 rounded-md cursor-pointer flex items-center justify-between hover:bg-gray-100 transition-colors duration-150 ${
                    selectedGroupId === group.id ? "ring-2 ring-blue-500" : ""
                  }`}
                  onClick={() => setSelectedGroupId(group.id)}
                >
                  <span>{group.name}</span>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 text-gray-400"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
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
                className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded inline-flex items-center space-x-1"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
                    clipRule="evenodd"
                  />
                </svg>
                <span>Add</span>
              </button>
            </form>
          </div>

          {selectedGroupId && (
            <div>
              <h3 className="text-lg font-semibold mb-3">Group Members</h3>
              {groupMembers && groupMembers.length > 0 ? (
                <ul className="space-y-2 mb-4">
                  {groupMembers.map((member: GroupMember) => (
                    <li
                      key={member.userId}
                      className="flex justify-between items-center bg-gray-50 p-3 rounded-md hover:bg-gray-100 transition-colors duration-150"
                    >
                      <span>{member.name || member.userId}</span>
                      <button
                        onClick={() => handleRemoveUser(member.userId)}
                        className="text-red-500 hover:text-red-700 inline-flex items-center space-x-1"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-5 w-5"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path
                            fillRule="evenodd"
                            d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                            clipRule="evenodd"
                          />
                        </svg>
                        <span>Remove</span>
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-500 mb-4">No members in this group</p>
              )}

              <h3 className="text-lg font-semibold mb-3">Available Members</h3>
              {availableMembers && availableMembers.length > 0 ? (
                <ul className="space-y-2">
                  {availableMembers.map((member: PackageMember) => (
                    <li
                      key={member.userId}
                      className="flex justify-between items-center bg-gray-50 p-3 rounded-md hover:bg-gray-100 transition-colors duration-150"
                    >
                      <span>{member.name || member.userId}</span>
                      <button
                        onClick={() => handleAddUser(member.userId)}
                        className="text-blue-500 hover:text-blue-700 inline-flex items-center space-x-1"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-5 w-5"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path
                            fillRule="evenodd"
                            d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
                            clipRule="evenodd"
                          />
                        </svg>
                        <span>Add</span>
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-500">No available members</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
