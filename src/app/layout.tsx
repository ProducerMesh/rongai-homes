import type { Metadata } from "next";
import { Fraunces, Inter, IBM_Plex_Mono } from "next/font/google";

import Providers from "@/components/providers";
import Header from "@/components/header";
import "./globals.css";

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  weight: ["400", "500", "600", "700"],
});

const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  variable: "--font-plex-mono",
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: "Rongai Homes — Find your next home without walking around",
  description:
    "Discover verified, currently-vacant houses, apartments, land and commercial spaces in Ongata Rongai.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body
        className={`${fraunces.variable} ${inter.variable} ${plexMono.variable} font-body bg-parchment text-ink antialiased`}
      >
        <Providers>
  <Header />
  {children}
</Providers>
      </body>
    </html>
  );
}
