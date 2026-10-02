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
import {
  dashboardQuery,
  dashboardState,
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
  const { tab, view, scenario } = dashboardState(searchParams, data, dataset);

  const previousView = useRef({ tab, view });
  useEffect(() => {
    if (
      (previousView.current.tab !== tab ||
        previousView.current.view !== view) &&
      !window.location.hash
    )
      window.scrollTo(0, 0);
    previousView.current = { tab, view };
  }, [tab, view]);

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
      <main
        id="main-content"
        className="relative mx-auto max-w-[1280px] px-4 py-7 md:px-8 md:py-9"
      >
        <header className="mb-5 max-w-4xl">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 md:text-3xl">
            Targeted energy discount
          </h1>
          <p className="mt-2 text-base leading-6 text-slate-600">
            Explore the cost and household effects of the{" "}
            <a
              className="underline"
              href="https://www.resolutionfoundation.org/publications/billing-me-softly/"
              target="_blank"
              rel="noreferrer"
            >
              Resolution Foundation&apos;s proposal
            </a>{" "}
            for energy bill support in Great Britain.
          </p>
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
                  view={view}
                  onViewChange={(value) => navigate({ view: value })}
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
        <footer className="mt-10 border-t border-slate-200 pt-5 text-sm leading-6 text-slate-500">
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
              ? ` · policyengine-uk ${data.meta.policyengine_uk} · Results generated ${data.meta.generated}`
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
