export function Label({ children, hint }) {
  return (
    <label className="field-label">
      {children}
      {hint ? <span className="ml-1 normal-case tracking-normal text-steel-500">{hint}</span> : null}
    </label>
  );
}

export function TextField({ label, hint, value, onChange, type = "text", ...rest }) {
  return (
    <div>
      {label ? <Label hint={hint}>{label}</Label> : null}
      <input
        type={type}
        className="field"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        {...rest}
      />
    </div>
  );
}

export function NumberField({ label, unit, value, onChange, min, max, step = "any", ...rest }) {
  return (
    <div>
      <Label>{label}</Label>
      <div className="relative">
        <input
          type="number"
          inputMode="decimal"
          className={`field ${unit ? "pr-14" : ""}`}
          value={value ?? ""}
          min={min}
          max={max}
          step={step}
          onChange={(e) => onChange(e.target.value === "" ? "" : Number(e.target.value))}
          {...rest}
        />
        {unit ? (
          <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-[11px] font-semibold text-steel-500">
            {unit}
          </span>
        ) : null}
      </div>
    </div>
  );
}

export function SelectField({ label, value, onChange, options, mapOption }) {
  return (
    <div>
      <Label>{label}</Label>
      <select className="field select" value={value} onChange={(e) => onChange(e.target.value)}>
        {options.map((option) => {
          const { v, label: text } = mapOption ? mapOption(option) : { v: option, label: option };
          return (
            <option key={v} value={v}>
              {text}
            </option>
          );
        })}
      </select>
    </div>
  );
}

export function Metric({ label, value, unit, tone = "default", title }) {
  const tones = {
    default: "text-slate-50",
    volt: "text-volt",
    pass: "text-emerald-400",
    fail: "text-rose-400",
    muted: "text-steel-300",
  };
  return (
    <div className="metric" title={title}>
      <div className="metric-label">{label}</div>
      <div className={`metric-value ${tones[tone]}`}>
        {value ?? "—"}
        {value !== null && value !== undefined && unit ? (
          <span className="ml-1 text-xs font-semibold text-steel-500">{unit}</span>
        ) : null}
      </div>
    </div>
  );
}

export function StatusChip({ passed, complete = true }) {
  if (!complete) {
    return <span className="chip bg-slate-500/15 text-slate-300 ring-1 ring-slate-400/30">Awaiting input</span>;
  }
  return passed ? (
    <span className="chip bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-400/40">Pass — compliant</span>
  ) : (
    <span className="chip bg-rose-500/15 text-rose-400 ring-1 ring-rose-400/40">Fail — exceeds limit</span>
  );
}

export function Panel({ title, subtitle, actions, children, className = "" }) {
  return (
    <section className={`panel p-5 ${className}`}>
      {(title || actions) && (
        <header className="mb-4 flex flex-wrap items-start justify-between gap-3">
          <div>
            {title ? <h2 className="panel-title">{title}</h2> : null}
            {subtitle ? <p className="mt-1 text-xs text-steel-300">{subtitle}</p> : null}
          </div>
          {actions}
        </header>
      )}
      {children}
    </section>
  );
}
