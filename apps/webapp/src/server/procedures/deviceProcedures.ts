import { protectedProcedure } from "../trpc";
import { z } from "zod";
import { devices } from "../schema";
import { eq } from "drizzle-orm";
import { db } from "../db";

export const deviceProcedures = {
  getDevices: protectedProcedure.query(async ({ ctx }) => {
    return db.select().from(devices).where(eq(devices.userId, ctx.user.id));
  }),

  registerDevice: protectedProcedure
    .input(z.object({ name: z.string() }))
    .mutation(async ({ input, ctx }) => {
      return db.insert(devices).values({ ...input, userId: ctx.user.id });
    }),
};
