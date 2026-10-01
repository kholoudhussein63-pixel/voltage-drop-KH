"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import DesignCriteria from "../components/DesignCriteria";
import BranchInputs from "../components/BranchInputs";
import PathBuilder from "../components/PathBuilder";
import ResultsPanel from "../components/ResultsPanel";
import Recommendations from "../components/Recommendations";
import HistoryTable from "../components/HistoryTable";
import ReferenceTable from "../components/ReferenceTable";
import {
  computeBranch,
  computePath,
  evaluateCompliance,
  buildRecommendations,
} from "../lib/calculator";
import { APPLICATIONS, round } from "../lib/vdTable";

const HISTORY_KEY = "vd-calculator-history-v1";

const DEFAULT_BRANCH = {
  length: 85,
  current: 210,
  csa: 150,
  parallel: 1,
  upstreamVd: 0,
};

const DEFAULT_SECTIONS = [
  { id: "s1", label: "MDB → SMDB", length: 60, current: 400, csa: 240, parallel: 2 },
  { id: "s2", label: "SMDB → DB-01", length: 35, current: 250, csa: 120, parallel: 1 },
  { id: "s3", label: "DB-01 → Motor", length: 25, current: 95, csa: 35, parallel: 1 },
];

const ENGINEERING_NOTES = [
  "Tabulated mV/A/m values are the standard free-air-installation factors; apply grouping, ambient and soil-resistivity derating to the cable current rating before finalising the design.",
  "Parallel circuits must be of identical length, material, cross-section and insulation to guarantee equal current sharing.",
  "Motor starting and transformer inrush conditions can require a stricter transient voltage-drop criterion than the running case shown here.",
  "Lighting circuits are limited to 3% and power circuits to 5% in line with common distribution design practice; confirm against the governing local code.",
];

