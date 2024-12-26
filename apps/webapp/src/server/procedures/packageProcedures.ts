import { protectedProcedure, router } from "../trpc";
import {
  getMessaging,
  Message,
  MulticastMessage,
} from "firebase-admin/messaging";
import { z } from "zod";
import {
  packagesTable,
  packageMembersTable,
  usersTable,
  approvalRequestsTable,
  approvalGroupsTable,
  approvalGroupMembersTable,
  devicesTable,
} from "../schema";
import { eq, and } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { db } from "../db";
import { MessagePayload } from "firebase/messaging";
import { initializeApp } from "firebase-admin/app";
import { googleCredentials } from "../google";

const PackageZodSchema = z.object({
  id: z.number(),
  name: z.string(),
  createdAt: z.date(),
  ownerId: z.string(),
});

try {
  await initializeApp({
    credential: googleCredentials,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!,
  });
} catch (e) {
  console.error(e);
}

export const packageProcedures = router({
  getPackages: protectedProcedure
    .input(z.void())
    .output(z.array(PackageZodSchema))
    .query(async ({ ctx }) => {
      return db.select().from(packagesTable);
    }),

  getPackageDetails: protectedProcedure
    .input(z.object({ packageId: z.number() }))
    .query(async ({ input, ctx }) => {
      const packageDetails = await db
        .select()
        .from(packagesTable)
        .where(eq(packagesTable.id, input.packageId))
        .limit(1);

      if (packageDetails.length === 0) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Package not found",
        });
      }

      const member = await db
        .select()
        .from(packageMembersTable)
        .where(
          and(
            eq(packageMembersTable.packageId, input.packageId),
            eq(packageMembersTable.userId, ctx.user.id),
          ),
        )
        .limit(1);

      return {
        ...packageDetails[0],
        isOwner: packageDetails[0].ownerId === ctx.user.id,
        isMember: member.length > 0,
      };
    }),

  createPackage: protectedProcedure
    .input(z.object({ name: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const newPackage = await db
        .insert(packagesTable)
        .values({ ...input, ownerId: ctx.user.id })
        .returning();
      await db
        .insert(packageMembersTable)
        .values({ packageId: newPackage[0].id, userId: ctx.user.id });
      return newPackage[0];
    }),

  getPackageMembers: protectedProcedure
    .input(z.object({ packageId: z.number() }))
    .output(
      z.array(
        z.object({
          userId: z.string(),
          name: z.string().nullable(),
          email: z.string().email().nullable(),
        }),
      ),
    )
    .query(async ({ input, ctx }) => {
      const members = await db
        .select({
          userId: usersTable.id,
          name: usersTable.name,
          email: usersTable.email,
        })
        .from(packageMembersTable)
        .innerJoin(usersTable, eq(packageMembersTable.userId, usersTable.id))
        .where(eq(packageMembersTable.packageId, input.packageId));
      return members;
    }),

  addPackageMember: protectedProcedure
    .input(z.object({ packageId: z.number(), email: z.string().email() }))
    .mutation(async ({ input, ctx }) => {
      const user = await db
        .select()
        .from(usersTable)
        .where(eq(usersTable.email, input.email))
        .limit(1);

      if (user.length === 0) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "User not found",
        });
      }

      await db.insert(packageMembersTable).values({
        packageId: input.packageId,
        userId: user[0].id,
      });

      return { success: true };
    }),

  removePackageMember: protectedProcedure
    .input(z.object({ packageId: z.number(), userId: z.string() }))
    .mutation(async ({ input, ctx }) => {
      await db
        .delete(packageMembersTable)
        .where(
          and(
            eq(packageMembersTable.packageId, input.packageId),
            eq(packageMembersTable.userId, input.userId),
          ),
        );

      return { success: true };
    }),

  startPublishing: protectedProcedure
    .input(z.object({ packageId: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const [request] = await db
        .insert(approvalRequestsTable)
        .values({
          packageId: input.packageId,
          title: `Publish package at ${new Date().toISOString()}`,
          status: "pending",
        })
        .returning();

      if (!request) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create approval request",
        });
      }

      const sqGroups = db
        .select({
          id: approvalGroupsTable.id,
        })
        .from(approvalGroupsTable)
        .innerJoin(
          approvalGroupMembersTable,
          eq(approvalGroupsTable.id, approvalGroupMembersTable.groupId),
        )
        .where(eq(approvalGroupsTable.packageId, input.packageId))
        .as("sqGroups");
      const sqMembers = db
        .select({
          userId: approvalGroupMembersTable.userId,
        })
        .from(approvalGroupMembersTable)
        .innerJoin(sqGroups, eq(approvalGroupMembersTable.groupId, sqGroups.id))
        .where(eq(approvalGroupMembersTable.groupId, sqGroups.id))
        .as("sqMembers");
      const sqUsers = db
        .select({
          id: usersTable.id,
        })
        .from(usersTable)
        .innerJoin(sqMembers, eq(usersTable.id, sqMembers.userId))
        .where(eq(usersTable.id, sqMembers.userId))
        .as("sqUsers");
      const devices = await db
        .select({
          id: devicesTable.id,
          fcmToken: devicesTable.fcmToken,
        })
        .from(devicesTable)
        .innerJoin(sqUsers, eq(devicesTable.userId, sqUsers.id))
        .where(eq(devicesTable.userId, sqUsers.id));

      // Send push to all members in the approval group for this package.

      const message: MulticastMessage = {
        notification: {
          title: "New approval request",
          body: "A new approval request has been created",
        },
        webpush: {
          fcmOptions: {
            link: `https://tpp.dudy.dev/app/packages/${input.packageId}/requests/${request.id}`,
          },
        },
        tokens: devices.map((device) => device.fcmToken),
      };

      try {
        await initializeApp({
          credential: googleCredentials,
          projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!,
        });
      } catch (e) {
        console.error(e);
      }

      const pushResults = await getMessaging().sendEachForMulticast(message);
      console.log("pushResults", pushResults);

      return request;
    }),
});
