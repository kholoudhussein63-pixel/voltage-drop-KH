import { useState } from "react";
import { Panel } from "./ui";
import { COPPER_VD_TABLE, ALUMINIUM_FACTOR, MATERIALS, round } from "../lib/vdTable";

export default function ReferenceTable({ activeCsa, material, insulation }) {
  const [showAluminium, setShowAluminium] = useState(true);

  return (
    <Panel
      title="Embedded Conductor Database"
      subtitle="Copper mV / A / m reference values, exactly as specified. Aluminium columns are derived with the resistivity ratio."
      actions={
        <button type="button" className="btn-ghost" onClick={() => setShowAluminium((v) => !v)}>
          {showAluminium ? "Hide" : "Show"} Aluminium
        </button>
      }
    >
      <div className="max-h-[420px] overflow-auto">
        <table className="w-full border-separate border-spacing-0 text-sm">
          <thead className="sticky top-0 bg-steel-900">
            <tr>
              <th className="border-b border-white/10 px-3 py-2 text-left">C.S.A (mm²)</th>
              <th className="border-b border-white/10 px-3 py-2 text-left">PVC/PVC</th>
              <th className="border-b border-white/10 px-3 py-2 text-left">XLPE/PVC</th>
              {showAluminium ? (
                <>
                  <th className="border-b border-white/10 px-3 py-2 text-left">Al PVC/PVC</th>
                  <th className="border-b border-white/10 px-3 py-2 text-left">Al XLPE/PVC</th>
                </>
              ) : null}
            </tr>
          </thead>
          <tbody>
            {COPPER_VD_TABLE.map((row) => {
              const isActive = Number(row.csa) === Number(activeCsa);
              const activeColumn = insulation === "xlpe" ? "xlpe" : "pvc";
              return (
                <tr
                  key={row.csa}
                  className={
                    isActive
                      ? "bg-volt/10 font-bold text-volt"
                      : "border-b border-white/5 text-slate-300 hover:bg-white/[0.03]"
                  }
                >
                  <td className="px-3 py-1.5 font-mono">{row.csa}</td>
                  <td className={`px-3 py-1.5 font-mono ${isActive && activeColumn === "pvc" ? "" : ""}`}>
                    {row.pvc}
                  </td>
                  <td className={`px-3 py-1.5 font-mono ${isActive && activeColumn === "xlpe" ? "" : ""}`}>
                    {row.xlpe}
                  </td>
                  {showAluminium ? (
                    <>
                      <td className="px-3 py-1.5 font-mono text-steel-300">
                        {round(row.pvc * ALUMINIUM_FACTOR, 3)}
                      </td>
                      <td className="px-3 py-1.5 font-mono text-steel-300">
                        {round(row.xlpe * ALUMINIUM_FACTOR, 3)}
                      </td>
                    </>
                  ) : null}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="mt-3 flex flex-wrap gap-4 text-[11px] text-steel-300">
        {MATERIALS.map((m) => (
          <span key={m.value}>
            <b className="text-slate-200">{m.label}</b> — {m.value === "copper" ? "table values" : `×${round(ALUMINIUM_FACTOR, 3)} factor`}
          </span>
        ))}
        <span>Highlighted row = currently selected C.S.A</span>
      </div>
    </Panel>
  );
}
