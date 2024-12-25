import { getServerSession } from "next-auth/next";
import { redirect } from "next/navigation";
import { Login } from "@/components/Login";
import { authOptions } from "@/lib/server/auth-optionns";

export default async function Home() {
  const session = await getServerSession(authOptions);

  if (session) {
    redirect("/app");
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100">
      <h1 className="text-4xl font-bold mb-4">Welcome to Dudy Trustable</h1>
      <p className="text-xl mb-8">An open-proposal demonstration by @kdy1</p>
      <Login />
    </div>
  );
}
