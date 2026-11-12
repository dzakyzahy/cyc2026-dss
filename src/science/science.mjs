// Pure scientific & quantitative modeling engine for CYC 2026 — PT XYZ Decarbonization Strategy
// Strictly implements sequential anti-double-counting (CYC 2026 Case Rule #4) and SBTi 2036 target validation.

export function round2(n) {
  return Math.round((Number(n) + Number.EPSILON) * 100) / 100;
}

/**
 * Computes baseline summary metrics directly from raw inventory items.
 */
export function computeBaselineSummary(sources) {
  const s1 = sources.filter(s => s.scope === 'Scope 1').reduce((a, b) => a + b.emissions, 0);
  const s2 = sources.filter(s => s.scope === 'Scope 2').reduce((a, b) => a + b.emissions, 0);
  const s3All = sources.filter(s => s.scope === 'Scope 3').reduce((a, b) => a + b.emissions, 0);
  const s3In = sources.filter(s => s.scope === 'Scope 3' && s.inBoundary).reduce((a, b) => a + b.emissions, 0);
  const s3Out = sources.filter(s => s.scope === 'Scope 3' && !s.inBoundary).reduce((a, b) => a + b.emissions, 0);
  const total = s1 + s2 + s3All;
  const s12 = s1 + s2;
  const inBoundaryTotal = s12 + s3In;

  return {
    scope1: round2(s1),
    scope2: round2(s2),
    scope12: round2(s12),
    scope3Total: round2(s3All),
    scope3InBoundary: round2(s3In),
    scope3OutBoundary: round2(s3Out),
    scope3CoverageRatio: round2((s3In / s3All) * 100),
    totalReported: round2(total),
    inBoundaryTotal: round2(inBoundaryTotal),
    targets: {
      scope12ReductionPct: 63.0,
      scope12RequiredReduction: 4128.11,
      scope12Max2036: 2424.45,
      scope3ReductionPct: 37.5,
      scope3TargetBoundary: 16756.60,
      scope3RequiredReduction: 6283.73,
      scope3Max2036: 10472.88,
      totalRequiredReduction: 10411.84,
      totalMax2036InBoundary: 12897.33
    }
  };
}

/**
 * Sequential Anti-Double-Counting Abatement Engine (CYC 2026 Case Rule #4).
 *
 * Why sequential?
 * 1. Scope 2: Energy efficiency (EMS/VFD/HVAC) first reduces electricity demand by `effFactor`.
 *    Renewable electricity procurement (Rooftop Solar + Green Tariff/I-REC) is then applied ONLY
 *    to the remaining post-efficiency electricity baseline `S2_after_eff`, avoiding double counting.
 * 2. Scope 1: Boiler waste-heat recovery & combustion tuning first reduces stationary fuel demand
 *    by `thermEffFactor`. Biomass co-firing & industrial heat pumps then displace fuel ONLY on
 *    the remaining post-efficiency stationary combustion baseline `S1_stat_after_eff`.
 * 3. Scope 3 Cat 3 (Fuel & Energy Related WTT/T&D): Co-benefit reduction is linked proportionally
 *    to the actual physical energy reductions in Scope 1 & Scope 2 plus grid supplier cleaner logistics.
 */
