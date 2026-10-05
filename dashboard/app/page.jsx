"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import BaselineTab from "../src/components/BaselineTab";
import HouseholdTab from "../src/components/HouseholdTab";
import MethodologyTab from "../src/components/MethodologyTab";
import ReformTab from "../src/components/ReformTab";
import NavigationTabs from "../src/components/NavigationTabs";
import ScenarioControls from "../src/components/ScenarioControls";
import { datasetFromQuery } from "../src/lib/dataHelpers";
import { formatDate } from "../src/lib/formatters";
import {
  dashboardQuery,
  dashboardState,
  legacyAnchor,
  TABS,
} from "../src/lib/dashboardState";

const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

function Dashboard() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const currentQuery = useRef(searchParams.toString());
  useEffect(() => {
    currentQuery.current = searchParams.toString();
  }, [searchParams]);
  const [data, setData] = useState(null);
  const [calculator, setCalculator] = useState(null);
  const [error, setError] = useState(null);
  // Kept above the tabs so navigating away never discards an entered household.
  const [householdState, setHouseholdState] = useState(null);
  const dataset = datasetFromQuery(searchParams.get("dataset"), data);
  const { tab, scenario } = dashboardState(searchParams, data, dataset);

  const previousTab = useRef(tab);
  useEffect(() => {
    if (previousTab.current !== tab && !window.location.hash)
      window.scrollTo(0, 0);
    previousTab.current = tab;
  }, [tab]);

  // Links to the old eligibility view open its section on the Economic impact tab.
  const legacy = legacyAnchor(searchParams);
  useEffect(() => {
    if (!legacy || !data) return;
    const anchor = tab === "reform" ? legacy : "";
    const query = dashboardQuery(currentQuery.current, { view: null });
    currentQuery.current = query;
    router.replace(`/?${query}${anchor ? `#${anchor}` : ""}`, { scroll: false });
    if (!anchor) return;
    requestAnimationFrame(() => {
      const section = document.getElementById(anchor);
      section?.querySelector("details")?.setAttribute("open", "");
      section?.scrollIntoView({ block: "start" });
    });
  }, [legacy, data, tab, router]);

  useEffect(() => {
    let cancelled = false;
    async function loadData() {
      try {
        const [results, calc] = await Promise.all(
          ["targeted_energy_discount_results.json", "calculator.json"].map(
            async (name) => {
              const response = await fetch(`${BASE}/data/${name}`);
              if (!response.ok)
                throw new Error(
                  "The analysis could not be loaded. Please refresh to try again.",
                );
              return response.json();
            },
          ),
        );
        if (!cancelled) {
          setData(results);
          setCalculator(calc);
        }
      } catch (err) {
        if (!cancelled) setError(err.message);
      }
    }
    loadData();
    return () => {
      cancelled = true;
    };
  }, []);

  function navigate(patch, anchor = "") {
    const query = dashboardQuery(currentQuery.current, patch);
    currentQuery.current = query;
    router.push(`/?${query}${anchor ? `#${anchor}` : ""}`, { scroll: false });
  }
  const methodology = (anchor = "") => navigate({ tab: "methodology" }, anchor);

  return (
    <div className="app-shell min-h-screen">
      <header className="title-row">
        <div className="mx-auto max-w-[1280px] px-4 py-4 md:px-8">
          <h1>The targeted energy bill discount</h1>
        </div>
      </header>
      <main
        id="main-content"
        className="relative mx-auto max-w-[1280px] px-4 py-7 md:px-8 md:py-9"
      >
        <header className="mb-5">
          <div className="space-y-2 text-base leading-7 text-slate-700">
            <p>
              This dashboard estimates the cost and household effects of the
              Resolution Foundation&apos;s proposal for a targeted energy
              discount in Great Britain, set out in{" "}
              <a
                className="underline"
                href="https://www.resolutionfoundation.org/publications/billing-me-softly/"
                target="_blank"
                rel="noreferrer"
              >
                <em>Billing me softly</em>
              </a>{" "}
              (August 2026). Under the proposal, a household qualifies if anyone
              in it receives a means-tested benefit or if its highest individual
              taxable income is below a threshold. It then receives a discount
              on its energy bill over the winter.
            </p>
            <p>
              We model five versions of the design, each paid in three ways, in
              2026-27 and 2027-28, using the{" "}
              <a
                className="underline"
                href="https://policyengine.org/uk/model"
                target="_blank"
                rel="noreferrer"
              >
                PolicyEngine UK
              </a>{" "}
              microsimulation model on survey data for GB households. See the
              total cost, who gains across the income distribution, the effect
              on poverty and inequality, and who qualifies. You can also
              calculate the discount for your own household. The{" "}
              <button className="underline" onClick={() => methodology()}>
                methodology
              </button>{" "}
              covers the data and assumptions, and the code is on{" "}
              <a
                className="underline"
                href="https://github.com/PolicyEngine/uk-energy-reforms"
                target="_blank"
                rel="noreferrer"
              >
                GitHub
              </a>
              .
            </p>
          </div>
        </header>
        <NavigationTabs
          id="dashboard"
          label="Dashboard sections"
          options={TABS}
          value={tab}
          onChange={(value) => navigate({ tab: value })}
        />
        {error && (
          <p role="alert" className="section-card mt-6 text-red-700">
            {error}
          </p>
        )}
        {!data && !error && (
          <p role="status" className="section-card mt-6 text-slate-500">
            Loading the analysis…
          </p>
        )}
        {data && !error && (
          <>
            {(tab === "reform" || tab === "household") && (
              <ScenarioControls
                data={data}
                dataset={dataset}
                scenario={scenario}
                onChange={navigate}
                onMethodology={() => methodology("method-payments")}
              />
            )}
            {TABS.filter((item) => item.value !== tab).map((item) => (
              <div
                key={item.value}
                hidden
                role="tabpanel"
                id={`dashboard-panel-${item.value}`}
                aria-labelledby={`dashboard-tab-${item.value}`}
              />
            ))}
            <div
              role="tabpanel"
              id={`dashboard-panel-${tab}`}
              aria-labelledby={`dashboard-tab-${tab}`}
              tabIndex={0}
              className="mt-6"
            >
              {tab === "reform" && (
                <ReformTab
                  data={data}
                  dataset={dataset}
                  scenario={scenario}
                  onMethodology={methodology}
                />
              )}
              {tab === "household" && (
                <HouseholdTab
                  data={data}
                  calculator={calculator}
                  dataset={dataset}
                  scenario={scenario}
                  savedState={householdState}
                  onSaveState={setHouseholdState}
                  onMethodology={methodology}
                />
              )}
              {tab === "baseline" && (
                <BaselineTab data={data} dataset={dataset} />
              )}
              {tab === "methodology" && (
                <MethodologyTab data={data} dataset={dataset} />
              )}
            </div>
          </>
        )}
        <footer className="mt-12 border-t border-slate-200 pt-8 text-center text-sm leading-6 text-slate-500">
          <p>
            Estimates for Great Britain.{" "}
            <a
              className="underline"
              href="https://github.com/PolicyEngine/uk-energy-reforms"
              target="_blank"
              rel="noreferrer"
            >
              Replication code
            </a>
            {data?.meta
              ? ` · policyengine-uk ${data.meta.policyengine_uk} · Results generated ${formatDate(data.meta.generated)}`
              : ""}
            .
          </p>
        </footer>
      </main>
    </div>
  );
}

export default function Page() {
  return (
    <Suspense
      fallback={<p className="p-12 text-center text-slate-500">Loading…</p>}
    >
      <Dashboard />
    </Suspense>
  );
}
