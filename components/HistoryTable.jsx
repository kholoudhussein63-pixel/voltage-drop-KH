import { Panel } from "./ui";

export default function HistoryTable({ entries, onLoad, onClear }) {
  return (
    <Panel
      title="Calculation History"
      subtitle="Saved design cases, persisted in this browser."
      actions={
        <div className="flex gap-2">
          <button type="button" className="btn-ghost" onClick={onClear} disabled={!entries.length}>
            Clear
          </button>
        </div>
      }
    >
      {entries.length === 0 ? (
        <p className="rounded-xl border border-dashed border-white/10 px-4 py-8 text-center text-sm text-steel-300">
          No saved cases yet — run a calculation and press “Save to history”.
        </p>
      ) : (
        <div className="max-h-[320px] overflow-auto">
          <table className="w-full min-w-[720px] border-separate border-spacing-0 text-xs">
            <thead className="sticky top-0 bg-steel-900">
              <tr>
                {["Case", "Date", "Mode", "Config", "L (m)", "I_b (A)", "V_Net", "Limit", "V.D (V)", "V.D %", "Result"].map(
                  (head) => (
                    <th key={head} className="border-b border-white/10 px-2 py-2 text-left">
                      {head}
                    </th>
                  )
                )}
              </tr>
            </thead>
            <tbody>
              {entries.map((entry) => (
                <tr key={entry.id} className="row-hover cursor-pointer" onClick={() => onLoad(entry)}>
                  <td className="px-2 py-2 font-semibold text-slate-100">{entry.name}</td>
                  <td className="px-2 py-2 font-mono text-steel-300">{entry.date}</td>
                  <td className="px-2 py-2">
                    <span className="chip bg-white/5 text-steel-300 ring-1 ring-white/10">Mode {entry.mode}</span>
                  </td>
                  <td className="px-2 py-2 font-mono text-slate-300">{entry.config}</td>
                  <td className="px-2 py-2 font-mono">{entry.length}</td>
                  <td className="px-2 py-2 font-mono">{entry.current}</td>
                  <td className="px-2 py-2 font-mono">{entry.vNet}</td>
                  <td className="px-2 py-2 font-mono">{entry.limit}%</td>
                  <td className="px-2 py-2 font-mono text-volt">{entry.vd}</td>
                  <td className="px-2 py-2 font-mono">{entry.vdPercent}%</td>
                  <td className="px-2 py-2">
                    <span
                      className={`chip ring-1 ${
                        entry.passed
                          ? "bg-emerald-500/15 text-emerald-400 ring-emerald-400/30"
                          : "bg-rose-500/15 text-rose-400 ring-rose-400/30"
                      }`}
                    >
                      {entry.passed ? "Pass" : "Fail"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Panel>
  );
}
