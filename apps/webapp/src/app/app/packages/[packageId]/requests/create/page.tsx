"use client";

import { useState } from "react";
import { trpc } from "@/utils/trpc";
import { withAuth } from "@/components/withAuth";
import { useRouter } from "next/navigation";

export default function CreateApprovalRequest({
  params,
}: {
  params: { packageId: string };
}) {
  const [title, setTitle] = useState("");
  const createRequestMutation = trpc.createApprovalRequest.useMutation();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (title.trim()) {
      try {
        await createRequestMutation.mutateAsync({
          packageId: parseInt(params.packageId),
          title: title.trim(),
        });
        router.push(`/app/packages/${params.packageId}/requests`);
      } catch (error) {
        console.error("Error creating approval request:", error);
        alert("Failed to create approval request. Please try again.");
      }
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Create Approval Request</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label
            htmlFor="title"
            className="block text-sm font-medium text-gray-700"
          >
            Request Title
          </label>
          <input
            type="text"
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
            required
          />
        </div>
        <button
          type="submit"
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        >
          Create Request
        </button>
      </form>
    </div>
  );
}
