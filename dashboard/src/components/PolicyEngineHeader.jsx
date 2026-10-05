const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

// PolicyEngine site header, rendered by the dashboard itself. Multizone
// rewrites proxy this app under policyengine.org/uk/targeted-energy-discount but
// do not inject the parent site shell, so — like the other published
// dashboards — we render the header/nav here. Links point at the UK site so
// the tool sits inside the PolicyEngine UK experience.
const NAV_LINKS = [
  { label: "Research", href: "https://policyengine.org/uk/research" },
  { label: "Model", href: "https://policyengine.org/uk/model" },
  { label: "API", href: "https://policyengine.org/uk/api" },
  { label: "About", href: "https://policyengine.org/uk/about" },
  { label: "Donate", href: "https://policyengine.org/uk/donate" },
];

export default function PolicyEngineHeader() {
  return (
    <nav
      className="sticky top-0 z-50 w-full"
      style={{
        background:
          "linear-gradient(to right, var(--pe-color-primary-800, #234E52), var(--pe-color-primary-600, #2C7A7B))",
      }}
    >
      <div className="mx-auto flex min-h-[58px] max-w-[1400px] items-center gap-5 px-4 py-2 md:gap-8 md:px-8">
        <a
          href="https://policyengine.org/uk"
          aria-label="PolicyEngine UK home"
          className="flex flex-shrink-0 items-center"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`${BASE_PATH}/assets/logos/policyengine-white.svg`}
            alt="PolicyEngine"
            className="h-6 w-auto"
          />
        </a>

        {/* On narrow phones the links wrap onto a second line rather than run off
            the edge, so every one stays visible. */}
        <div className="flex min-w-0 flex-wrap items-center gap-x-4 gap-y-1 md:gap-x-8">
          {NAV_LINKS.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="shrink-0 text-sm font-medium text-white no-underline transition-opacity hover:opacity-80 md:text-[15px]"
            >
              {link.label}
            </a>
          ))}
        </div>
      </div>
    </nav>
  );
}
