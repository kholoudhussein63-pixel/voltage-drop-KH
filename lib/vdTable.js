/**
 * Embedded Copper Conductor Voltage Drop Table
 * Units: mV / A / m  (millivolt per ampere per metre)
 * Columns: PVC/PVC insulation, XLPE/PVC insulation
 */
export const COPPER_VD_TABLE = [
  { csa: 1.5, pvc: 20.345, xlpe: 20.341 },
  { csa: 2.5, pvc: 12.397, xlpe: 13.197 },
  { csa: 4, pvc: 7.741, xlpe: 7.731 },
  { csa: 6, pvc: 5.199, xlpe: 5.191 },
  { csa: 10, pvc: 3.101, xlpe: 3.094 },
  { csa: 16, pvc: 1.988, xlpe: 1.982 },
  { csa: 25, pvc: 1.28, xlpe: 1.276 },
  { csa: 35, pvc: 0.959, xlpe: 0.955 },
  { csa: 50, pvc: 0.72, xlpe: 0.715 },
  { csa: 70, pvc: 0.524, xlpe: 0.52 },
  { csa: 95, pvc: 0.398, xlpe: 0.394 },
  { csa: 120, pvc: 0.341, xlpe: 0.337 },
  { csa: 150, pvc: 0.285, xlpe: 0.282 },
  { csa: 185, pvc: 0.244, xlpe: 0.241 },
  { csa: 240, pvc: 0.204, xlpe: 0.201 },
  { csa: 300, pvc: 0.18, xlpe: 0.177 },
  { csa: 400, pvc: 0.157, xlpe: 0.155 },
];

export const CSA_OPTIONS = COPPER_VD_TABLE.map((r) => r.csa);

export const MATERIALS = [
  { value: "copper", label: "Copper (Cu)" },
  { value: "aluminium", label: "Aluminium (Al)" },
];

export const INSULATIONS = [
  { value: "pvc", label: "PVC Insulation & PVC Sheathed" },
  { value: "xlpe", label: "XLPE Insulation & PVC Sheathed" },
];

export const APPLICATIONS = [
  { value: "power", label: "Power / Motors", limit: 5 },
  { value: "lighting", label: "Lighting", limit: 3 },
  { value: "custom", label: "Custom Limit", limit: null },
];

export const VOLTAGES = [
  { value: 380, label: "380 V — Three Phase" },
  { value: 400, label: "400 V — Three Phase" },
  { value: 220, label: "220 V — Single Phase" },
  { value: 230, label: "230 V — Single Phase" },
];

/**
 * The embedded reference table is specified for copper conductors.
 * Aluminium factors are derived from the standard resistivity ratio
 * rho(Al)/rho(Cu) = 28.264 / 17.241 (IEC 60228 class 2 conductors).
 */
export const ALUMINIUM_FACTOR = 28.264 / 17.241;

/** Single largest practical radial run before parallel circuits are required. */
export const MAX_SINGLE_RUN_CSA = 240;

export const PARALLEL_OPTIONS = [1, 2, 3, 4];

/**
 * Auto-retrieves the base mV/A/m factor for a size + insulation pair,
 * then converts it for the selected conductor material.
 */
export function lookupMv({ csa, insulation, material }) {
  const row = COPPER_VD_TABLE.find((r) => r.csa === Number(csa));
  if (!row) return null;
  const copperMv = Number(row[insulation === "xlpe" ? "xlpe" : "pvc"]);
  const mv = material === "aluminium" ? copperMv * ALUMINIUM_FACTOR : copperMv;
  return { copperMv, mv: round(mv, 4) };
}

export function round(value, decimals = 3) {
  if (!Number.isFinite(value)) return 0;
  const f = 10 ** decimals;
  return Math.round(value * f) / f;
}
