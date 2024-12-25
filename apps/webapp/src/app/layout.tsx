"use client";

import "./globals.css";
import { Inter } from "next/font/google";
import { SessionProvider } from "next-auth/react";
import { NoSSR } from "../components/util/no-ssr";
import { TrpcProvider } from "./trpc-provider";

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
          <TrpcProvider>
            <body>{children}</body>
          </TrpcProvider>
        </SessionProvider>
      </NoSSR>
    </html>
  );
}
