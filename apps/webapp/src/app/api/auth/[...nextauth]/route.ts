import NextAuth from "next-auth"
import { DrizzleAdapter } from "@auth/drizzle-adapter"
import { db } from "@/server/db"
import GithubProvider from "next-auth/providers/github"

export const authOptions = {
  adapter: DrizzleAdapter(db),
  providers: [
    GithubProvider({
      clientId: process.env.GITHUB_ID,
      clientSecret: process.env.GITHUB_SECRET,
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

const handler = NextAuth(authOptions)

export { handler as GET, handler as POST }

