import PolicyEngineFooter from "../src/components/PolicyEngineFooter";
import PolicyEngineHeader from "../src/components/PolicyEngineHeader";

import "./globals.css";

const description =
  "Who a targeted energy discount for households on means-tested benefits or with a " +
  "highest individual income below £24,000 would reach, what it costs and how it " +
  "changes household incomes, with PolicyEngine UK estimates beside the Resolution " +
  "Foundation's figures.";

export const metadata = {
  // Resolves the generated Open Graph image URL (with the base path) against the
  // live deployment, so link previews work before the policyengine.org rewrite exists.
  metadataBase: new URL(
    "https://uk-targeted-energy-discount.vercel.app/uk/targeted-energy-discount",
  ),
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

export default function RootLayout({ children }) {
  return (
    <html lang="en-GB">
      <body>
        <PolicyEngineHeader />
        {children}
        <PolicyEngineFooter />
      </body>
    </html>
  );
}
