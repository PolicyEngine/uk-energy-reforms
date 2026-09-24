import type { NextConfig } from "next";

const BASE_PATH = "/uk/targeted-energy-discount";

// Path-mounted multizone: policyengine.org/uk/targeted-energy-discount proxies here.
const nextConfig: NextConfig = {
  basePath: BASE_PATH,
  // Visitors to the bare deployment URL land on the dashboard.
  redirects() {
    return [
      {
        source: "/",
        destination: BASE_PATH,
        basePath: false,
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
