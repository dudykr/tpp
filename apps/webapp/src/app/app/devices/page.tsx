"use client";

import { useState, useEffect } from "react";
import { trpc } from "@/utils/trpc";

export default function Devices() {
  const [devices, setDevices] = useState([]);
  const { data: fetchedDevices, isLoading } = trpc.getDevices.useQuery();
  const registerDevice = trpc.registerDevice.useMutation();

  useEffect(() => {
    if (fetchedDevices) {
      setDevices(fetchedDevices);
    }
  }, [fetchedDevices]);

  const register = async () => {
    try {
      const newDevice = await registerDevice.mutateAsync({
        name: "New Device",
      });
      setDevices([...devices, newDevice]);
    } catch (error) {
      console.error("Error registering device:", error);
    }
  };

  if (isLoading) return <div>Loading...</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Manage Devices</h1>
      <button
        onClick={register}
        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
      >
        Register New Device
      </button>
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">Registered Devices</h2>
        {devices.length === 0 ? (
          <p>No devices registered yet.</p>
        ) : (
          <ul className="space-y-2">
            {devices.map((device, index) => (
              <li key={index} className="bg-gray-50 p-3 rounded-md">
                {device.name}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
