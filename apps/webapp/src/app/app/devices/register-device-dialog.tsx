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

export function RegisterDeviceDialog() {
  const [open, setOpen] = useState(false);
  const [deviceName, setDeviceName] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const registerDevice = trpc.registerDevice.useMutation({
    onSuccess: () => {
      setOpen(false);
      setDeviceName("");
    },
  });

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
    } finally {
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
          <Button onClick={handleRegister} disabled={!deviceName || isLoading}>
            {isLoading ? "Registering..." : "Register Device"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
