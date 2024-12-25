import { protectedProcedure } from "../trpc";
import { z } from "zod";
import { devices } from "../schema";
import { eq } from "drizzle-orm";
import { db } from "../db";

export const DeviceSchema = z.object({
  id: z.number(),
  name: z.string(),
  createdAt: z.date(),
});

export const deviceProcedures = {
  getDevices: protectedProcedure
    .input(z.void())
    .output(z.array(DeviceSchema))
    .query(async ({ ctx }) => {
      return db
        .select({
          id: devices.id,
          name: devices.name,
          createdAt: devices.createdAt,
        })
        .from(devices)
        .where(eq(devices.userId, ctx.user.id));
    }),

  registerDevice: protectedProcedure
    .input(z.object({ name: z.string(), fcmToken: z.string() }))
    .mutation(async ({ input, ctx }) => {
      return db.insert(devices).values({ ...input, userId: ctx.user.id });
    }),
};
