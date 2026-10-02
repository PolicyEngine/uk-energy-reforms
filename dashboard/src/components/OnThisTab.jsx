"use client";

import { useEffect, useState } from "react";

export default function OnThisTab({ sections }) {
  const [active, setActive] = useState(sections[0]?.id);
  const ids = sections.map((s) => s.id).join(",");
  useEffect(() => {
    const nodes = ids
      .split(",")
      .map((id) => document.getElementById(id))
      .filter(Boolean);
    function update() {
      const passed = nodes.filter(
        (node) => node.getBoundingClientRect().top <= 180,
      );
      setActive((passed.at(-1) ?? nodes[0])?.id);
    }
    update();
    window.addEventListener("scroll", update, { passive: true });
    return () => window.removeEventListener("scroll", update);
  }, [ids]);
  const links = sections.map(({ id, label }) => (
    <li key={id}>
      <a
        href={`#${id}`}
        aria-current={active === id ? "location" : undefined}
        onClick={() => setActive(id)}
      >
        {label}
      </a>
    </li>
  ));
  return (
    <nav aria-label="On this tab" className="section-nav">
      <div className="hidden min-[1680px]:block">
        <p className="mb-3 text-xs font-semibold text-slate-500">On this tab</p>
        <ol className="space-y-1">{links}</ol>
      </div>
      <details className="disclosure min-[1680px]:hidden">
        <summary>On this tab</summary>
        <ol className="mt-3 flex flex-wrap gap-2">{links}</ol>
      </details>
    </nav>
  );
}
