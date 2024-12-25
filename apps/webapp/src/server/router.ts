import { router } from './trpc'
import { deviceProcedures } from './procedures/deviceProcedures'
import { packageProcedures } from './procedures/packageProcedures'
import { approvalProcedures } from './procedures/approvalProcedures'

export const appRouter = router({
  ...deviceProcedures,
  ...packageProcedures,
  ...approvalProcedures,
})

export type AppRouter = typeof appRouter