export function evaluatePathway(data, params = {}) {
  const {
    scenario = 'recommended',
    execScale = 1.0,
    reShare = null,
    supplierAdoption = null,
    excludeOutBoundary = true,
    disabledInitiatives = []
  } = params;

  const preset = data.scenarios[scenario] || data.scenarios.recommended;
  const scale = Number.isFinite(execScale) ? Math.max(0.4, Math.min(1.25, execScale)) : 1.0;
  const reOverride = reShare !== null && Number.isFinite(reShare) ? Math.max(0, Math.min(1, reShare)) : preset.reShare;
  const supOverride = supplierAdoption !== null && Number.isFinite(supplierAdoption) ? Math.max(0, Math.min(1.25, supplierAdoption)) : preset.supplierAdoption;
  const disabled = new Set(disabledInitiatives);

  const isActive = id => !disabled.has(id);
  const byId = Object.fromEntries(data.sources.map(s => [s.id, s]));

  // --- SCOPE 2 SEQUENTIAL CALCULATION ---
  const s2Base = byId['S2-ELEC'].emissions; // 2400.52
  const s2EffRate = isActive('INIT-S2-EFF') ? Math.min(0.35, 0.18 * scale * preset.opsMultiplier) : 0;
  const s2EffReduction = s2Base * s2EffRate;
  const s2ResidualAfterEff = s2Base - s2EffReduction;

  // Naive (unsequenced) RE reduction if someone wrongly applied RE share to original s2Base:
  const solarShare = isActive('INIT-S2-SOLAR') ? Math.min(0.55, 0.45 * reOverride / 0.968) : 0;
  const recShare = isActive('INIT-S2-REC') ? Math.max(0, reOverride - solarShare) : 0;
  const effectiveReShare = Math.min(1.0, solarShare + recShare);

  const s2SolarReduction = s2ResidualAfterEff * solarShare;
  const s2RecReduction = s2ResidualAfterEff * recShare;
  const s2TotalReduction = s2EffReduction + s2SolarReduction + s2RecReduction;
  const s2Final = Math.max(0, s2Base - s2TotalReduction);
  const s2DoubleCountAvoided = s2EffReduction * effectiveReShare;

  // --- SCOPE 1 SEQUENTIAL CALCULATION ---
  const s1StatBase = byId['S1-STAT'].emissions; // 3907.92
  const s1MobBase = byId['S1-MOB'].emissions;   // 231.13
  const s1FugBase = byId['S1-FUG'].emissions;   // 12.86
  const s1ProcBase = byId['S1-PROC'].emissions; // 0.13
  const s1Base = s1StatBase + s1MobBase + s1FugBase + s1ProcBase; // 4152.04

  const s1ThermEffRate = isActive('INIT-S1-WHR') ? Math.min(0.30, 0.1685 * scale * preset.opsMultiplier) : 0;
  const s1WhReduction = s1StatBase * s1ThermEffRate;
  const s1StatAfterEff = s1StatBase - s1WhReduction;

  const s1FuelSwitchShare = isActive('INIT-S1-BIOHP') ? Math.min(0.85, 0.60 * scale * preset.opsMultiplier) : 0;
  const s1FuelSwitchReduction = s1StatAfterEff * s1FuelSwitchShare;
  const s1DoubleCountAvoided = s1WhReduction * s1FuelSwitchShare;

  const s1MobRate = isActive('INIT-S1-EV') ? Math.min(0.95, 0.80 * scale * preset.opsMultiplier) : 0;
  const s1MobReduction = s1MobBase * s1MobRate;

  const s1FugRate = isActive('INIT-S1-FUG') ? Math.min(0.95, 0.82 * scale) : 0;
  const s1FugReduction = s1FugBase * s1FugRate;

  const s1TotalReduction = s1WhReduction + s1FuelSwitchReduction + s1MobReduction + s1FugReduction;
  const s1Final = Math.max(0, s1Base - s1TotalReduction);

  const s12Base = s1Base + s2Base; // 6552.56
  const s12Reduction = s1TotalReduction + s2TotalReduction;
  const s12Final = s12Base - s12Reduction;
  const s12ReductionPct = (s12Reduction / s12Base) * 100;

  // --- SCOPE 3 IN-BOUNDARY CALCULATION ---
  const c1Base = byId['S3-C1'].emissions;   // 6098.98
  const c2Base = byId['S3-C2'].emissions;   // 14.33
  const c3Base = byId['S3-C3'].emissions;   // 2227.00
  const c4Base = byId['S3-C4'].emissions;   // 958.63
  const c5Base = byId['S3-C5'].emissions;   // 51.56
  const c6Base = byId['S3-C6'].emissions;   // 6.40
  const c7Base = byId['S3-C7'].emissions;   // 121.98
  const c9Base = byId['S3-C9'].emissions;   // 2532.03
  const c10Base = byId['S3-C10'].emissions; // 4745.86

  const c1Rate = isActive('INIT-S3-C1') ? Math.min(0.60, 0.38 * supOverride) : 0;
  const c1Reduction = c1Base * c1Rate;

  const c10Rate = isActive('INIT-S3-C10') ? Math.min(0.55, 0.34 * supOverride) : 0;
  const c10Reduction = c10Base * c10Rate;

  // Cat 3 WTT & T&D reduction is coupled to physical energy savings in S1+S2 + upstream fuel cleaner sourcing
  const s12PhysicalRatio = s12Reduction / s12Base;
  const c3Rate = isActive('INIT-S3-C3') ? Math.min(0.75, (0.52 * s12PhysicalRatio + 0.14 * supOverride)) : 0;
  const c3Reduction = c3Base * c3Rate;

  const logRate = isActive('INIT-S3-LOG') ? Math.min(0.60, 0.35 * supOverride) : 0;
  const c4Reduction = c4Base * logRate;
  const c9Reduction = c9Base * logRate;

  const circRate = isActive('INIT-S3-CIRC') ? Math.min(0.75, 0.54 * scale) : 0;
  const c5Reduction = c5Base * circRate;
  const c2Reduction = c2Base * (circRate * 0.5);

  const commRate = isActive('INIT-S3-COMM') ? Math.min(0.75, 0.53 * scale) : 0;
  const c7Reduction = c7Base * commRate;
  const c6Reduction = c6Base * (commRate * 0.75);

  const s3InBase = c1Base + c2Base + c3Base + c4Base + c5Base + c6Base + c7Base + c9Base + c10Base; // 16756.77
  const s3Reduction = c1Reduction + c2Reduction + c3Reduction + c4Reduction + c5Reduction + c6Reduction + c7Reduction + c9Reduction + c10Reduction;
  const s3InFinal = Math.max(0, s3InBase - s3Reduction);
  const s3ReductionPct = (s3Reduction / s3InBase) * 100;

  const totalDoubleCountAvoided = s2DoubleCountAvoided + s1DoubleCountAvoided;
  const totalInBoundaryBase = s12Base + s3InBase; // 23309.33
  const totalReduction = s12Reduction + s3Reduction;
  const totalInBoundaryFinal = totalInBoundaryBase - totalReduction;

  // Per-initiative breakdown with dynamic actual abatement
  const initiativeMap = {
    'INIT-S2-EFF': s2EffReduction,
    'INIT-S2-SOLAR': s2SolarReduction,
    'INIT-S2-REC': s2RecReduction,
    'INIT-S1-WHR': s1WhReduction,
    'INIT-S1-BIOHP': s1FuelSwitchReduction,
    'INIT-S1-EV': s1MobReduction,
    'INIT-S1-FUG': s1FugReduction,
    'INIT-S3-C1': c1Reduction,
    'INIT-S3-C10': c10Reduction,
    'INIT-S3-C3': c3Reduction,
    'INIT-S3-LOG': c4Reduction + c9Reduction,
    'INIT-S3-CIRC': c5Reduction + c2Reduction,
    'INIT-S3-COMM': c7Reduction + c6Reduction
  };

  const initiatives = data.initiatives.map(init => {
    const abated = round2(initiativeMap[init.id] || 0);
    const mcdaScore = computeMcdaScore(init);
    return {
      ...init,
      active: isActive(init.id),
      abated,
      shareOfTargetPct: round2((abated / 10411.84) * 100),
      mcdaScore
    };
  });

  // Annual trajectory 2025 -> 2036
  const years = [2025, 2026, 2027, 2028, 2029, 2030, 2031, 2032, 2033, 2034, 2035, 2036];
  // S-curve progress weights across phases (Phase 1: 2027-2028, Phase 2: 2029-2033, Phase 3: 2034-2036)
  const s12Weights = [0, 0.03, 0.16, 0.34, 0.50, 0.65, 0.78, 0.87, 0.93, 0.96, 0.99, 1.0];
  const s3Weights  = [0, 0.01, 0.08, 0.19, 0.33, 0.48, 0.63, 0.76, 0.86, 0.92, 0.97, 1.0];

  const trajectory = years.map((yr, idx) => {
    const curS12 = round2(s12Base - s12Reduction * s12Weights[idx]);
    const curS3 = round2(s3InBase - s3Reduction * s3Weights[idx]);
    const sbtS12Line = round2(s12Base - (4128.11 * (idx / (years.length - 1))));
    const sbtS3Line = round2(s3InBase - (6283.73 * (idx / (years.length - 1))));
    return {
      year: yr,
      scope12: curS12,
      scope3In: curS3,
      totalIn: round2(curS12 + curS3),
      sbtLinearTotal: round2(sbtS12Line + sbtS3Line),
      sbtLinearS12: sbtS12Line,
      sbtLinearS3: sbtS3Line
    };
  });

  const meetsS12 = s12Reduction + 1e-6 >= 4128.11 && s12Final - 1e-6 <= 2424.45;
  const meetsS3 = s3Reduction + 1e-6 >= 6283.73 && s3InFinal - 1e-6 <= 10472.88;
  const meetsTotal = totalReduction + 1e-6 >= 10411.84;

  return {
    scenario,
    excludeOutBoundary,
    scope1: { baseline: round2(s1Base), reduction: round2(s1TotalReduction), final2036: round2(s1Final) },
    scope2: { baseline: round2(s2Base), reduction: round2(s2TotalReduction), final2036: round2(s2Final) },
    scope12: {
      baseline: round2(s12Base),
      reduction: round2(s12Reduction),
      reductionPct: round2(s12ReductionPct),
      final2036: round2(s12Final),
      requiredReduction: 4128.11,
      maxAllowed2036: 2424.45,
      buffer: round2(s12Reduction - 4128.11),
      compliant: meetsS12
    },
    scope3: {
      reportedBaseline: 19835.40,
      inBoundaryBaseline: round2(s3InBase),
      outBoundaryBaseline: 3078.63,
      reduction: round2(s3Reduction),
      reductionPct: round2(s3ReductionPct),
      final2036: round2(s3InFinal),
      requiredReduction: 6283.73,
      maxAllowed2036: 10472.88,
      buffer: round2(s3Reduction - 6283.73),
      compliant: meetsS3
    },
    total: {
      inBoundaryBaseline: round2(totalInBoundaryBase),
      reduction: round2(totalReduction),
      reductionPct: round2((totalReduction / totalInBoundaryBase) * 100),
      final2036: round2(totalInBoundaryFinal),
      requiredReduction: 10411.84,
      maxAllowed2036: 12897.33,
      buffer: round2(totalReduction - 10411.84),
      doubleCountAvoided: round2(totalDoubleCountAvoided),
      compliant: meetsS12 && meetsS3 && meetsTotal
    },
    waterfall: [
      { label: 'Baseline 2025 (In-Boundary)', value: round2(totalInBoundaryBase), kind: 'absolute' },
      { label: 'Tahap 1: Efisiensi S1 & S2', value: -round2(s2EffReduction + s1WhReduction), kind: 'relative' },
      { label: 'Tahap 2: EBT S2 (Solar+REC)', value: -round2(s2SolarReduction + s2RecReduction), kind: 'relative' },
      { label: 'Tahap 3: Transisi S1 (Bio/HP/EV)', value: -round2(s1FuelSwitchReduction + s1MobReduction + s1FugReduction), kind: 'relative' },
      { label: 'Tahap 4: Hulu & Produk (Cat 1 & 10)', value: -round2(c1Reduction + c10Reduction), kind: 'relative' },
      { label: 'Tahap 5: Logistik & WTT (Cat 3,4,9,7)', value: -round2(c3Reduction + c4Reduction + c9Reduction + c5Reduction + c2Reduction + c7Reduction + c6Reduction), kind: 'relative' },
      { label: 'Emisi Residual 2036', value: round2(totalInBoundaryFinal), kind: 'total' }
    ],
    initiatives,
    trajectory
  };
}

