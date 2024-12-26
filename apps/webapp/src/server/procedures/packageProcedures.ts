import { protectedProcedure, router } from "../trpc";
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

const PackageZodSchema = z.object({
  id: z.number(),
  name: z.string(),
  createdAt: z.date(),
  ownerId: z.string(),
});

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
      const [request] = db
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
        .select()
        .from(approvalGroupsTable)
        .where(eq(approvalGroupsTable.packageId, input.packageId))
        .as("sqGroups");
      const sqMembers = db
        .select()
        .from(approvalGroupMembersTable)
        .where(eq(approvalGroupMembersTable.groupId, sqGroups.id))
        .as("sqMembers");
      const sqUsers = db
        .select()
        .from(usersTable)
        .where(eq(usersTable.id, sqMembers.userId))
        .as("sqUsers");
      const devices = await db
        .select()
        .from(devicesTable)
        .where(eq(devicesTable.userId, sqUsers.id));

      // Send push to all members in the approval group for this package.
    }),
});
