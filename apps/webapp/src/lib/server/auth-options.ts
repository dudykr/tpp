import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { db } from "@/server/db";
import EmailProvider from "next-auth/providers/email";
import GithubProvider from "next-auth/providers/github";
import { NextAuthOptions } from "next-auth";

export const authOptions: NextAuthOptions = {
  adapter: DrizzleAdapter(db),
  providers: [EmailProvider({})],
  callbacks: {
    session: ({ session, user }) => ({
      ...session,
      user: {
        ...session.user,
        id: user.id,
      },
    }),
  },
};
