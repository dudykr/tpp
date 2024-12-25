"use client";

import Link from "next/link";
import { trpc } from "@/utils/trpc";

export default function ApprovalRequests({
  params,
}: {
  params: { packageId: string };
}) {
  const { data: requests, isLoading } = trpc.getApprovalRequests.useQuery({
    packageId: parseInt(params.packageId),
  });

  if (isLoading) return <div>Loading...</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">
        Approval Requests for Package: {params.packageId}
      </h1>
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">Current Requests</h2>
        <ul className="space-y-4">
          {requests?.map((request) => (
            <li key={request.id}>
              <Link
                href={`/app/packages/${params.packageId}/requests/${request.id}`}
                className="block bg-gray-50 p-4 rounded-md hover:bg-gray-100 transition-colors"
              >
                <h3 className="text-lg font-medium">{request.title}</h3>
                <p className="text-sm text-gray-500">
                  Status: {request.status}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      </div>
      <Link
        href={`/app/packages/${params.packageId}/requests/create`}
        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded inline-block"
      >
        Create New Request
      </Link>
    </div>
  );
}
