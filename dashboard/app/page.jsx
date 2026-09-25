"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import BaselineTab from "../src/components/BaselineTab";
import HouseholdTab from "../src/components/HouseholdTab";
import MethodologyTab from "../src/components/MethodologyTab";
import ReformTab from "../src/components/ReformTab";
import { datasetFromQuery } from "../src/lib/dataHelpers";

const TAB_OPTIONS = [
  { id: "reform", label: "Targeted energy discount" },
  { id: "household", label: "Your household" },
  { id: "baseline", label: "Baseline and comparisons" },
  { id: "methodology", label: "Methodology" },
];

const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

// The comparison with the report now sits in the baseline tab; keep its old links working.
const TAB_ALIASES = { report: "baseline" };

function getInitialTab(tabParam) {
  const tab = TAB_ALIASES[tabParam] ?? tabParam;
  return TAB_OPTIONS.some((option) => option.id === tab) ? tab : "reform";
}

function TabLink({ onSelect, children }) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className="font-semibold text-[color:var(--pe-color-primary-600)] underline decoration-1 underline-offset-2 transition-opacity hover:opacity-80"
    >
      {children}
    </button>
  );
}

function Dashboard() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState(() => getInitialTab(searchParams.get("tab")));
  const [data, setData] = useState(null);
  const [calculator, setCalculator] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setActiveTab(getInitialTab(searchParams.get("tab")));
  }, [searchParams]);

  useEffect(() => {
    async function loadData() {
      try {
        const [results, calc] = await Promise.all(
          ["targeted_energy_discount_results.json", "calculator.json"].map(async (name) => {
            const response = await fetch(`${BASE}/data/${name}`);
            if (!response.ok) throw new Error(`${name} not found; run export-dashboard first`);
            return response.json();
          }),
        );
        setData(results);
        setCalculator(calc);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const datasetParam = searchParams.get("dataset");
  const dataset = datasetFromQuery(datasetParam, data);

  function handleTabChange(tab) {
    setActiveTab(tab);
    const params = new URLSearchParams();
    if (tab !== "reform") params.set("tab", tab);
    if (datasetParam) params.set("dataset", datasetParam);
    const query = params.toString();
    router.replace(query ? `/?${query}` : "/", { scroll: false });
  }

  return (
    <div className="app-shell min-h-screen">
      <header className="title-row">
        <div className="mx-auto flex max-w-[1400px] items-center justify-between px-6 py-4 md:px-8">
          <h1>Targeted energy discount analysis</h1>
        </div>
      </header>

      <main className="relative z-[1] mx-auto max-w-[1400px] px-6 py-10 md:px-8 md:py-12">
        <div className="animate-[fadeIn_0.4s_ease-out]">
          <p className="mb-3 text-[1.05rem] leading-relaxed text-slate-600">
            The{" "}
            <a
              href="https://www.resolutionfoundation.org/publications/billing-me-softly/"
              target="_blank"
              rel="noreferrer"
              className="underline"
            >
              Resolution Foundation
            </a>{" "}
            proposes discounting gas and electricity unit prices this winter for households in Great
            Britain that receive a means-tested benefit or whose highest-income member has taxable
            income below £24,000 a year, with a tiered version paying about £220 below £18,000 and
            £85 from £18,000 to £24,000. This dashboard uses{" "}
            <a
              href="https://policyengine.org"
              target="_blank"
              rel="noreferrer"
              className="underline"
            >
              PolicyEngine
            </a>{" "}
            UK microsimulation to estimate each option. The{" "}
            <TabLink onSelect={() => handleTabChange("reform")}>Targeted energy discount</TabLink>{" "}
            tab shows cost, reach, gains by income, winners and losers, inequality, poverty,
            eligibility across income measures, and regional and household breakdowns. The{" "}
            <TabLink onSelect={() => handleTabChange("household")}>Your household</TabLink> tab
            works out the discount for a household you describe and how it changes with income. The{" "}
            <TabLink onSelect={() => handleTabChange("baseline")}>Baseline and comparisons</TabLink>{" "}
            tab sets out the households and energy bills in the model and compares them with
            official statistics and with the Resolution Foundation&apos;s own figures, and the{" "}
            <TabLink onSelect={() => handleTabChange("methodology")}>Methodology</TabLink> tab
            explains every assumption.
          </p>
        </div>

        <div className="mb-8 mt-8 flex w-fit max-w-full flex-wrap border-b-2 border-slate-200">
          {TAB_OPTIONS.map((tab) => (
            <button
              key={tab.id}
              className={`tab-button ${activeTab === tab.id ? "active" : ""}`}
              onClick={() => handleTabChange(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {error && (
          <p className="rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">
            Error: {error}
          </p>
        )}
        {loading && !error && (
          <p className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-500">
            Loading data...
          </p>
        )}

        {!loading && !error && data && (
          <>
            {activeTab === "reform" && <ReformTab data={data} dataset={dataset} />}
            {activeTab === "household" && (
              <HouseholdTab data={data} calculator={calculator} dataset={dataset} />
            )}
            {activeTab === "baseline" && <BaselineTab data={data} dataset={dataset} />}
            {activeTab === "methodology" && <MethodologyTab data={data} dataset={dataset} />}
          </>
        )}

        <footer className="mt-12 border-t border-slate-200 pt-8 text-center text-sm text-slate-500">
          <p>
            Replication code:{" "}
            <a
              href="https://github.com/PolicyEngine/uk-energy-reforms"
              target="_blank"
              rel="noreferrer"
            >
              PolicyEngine/uk-energy-reforms
            </a>
            {data?.meta ? `, run on policyengine-uk ${data.meta.policyengine_uk}` : ""}. Results
            last generated {data?.meta?.generated ?? ""}.
          </p>
        </footer>
      </main>
    </div>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<p className="p-12 text-center text-slate-500">Loading...</p>}>
      <Dashboard />
    </Suspense>
  );
}
