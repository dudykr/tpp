"use client";

import { useState } from "react";
import { trpc } from "@/utils/trpc";
import { use } from "react";
import { startAuthentication } from "@simplewebauthn/browser";

type Props = {
  params: Promise<{ packageId: string; requestId: string }>;
};

export default function ApprovalRequestDetails(props: Props) {
  const params = use(props.params);
  const [isApproving, setIsApproving] = useState(false);
  const {
    data: requestDetails,
    isLoading,
    refetch,
  } = trpc.approvals.getApprovalRequests.useQuery({
    packageId: parseInt(params.packageId),
  });
  const startApproval = trpc.approvals.startApprovalProcess.useMutation();
  const approveRequest = trpc.approvals.approveRequest.useMutation();

  const handleApprove = async () => {
    setIsApproving(true);
    try {
      const { options } = await startApproval.mutateAsync({
        requestId: parseInt(params.requestId),
      });
      const result = await startAuthentication({
        optionsJSON: options,
      });
      console.log("result", result);
      alert("Approval submitted successfully!");

      await approveRequest.mutateAsync({
        requestId: parseInt(params.requestId),
        result,
      });
      void refetch();
    } catch (error) {
      console.error("Error submitting approval:", error);
      alert("Failed to submit approval. Please try again.");
    } finally {
      setIsApproving(false);
    }
  };

  if (isLoading) return <div>Loading...</div>;

  const request = requestDetails?.find(
    (r) => r.id === parseInt(params.requestId),
  );

  if (!request) return <div>Request not found</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Approval Request Details</h1>
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">Request Information</h2>
        <p>Package ID: {params.packageId}</p>
        <p>Request ID: {params.requestId}</p>
        <p>Title: {request.title}</p>
        <p>Status: {request.status}</p>
      </div>
      {request.status === "pending" && (
        <button
          onClick={handleApprove}
          disabled={isApproving}
          className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50"
        >
          {isApproving ? "Submitting Approval..." : "Approve Request"}
        </button>
      )}
      <p className="text-sm text-gray-600">
        Note: The request will be fully approved when at least one member from
        each approval group has approved it.
      </p>
    </div>
  );
}
