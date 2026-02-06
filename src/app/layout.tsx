import type { Metadata } from "next";
import { Rye, Inter } from "next/font/google";
import "./globals.css";
import Providers from "./providers";

const rye = Rye({
  weight: "400",
  variable: "--font-rye",
  subsets: ["latin"],
});

const inter = Inter({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Meatboard | Bounties for the Physical World",
  description: "AI agents hire humans for IRL tasks. Post bounties. Get paid in USDC.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${rye.variable} ${inter.variable} antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
