"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { trpc } from "@/utils/trpc";
import "@/lib/firebase";
import { getMessaging, getToken } from "firebase/messaging";
import { getAuth, signInAnonymously } from "firebase/auth";
import { startRegistration } from "@simplewebauthn/browser";

export function RegisterDeviceDialog({ onAdd }: { onAdd: () => void }) {
  const [open, setOpen] = useState(false);
  const [deviceName, setDeviceName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [registeredDeviceId, setRegisteredDeviceId] = useState<number | null>(
    null,
  );

  const registerDevice = trpc.devices.registerDevice.useMutation({
    onSuccess: (device) => {
      setRegisteredDeviceId(device.id);
      void handleWebAuthnRegistration(device.id);
    },
  });

  const generateWebAuthnOptions =
    trpc.devices.generateWebAuthnRegistrationOptions.useMutation();
  const verifyWebAuthnRegistration =
    trpc.devices.verifyWebAuthnRegistration.useMutation({
      onSuccess: () => {
        setOpen(false);
        setDeviceName("");
        setRegisteredDeviceId(null);
        onAdd();
      },
    });

  const handleWebAuthnRegistration = async (deviceId: number) => {
    try {
      const options = await generateWebAuthnOptions.mutateAsync({ deviceId });
      const registrationResponse = await startRegistration({
        optionsJSON: options,
        useAutoRegister: true,
      });

      await verifyWebAuthnRegistration.mutateAsync({
        deviceId,
        registrationResponse,
        challenge: options.challenge,
      });
    } catch (error) {
      console.error("Error registering WebAuthn:", error);
      setIsLoading(false);
    }
  };

  const handleRegister = async () => {
    try {
      setIsLoading(true);

      const auth = getAuth();
      if (!auth.currentUser) {
        await signInAnonymously(auth);
      }

      const messaging = getMessaging();
      const fcmToken = await getToken(messaging, {
        vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
      });

      if (!fcmToken) {
        throw new Error("Failed to get FCM token");
      }

      await registerDevice.mutateAsync({
        name: deviceName,
        fcmToken,
      });
    } catch (error) {
      console.error("Error registering device:", error);
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">Register New Device</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Register New Device</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Input
              id="deviceName"
              placeholder="Enter device name"
              value={deviceName}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setDeviceName(e.target.value)
              }
            />
          </div>
          <Button
            onClick={handleRegister}
            disabled={!deviceName || isLoading || registeredDeviceId !== null}
          >
            {isLoading ? "Registering..." : "Register Device"}
          </Button>
          {registeredDeviceId !== null && (
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-2">
                Please complete the WebAuthn registration by following your
                browser's prompts.
              </p>
              {generateWebAuthnOptions.isPending && (
                <p>Preparing WebAuthn registration...</p>
              )}
              {verifyWebAuthnRegistration.isPending && (
                <p>Verifying WebAuthn registration...</p>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
