import { Panel, SelectField, NumberField } from "./ui";
import {
  CSA_OPTIONS,
  MATERIALS,
  INSULATIONS,
  PARALLEL_OPTIONS,
  lookupMv,
  round,
} from "../lib/vdTable";

export default function BranchInputs({ form, onChange, context, disabledFields = [] }) {
  const isPath = disabledFields.includes("length");

  if (isPath) {
    return (
      <Panel
        title="Conductor Specification"
        subtitle="Applies to every section of the cumulative path — per-section length, current, C.S.A and parallel count are set in the section table below."
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <SelectField
            label="Conductor Material"
            value={context.material}
            onChange={(v) => onChange("material", v)}
            options={MATERIALS}
            mapOption={(o) => ({ v: o.value, label: o.label })}
          />
          <SelectField
            label="Insulation Type"
            value={context.insulation}
            onChange={(v) => onChange("insulation", v)}
            options={INSULATIONS}
            mapOption={(o) => ({ v: o.value, label: o.label })}
          />
        </div>
      </Panel>
    );
  }

  const mvInfo = lookupMv({
    csa: form.csa,
    insulation: context.insulation,
    material: context.material,
  });

  const adjusted = mvInfo ? mvInfo.mv / Math.max(1, Number(form.parallel) || 1) : null;

  return (
    <Panel
      title="Branch Parameters"
      subtitle="Cable run under evaluation — the mV/A/m factor is auto-fetched from the embedded conductor table."
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <NumberField
          label="Cable Length (L)"
          unit="m"
          value={form.length}
          min="0"
          onChange={(v) => onChange("length", v)}
        />
        <NumberField
          label="Load Current / Breaker Rating (I_b)"
          unit="A"
          value={form.current}
          min="0"
          onChange={(v) => onChange("current", v)}
        />
        <SelectField
          label="Cross-Sectional Area (C.S.A)"
          value={form.csa}
          onChange={(v) => onChange("csa", Number(v))}
          options={CSA_OPTIONS}
          mapOption={(o) => ({ v: o, label: `${o} mm²` })}
        />
        <SelectField
          label="Conductor Material"
          value={context.material}
          onChange={(v) => onChange("material", v)}
          options={MATERIALS}
          mapOption={(o) => ({ v: o.value, label: o.label })}
        />
        <SelectField
          label="Insulation Type"
          value={context.insulation}
          onChange={(v) => onChange("insulation", v)}
          options={INSULATIONS}
          mapOption={(o) => ({ v: o.value, label: o.label })}
        />
        <SelectField
          label="Number of Parallel Cables (N)"
          value={form.parallel}
          onChange={(v) => onChange("parallel", Number(v))}
          options={PARALLEL_OPTIONS}
          mapOption={(o) => ({ v: o, label: `${o} parallel run${o > 1 ? "s" : ""}` })}
        />
        <NumberField
          label="Upstream V.D (V_US)"
          unit="V"
          value={form.upstreamVd}
          min="0"
          onChange={(v) => onChange("upstreamVd", v)}
        />
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Readout label="Base mV/A/m" value={mvInfo ? round(mvInfo.mv, 4) : null} />
        <Readout label="Table (Cu) mV/A/m" value={mvInfo ? mvInfo.copperMv : null} />
        <Readout label="Adjusted mV ÷ N" value={adjusted === null ? null : round(adjusted, 5)} />
        <Readout label="Effective Configuration" value={formatConfig(form, context)} small />
      </div>
    </Panel>
  );
}

function formatConfig(form, context) {
  const n = Math.max(1, Number(form.parallel) || 1);
  return `${n} × ${form.csa} mm² ${context.material === "aluminium" ? "Al" : "Cu"} · ${
    context.insulation === "xlpe" ? "XLPE" : "PVC"
  }`;
}

function Readout({ label, value, small }) {
  return (
    <div className="rounded-lg border border-volt/20 bg-volt/5 px-3 py-2">
      <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-volt/80">{label}</div>
      <div className={`mt-0.5 font-mono font-bold text-slate-100 ${small ? "text-xs" : "text-base"}`}>
        {value ?? "—"}
      </div>
    </div>
  );
}
