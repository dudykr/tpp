import { protectedProcedure } from '../trpc'
import { z } from 'zod'
import { approvalGroups, approvalGroupMembers, approvalRequests, approvals, packages, packageMembers } from '../schema'
import { eq, and } from 'drizzle-orm'
import { TRPCError } from '@trpc/server'

const ApprovalRequestStatus = z.enum(['pending', 'approved', 'rejected'])

export const approvalProcedures = {
  getApprovalRequests: protectedProcedure
    .input(z.object({ packageId: z.number() }))
    .query(async ({ input, ctx }) => {
      return ctx.db.select().from(approvalRequests).where(eq(approvalRequests.packageId, input.packageId))
    }),

  getPackageApprovalGroups: protectedProcedure
    .input(z.object({ packageId: z.number() }))
    .query(async ({ input, ctx }) => {
      return ctx.db.select().from(approvalGroups).where(eq(approvalGroups.packageId, input.packageId))
    }),

  createApprovalGroup: protectedProcedure
    .input(z.object({ packageId: z.number(), name: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const packageDetails = await ctx.db
        .select()
        .from(packages)
        .where(eq(packages.id, input.packageId))
        .limit(1)

      const isMember = await ctx.db
        .select()
        .from(packageMembers)
        .where(
          and(
            eq(packageMembers.packageId, input.packageId),
            eq(packageMembers.userId, ctx.user.id)
          )
        )
        .limit(1)

      if (packageDetails.length === 0 || isMember.length === 0) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You do not have permission to modify this package',
        })
      }

      return ctx.db.insert(approvalGroups).values(input)
    }),

  addUserToApprovalGroup: protectedProcedure
    .input(z.object({ groupId: z.number(), userId: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const packageDetails = await ctx.db
        .select()
        .from(approvalGroups)
        .innerJoin(packages, eq(approvalGroups.packageId, packages.id))
        .where(eq(approvalGroups.id, input.groupId))
        .limit(1);

      const isMember = await ctx.db
        .select()
        .from(packageMembers)
        .where(
          and(
            eq(packageMembers.packageId, packageDetails[0].packageId),
            eq(packageMembers.userId, ctx.user.id)
          )
        )
        .limit(1);

      if (packageDetails.length === 0 || isMember.length === 0) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You do not have permission to modify this package',
        })
      }
      return ctx.db.insert(approvalGroupMembers).values(input)
    }),

  removeUserFromApprovalGroup: protectedProcedure
    .input(z.object({ groupId: z.number(), userId: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const packageDetails = await ctx.db
        .select()
        .from(approvalGroups)
        .innerJoin(packages, eq(approvalGroups.packageId, packages.id))
        .where(eq(approvalGroups.id, input.groupId))
        .limit(1);

      const isMember = await ctx.db
        .select()
        .from(packageMembers)
        .where(
          and(
            eq(packageMembers.packageId, packageDetails[0].packageId),
            eq(packageMembers.userId, ctx.user.id)
          )
        )
        .limit(1);

      if (packageDetails.length === 0 || isMember.length === 0) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You do not have permission to modify this package',
        })
      }
      return ctx.db
        .delete(approvalGroupMembers)
        .where(
          and(
            eq(approvalGroupMembers.groupId, input.groupId),
            eq(approvalGroupMembers.userId, input.userId)
          )
        )
    }),

  approveRequest: protectedProcedure
    .input(z.object({ requestId: z.number() }))
    .mutation(async ({ input, ctx }) => {
      // Add the user's approval
      await ctx.db.insert(approvals).values({ requestId: input.requestId, userId: ctx.user.id })

      // Check if the request should be approved
      const request = await ctx.db
        .select()
        .from(approvalRequests)
        .where(eq(approvalRequests.id, input.requestId))
        .limit(1)

      const approvalGroups = await ctx.db
        .select()
        .from(approvalGroups)
        .where(eq(approvalGroups.packageId, request[0].packageId))

      const approvedGroups = await ctx.db
        .select()
        .from(approvals)
        .innerJoin(approvalGroupMembers, eq(approvals.userId, approvalGroupMembers.userId))
        .where(eq(approvals.requestId, input.requestId))
        .groupBy(approvalGroupMembers.groupId)

      if (approvedGroups.length === approvalGroups.length) {
        // All groups have at least one approval, update the request status
        await ctx.db
          .update(approvalRequests)
          .set({ status: 'approved' })
          .where(eq(approvalRequests.id, input.requestId))
      }

      return { success: true }
    }),

  createApprovalRequest: protectedProcedure
    .input(z.object({ packageId: z.number(), title: z.string() }))
    .mutation(async ({ input, ctx }) => {
      return ctx.db.insert(approvalRequests).values({
        ...input,
        status: 'pending',
      })
    }),
}

