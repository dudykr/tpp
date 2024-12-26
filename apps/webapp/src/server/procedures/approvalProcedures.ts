import { protectedProcedure, router } from "../trpc";
import { z } from "zod";
import {
  approvalRequestsTable,
  approvalGroupsTable,
  approvalGroupMembersTable,
  approvalsTable,
  packagesTable,
  packageMembersTable,
  approvalAuthenticators,
} from "../schema";
import { eq, and, Simplify } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { db } from "../db";
import { startAuthentication } from "@simplewebauthn/browser";
import { generateAuthenticationOptions } from "@simplewebauthn/server";
import { isoUint8Array } from "@simplewebauthn/server/helpers";

const ApprovalRequestStatus = z.enum(["pending", "approved", "rejected"]);

export const approvalProcedures = router({
  getApprovalRequests: protectedProcedure
    .input(z.object({ packageId: z.number() }))
    .query(async ({ input, ctx }) => {
      return db
        .select()
        .from(approvalRequestsTable)
        .where(eq(approvalRequestsTable.packageId, input.packageId));
    }),

  startApprovalProcess: protectedProcedure
    .input(z.object({ requestId: z.number() }))
    .output(z.object({ options: z.any() }))
    .mutation(async ({ input, ctx }) => {
      const sqPackage = db
        .select({
          packageId: approvalRequestsTable.packageId,
        })
        .from(approvalRequestsTable)
        .where(eq(approvalRequestsTable.id, input.requestId))
        .limit(1)
        .as("sqPackage");

      const sqGroups = db
        .select({
          groupId: approvalGroupsTable.id,
        })
        .from(approvalGroupsTable)
        .innerJoin(
          sqPackage,
          eq(approvalGroupsTable.packageId, sqPackage.packageId),
        )
        .limit(1)
        .as("sqGroups");

      const [approvalGroupMembership] = await db
        .select({
          groupId: approvalGroupMembersTable.groupId,
        })
        .from(approvalGroupMembersTable)
        .innerJoin(
          sqGroups,
          eq(approvalGroupMembersTable.groupId, sqGroups.groupId),
        )
        .where(eq(approvalGroupMembersTable.userId, ctx.user.id))
        .limit(1);

      if (!approvalGroupMembership)
        throw new TRPCError({
          code: "FORBIDDEN",
          message:
            "You are not a member of any approval groups for this package",
        });

      const authenticators = await db
        .select()
        .from(approvalAuthenticators)
        .where(eq(approvalAuthenticators.userId, ctx.user.id));

      if (authenticators.length === 0)
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "WebAuthn is not configured for this account",
        });

      const options = await generateAuthenticationOptions({
        rpID: process.env.WEBAUTHN_RP_ID!,
        allowCredentials: authenticators.map((authenticator) => ({
          id: authenticator.credentialID,
        })),
        challenge: isoUint8Array.fromUTF8String(input.requestId.toString()),
        timeout: 60000,
        userVerification: "required",
      });

      return {
        options,
      };
    }),

  getPackageApprovalGroups: protectedProcedure
    .input(z.object({ packageId: z.number() }))
    .query(async ({ input, ctx }) => {
      return db
        .select()
        .from(approvalGroupsTable)
        .where(eq(approvalGroupsTable.packageId, input.packageId));
    }),

  createApprovalGroup: protectedProcedure
    .input(z.object({ packageId: z.number(), name: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const packageDetails = await db
        .select()
        .from(packagesTable)
        .where(eq(packagesTable.id, input.packageId))
        .limit(1);

      const isMember = await db
        .select()
        .from(packageMembersTable)
        .where(
          and(
            eq(packageMembersTable.packageId, input.packageId),
            eq(packageMembersTable.userId, ctx.user.id),
          ),
        )
        .limit(1);

      if (packageDetails.length === 0 || isMember.length === 0) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You do not have permission to modify this package",
        });
      }

      return db.insert(approvalGroupsTable).values(input);
    }),

  addUserToApprovalGroup: protectedProcedure
    .input(z.object({ groupId: z.number(), userId: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const packageDetails = await db
        .select()
        .from(approvalGroupsTable)
        .innerJoin(
          packagesTable,
          eq(approvalGroupsTable.packageId, packagesTable.id),
        )
        .where(eq(approvalGroupsTable.id, input.groupId))
        .limit(1);

      const isMember = await db
        .select()
        .from(packageMembersTable)
        .where(
          and(
            eq(packageMembersTable.packageId, packageDetails[0].packages.id),
            eq(packageMembersTable.userId, ctx.user.id),
          ),
        )
        .limit(1);

      if (packageDetails.length === 0 || isMember.length === 0) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You do not have permission to modify this package",
        });
      }
      return db.insert(approvalGroupMembersTable).values(input);
    }),

  removeUserFromApprovalGroup: protectedProcedure
    .input(z.object({ groupId: z.number(), userId: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const packageDetails = await db
        .select()
        .from(approvalGroupsTable)
        .innerJoin(
          packagesTable,
          eq(approvalGroupsTable.packageId, packagesTable.id),
        )
        .where(eq(approvalGroupsTable.id, input.groupId))
        .limit(1);

      const isMember = await db
        .select()
        .from(packageMembersTable)
        .where(
          and(
            eq(packageMembersTable.packageId, packageDetails[0].packages.id),
            eq(packageMembersTable.userId, ctx.user.id),
          ),
        )
        .limit(1);

      if (packageDetails.length === 0 || isMember.length === 0) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You do not have permission to modify this package",
        });
      }
      return db
        .delete(approvalGroupMembersTable)
        .where(
          and(
            eq(approvalGroupMembersTable.groupId, input.groupId),
            eq(approvalGroupMembersTable.userId, input.userId),
          ),
        );
    }),

  approveRequest: protectedProcedure
    .input(z.object({ requestId: z.number() }))
    .mutation(async ({ input, ctx }) => {
      // Add the user's approval
      await db
        .insert(approvalsTable)
        .values({ requestId: input.requestId, userId: ctx.user.id });

      // Check if the request should be approved
      const request = await db
        .select()
        .from(approvalRequestsTable)
        .where(eq(approvalRequestsTable.id, input.requestId))
        .limit(1);

      const approvalGroups = await db
        .select()
        .from(approvalGroupsTable)
        .where(eq(approvalGroupsTable.packageId, request[0].packageId));

      const approvedGroups = await db
        .select()
        .from(approvalsTable)
        .innerJoin(
          approvalGroupMembersTable,
          eq(approvalsTable.userId, approvalGroupMembersTable.userId),
        )
        .where(eq(approvalsTable.requestId, input.requestId))
        .groupBy(approvalGroupMembersTable.groupId);

      if (approvedGroups.length === approvalGroups.length) {
        // All groups have at least one approval, update the request status
        await db
          .update(approvalRequestsTable)
          .set({ status: "approved" })
          .where(eq(approvalRequestsTable.id, input.requestId));
      }

      return { success: true };
    }),

  createApprovalRequest: protectedProcedure
    .input(z.object({ packageId: z.number(), title: z.string() }))
    .mutation(async ({ input, ctx }) => {
      return db.insert(approvalRequestsTable).values({
        ...input,
        status: "pending",
      });
    }),
});