/**
 * Computes Multi-Criteria Decision Analysis (MCDA) prioritization score (0-100)
 * based on the 8 criteria listed in CYC 2026 Section 8D.
 */
export function computeMcdaScore(init) {
  // Higher is better for all normalized 1..5 ratings:
  // impact (25%), feasibility/low-complexity (15%), trl (15%), reliability/low-risk (15%),
  // strategic (10%), scalability (10%), speed (10%)
  const c = init.criteria;
  if (!c) return 75;
  const weighted =
    c.impact * 0.25 +
    c.feasibility * 0.15 +
    c.trl * 0.15 +
    c.reliability * 0.15 +
    c.strategic * 0.10 +
    c.scalability * 0.10 +
    c.speed * 0.10;
  return round2(weighted * 20);
}

/**
 * Evaluates Governance & SBTi Implementation Gate readiness (saved per phase in browser).
 */
export function assessGovernanceGate(phaseId, entries) {
  const allVerified =
    Array.isArray(entries) &&
    entries.length === 4 &&
    entries.every(e => e.status === 'verified' && typeof e.evidence === 'string' && e.evidence.trim().length > 0);
  const anyFailed = Array.isArray(entries) && entries.some(e => e.status === 'failed');

  return {
    status: anyFailed ? 'hold' : allVerified ? 'ready' : 'pending',
    approvedCapexPct: anyFailed ? 0 : allVerified ? 100 : 35,
    message: anyFailed
      ? 'Tahan eskalasi modal (Hold). Terdapat risiko operasional atau kontrak pemasok yang belum terpenuhi; lakukan mitigasi terlebih dahulu.'
      : allVerified
      ? `Prasyarat tata kelola ${phaseId} lengkap untuk persetujuan Dewan Direksi PT XYZ. Audit MRV ISO 14064-1 siap dijalankan.`
      : 'Verifikasi tata kelola belum lengkap. Lanjutkan pengumpulan bukti baseline pemasok & audit teknis sebelum ekspansi penuh.'
  };
}

/**
 * Generates safe UTF-8 CSV string with formula-injection protection.
 */
export function csvText(rows) {
  if (!rows || !rows.length) return '';
  const keys = Object.keys(rows[0]);
  const quote = v => {
    let s = String(v ?? '');
    if (/^[=+@\t\r]/.test(s)) s = "'" + s;
    return '"' + s.replaceAll('"', '""') + '"';
  };
  return '\uFEFF' + [keys.map(quote).join(','), ...rows.map(r => keys.map(k => quote(r[k])).join(','))].join('\r\n');
}
