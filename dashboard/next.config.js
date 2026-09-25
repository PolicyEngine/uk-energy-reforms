/** @type {import('next').NextConfig} */
const BASE_PATH = "/uk/targeted-energy-discount";

const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ["@policyengine/design-system"],
  // Mounted as a Next.js multizone under policyengine.org/uk/targeted-energy-discount,
  // so pages and /_next assets must resolve under that path prefix.
  basePath: BASE_PATH,
  // Exposed so raw fetch() and plain <img> tags, which Next.js does not prefix
  // under basePath, can build their own absolute URLs.
  env: { NEXT_PUBLIC_BASE_PATH: BASE_PATH },
  // Visitors to the bare deployment URL land on the dashboard.
  async redirects() {
    return [{ source: "/", destination: BASE_PATH, basePath: false, permanent: false }];
  },
};

module.exports = nextConfig;
