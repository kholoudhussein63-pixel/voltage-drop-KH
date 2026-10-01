import { Panel } from "./ui";
import { CSA_OPTIONS, PARALLEL_OPTIONS, round } from "../lib/vdTable";

export default function PathBuilder({ rows, onCell, onAdd, onRemove, onDuplicate }) {
  const total = round(rows.reduce((acc, r) => acc + (r.valid ? r.vdInd : 0), 0), 3);

  return (
    <Panel
      title="Cumulative Path Sections"
      subtitle="Mode B — sections run source to load; V.D (Accm) = V.D (Ind) + V.D (US) cascades down the route."
      actions={
        <button type="button" className="btn-primary" onClick={onAdd}>
          + Add Section
        </button>
      }
    >
      <div className="overflow-x-auto">
        <table className="w-full min-w-[1000px] border-separate border-spacing-0 text-sm">
          <thead>
            <tr>
              {["#", "Section", "L (m)", "I_b (A)", "C.S.A mm²", "N ∥", "mV/N", "V.D Ind (V)", "V.D US (V)", "V.D Accm (V)", "V.D %", "Ops"].map(
                (head) => (
                  <th key={head} className="border-b border-white/10 px-2 py-2 text-left">
                    {head}
                  </th>
                )
              )}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <tr key={row.id} className="row-hover">
                <td className="px-2 py-2 font-mono text-steel-300">{index + 1}</td>
                <td className="px-2 py-2">
                  <input
                    className="field !px-2 !py-1.5 text-xs"
                    value={row.label}
                    onChange={(e) => onCell(row.id, "label", e.target.value)}
                  />
                </td>
                <td className="px-2 py-2">
                  <input
                    type="number"
                    className="field !px-2 !py-1.5 font-mono"
                    value={row.length ?? ""}
                    min="0"
                    onChange={(e) => onCell(row.id, "length", num(e.target.value))}
                  />
                </td>
                <td className="px-2 py-2">
                  <input
                    type="number"
                    className="field !px-2 !py-1.5 font-mono"
                    value={row.current ?? ""}
                    min="0"
                    onChange={(e) => onCell(row.id, "current", num(e.target.value))}
                  />
                </td>
                <td className="px-2 py-2">
                  <select
                    className="field select !px-2 !py-1.5 !pr-6 font-mono min-w-[74px]"
                    value={row.csa}
                    onChange={(e) => onCell(row.id, "csa", Number(e.target.value))}
                  >
                    {CSA_OPTIONS.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="px-2 py-2">
                  <select
                    className="field select !px-2 !py-1.5 !pr-6 font-mono min-w-[56px]"
                    value={row.parallel}
                    onChange={(e) => onCell(row.id, "parallel", Number(e.target.value))}
                  >
                    {PARALLEL_OPTIONS.map((n) => (
                      <option key={n} value={n}>
                        {n}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="px-2 py-2 font-mono text-steel-300">
                  {row.adjustedMv == null ? "—" : round(row.adjustedMv, 4)}
                </td>
                <td className="px-2 py-2 font-mono text-slate-200">
                  {row.vdInd == null ? "—" : round(row.vdInd, 3)}
                </td>
                <td className="px-2 py-2 font-mono text-slate-400">{round(row.upstreamVd, 3)}</td>
                <td className="px-2 py-2 font-mono text-volt">
                  {row.vdAccm == null ? "—" : round(row.vdAccm, 3)}
                </td>
                <td
                  className={`px-2 py-2 font-mono font-bold ${
                    row.vdPercent == null
                      ? "text-steel-300"
                      : row.vdPercent > row.limit
                        ? "text-rose-400"
                        : "text-emerald-400"
                  }`}
                >
                  {row.vdPercent == null ? "—" : `${row.vdPercent}%`}
                </td>
                <td className="px-2 py-2">
                  <div className="flex gap-1">
                    <button
                      type="button"
                      title="Duplicate"
                      className="rounded-md border border-white/10 px-2 py-1 text-xs text-steel-300 hover:text-slate-100"
                      onClick={() => onDuplicate(row.id)}
                    >
                      ⧉
                    </button>
                    <button
                      type="button"
                      title="Remove"
                      className="rounded-md border border-rose-500/30 px-2 py-1 text-xs text-rose-400 hover:bg-rose-500/10"
                      onClick={() => onRemove(row.id)}
                      disabled={rows.length <= 1}
                    >
                      ✕
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td
                colSpan={8}
                className="border-t border-white/10 px-2 py-3 text-right text-[11px] uppercase tracking-wider text-steel-300"
              >
                Sum of individual drops
              </td>
              <td colSpan={2} className="border-t border-white/10 px-2 py-3 font-mono text-volt">
                {total} V
              </td>
              <td />
            </tr>
          </tfoot>
        </table>
      </div>
      <p className="mt-3 text-xs text-steel-300">
        Each row carries its own load current. The final row&apos;s V.D (Accm) is the design drop for the
        whole path and drives compliance checking.
      </p>
    </Panel>
  );
}

function num(value) {
  if (value === "") return "";
  const n = Number(value);
  return Number.isFinite(n) ? n : "";
}
