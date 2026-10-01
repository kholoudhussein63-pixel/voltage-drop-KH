import {
  COPPER_VD_TABLE,
  MAX_SINGLE_RUN_CSA,
  PARALLEL_OPTIONS,
  lookupMv,
  round,
} from "./vdTable";

/**
 * Core per-section calculation implementing the specified formulas:
 *   Adjusted mV   = mV / N
 *   V.D (Ind)     = ((mV / N) * I_b * L) / 1000
 *   V.D (Accm)    = V.D (Ind) + V.D (US)
 *   V.D %         = (V.D (Accm) / V_Net) * 100
 */
export function computeSection(section, context) {
  const { length, current, csa, parallel, upstreamVd } = normalizeSection(section, context);
  const lookup = lookupMv({
    csa,
    insulation: context.insulation,
    material: context.material,
  });

  if (!lookup || !isPositive(length) || !isPositive(current)) {
    return {
      valid: false,
      length,
      current,
      csa,
      parallel,
      mv: lookup ? lookup.mv : null,
      adjustedMv: null,
      vdInd: null,
      upstreamVd: round(upstreamVd, 3),
      vdAccm: null,
      vdPercent: null,
    };
  }

  const adjustedMv = lookup.mv / parallel;
  const vdInd = (adjustedMv * current * length) / 1000;
  const vdAccm = vdInd + upstreamVd;
  const vdPercent = context.vNet > 0 ? (vdAccm / context.vNet) * 100 : 0;

  return {
    valid: true,
    length,
    current,
    csa,
    parallel,
    copperMv: lookup.copperMv,
    mv: lookup.mv,
    adjustedMv: round(adjustedMv, 5),
    vdInd: round(vdInd, 4),
    upstreamVd: round(upstreamVd, 4),
    vdAccm: round(vdAccm, 4),
    vdPercent: round(vdPercent, 3),
  };
}

function normalizeSection(section, context) {
  return {
    length: toNumber(section.length ?? context.length),
    current: toNumber(section.current ?? context.current),
    csa: toNumber(section.csa ?? context.csa),
    parallel: Math.max(1, Math.round(toNumber(section.parallel ?? context.parallel) || 1)),
    upstreamVd: toNumber(section.upstreamVd ?? context.upstreamVd),
  };
}

export function computeBranch(input) {
  return computeSection(
    {
      length: input.length,
      current: input.current,
      csa: input.csa,
      parallel: input.parallel,
      upstreamVd: input.upstreamVd,
    },
    input
  );
}

/**
 * Mode B — cumulative multi-section path.
 * `sections` are ordered source -> load. Each section accumulates the
 * voltage drop already incurred upstream.
 */
export function computePath(sections, context) {
  const rows = [];
  let accumulated = 0;

  sections.forEach((section, index) => {
    const result = computeSection(
      { ...section, length: section.length, current: section.current, parallel: section.parallel },
      { ...context, upstreamVd: 0 }
    );
    const upstreamVd = accumulated;
    const vdInd = result.valid ? result.vdInd : null;
    const vdAccm = result.valid ? round(vdInd + upstreamVd, 4) : null;

    if (result.valid) accumulated = vdAccm;

    rows.push({
      ...result,
      id: section.id ?? index,
      label: section.label || `Section ${index + 1}`,
      upstreamVd: round(upstreamVd, 4),
      vdAccm,
      vdPercent:
        result.valid && context.vNet > 0 ? round((vdAccm / context.vNet) * 100, 3) : null,
    });
  });

  const totalVd = round(accumulated, 4);
  return {
    rows,
    totalVd,
    vdPercent: context.vNet > 0 ? round((totalVd / context.vNet) * 100, 3) : 0,
  };
}

