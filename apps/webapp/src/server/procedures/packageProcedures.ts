import { protectedProcedure } from "../trpc";
import { z } from "zod";
import { packages, packageMembers, users } from "../schema";
import { eq, and } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

export const packageProcedures = {
  getPackages: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db.select().from(packages);
  }),

  getPackageDetails: protectedProcedure
    .input(z.object({ packageId: z.number() }))
    .query(async ({ input, ctx }) => {
      const packageDetails = await ctx.db
        .select()
        .from(packages)
        .where(eq(packages.id, input.packageId))
        .limit(1);

      if (packageDetails.length === 0) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Package not found",
        });
      }

      const member = await ctx.db
        .select()
        .from(packageMembers)
        .where(
          and(
            eq(packageMembers.packageId, input.packageId),
            eq(packageMembers.userId, ctx.user.id),
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
      const newPackage = await ctx.db
        .insert(packages)
        .values({ ...input, ownerId: ctx.user.id })
        .returning();
      await ctx.db
        .insert(packageMembers)
        .values({ packageId: newPackage[0].id, userId: ctx.user.id });
      return newPackage[0];
    }),

  getPackageMembers: protectedProcedure
    .input(z.object({ packageId: z.number() }))
    .query(async ({ input, ctx }) => {
      const members = await ctx.db
        .select({
          id: users.id,
          name: users.name,
          email: users.email,
        })
        .from(packageMembers)
        .innerJoin(users, eq(packageMembers.userId, users.id))
        .where(eq(packageMembers.packageId, input.packageId));
      return members;
    }),

  addPackageMember: protectedProcedure
    .input(z.object({ packageId: z.number(), email: z.string().email() }))
    .mutation(async ({ input, ctx }) => {
      const user = await ctx.db
        .select()
        .from(users)
        .where(eq(users.email, input.email))
        .limit(1);

      if (user.length === 0) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "User not found",
        });
      }

      await ctx.db.insert(packageMembers).values({
        packageId: input.packageId,
        userId: user[0].id,
      });

      return { success: true };
    }),

  removePackageMember: protectedProcedure
    .input(z.object({ packageId: z.number(), userId: z.number() }))
    .mutation(async ({ input, ctx }) => {
      await ctx.db
        .delete(packageMembers)
        .where(
          and(
            eq(packageMembers.packageId, input.packageId),
            eq(packageMembers.userId, input.userId),
          ),
        );

      return { success: true };
    }),
};
