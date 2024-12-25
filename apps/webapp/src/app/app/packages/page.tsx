"use client";

import Link from "next/link";
import { trpc } from "@/utils/trpc";
import { withAuth } from "@/components/withAuth";

function Packages() {
  const { data: packages, isLoading } = trpc.getPackages.useQuery();

  if (isLoading) return <div>Loading...</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Your Packages</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {packages?.map((pkg) => (
          <Link
            key={pkg.id}
            href={`/app/packages/${pkg.id}`}
            className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow"
          >
            <h2 className="text-xl font-semibold mb-2">{pkg.name}</h2>
            <p className="text-blue-500">View details</p>
          </Link>
        ))}
      </div>
    </div>
  );
}

export default withAuth(Packages);