/** Compliance evaluation against the allowable limit for the application. */
export function evaluateCompliance({ vdPercent, limit, context }) {
  if (!Number.isFinite(vdPercent)) {
    return { status: "incomplete", passed: false, margin: null, messages: [] };
  }
  const passed = vdPercent <= limit;
  const margin = round(limit - vdPercent, 3);
  const messages = [];

  if (passed) {
    messages.push(
      `Compliant — utilisation is ${round((vdPercent / limit) * 100, 1)}% of the allowable ${limit}% drop.`
    );
    if (margin < 0.25) {
      messages.push(`Margin to the ${limit}% limit is only ${margin}%. Confirm final routing length.`);
    }
  } else {
    messages.push(
      `Non-compliant — ${vdPercent}% exceeds the allowable ${limit}% limit by ${round(vdPercent - limit, 3)}%.`
    );
  }

  if (context?.csa > MAX_SINGLE_RUN_CSA) {
    messages.push(
      `C.S.A of ${context.csa} mm² exceeds the ${MAX_SINGLE_RUN_CSA} mm² single-run practical limit — a parallel configuration is recommended.`
    );
  }
  if (context?.parallel > 1) {
    const perCable = round(context.current / context.parallel, 2);
    messages.push(
      `Parallel run: ${context.parallel} × ${context.csa} mm² carrying ≈ ${perCable} A per circuit (verify cable rating and current sharing).`
    );
  }

  return {
    status: passed ? "pass" : "fail",
    passed,
    margin,
    messages,
  };
}

/**
 * Intelligent recommendations:
 *  - smallest C.S.A that passes at the current parallel count
 *  - smallest parallel count that passes at the current C.S.A
 *  - best combined upsized option
 */
export function buildRecommendations({ mode, input, sections, context, compliance }) {
  if (compliance.status === "incomplete") return [];

  const limit = context.limit;
  const recs = [];

  if (compliance.passed) {
    const downsized =
      mode === "A"
        ? findSmallestPassingBranch({ ...input, csa: context.csa }, context, limit)
        : null;
    if (downsized && downsized.csa < input.csa) {
      recs.push({
        type: "optimize",
        title: "Downsize opportunity",
        detail: `The path passes at ${limit}%, so ${downsized.csa} mm² (N=${downsized.parallel}) with V.D% ${downsized.vdPercent} could reduce copper content and cost. Re-check short-circuit withstand before adopting.`,
        ...downsized,
      });
    }
    return recs;
  }

  if (mode === "A") {
    const sizeUp = searchBranchSolutions(sections ?? input, context, limit, "csa");
    if (sizeUp.length) {
      recs.push({
        type: "upscale",
        title: "Upsize the conductor",
        detail: sizeUp
          .slice(0, 3)
          .map((s) => `${s.csa} mm² (N=${s.parallel}) → ${s.vdPercent}%`)
          .join(", "),
        options: sizeUp,
      });
    }

    const parallelUp = searchBranchSolutions(sections ?? input, context, limit, "parallel");
    if (parallelUp.length) {
      recs.push({
        type: "parallel",
        title: "Add parallel circuits",
        detail: parallelUp
          .slice(0, 3)
          .map((s) => `${s.parallel} × ${s.csa} mm² → ${s.vdPercent}%`)
          .join(", "),
        options: parallelUp,
      });
    }

    if (input.csa >= COPPER_VD_TABLE[COPPER_VD_TABLE.length - 1].csa) {
      recs.push({
        type: "escalate",
        title: "Table limit reached",
        detail:
          "400 mm² is the largest tabulated size. Consider a higher system voltage, splitting the load across separate feeders, moving the distribution board closer to the load, or using XLPE insulated cable.",
      });
    }
    return recs;
  }

  // Mode B — the controlling section is the one with the highest individual drop.
  const rows = (sections || []).map((s) => computeSection(s, { ...context, upstreamVd: 0 }));
  const controlling = rows
    .filter((r) => r.valid)
    .sort((a, b) => b.vdInd - a.vdInd)
    .at(0);

  if (!controlling) return recs;

  const idx = rows.findIndex((r) => r === controlling);
  const base = sections[idx];
  const others = sum(rows.filter((r, i) => i !== idx && r.valid).map((r) => r.vdInd));
  const budgetMv = (limit * context.vNet) / 100 - others;

  if (budgetMv <= 0) {
    recs.push({
      type: "escalate",
      title: "Path exceeds limit before final section",
      detail: `Upstream sections alone already consume ${round(others, 3)} V of the ${round((limit * context.vNet) / 100, 3)} V budget at ${limit}%. Shorten the route, upsize multiple sections, or re-rate the network voltage.`,
    });
    return recs;
  }

  const solution = solveForBudget({
    current: controlling.current,
    length: controlling.length,
    budgetVd: budgetMv,
    insulation: context.insulation,
    material: context.material,
  });

  if (solution) {
    const projected = round(((others + solution.sectionVd) / context.vNet) * 100, 3);
    recs.push({
      type: "upscale",
      title: `Upsize controlling section (${controlling.label ?? base.label})`,
      detail: `Changing ${controlling.csa} mm² to ${solution.csa} mm² with N=${solution.parallel} brings the cumulative drop to ${projected}% against the ${limit}% limit.`,
      sectionId: base.id,
      ...solution,
      vdPercent: projected,
    });
  } else {
    recs.push({
      type: "escalate",
      title: "No single-section fix available",
      detail: `The controlling section needs V.D ≤ ${round(budgetMv, 3)} V. Upsize more than one section, add parallel runs, or increase the distribution level.`,
    });
  }

  return recs;
}

