import { router } from "./trpc";
import { deviceProcedures } from "./procedures/deviceProcedures";
import { packageProcedures } from "./procedures/packageProcedures";
import { approvalProcedures } from "./procedures/approvalProcedures";
import { inferRouterInputs, inferRouterOutputs } from "@trpc/server";

export const appRouter = router({
  ...deviceProcedures,
  ...packageProcedures,
  ...approvalProcedures,
});

export type AppRouter = typeof appRouter;
export type ApiInput = inferRouterInputs<AppRouter>;
export type ApiOutput = inferRouterOutputs<AppRouter>;
