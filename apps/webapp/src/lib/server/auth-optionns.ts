import { DrizzleAdapter } from "@auth/drizzle-adapter"
import { db } from "@/server/db"
import GithubProvider from "next-auth/providers/github"
import { NextAuthOptions } from "next-auth"


export const authOptions :NextAuthOptions= {
    adapter: DrizzleAdapter(db),
    providers: [
      GithubProvider({
        clientId: process.env.GITHUB_ID!,
        clientSecret: process.env.GITHUB_SECRET!,
      }),
    ],
    callbacks: {
      session: ({ session, user }) => ({
        ...session,
        user: {
          ...session.user,
          id: user.id,
        },
      }),
    },
  }