function solveForBudget({ current, length, budgetVd, insulation, material }) {
  const candidates = [];
  for (const size of sortedSizes()) {
    const mv = lookupMv({ csa: size, insulation, material })?.mv;
    if (!mv) continue;
    for (const n of PARALLEL_OPTIONS) {
      const vd = ((mv / n) * current * length) / 1000;
      if (vd <= budgetVd) candidates.push({ csa: size, parallel: n, sectionVd: round(vd, 4) });
    }
  }
  if (!candidates.length) return null;
  // Prefer the fewest parallel circuits, then the smallest conductor.
  return candidates.sort((a, b) => a.parallel - b.parallel || a.csa - b.csa)[0];
}

function searchBranchSolutions(input, context, limit, axis) {
  const sizes = sortedSizes();
  const currentCsa = input.csa;
  const currentParallel = Math.max(1, Number(input.parallel) || 1);
  const results = [];

  const test = (csa, parallel) => {
    const r = computeBranch({ ...input, ...context, csa, parallel });
    if (!r.valid) return null;
    return r.vdPercent <= limit ? { csa, parallel, ...r } : null;
  };

  if (axis === "csa") {
    sizes
      .filter((s) => s > currentCsa)
      .some((s) => {
        const hit = test(s, currentParallel);
        if (hit) {
          results.push(hit);
          return true;
        }
        return false;
      });
    for (const n of PARALLEL_OPTIONS.filter((x) => x > 1)) {
      for (const s of sizes.filter((x) => x > currentCsa)) {
        const hit = test(s, n);
        if (hit) {
          results.push(hit);
          break;
        }
      }
    }
  } else {
    PARALLEL_OPTIONS.filter((n) => n > currentParallel).forEach((n) => {
      const hit = test(currentCsa, n);
      if (hit) results.push(hit);
    });
  }

  return results.sort((a, b) => a.csa - b.csa || a.parallel - b.parallel);
}

function findSmallestPassingBranch(input, context, limit) {
  const candidates = [];
  for (const csa of sortedSizes()) {
    for (const parallel of PARALLEL_OPTIONS) {
      const r = computeBranch({ ...input, ...context, csa, parallel });
      if (r.valid && r.vdPercent <= limit) candidates.push({ csa, parallel, ...r });
    }
  }
  if (!candidates.length) return null;
  // Prefer the fewest parallel circuits, then the smallest conductor.
  return candidates.sort(
    (a, b) => a.parallel - b.parallel || a.csa - b.csa || a.vdPercent - b.vdPercent
  )[0];
}

function sortedSizes() {
  return COPPER_VD_TABLE.map((r) => r.csa).sort((a, b) => a - b);
}

function sum(list) {
  return list.reduce((acc, v) => acc + (Number(v) || 0), 0);
}

function toNumber(value) {
  if (value === "" || value === null || value === undefined) return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function isPositive(v) {
  return Number.isFinite(v) && v > 0;
}