export default function CalculatorPage() {
  const [mode, setMode] = useState("A");
  const [context, setContext] = useState({
    material: "copper",
    insulation: "xlpe",
    vNet: 380,
    application: "power",
    limit: 5,
  });
  const [branch, setBranch] = useState(DEFAULT_BRANCH);
  const [sections, setSections] = useState(DEFAULT_SECTIONS);
  const [history, setHistory] = useState([]);
  const [caseName, setCaseName] = useState("");
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(HISTORY_KEY);
      if (raw) setHistory(JSON.parse(raw));
    } catch {
      setHistory([]);
    }
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    try {
      window.localStorage.setItem(HISTORY_KEY, JSON.stringify(history.slice(0, 50)));
    } catch {
      /* storage unavailable — history stays in memory */
    }
  }, [history, loaded]);

  const setContextValue = useCallback((key, value) => {
    setContext((prev) => {
      const next = { ...prev, [key]: value };
      if (key === "application" && value !== "custom") {
        next.limit = APPLICATIONS.find((a) => a.value === value)?.limit ?? prev.limit;
      }
      return next;
    });
  }, []);

  const setBranchValue = useCallback((key, value) => {
    if (key === "material" || key === "insulation") {
      setContextValue(key, value);
      return;
    }
    setBranch((prev) => ({ ...prev, [key]: value }));
  }, [setContextValue]);

  const branchResult = useMemo(
    () => computeBranch({ ...branch, ...context }),
    [branch, context]
  );

  const pathResult = useMemo(() => computePath(sections, context), [sections, context]);

  const active = useMemo(() => {
    if (mode === "A") {
      return {
        result: branchResult,
        vdPercent: branchResult.vdPercent,
        vdAccm: branchResult.vdAccm,
        config: `${branch.parallel} × ${branch.csa} mm²`,
        length: branch.length,
        current: branch.current,
      };
    }
    const last = [...pathResult.rows].reverse().find((r) => r.valid);
    return {
      result: last
        ? {
            ...last,
            mv: null,
            adjustedMv: null,
            vdInd: last.vdInd,
            sectionVd: last.vdInd,
            upstreamVd: last.upstreamVd,
            vdAccm: pathResult.totalVd,
            vdPercent: pathResult.vdPercent,
            length: sum(sections.map((s) => Number(s.length) || 0)),
            current: last.current,
            parallel: last.parallel,
          }
        : emptyResult(sections, context),
      vdPercent: pathResult.vdPercent,
      vdAccm: pathResult.totalVd,
      config: `${sections.length} sections`,
      length: sum(sections.map((s) => Number(s.length) || 0)),
      current: last ? last.current : null,
    };
  }, [mode, branchResult, pathResult, sections, context]);

  const compliance = useMemo(
    () =>
      evaluateCompliance({
        vdPercent: active.vdPercent,
        limit: context.limit,
        context: {
          csa: mode === "A" ? branch.csa : maxCsa(sections),
          parallel: mode === "A" ? branch.parallel : maxParallel(sections),
          current: active.current,
        },
      }),
    [active, context.limit, branch, sections, mode]
  );

  const suggestions = useMemo(
    () =>
      buildRecommendations({
        mode,
        input: branch,
        sections: mode === "A" ? null : decorateRows(pathResult.rows, context.limit),
        context: { ...context, ...branch },
        compliance,
      }),
    [mode, branch, context, compliance, pathResult]
  );

  const trace = useMemo(() => {
    if (mode === "A") return null;
    return pathResult.rows
      .filter((r) => r.valid)
      .map(
        (r, i) =>
          `S${i + 1} ${r.label.padEnd(16, " ")} (${r.adjustedMv} × ${r.current} × ${r.length})/1000 = ${round(r.vdInd, 3)} V  →  Accm ${round(r.vdAccm, 3)} V`
      )
      .join("\n");
  }, [mode, pathResult]);

  const saveCase = () => {
    const entry = {
      id: `${Date.now()}`,
      name: caseName.trim() || `${mode === "A" ? "Branch" : "Path"} ${history.length + 1}`,
      date: new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "2-digit" }),
      mode,
      config: `${active.config} ${context.material === "copper" ? "Cu" : "Al"} ${context.insulation.toUpperCase()}`,
      length: active.length,
      current: active.current,
      vNet: context.vNet,
      limit: context.limit,
      vd: active.vdAccm === null ? "—" : round(active.vdAccm, 3),
      vdPercent: active.vdPercent === null ? "—" : active.vdPercent,
      passed: compliance.passed,
      payload: { mode, context, branch, sections },
    };
    setHistory((prev) => [entry, ...prev].slice(0, 50));
    setCaseName("");
  };

  const loadCase = (entry) => {
    if (!entry.payload) return;
    setMode(entry.payload.mode);
    setContext(entry.payload.context);
    setBranch(entry.payload.branch);
    setSections(entry.payload.sections);
  };

  const applySuggestion = (suggestion) => {
    if (mode === "A") {
      setBranch((prev) => ({ ...prev, csa: suggestion.csa, parallel: suggestion.parallel }));
      return;
    }
    setSections((prev) =>
      prev.map((s) =>
        s.id === suggestion.sectionId
          ? { ...s, csa: suggestion.csa, parallel: suggestion.parallel }
          : s
      )
    );
  };

  return (
    <main className="mx-auto max-w-[1500px] px-4 py-6 sm:px-6 lg:px-8">
      <Header />

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <div className="panel flex gap-1 p-1.5">
          <button
            type="button"
            className={`tab ${mode === "A" ? "tab-active" : "tab-idle"}`}
            onClick={() => setMode("A")}
          >
            <span className="block text-[10px] uppercase tracking-widest opacity-70">Mode A</span>
            <span className="block text-sm font-bold">Single Branch</span>
          </button>
          <button
            type="button"
            className={`tab ${mode === "B" ? "tab-active" : "tab-idle"}`}
            onClick={() => setMode("B")}
          >
            <span className="block text-[10px] uppercase tracking-widest opacity-70">Mode B</span>
            <span className="block text-sm font-bold">Cumulative Path</span>
          </button>
        </div>

        <div className="panel ml-auto flex flex-1 items-center gap-2 px-3 py-2 sm:flex-none">
          <input
            className="field !py-2"
            placeholder="Name this design case…"
            value={caseName}
            onChange={(e) => setCaseName(e.target.value)}
          />
          <button type="button" className="btn-primary shrink-0" onClick={saveCase}>
            Save to history
          </button>
        </div>
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1.55fr)_minmax(0,1fr)]">
        <div className="space-y-5">
          <DesignCriteria context={context} onChange={setContextValue} />

          {mode === "A" ? (
            <BranchInputs form={branch} onChange={setBranchValue} context={context} />
          ) : (
            <>
              <BranchInputs
                form={branch}
                onChange={setBranchValue}
                context={context}
                disabledFields={["length", "current", "upstreamVd"]}
              />
              <PathBuilder
                rows={decorateRows(pathResult.rows, context.limit)}
                onCell={updateSection}
                onAdd={addSection}
                onRemove={removeSection}
                onDuplicate={duplicateSection}
              />
            </>
          )}

          <ResultsPanel
            result={active.result}
            limit={context.limit}
            vNet={context.vNet}
            application={labelForApplication(context)}
            mode={mode}
            trace={trace}
          />

          <Recommendations
            messages={compliance.messages}
            notes={ENGINEERING_NOTES}
            suggestions={suggestions}
            onApply={applySuggestion}
          />
        </div>

        <div className="space-y-5">
          <ReferenceTable
            activeCsa={mode === "A" ? branch.csa : maxCsa(sections)}
            material={context.material}
            insulation={context.insulation}
          />
          <HistoryTable
            entries={history}
            onLoad={loadCase}
            onClear={() => setHistory([])}
          />
        </div>
      </div>

      <footer className="mt-8 border-t border-white/5 py-6 text-center text-xs text-steel-500">
        Advanced Voltage Drop &amp; Cable Sizing Calculator — engineering reference tool. Verify all designs
        against the applicable installation standard before construction.
      </footer>
    </main>
  );

  function addSection() {
    setSections((prev) => [
      ...prev,
      {
        id: `s${Date.now()}`,
        label: `Section ${prev.length + 1}`,
        length: prev[prev.length - 1]?.length ?? 30,
        current: Math.round((prev[prev.length - 1]?.current ?? 100) * 0.6),
        csa: 16,
        parallel: 1,
      },
    ]);
  }

  function removeSection(id) {
    setSections((prev) => (prev.length > 1 ? prev.filter((s) => s.id !== id) : prev));
  }

  function duplicateSection(id) {
    setSections((prev) => {
      const index = prev.findIndex((s) => s.id === id);
      if (index === -1) return prev;
      const copy = { ...prev[index], id: `s${Date.now()}`, label: `${prev[index].label} (copy)` };
      const next = [...prev];
      next.splice(index + 1, 0, copy);
      return next;
    });
  }

  function updateSection(id, key, value) {
    setSections((prev) => prev.map((s) => (s.id === id ? { ...s, [key]: value } : s)));
  }
}

