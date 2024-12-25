"use client";

import Link from "next/link";

export default function Dashboard() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Link
          href="/app/devices"
          className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow"
        >
          <h2 className="text-xl font-semibold mb-2">Manage Devices</h2>
          <p>
            Register and manage your devices for push notifications and WebAuthn
          </p>
        </Link>
        <Link
          href="/app/packages"
          className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow"
        >
          <h2 className="text-xl font-semibold mb-2">Packages</h2>
          <p>View and manage packages you&apos;re a member of</p>
        </Link>
      </div>
    </div>
  );
}
