import { Panel, SelectField, NumberField } from "./ui";
import { APPLICATIONS, VOLTAGES } from "../lib/vdTable";

export default function DesignCriteria({ context, onChange }) {
  return (
    <Panel
      title="Design Criteria"
      subtitle="Network voltage and the governing allowable voltage-drop limit."
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <SelectField
          label="Network Voltage (V_Net)"
          value={context.vNet}
          onChange={(v) => onChange("vNet", Number(v))}
          options={VOLTAGES}
          mapOption={(o) => ({ v: o.value, label: o.label })}
        />
        <SelectField
          label="Application Type"
          value={context.application}
          onChange={(v) => onChange("application", v)}
          options={APPLICATIONS}
          mapOption={(o) => ({ v: o.value, label: `${o.label}${o.limit ? ` — max ${o.limit}%` : ""}` })}
        />
        <NumberField
          label={context.application === "custom" ? "Custom Allowable V.D" : "Allowable V.D (fixed)"}
          unit="%"
          value={context.limit}
          min="0.1"
          step="0.5"
          onChange={(v) => onChange("limit", v)}
          disabled={context.application !== "custom"}
        />
      </div>
    </Panel>
  );
}
