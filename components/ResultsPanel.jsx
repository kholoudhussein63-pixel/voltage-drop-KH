import { Metric, Panel, StatusChip } from "./ui";
import { round } from "../lib/vdTable";

export default function ResultsPanel({ result, limit, vNet, application, mode, trace }) {
  const complete = result.vdPercent !== null && Number.isFinite(result.vdPercent);
  const passed = complete && result.vdPercent <= limit;
  const utilisation = complete && limit > 0 ? round((result.vdPercent / limit) * 100, 1) : null;
  const headroomVolts = complete ? round((limit * vNet) / 100 - result.vdAccm, 3) : null;

  return (
    <Panel
      title="Calculation Results"
      subtitle="Live evaluation of the engineering formulas against the selected allowable limit."
      actions={<StatusChip passed={passed} complete={complete} />}
    >
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-6">
        {mode === "A" ? (
          <Metric label="Adjusted mV ÷ N" unit="mV/A/m" value={fmt(result.adjustedMv, 5)} tone="muted" />
        ) : (
          <Metric label="Path Length" unit="m" value={fmt(result.length, 2)} tone="muted" />
        )}
        <Metric
          label={mode === "A" ? "V.D Individual" : "Terminal Section V.D"}
          unit="V"
          value={fmt(mode === "A" ? result.vdInd : result.sectionVd, 3)}
        />
        <Metric label="V.D Upstream" unit="V" value={fmt(result.upstreamVd, 3)} tone="muted" />
        <Metric label="V.D Accumulated" unit="V" value={fmt(result.vdAccm, 3)} tone="volt" />
        <Metric
          label="V.D Percentage"
          unit="%"
          value={fmt(result.vdPercent, 3)}
          tone={complete ? (passed ? "pass" : "fail") : "default"}
        />
        <Metric label="Allowable Limit" unit="%" value={limit} tone="muted" />
      </div>

      <div className="mt-5">
        <div className="mb-1.5 flex justify-between text-[11px] font-semibold uppercase tracking-wider text-steel-300">
          <span>Limit utilisation</span>
          <span>{utilisation === null ? "—" : `${utilisation}% of ${limit}%`}</span>
        </div>
        <div className="h-3 overflow-hidden rounded-full bg-steel-950 ring-1 ring-white/5">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              utilisation === null
                ? "bg-steel-700"
                : utilisation > 100
                  ? "bg-rose-500"
                  : utilisation > 85
                    ? "bg-volt"
                    : "bg-emerald-500"
            }`}
            style={{ width: `${utilisation === null ? 0 : Math.min(utilisation, 100)}%` }}
          />
        </div>
        <div className="mt-2 flex flex-wrap gap-x-6 gap-y-1 text-xs text-steel-300">
          <span>
            Network voltage: <b className="font-mono text-slate-200">{vNet} V</b>
          </span>
          <span>
            Application: <b className="text-slate-200">{application}</b>
          </span>
          <span>
            Mode: <b className="text-slate-200">{mode === "A" ? "Single branch" : "Cumulative path"}</b>
          </span>
          <span>
            Headroom:{" "}
            <b className={`font-mono ${headroomVolts !== null && headroomVolts < 0 ? "text-rose-400" : "text-emerald-400"}`}>
              {headroomVolts === null ? "—" : `${headroomVolts} V`}
            </b>
          </span>
        </div>
      </div>

      <div className="mt-5 rounded-xl border border-white/5 bg-steel-950/50 p-4">
        <h3 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-steel-300">
          {mode === "A" ? "Formula trace" : "Path cascade trace"}
        </h3>
        {mode === "A" ? (
          <pre className="mt-2 overflow-x-auto whitespace-pre-wrap font-mono text-xs leading-relaxed text-slate-300">
{`Adjusted mV  = mV / N                = ${fmt(result.mv, 4)} / ${result.parallel ?? "—"} = ${fmt(result.adjustedMv, 5)} mV/A/m
V.D (Ind)    = (mV/N) × I_b × L /1000 = ${fmt(result.adjustedMv, 5)} × ${fmt(result.current, 2)} × ${fmt(result.length, 2)} / 1000 = ${fmt(result.vdInd, 4)} V
V.D (Accm)   = V.D(Ind) + V.D(US)     = ${fmt(result.vdInd, 4)} + ${fmt(result.upstreamVd, 4)} = ${fmt(result.vdAccm, 4)} V
V.D %        = (V.D(Accm) / V_Net)×100 = (${fmt(result.vdAccm, 4)} / ${vNet}) × 100 = ${fmt(result.vdPercent, 3)} %
Compliance   = V.D % ≤ ${limit} % (limit for ${application})`}
          </pre>
        ) : (
          <>
            <pre className="mt-2 overflow-x-auto whitespace-pre-wrap font-mono text-xs leading-relaxed text-slate-300">
{trace || "Complete every section to evaluate the path."}
            </pre>
            <p className="mt-2 font-mono text-xs text-volt">
              V.D (Accm total) = {fmt(result.vdAccm, 4)} V → V.D % = ({fmt(result.vdAccm, 4)} / {vNet}) × 100 ={" "}
              {fmt(result.vdPercent, 3)} % ≤ {limit} %
            </p>
          </>
        )}
      </div>
    </Panel>
  );
}

function fmt(value, decimals) {
  if (value === null || value === undefined || !Number.isFinite(value)) return null;
  return round(value, decimals);
}
