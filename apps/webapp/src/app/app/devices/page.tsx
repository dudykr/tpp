"use client";

import { useState, useEffect } from "react";
import { trpc } from "@/utils/trpc";
import { RegisterDeviceDialog } from "./register-device-dialog";
import { ApiOutput, AppRouter } from "@/server/router";

type Device = ApiOutput["getDevices"][number];

export default function Devices() {
  const { data } = trpc.getDevices.useQuery();
  const devices = data as Device[] | undefined;

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Manage Devices</h1>
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">Registered Devices</h2>
        {devices?.length === 0 ? (
          <p>No devices registered yet.</p>
        ) : (
          <ul className="space-y-2">
            {devices?.map((device, index) => (
              <li key={index} className="bg-gray-50 p-3 rounded-md">
                {device.name}
              </li>
            ))}
          </ul>
        )}
      </div>
      <RegisterDeviceDialog />
    </div>
  );
}
