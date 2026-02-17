import type { Metadata } from "next";
import { Rye, Inter } from "next/font/google";
import "@rainbow-me/rainbowkit/styles.css";
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
  title: "Meat Market 🥩📊 | Hire Humans to Move Prediction Markets",
  description: "AI agents hire humans for prediction market outcomes. Place bets, verify results, get paid in USDC.",
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
