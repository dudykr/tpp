import { isoUint8Array } from "@simplewebauthn/server/helpers";
import { protectedProcedure, router } from "../trpc";
import { z } from "zod";
import { approvalAuthenticators, devicesTable } from "../schema";
import { and, eq, exists } from "drizzle-orm";
import { db } from "../db";
import {
  generateRegistrationOptions,
  verifyRegistrationResponse,
} from "@simplewebauthn/server";

export const DeviceZodSchema = z.object({
  id: z.number(),
  name: z.string(),
  isWebAuthnRegistered: z.boolean(),
  createdAt: z.date(),
});

export const deviceProcedures = router({
  getDevices: protectedProcedure
    .input(z.void())
    .output(z.array(DeviceZodSchema))
    .query(async ({ ctx }) => {
      const devices = await db
        .select({
          id: devicesTable.id,
          name: devicesTable.name,
          createdAt: devicesTable.createdAt,
          webAuthnId: approvalAuthenticators.credentialID,
        })
        .from(devicesTable)
        .leftJoin(
          approvalAuthenticators,
          eq(approvalAuthenticators.deviceId, devicesTable.id),
        )
        .where(eq(devicesTable.userId, ctx.user.id));

      return devices.map(({ webAuthnId, ...device }) => ({
        ...device,
        isWebAuthnRegistered: webAuthnId !== null,
      }));
    }),

  unregisterDevice: protectedProcedure
    .input(z.object({ deviceId: z.number() }))
    .mutation(async ({ input, ctx }) => {
      await db
        .delete(devicesTable)
        .where(
          and(
            eq(devicesTable.id, input.deviceId),
            eq(devicesTable.userId, ctx.user.id),
          ),
        );
    }),

  registerDevice: protectedProcedure
    .input(z.object({ name: z.string(), fcmToken: z.string() }))
    .output(DeviceZodSchema)
    .mutation(async ({ input, ctx }) => {
      const [device] = await db
        .insert(devicesTable)
        .values({ ...input, userId: ctx.user.id })
        .returning({
          id: devicesTable.id,
          name: devicesTable.name,
          createdAt: devicesTable.createdAt,
        })
        .onConflictDoUpdate({
          target: [devicesTable.fcmToken],
          set: {
            name: input.name,
          },
        });

      const credentials = await db
        .select()
        .from(approvalAuthenticators)
        .where(eq(approvalAuthenticators.deviceId, device.id))
        .limit(1);

      return {
        ...device,
        isWebAuthnRegistered: credentials.length > 0,
      };
    }),

  generateWebAuthnRegistrationOptions: protectedProcedure
    .input(z.object({ deviceId: z.number() }))
    .output(z.any())
    .mutation(async ({ input, ctx }) => {
      const existingCredentials = await db
        .select()
        .from(approvalAuthenticators)
        .where(
          and(
            eq(approvalAuthenticators.userId, ctx.user.id),
            eq(approvalAuthenticators.deviceId, input.deviceId),
          ),
        );

      const options = await generateRegistrationOptions({
        rpName: "Dudy TPP",
        rpID: process.env.WEBAUTHN_RP_ID!,
        userID: isoUint8Array.fromUTF8String(ctx.user.id),
        userName: ctx.user.email!,
        attestationType: "none",
        excludeCredentials: existingCredentials.map((credential) => ({
          id: fromBase64URLString(credential.credentialID),
        })),
      });

      return options;
    }),

  verifyWebAuthnRegistration: protectedProcedure
    .input(
      z.object({
        deviceId: z.number(),
        registrationResponse: z.any(),
        challenge: z.string(),
      }),
    )
    .output(z.object({ verified: z.boolean() }))
    .mutation(async ({ input, ctx }) => {
      const verification = await verifyRegistrationResponse({
        response: input.registrationResponse,
        expectedChallenge: input.challenge,
        expectedOrigin: process.env.WEBAUTHN_ORIGIN!,
        expectedRPID: process.env.WEBAUTHN_RP_ID!,
      });

      if (verification.verified) {
        const { credential } = verification.registrationInfo!;

        await db.insert(approvalAuthenticators).values({
          credentialID: Buffer.from(credential.id).toString("base64url"),
          userId: ctx.user.id,
          credentialPublicKey: Buffer.from(credential.publicKey).toString(
            "base64url",
          ),
          counter: credential.counter,
          credentialDeviceType:
            verification.registrationInfo!.credentialDeviceType,
          credentialBackedUp: verification.registrationInfo!.credentialBackedUp,
          transports: input.registrationResponse.response.transports?.join(","),

          deviceId: input.deviceId,
        });

        return { verified: true };
      }

      return { verified: false };
    }),
});

export function fromBase64URLString(credentialID: string): string {
  return Buffer.from(credentialID, "base64url").toString();
}
