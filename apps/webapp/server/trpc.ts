import { initTRPC, TRPCError } from '@trpc/server'
import { CreateNextContextOptions } from '@trpc/server/adapters/next'
import { db } from './db'
import { getServerSession } from 'next-auth'
import { authOptions } from '../app/api/auth/[...nextauth]/route'

export const createContext = async (opts: CreateNextContextOptions) => {
  const session = await getServerSession(authOptions)
  return {
    db,
    session,
  }
}

const t = initTRPC.context<typeof createContext>().create()

export const router = t.router
export const publicProcedure = t.procedure

export const protectedProcedure = t.procedure.use(async (opts) => {
  const { ctx } = opts
  if (!ctx.session || !ctx.session.user) {
    throw new TRPCError({ code: 'UNAUTHORIZED' })
  }
  return opts.next({
    ctx: {
      ...ctx,
      user: ctx.session.user,
    },
  })
})

