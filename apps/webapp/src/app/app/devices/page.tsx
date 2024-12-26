"use client";

import { useState, useEffect } from "react";
import { trpc } from "@/utils/trpc";
import { RegisterDeviceDialog } from "./register-device-dialog";
import { ApiOutput, AppRouter } from "@/server/router";

type Device = ApiOutput["devices"]["getDevices"][number];

export default function Devices() {
  const [data, query] = trpc.devices.getDevices.useSuspenseQuery();
  const devices = data as Device[];
  const utils = trpc.useUtils();
  const unregisterMutation = trpc.devices.unregisterDevice.useMutation({
    onSuccess: () => {
      void utils.devices.getDevices.invalidate();
    },
  });

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Manage Devices</h1>
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">Registered Devices</h2>
        {devices.length === 0 ? (
          <p>No devices registered yet.</p>
        ) : (
          <ul className="space-y-2">
            {devices.map((device, index) => (
              <li
                key={index}
                className="bg-gray-50 p-3 rounded-md flex justify-between items-center"
              >
                <div className="flex items-center gap-2">
                  <span>{device.name}</span>
                  {device.isWebAuthnRegistered ? (
                    <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                      WebAuthn Registered
                    </span>
                  ) : (
                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                      WebAuthn Not Registered
                    </span>
                  )}
                </div>
                <button
                  onClick={() =>
                    unregisterMutation.mutate({ deviceId: device.id })
                  }
                  className="text-red-600 hover:text-red-800"
                >
                  Unregister
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
      <RegisterDeviceDialog onAdd={query.refetch} />
    </div>
  );
}