function decorateRows(rows, limit) {
  return rows.map((r) => ({ ...r, limit }));
}

function emptyResult(sections, context) {
  const first = sections[0] ?? {};
  return {
    valid: false,
    mv: null,
    adjustedMv: null,
    vdInd: null,
    sectionVd: null,
    upstreamVd: 0,
    vdAccm: null,
    vdPercent: null,
    csa: first.csa ?? context.csa,
    parallel: first.parallel ?? 1,
    length: null,
    current: null,
  };
}

function labelForApplication(context) {
  const app = APPLICATIONS.find((a) => a.value === context.application);
  return app ? `${app.label} (${context.limit}%)` : `${context.limit}%`;
}

function sum(list) {
  return list.reduce((acc, v) => acc + (Number(v) || 0), 0);
}

function maxCsa(sections) {
  return Math.max(...sections.map((s) => Number(s.csa) || 0));
}

function maxParallel(sections) {
  return Math.max(...sections.map((s) => Number(s.parallel) || 1));
}

function Header() {
  return (
    <header className="panel relative overflow-hidden p-6">
      <div className="absolute inset-y-0 right-0 w-1/3 bg-gradient-to-l from-volt/10 to-transparent" />
      <div className="relative flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.22em] text-volt">
            <span className="h-2 w-2 rounded-full bg-volt" />
            Electrical Distribution Engineering
          </div>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-50 sm:text-3xl">
            Advanced Voltage Drop &amp; Cable Sizing Calculator
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-steel-300">
            mV/A/m driven conductor sizing with parallel-run scaling, cumulative multi-section path
            evaluation and automated compliance against lighting and power limits.
          </p>
        </div>
        <div className="flex gap-6 text-right">
          <Stat label="Tabulated sizes" value="1.5 – 400" unit="mm²" />
          <Stat label="Insulation" value="2" unit="types" />
          <Stat label="Max parallel" value="4" unit="runs" />
        </div>
      </div>
    </header>
  );
}

function Stat({ label, value, unit }) {
  return (
    <div>
      <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-steel-300">{label}</div>
      <div className="font-mono text-xl font-bold text-slate-50">
        {value}
        <span className="ml-1 text-[10px] text-steel-500">{unit}</span>
      </div>
    </div>
  );
}
