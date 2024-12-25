'use client';

import 'client-only'
import { AppRouter } from '@/server/router'
import { createTRPCClient,  httpBatchLink } from '@trpc/client'

export const trpc = createTRPCClient<AppRouter>({
  links: [
    httpBatchLink({ url: '/api/trpc' }),
  ],
})
