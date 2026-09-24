import type { Metadata } from "next";
import { Inter } from "next/font/google";

import "./globals.css";

const inter = Inter({ subsets: ["latin"], weight: ["400", "500", "600", "700"] });

const description =
  "Who a targeted energy discount for households on means-tested benefits or with a " +
  "highest individual income below £24,000 would reach in 2026-27, with PolicyEngine " +
  "estimates beside the Resolution Foundation's figures.";

export const metadata: Metadata = {
  title: "Targeted energy discount | PolicyEngine",
  description,
  alternates: { canonical: "https://policyengine.org/uk/targeted-energy-discount" },
  openGraph: {
    title: "Targeted energy discount",
    description,
    url: "https://policyengine.org/uk/targeted-energy-discount",
    siteName: "PolicyEngine",
    type: "website",
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en-GB">
      <body className={inter.className}>{children}</body>
    </html>
  );
}
