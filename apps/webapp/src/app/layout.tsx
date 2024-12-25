"use client";

import "./globals.css";
import { Inter } from "next/font/google";
import { SessionProvider } from "next-auth/react";
import { NoSSR } from "../components/util/no-ssr";

const inter = Inter({ subsets: ["latin"] });

// export const metadata = {
//   title: "Dudy TPP",
//   description: "Open-proposal demonstration by @kdy1",
// };

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <NoSSR>
        <SessionProvider>
          <body className={inter.className}>{children}</body>
        </SessionProvider>
      </NoSSR>
    </html>
  );
}
