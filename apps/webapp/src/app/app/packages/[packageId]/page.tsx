"use client";

import Link from "next/link";
import { trpc } from "@/utils/trpc";
import { use } from "react";
import { Button } from "@/components/ui/button";

type Props = {
  params: Promise<{ packageId: string }>;
};

export default function PackageDetails(props: Props) {
  const params = use(props.params);

  const startPublishing = trpc.packages.startPublishing.useMutation({
    onSuccess: () => {
      alert("Publishing started");
    },
  });

  const { data: packageDetails, isLoading } =
    trpc.packages.getPackageDetails.useQuery({
      packageId: parseInt(params.packageId),
    });

  if (isLoading) return <div>Loading...</div>;

  if (!packageDetails?.isMember) {
    return <div>You do not have access to this package.</div>;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">
        Package Details: {packageDetails.name}
      </h1>
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">Package Information</h2>
        <p>ID: {packageDetails.id}</p>
        <p>Name: {packageDetails.name}</p>
        <p>Created At: {packageDetails.createdAt.toLocaleString()}</p>
        <p>Owner: {packageDetails.isOwner ? "You" : "Another user"}</p>
      </div>
      <div className="flex space-x-4">
        <Link
          href={`/app/packages/${params.packageId}/requests`}
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded inline-block"
        >
          View Approval Requests
        </Link>
        {packageDetails.isOwner && (
          <Link
            href={`/app/packages/${params.packageId}/config`}
            className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded inline-block"
          >
            Approval Configuration
          </Link>
        )}
        <Link
          href={`/app/packages/${params.packageId}/members`}
          className="bg-purple-500 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded inline-block"
        >
          Manage Members
        </Link>
      </div>

      <div>
        <Button
          onClick={() => {
            void startPublishing.mutateAsync({
              packageId: parseInt(params.packageId),
            });
          }}
        >
          Demo: Start publishing your package
        </Button>
      </div>
    </div>
  );
}
