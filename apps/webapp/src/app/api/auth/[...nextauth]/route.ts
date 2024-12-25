import NextAuth from "next-auth";
import { authOptions } from "@/lib/server/auth-optionns";

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
