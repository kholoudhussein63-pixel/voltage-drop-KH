import { Panel } from "./ui";

const ICONS = {
  pass: "✓",
  fail: "!",
  upscale: "↑",
  parallel: "≡",
  optimize: "◆",
  escalate: "▲",
};

const TONES = {
  pass: "border-emerald-400/30 bg-emerald-500/10 text-emerald-300",
  fail: "border-rose-400/30 bg-rose-500/10 text-rose-300",
  info: "border-sky-400/25 bg-sky-500/10 text-sky-300",
  upscale: "border-volt/40 bg-volt/10 text-volt",
  parallel: "border-volt/40 bg-volt/10 text-volt",
  optimize: "border-emerald-400/30 bg-emerald-500/10 text-emerald-300",
  escalate: "border-rose-400/30 bg-rose-500/10 text-rose-300",
};

export default function Recommendations({ messages, notes, suggestions, onApply }) {
  return (
    <Panel
      title="Compliance & Intelligent Recommendations"
      subtitle="Automated checks against allowable limits with upsize / parallel-run solutions."
    >
      <div className="space-y-2">
        {messages.length ? (
          messages.map((message, i) => (
            <div
              key={`${message}-${i}`}
              className={`flex items-start gap-3 rounded-xl border px-4 py-3 text-sm ${
                message.startsWith("Compliant")
                  ? TONES.pass
                  : message.startsWith("Non-compliant")
                    ? TONES.fail
                    : TONES.info
              }`}
            >
              <span className="mt-0.5 font-mono text-xs font-bold">
                {message.startsWith("Compliant") ? ICONS.pass : message.startsWith("Non-compliant") ? ICONS.fail : "i"}
              </span>
              <span className="text-slate-100">{message}</span>
            </div>
          ))
        ) : (
          <p className="rounded-xl border border-dashed border-white/10 px-4 py-6 text-center text-sm text-steel-300">
            Enter a positive cable length and load current to run the compliance check.
          </p>
        )}
      </div>

      {suggestions.length ? (
        <div className="mt-5 grid gap-3 lg:grid-cols-2">
          {suggestions.map((suggestion) => (
            <div
              key={suggestion.title}
              className={`rounded-xl border p-4 ${TONES[suggestion.type] ?? TONES.info}`}
            >
              <div className="flex items-center gap-2">
                <span className="font-mono text-base font-bold">{ICONS[suggestion.type] ?? "•"}</span>
                <h3 className="text-sm font-bold uppercase tracking-wider">{suggestion.title}</h3>
              </div>
              <p className="mt-2 text-sm text-slate-200">{suggestion.detail}</p>

              {suggestion.csa ? (
                <button
                  type="button"
                  onClick={() => onApply(suggestion)}
                  className="btn-ghost mt-3 bg-white/5 text-slate-100 hover:bg-white/15"
                >
                  Apply {suggestion.csa} mm² × {suggestion.parallel}
                </button>
              ) : null}

              {suggestion.options?.length ? (
                <ul className="mt-3 space-y-1.5">
                  {suggestion.options.map((option) => (
                    <li key={`${option.csa}-${option.parallel}`}>
                      <button
                        type="button"
                        onClick={() => onApply(option)}
                        className="flex w-full items-center justify-between gap-3 rounded-lg border border-white/10 bg-steel-950/50 px-3 py-2 font-mono text-xs text-slate-200 transition hover:border-volt/50 hover:text-volt"
                      >
                        <span>
                          {option.parallel} × {option.csa} mm²
                        </span>
                        <span>{option.vdPercent}% V.D</span>
                      </button>
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          ))}
        </div>
      ) : null}

      {notes?.length ? (
        <div className="mt-5 rounded-xl border border-white/5 bg-steel-950/40 p-4">
          <h3 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-steel-300">
            Engineering cautions
          </h3>
          <ul className="mt-2 space-y-1.5 text-xs text-slate-300">
            {notes.map((note) => (
              <li key={note} className="flex gap-2">
                <span className="text-volt">—</span>
                <span>{note}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </Panel>
  );
}
