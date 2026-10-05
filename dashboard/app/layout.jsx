import PolicyEngineFooter from "../src/components/PolicyEngineFooter";
import PolicyEngineHeader from "../src/components/PolicyEngineHeader";

import "./globals.css";

const description =
  "Who a targeted energy discount for households on means-tested benefits or with a " +
  "highest individual income below £24,000 would reach, what it costs and how it " +
  "changes household incomes, with PolicyEngine UK estimates beside the Resolution " +
  "Foundation's figures.";

// The live deployment. The page moves to policyengine.org/uk/targeted-energy-discount
// once policyengine-app-v2 rewrites that path to this zone; until then that address
// returns 404, so the canonical and Open Graph URLs point here.
const SITE = "https://uk-targeted-energy-discount.vercel.app";
const PAGE = `${SITE}/uk/targeted-energy-discount`;

export const metadata = {
  // An origin without a path: Next.js joins metadataBase's path onto the generated
  // Open Graph image URL, which already carries the base path, so a path here doubles
  // it (and the image 404s).
  metadataBase: new URL(SITE),
  title: "Targeted energy discount | PolicyEngine",
  description,
  alternates: { canonical: PAGE },
  openGraph: {
    title: "Targeted energy discount",
    description,
    url: PAGE,
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
