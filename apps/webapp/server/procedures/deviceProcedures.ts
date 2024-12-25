import { protectedProcedure } from '../trpc'
import { z } from 'zod'
import { devices } from '../schema'
import { eq } from 'drizzle-orm'

export const deviceProcedures = {
  getDevices: protectedProcedure
    .query(async ({ ctx }) => {
      return ctx.db.select().from(devices).where(eq(devices.userId, ctx.user.id))
    }),

  registerDevice: protectedProcedure
    .input(z.object({ name: z.string() }))
    .mutation(async ({ input, ctx }) => {
      return ctx.db.insert(devices).values({ ...input, userId: ctx.user.id })
    }),
}

