import { protectedProcedure } from "../trpc";
import { z } from "zod";
import { devicesTable } from "../schema";
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
          id: devicesTable.id,
          name: devicesTable.name,
          createdAt: devicesTable.createdAt,
        })
        .from(devicesTable)
        .where(eq(devicesTable.userId, ctx.user.id));
    }),

  registerDevice: protectedProcedure
    .input(z.object({ name: z.string(), fcmToken: z.string() }))
    .output(DeviceSchema)
    .mutation(async ({ input, ctx }) => {
      const [device] = await db
        .insert(devicesTable)
        .values({ ...input, userId: ctx.user.id })
        .returning({
          id: devicesTable.id,
          name: devicesTable.name,
          createdAt: devicesTable.createdAt,
        })
        .execute();

      return device;
    }),
};
