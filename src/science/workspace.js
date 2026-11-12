import { attachNagNavigation } from './nag-navigation.mjs';
import { attachTerrainControls } from './terrain-controls.mjs';
import { computeBaselineSummary, evaluatePathway, assessGovernanceGate, csvText } from './science.mjs';

const $ = (s, root = document) => root.querySelector(s);
const $$ = (s, root = document) => [...root.querySelectorAll(s)];
const fmt = (n, d = 2) =>
  n === null || n === undefined ? '—' : Number(n).toLocaleString('id-ID', { maximumFractionDigits: d });
const esc = s =>
  String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const pill = (s, t = 'green') => `<span class="pill ${t}">${s}</span>`;

let main;
let D, T, routeToken = 0, terrainControls = null, cameraBusy = false, pendingCamera = null, nagControls = null;

const state = {
  scenario: 'recommended',
  execScale: 100,
  reShare: 96.8,
  supplierAdoption: 100,
  excludeOut: true,
  scopeFilter: 'all',
  dssTab: 'waterfall',
  terrainExtent: 'local',
  ve: 1,
  opacity: 0.88,
  showThreshold: true,
  showTrajectories: true,
  showOptimalPoint: true,
  option: 'Fase 1–3 Terintegrasi',
  dataSet: 'sources',
  scopeSelect: 'all',
  phaseSelect: 'all',
  query: '',
  page: 0
};

// Official CYC 2026 Guidebook Color Palette (#204f49 deep teal-forest, #506e56 sage green, #868e69 olive-khaki, #45b680 SRE mint)
const palette = {
  green: '#204f49',
  sage: '#506e56',
  olive: '#868e69',
  mint: '#45b680',
  gold: '#9a7b38',
  ink: '#1a2f2b',
  gray: '#687873'
};

const config = {
  responsive: true,
  displaylogo: false,
  scrollZoom: false,
  showSendToCloud: false,
  modeBarButtonsToRemove: ['lasso2d', 'select2d', 'sendChartToCloud', 'autoScale2d'],
  toImageButtonOptions: { format: 'png', filename: 'CYC2026_PT_XYZ_SBTi_DSS', scale: 2 }
};

const baseLayout = {
  font: { family: 'Inter, Segoe UI, sans-serif', size: 11, color: '#2b423d' },
  paper_bgcolor: '#ffffff',
  plot_bgcolor: '#ffffff',
  margin: { l: 68, r: 30, t: 24, b: 58 },
  hoverlabel: { bgcolor: '#ffffff', font: { color: '#1a2f2b' } },
  legend: { orientation: 'h', y: -0.16, x: 0 },
  colorway: [palette.green, palette.sage, palette.olive, palette.mint, palette.gold, palette.gray]
};

function download(name, text, type = 'application/json') {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function plot(el, traces, layout, plotConfig = {}) {
  if (!el) return;
  el.querySelector('.plot-state')?.remove();
  return window.Plotly.react(el, traces, { ...baseLayout, ...layout }, { ...config, ...plotConfig }).catch(() => {
    el.innerHTML =
      '<div class="plot-state">Grafik belum berhasil ditampilkan. Buka tabel data atau coba muat ulang.</div>';
  });
}

function purge() {
  nagControls?.dispose();
  nagControls = null;
  terrainControls?.dispose();
  terrainControls = null;
  pendingCamera = null;
  for (const el of $$('.js-plotly-plot', main)) window.Plotly.purge(el);
}

function pageTitle(label, title, description, tag = '') {
  return `<div class="page-title"><div><div class="eyebrow">${label}</div><h1>${title}</h1><p>${description}</p></div>${tag}</div>`;
}

const sourceRef =
  '<p class="report-ref">Acuan: CYC 2026 Case Study Handbook (Hal. 15–22). Kalkulasi sekuensial bebas double-counting (Case Rule #4) & tanpa kompensasi offset (Case Rule #6).</p>';

function getActiveEvaluation() {
  return evaluatePathway(D, {
    scenario: state.scenario,
    execScale: state.execScale / 100,
    reShare: state.reShare / 100,
    supplierAdoption: state.supplierAdoption / 100,
    excludeOutBoundary: state.excludeOut
  });
}

function dss() {
  main.innerHTML = `<div class="wrap">${pageTitle(
    'Decision support system · CYC 2026',
    'Command Center Dekarbonisasi SBTi 2036',
    'Simulasikan urutan intervensi Scope 1, Scope 2, dan Scope 3 PT XYZ secara interaktif tanpa hitung ganda (anti-double-counting).',
    pill('SBTi 2036 Validated')
  )}
  <div class="workspace">
    <aside class="panel sidebar">
      <h2>Parameter Strategi PT XYZ</h2>
      <div class="control">
        <label for="scenario">Preset Skenario Dewan Direksi</label>
        <select id="scenario">
          ${Object.values(D.scenarios)
            .map(s => `<option value="${s.id}" ${s.id === state.scenario ? 'selected' : ''}>${s.name}</option>`)
            .join('')}
        </select>
      </div>
      <div class="control">
        <label for="exec-scale">Intensitas Eksekusi Operasional (S1+S2): <span id="exec-val">${state.execScale}%</span></label>
        <input type="range" id="exec-scale" min="60" max="120" step="5" value="${state.execScale}">
        <p id="exec-note">Mengatur capaian efisiensi WHR boiler, Smart EMS/VFD, dan transisi bahan bakar.</p>
      </div>
      <div class="control">
        <label for="re-share">Bauran Listrik Terbarukan S2 (Pasca-Efisiensi): <span id="re-val">${fmt(state.reShare, 1)}%</span></label>
        <input type="range" id="re-share" min="40" max="100" step="1" value="${state.reShare}">
        <p>Diterapkan hanya pada sisa beban listrik pasca-efisiensi (mencegah double counting).</p>
      </div>
      <div class="control">
        <label for="sup-scale">Tingkat Adopsi Rantai Nilai Scope 3: <span id="sup-val">${state.supplierAdoption}%</span></label>
        <input type="range" id="sup-scale" min="50" max="120" step="5" value="${state.supplierAdoption}">
        <p>Kepatuhan pemasok Cat 1, adopsi produk rendah suhu Cat 10, dan modal shift logistik.</p>
      </div>
      <div class="control wide">
        <label class="check-row">
          <input type="checkbox" id="exclude-out" ${state.excludeOut ? 'checked' : ''}>
          <span>Keluarkan Cat 8 (527,57 t) &amp; Cat 12 (2.551,06 t) sesuai batas SBTi 84%</span>
        </label>
        <p>Handbook Hal. 16–17 menetapkan Cat 8 &amp; Cat 12 di luar batas target SBTi.</p>
      </div>
      <hr>
      <div class="control">
        <label for="scope-filter">Filter Tampilan Hotspot</label>
        <select id="scope-filter">
          <option value="all">Semua Scope (1, 2 &amp; 3)</option>
          <option value="Scope 1">Scope 1 (Direct Emissions)</option>
          <option value="Scope 2">Scope 2 (Purchased Electricity)</option>
          <option value="Scope 3">Scope 3 (Value Chain)</option>
        </select>
      </div>
      <div class="notice wide">
        <strong>Aturan Anti-Double-Counting:</strong> Efisiensi listrik (-18%) dan WHR boiler (-16,85%) dipotong terlebih dahulu sebelum pengadaan PLTS/I-REC dan co-firing biomassa dihitung.
      </div>
      <a class="button wide" href="data/decarbonization_initiatives_2036.csv" download>Unduh Tabel 13 Inisiatif (CSV)</a>
    </aside>
    <div class="content-stack">
      <section class="panel pad" id="target-summary" aria-live="polite"></section>
      <section class="panel">
        <div class="tabbar" role="tablist" aria-label="Tampilan analisis strategi">
          <button role="tab" data-tab="waterfall">Waterfall &amp; Lintasan 2036</button>
          <button role="tab" data-tab="hotspot">Hotspot &amp; Materialitas</button>
          <button role="tab" data-tab="compare">Portofolio 13 Inisiatif</button>
          <button role="tab" data-tab="gate">Tata Kelola &amp; KPI Direksi</button>
        </div>
        <div id="dss-content"></div>
      </section>
    </div>
  </div></div>`;

  $('#scope-filter').value = state.scopeFilter;
  $('#scenario').onchange = e => {
    state.scenario = e.target.value;
    const preset = D.scenarios[state.scenario];
    state.execScale = Math.round(preset.opsMultiplier * 100);
    state.reShare = Math.round(preset.reShare * 1000) / 10;
    state.supplierAdoption = Math.round(preset.supplierAdoption * 100);
    $('#exec-scale').value = state.execScale;
    $('#re-share').value = state.reShare;
    $('#sup-scale').value = state.supplierAdoption;
    $('#exec-val').textContent = state.execScale + '%';
    $('#re-val').textContent = fmt(state.reShare, 1) + '%';
    $('#sup-val').textContent = state.supplierAdoption + '%';
    updateDss();
  };
  $('#exec-scale').oninput = e => {
    state.execScale = Number(e.target.value);
    $('#exec-val').textContent = state.execScale + '%';
    updateDss();
  };
  $('#re-share').oninput = e => {
    state.reShare = Number(e.target.value);
    $('#re-val').textContent = fmt(state.reShare, 1) + '%';
    updateDss();
  };
  $('#sup-scale').oninput = e => {
    state.supplierAdoption = Number(e.target.value);
    $('#sup-val').textContent = state.supplierAdoption + '%';
    updateDss();
  };
  $('#exclude-out').onchange = e => {
    state.excludeOut = e.target.checked;
    updateDss();
  };
  $('#scope-filter').onchange = e => {
    state.scopeFilter = e.target.value;
    updateDssContent();
  };

  $$('[data-tab]', main).forEach((b, i, buttons) => {
    b.onclick = () => {
      state.dssTab = b.dataset.tab;
      updateDssContent();
    };
    b.onkeydown = e => {
      if (['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(e.key)) {
        e.preventDefault();
        const n =
          e.key === 'Home'
            ? 0
            : e.key === 'End'
            ? buttons.length - 1
            : (i + (e.key === 'ArrowRight' ? 1 : -1) + buttons.length) % buttons.length;
        buttons[n].focus();
        buttons[n].click();
      }
    };
  });
  updateDss();
}

function updateDss() {
  const ev = getActiveEvaluation();
  const preset = D.scenarios[state.scenario];
  const badgeText = ev.total.compliant ? 'LULUS TARGET SBTi 2036' : 'PERLU AKSELERASI';
  const badgeClass = ev.total.compliant ? 'green' : 'amber';

  $('#target-summary').innerHTML = `
    <div class="target-top">
      <span class="target-badge">${ev.total.reductionPct}%</span>
      <div>
        <h2>${preset.name} ${pill(badgeText, badgeClass)}</h2>
        <p>${preset.phaseFocus} · Eksekusi S1+S2 ${state.execScale}% · EBT S2 ${fmt(state.reShare, 1)}% · Adopsi Scope 3 ${state.supplierAdoption}%</p>
      </div>
    </div>
    <div class="mini-stats">
      <div class="mini-stat">
        <b>-${fmt(ev.scope12.reduction, 2)} t</b>
        <span>Reduksi S1+S2 (${fmt(ev.scope12.reductionPct, 1)}% vs wajib ≥63% / 4.128,11 t)</span>
      </div>
      <div class="mini-stat">
        <b>-${fmt(ev.scope3.reduction, 2)} t</b>
        <span>Reduksi S3 In-Boundary (${fmt(ev.scope3.reductionPct, 1)}% vs wajib ≥37,5% / 6.283,73 t)</span>
      </div>
      <div class="mini-stat">
        <b>-${fmt(ev.total.reduction, 2)} t</b>
        <span>Total Reduksi 2036 (Target wajib ≥10.411,84 tCO₂e)</span>
      </div>
      <div class="mini-stat">
        <b>${ev.total.buffer >= 0 ? '+' : ''}${fmt(ev.total.buffer, 2)} t</b>
        <span>Margin Kepatuhan SBTi · Bebas Double-Count ${fmt(ev.total.doubleCountAvoided, 2)} t</span>
      </div>
    </div>
    <div class="two-col">
      <div>
        <h3>Rasional Strategis &amp; Sekuensing</h3>
        <p>${preset.description}</p>
      </div>
      <div>
        <h3>Kepatuhan Batas Emisi Maksimum 2036</h3>
        <p>Emisi akhir Scope 1+2 mencapai <strong>${fmt(ev.scope12.final2036, 2)} tCO₂e</strong> (batas maks ≤2.424,45 tCO₂e) dan Scope 3 In-Boundary mencapai <strong>${fmt(ev.scope3.final2036, 2)} tCO₂e</strong> (batas maks ≤10.472,88 tCO₂e).</p>
      </div>
    </div>
    <p class="report-ref">Baseline 2025 Terlapor: 26.387,96 tCO₂e · Baseline Dalam Batas Target SBTi: 23.309,33 tCO₂e · Emisi Residual 2036: ${fmt(ev.total.final2036, 2)} tCO₂e.</p>
  `;
  updateDssContent();
}

function updateDssContent() {
  const root = $('#dss-content');
  for (const el of $$('.js-plotly-plot', root)) window.Plotly.purge(el);
  $$('[data-tab]', main).forEach(b => b.setAttribute('aria-selected', b.dataset.tab === state.dssTab));
  const ev = getActiveEvaluation();

  if (state.dssTab === 'waterfall') {
    root.innerHTML = `
      <div class="panel-head">
        <h3>Dekarbonisasi Sekuensial Tahap 1–5 (Anti-Double-Counting Waterfall)</h3>
        <span class="small muted">Menghindari hitung ganda sebesar ${fmt(ev.total.doubleCountAvoided, 2)} tCO₂e</span>
      </div>
      <div id="waterfall-chart" class="chart" aria-label="Grafik Waterfall Dekarbonisasi Sekuensial"></div>
      <p class="chart-caption">Garis merah putus-putus menandai plafon maksimum emisi SBTi 2036 (12.897,33 tCO₂e gabungan Scope 1+2 dan Scope 3 In-Boundary). Tahap 1 (Efisiensi) dipotong lebih dulu sebelum Tahap 2 (EBT) dan Tahap 3 (Biomassa/Heat Pump).</p>
      <div class="panel pad" style="border-top:1px solid var(--line)">
        <h3>Lintasan Penurunan Emisi Tahunan PT XYZ (2025–2036) vs Garis Target SBTi</h3>
        <div id="trajectory-chart" class="chart short"></div>
        <p class="chart-caption">Fase 1 (2027–2028): Foundation &amp; Quick Wins · Fase 2 (2029–2033): Scale &amp; Value-Chain Transformation · Fase 3 (2034–2036): Target Delivery &amp; Lock-In.</p>
        ${sourceRef}
      </div>
    `;
    renderWaterfallChart($('#waterfall-chart'), ev);
    renderTrajectoryChart($('#trajectory-chart'), ev);
  } else if (state.dssTab === 'hotspot') {
    root.innerHTML = `
      <div class="panel-head">
        <h3>Pemetaan Hotspot Baseline 2025 vs Emisi Residual 2036 per Sumber</h3>
        <span class="small muted">${state.excludeOut ? 'Menampilkan sumber dalam batas target SBTi (84% Scope 3)' : 'Menampilkan seluruh 16 sumber termasuk Cat 8 & Cat 12'}</span>
      </div>
      <div id="hotspot-chart" class="chart" aria-label="Grafik Hotspot Emisi PT XYZ"></div>
      <p class="chart-caption">Empat hotspot utama — S3 Cat 1 (6.098,98 t), S3 Cat 10 (4.745,86 t), S1 Stationary Combustion (3.907,92 t), dan S3 Cat 9 (2.532,03 t) — menyumbang 74,0% dari seluruh emisi dalam batas target SBTi.</p>
    `;
    renderHotspotChart($('#hotspot-chart'), ev);
  } else if (state.dssTab === 'compare') {
    root.innerHTML = `
      <div class="panel-head">
        <h3>Kuantifikasi 13 Inisiatif Dekarbonisasi &amp; Skor Prioritas MCDA</h3>
        <span class="small muted">Klik nama skenario di sidebar untuk menguji sensitivitas</span>
      </div>
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Kode</th>
              <th>Inisiatif Dekarbonisasi</th>
              <th>Scope</th>
              <th>Fase Roadmap</th>
              <th>Urutan Kalkulasi</th>
              <th class="num">Baseline Terdampak (t)</th>
              <th class="num">Reduksi Aktual (tCO₂e)</th>
              <th class="num">Porsi Target (%)</th>
              <th class="num">MACC ($/t)</th>
              <th class="num">Skor MCDA</th>
            </tr>
          </thead>
          <tbody>
            ${ev.initiatives
              .map(
                init => `<tr>
              <td class="mono"><strong>${esc(init.code)}</strong></td>
              <td>${esc(init.name)}</td>
              <td>${esc(init.scope)}</td>
              <td>${esc(init.phase)}</td>
              <td>${esc(init.sequenceStep)}</td>
              <td class="num">${fmt(init.baselineAffected, 2)}</td>
              <td class="num"><strong>-${fmt(init.abated, 2)}</strong></td>
              <td class="num">${fmt(init.shareOfTargetPct, 1)}%</td>
              <td class="num">${fmt(init.maccUsdPerTon, 1)}</td>
              <td class="num"><strong>${fmt(init.mcdaScore, 1)}</strong></td>
            </tr>`
              )
              .join('')}
          </tbody>
        </table>
      </div>
      <div class="panel pad" style="border:0">
        <h3>Kurva Biaya Abatement Marginal (MACC) vs Volume Reduksi Emisi</h3>
        <div id="macc-chart" class="chart short"></div>
        <p class="chart-caption">Inisiatif di bawah $0/tCO₂e (OP-02 Smart EMS, OP-01 Boiler WHR, RE-01 Rooftop Solar PPA, CE-01 Scrap Loop) menghasilkan penghematan OPEX bersih yang mendanai transformasi Scope 3.</p>
        ${sourceRef}
      </div>
    `;
    renderMaccChart($('#macc-chart'), ev);
  } else {
    renderGate();
  }
}

function renderWaterfallChart(el, ev) {
  const wf = ev.waterfall;
  plot(
    el,
    [
      {
        type: 'waterfall',
        orientation: 'v',
        measure: wf.map(w => w.kind),
        x: wf.map(w => w.label),
        y: wf.map(w => w.value),
        text: wf.map(w => (w.value > 0 && w.kind !== 'relative' ? fmt(w.value, 0) : fmt(w.value, 0))),
        textposition: 'outside',
        connector: { line: { color: '#868e69', width: 1.5, dash: 'dot' } },
        decreasing: { marker: { color: palette.green } },
        increasing: { marker: { color: palette.gold } },
        totals: { marker: { color: palette.sage } },
        hovertemplate: '%{x}<br>%{y:,.2f} tCO₂e<extra></extra>'
      }
    ],
    {
      yaxis: { title: { text: 'Emisi GRK (tCO₂e)' }, range: [0, 26500], gridcolor: '#e8eee9' },
      xaxis: { tickangle: -14 },
      shapes: [
        {
          type: 'line',
          xref: 'paper',
          x0: 0,
          x1: 1,
          y0: 12897.33,
          y1: 12897.33,
          line: { color: '#b91c1c', width: 2, dash: 'dash' }
        }
      ],
      annotations: [
        {
          xref: 'paper',
          x: 0.98,
          y: 13550,
          text: 'Plafon Maksimum SBTi 2036: 12.897,33 tCO₂e',
          showarrow: false,
          font: { size: 11, color: '#b91c1c' },
          bgcolor: '#fef2f2'
        }
      ],
      margin: { l: 72, r: 28, t: 28, b: 95 }
    }
  );
}

function renderTrajectoryChart(el, ev) {
  const tr = ev.trajectory;
  plot(
    el,
    [
      {
        type: 'scatter',
        mode: 'lines+markers',
        name: 'Proyeksi Total In-Boundary PT XYZ',
        x: tr.map(r => r.year),
        y: tr.map(r => r.totalIn),
        line: { color: palette.green, width: 3 },
        marker: { size: 7 }
      },
      {
        type: 'scatter',
        mode: 'lines',
        name: 'Garis Trajektori Linear SBTi 2036',
        x: tr.map(r => r.year),
        y: tr.map(r => r.sbtLinearTotal),
        line: { color: '#b91c1c', width: 2, dash: 'dash' }
      },
      {
        type: 'scatter',
        mode: 'lines+markers',
        name: 'Scope 3 In-Boundary (Target ≤10.472,88 t)',
        x: tr.map(r => r.year),
        y: tr.map(r => r.scope3In),
        line: { color: palette.sage, width: 2.2 },
        marker: { size: 6, symbol: 'square' }
      },
      {
        type: 'scatter',
        mode: 'lines+markers',
        name: 'Scope 1 + 2 (Target ≤2.424,45 t)',
        x: tr.map(r => r.year),
        y: tr.map(r => r.scope12),
        line: { color: palette.olive, width: 2.2 },
        marker: { size: 6, symbol: 'diamond' }
      }
    ],
    {
      xaxis: { title: { text: 'Tahun Peta Jalan' }, dtick: 1 },
      yaxis: { title: { text: 'Emisi Tahunan (tCO₂e)' }, rangemode: 'tozero', gridcolor: '#e8eee9' },
      margin: { l: 72, r: 28, t: 20, b: 68 }
    }
  );
}

function renderHotspotChart(el) {
  const filtered = D.sources
    .filter(s => (state.excludeOut ? s.inBoundary : true))
    .filter(s => state.scopeFilter === 'all' || s.scope === state.scopeFilter)
    .sort((a, b) => a.emissions - b.emissions);

  plot(
    el,
    [
      {
        type: 'bar',
        orientation: 'h',
        name: 'Baseline 2025 (tCO₂e)',
        y: filtered.map(s => `${s.id} · ${s.category}`),
        x: filtered.map(s => s.emissions),
        marker: {
          color: filtered.map(s =>
            !s.inBoundary
              ? '#94a3b8'
              : s.scope === 'Scope 1'
              ? palette.green
              : s.scope === 'Scope 2'
              ? palette.mint
              : palette.sage
          )
        },
        text: filtered.map(s => `${fmt(s.emissions, 2)} t (${fmt(s.shareTotalPct, 1)}%)`),
        textposition: 'auto',
        hovertemplate: '%{y}<br>Baseline 2025: %{x:,.2f} tCO₂e<extra></extra>'
      }
    ],
    {
      xaxis: { title: { text: 'Emisi Baseline 2025 (tCO₂e)' }, gridcolor: '#e8eee9' },
      yaxis: { automargin: true },
      margin: { l: 210, r: 40, t: 24, b: 60 }
    }
  );
}

function renderMaccChart(el, ev) {
  const sorted = [...ev.initiatives].sort((a, b) => a.maccUsdPerTon - b.maccUsdPerTon);
  plot(
    el,
    [
      {
        type: 'bar',
        x: sorted.map(i => `${i.code} (${fmt(i.abated, 0)}t)`),
        y: sorted.map(i => i.maccUsdPerTon),
        marker: {
          color: sorted.map(i => (i.maccUsdPerTon < 0 ? palette.mint : i.maccUsdPerTon <= 15 ? palette.sage : palette.green))
        },
        text: sorted.map(i => `$${fmt(i.maccUsdPerTon, 1)}/t`),
        textposition: 'outside',
        hovertemplate: '%{x}<br>Biaya MACC: USD %{y:.1f} / tCO₂e<extra></extra>'
      }
    ],
    {
      xaxis: { title: { text: 'Kode Inisiatif & Volume Reduksi (tCO₂e)' }, tickangle: -20 },
      yaxis: { title: { text: 'Biaya Abatement (USD / tCO₂e)' }, range: [-32, 32], zeroline: true, zerolinecolor: '#204f49' },
      shapes: [
        {
          type: 'line',
          xref: 'paper',
          x0: 0,
          x1: 1,
          y0: 28,
          y1: 28,
          line: { color: palette.gold, width: 2, dash: 'dot' }
        }
      ],
      annotations: [
        {
          xref: 'paper',
          x: 0.02,
          y: 29.5,
          text: 'Shadow Carbon Price Internal PT XYZ: USD 28/tCO₂e (Seluruh 13 inisiatif layak secara ekonomi)',
          showarrow: false,
          font: { size: 10.5, color: palette.gold }
        }
      ],
      margin: { l: 68, r: 28, t: 28, b: 85 }
    }
  );
}

const gateLabels = [
  'Baseline energi S1/S2 & faktor emisi primer pemasok Top-20 Cat 1 terverifikasi (ISO 14064-1)',
  'Urutan efisiensi (WHR & Smart EMS) dikunci sebelum kontrak EBT/biomassa (Anti-Double-Counting)',
  'Klausul SLA pengadaan rendah karbon & uji reliabilitas produk suhu rendah Cat 10 disetujui',
  'Persetujuan CAPEX berbasis Shadow Carbon Price ($28/tCO₂e) & dasbor pemantauan KPI triwulanan aktif'
];

function loadGate() {
  try {
    return JSON.parse(localStorage.getItem('cyc2026-dss-gates-v1') || '{}');
  } catch {
    return {};
  }
}

function entriesFor(id) {
  const g = loadGate()[id];
  return Array.from({ length: 4 }, (_, i) => ({
    status: ['unknown', 'verified', 'failed'].includes(g?.[i]?.status) ? g[i].status : 'unknown',
    evidence: typeof g?.[i]?.evidence === 'string' ? g[i].evidence : ''
  }));
}

function renderGate() {
  const preset = D.scenarios[state.scenario];
  const entries = entriesFor(preset.id);
  const root = $('#dss-content');
  root.innerHTML = `
    <div class="panel pad" style="border:0">
      <h3>Tata Kelola Stage-Gate &amp; Kerangka KPI — ${preset.name}</h3>
      <p class="small muted">Catatan tata kelola disimpan lokal di browser. Memenuhi kriteria penilaian CYC 2026: Risk, Governance &amp; KPI Framework (5%) serta Feasibility &amp; Roadmap (20%).</p>
      <div class="gate-list">
        ${gateLabels
          .map(
            (label, i) => `
          <div class="gate-item">
            <label for="gate-${i}">${i + 1}. ${label}</label>
            <select id="gate-${i}" data-gate="${i}">
              <option value="unknown">Dalam peninjauan komite</option>
              <option value="verified">Bukti &amp; KPI terverifikasi</option>
              <option value="failed">Risiko belum termitigasi (Hold)</option>
            </select>
            <label class="sr-only" for="evidence-${i}">Rujukan dokumen KPI ${i + 1}</label>
            <input id="evidence-${i}" data-evidence="${i}" value="${esc(entries[i].evidence)}" placeholder="Contoh: Kontrak PPA PLTS No. 04/2027, Audit ISO 14064-1, atau SLA Pemasok Tier-1" maxlength="500">
          </div>`
          )
          .join('')}
      </div>
      <div id="gate-result" class="gate-result" role="status"></div>
      <div class="two-col">
        <div>
          <h3>Aturan Tata Kelola Dewan Direksi</h3>
          <p>${preset.gateRule}</p>
        </div>
        <div>
          <h3>Pemicu Kontingensi &amp; Mitigasi Risiko</h3>
          <p>${preset.stopCondition}</p>
        </div>
      </div>
      <div class="actions" style="margin-top:22px">
        <button class="primary" id="export-gate">Ekspor Paket Tata Kelola (JSON)</button>
        <button id="reset-gate">Reset Catatan Skenario Ini</button>
      </div>
      <p id="save-status" class="status-line">Disimpan lokal per skenario. Tidak mengubah dataset baseline resmi CYC 2026.</p>
    </div>
  `;
  entries.forEach((v, i) => ($(`#gate-${i}`).value = v.status));
  const gather = () =>
    gateLabels.map((label, i) => ({
      label,
      status: $(`#gate-${i}`).value,
      evidence: $(`#evidence-${i}`).value
    }));
  const update = () => {
    const es = gather();
    const r = assessGovernanceGate(preset.name, es);
    $('#gate-result').classList.toggle('review', r.status === 'ready');
    $('#gate-result').innerHTML = `<strong>${r.message}</strong><br>Pencairan CAPEX Tahap Berjalan: ${r.approvedCapexPct}% dari alokasi anggaran dekarbonisasi.`;
    try {
      const g = loadGate();
      g[preset.id] = es;
      localStorage.setItem('cyc2026-dss-gates-v1', JSON.stringify(g));
    } catch {
      $('#save-status').textContent = 'Penyimpanan lokal tidak tersedia. Ekspor catatan sebelum meninggalkan halaman.';
    }
  };
  $$('[data-gate],[data-evidence]', root).forEach(el => el.addEventListener('input', update));
  update();
  $('#export-gate').onclick = () =>
    download(
      `CYC2026_Governance_${preset.id}.json`,
      JSON.stringify(
        {
          scenario: preset.id,
          report: D.report,
          created: new Date().toISOString(),
          entries: gather(),
          assessment: assessGovernanceGate(preset.name, gather())
        },
        null,
        2
      )
    );
  $('#reset-gate').onclick = () => {
    try {
      const g = loadGate();
      delete g[preset.id];
      localStorage.setItem('cyc2026-dss-gates-v1', JSON.stringify(g));
    } catch {}
    renderGate();
  };
}

async function loadTerrain() {
  if (T) return T;
  const r = await fetch('data/terrain.json');
  if (!r.ok) throw new Error('terrain');
  T = await r.json();
  return T;
}

function terrain() {
  const token = routeToken;
  main.innerHTML = `<div class="wrap">${pageTitle(
    'Pemodelan permukaan respons 3D',
    '3D Abatement & Trade-off Landscape',
    'Eksplorasi permukaan respons tiga dimensi yang memetakan interaksi antara intensitas eksekusi operasional (Scope 1+2) dan transformasi rantai nilai (Scope 3) terhadap target SBTi 2036.',
    pill('VE awal 1×')
  )}
  <div class="workspace">
    <aside class="panel sidebar">
      <h2>Kontrol Lanskap 3D</h2>
      <div class="control">
        <label for="extent">Mode Permukaan 3D</label>
        <select id="extent">
          <option value="local">Total Reduksi Emisi 2036 (tCO₂e)</option>
          <option value="regional">Surplus / Defisit terhadap Target SBTi</option>
        </select>
      </div>
      <div class="control">
        <label for="ve">Perbesaran Vertikal <span id="ve-value">${state.ve}×</span></label>
        <input type="range" id="ve" min="1" max="3" step=".5" value="${state.ve}">
        <p>Mengatur skala tinggi permukaan Z terhadap bidang eksekusi X–Y.</p>
      </div>
      <div class="control">
        <label for="opacity">Opasitas Permukaan</label>
        <input type="range" id="opacity" min=".25" max="1" step=".05" value="${state.opacity}">
      </div>
      <div class="control wide">
        <label class="check-row">
          <input type="checkbox" id="show-threshold" ${state.showThreshold ? 'checked' : ''}>
          <span>Garis Kontur Ambang Kepatuhan SBTi (10.411,84 tCO₂e)</span>
        </label>
        <label class="check-row">
          <input type="checkbox" id="show-trajectories" ${state.showTrajectories ? 'checked' : ''}>
          <span>Lintasan 13 Inisiatif pada Ruang 3D</span>
        </label>
        <label class="check-row">
          <input type="checkbox" id="show-optimal" ${state.showOptimalPoint ? 'checked' : ''}>
          <span>Titik Skenario Rekomendasi PT XYZ (100%, 100%)</span>
        </label>
      </div>
      <button id="reset-camera" class="wide">Reset kamera 3D</button>
      <div class="notice wide">
        Permukaan 3D dihitung dengan model sekuensial anti-double-counting pada grid 25 × 25 kombinasi eksekusi operasional vs adopsi pemasok Scope 3.
      </div>
    </aside>
    <div class="content-stack">
      <section class="panel">
        <div class="panel-head">
          <h2 id="terrain-label">Memuat lanskap 3D…</h2>
          <span id="terrain-badge" class="pill">tCO₂e · 2036</span>
        </div>
        <div class="camera-toolbar" role="group" aria-label="Kontrol kamera">
          <button id="mode-orbit" aria-pressed="true">Putar</button>
          <button id="mode-pan" aria-pressed="false">Geser</button>
          <button id="zoom-in" aria-label="Perbesar tampilan">＋</button>
          <button id="zoom-out" aria-label="Perkecil tampilan">−</button>
          <span id="camera-status" class="small muted">Kamera stabil · tanpa rotasi otomatis</span>
        </div>
        <div id="terrain-chart" class="chart tall">
          <div class="plot-state">Menyiapkan permukaan respons 3D…</div>
        </div>
        <div class="legend-note">
          <span>Permukaan Abatement SBTi</span>
          <span class="gold">Ambang Target 10.411,84 tCO₂e</span>
          <span class="blue">Titik Rekomendasi PT XYZ (11.718,12 tCO₂e)</span>
        </div>
        <p class="chart-caption" id="terrain-caption"></p>
      </section>
      <section class="panel pad">
        <h3>Interpretasi Lanskap Respons 3D bagi Dewan Direksi</h3>
        <div id="terrain-provenance" class="small muted"></div>
        <p class="report-ref">Drag kiri untuk putar, drag kanan untuk geser, scroll untuk zoom. Kamera berhenti stabil saat drag dilepas.</p>
        <div class="actions">
          <a class="button" href="#dss">Kembali ke Command Center</a>
          <a class="button" href="data/provenance.json" download>Manifest Provenance</a>
          <a class="button" href="data/decarbonization_initiatives_2036.csv" download>Unduh Data Inisiatif</a>
        </div>
      </section>
    </div>
  </div></div>`;

  $('#extent').value = state.terrainExtent;
  $('#extent').onchange = e => {
    state.terrainExtent = e.target.value;
    renderTerrain(true);
  };
  $('#ve').oninput = e => {
    state.ve = Number(e.target.value);
    $('#ve-value').textContent = state.ve + '×';
    renderTerrain();
  };
  $('#opacity').onchange = e => {
    state.opacity = Number(e.target.value);
    renderTerrain();
  };
  for (const [id, key] of [
    ['show-threshold', 'showThreshold'],
    ['show-trajectories', 'showTrajectories'],
    ['show-optimal', 'showOptimalPoint']
  ]) {
    $('#' + id).onchange = e => {
      state[key] = e.target.checked;
      renderTerrain();
    };
  }
  $('#reset-camera').onclick = () => terrainControls?.reset();
  for (const mode of ['orbit', 'pan']) {
    $('#mode-' + mode).onclick = () => {
      terrainControls?.mode(mode);
      for (const m of ['orbit', 'pan']) $('#mode-' + m).setAttribute('aria-pressed', String(m === mode));
    };
  }
  $('#zoom-in').onclick = () => terrainControls?.zoom(0.85);
  $('#zoom-out').onclick = () => terrainControls?.zoom(1 / 0.85);

  loadTerrain()
    .then(() => {
      if (token === routeToken) renderTerrain(true);
    })
    .catch(() => {
      if (token === routeToken) {
        $('#terrain-label').textContent = 'Lanskap 3D belum tersedia';
        $('#terrain-chart').innerHTML =
          '<div class="plot-state">Data 3D belum berhasil dimuat. <a href="#dss">Buka Command Center 2D</a>.</div>';
      }
    });
}

async function flushCamera() {
  if (cameraBusy) return;
  cameraBusy = true;
  try {
    while (pendingCamera) {
      const { chart, cam } = pendingCamera;
      pendingCamera = null;
      if (chart.isConnected) await window.Plotly.relayout(chart, { 'scene.camera': cam });
    }
  } finally {
    cameraBusy = false;
  }
}

function camera() {
  const k = innerWidth < 767 ? 1.65 : 1.05;
  return { eye: { x: -1.35 * k, y: -1.35 * k, z: 1.15 * k }, up: { x: 0, y: 0, z: 1 }, center: { x: 0, y: 0, z: 0 } };
}

function renderTerrain(reset = false) {
  if (!T || !$('#terrain-chart')) return;
  const g = T[state.terrainExtent];
  const isMargin = state.terrainExtent === 'regional';
  const targetVal = isMargin ? 0 : 10411.84;
  const recVal = isMargin ? 1306.28 : 11718.12;

  const traces = [
    {
      type: 'surface',
      x: g.x,
      y: g.y,
      z: g.z,
      name: g.label,
      colorscale: [
        [0, '#d8ddcc'],
        [0.3, '#868e69'],
        [0.6, '#506e56'],
        [0.85, '#204f49'],
        [1, '#45b680']
      ],
      opacity: state.opacity,
      showscale: true,
      colorbar: { title: { text: isMargin ? 'Margin SBTi (t)' : 'Reduksi (tCO₂e)' }, thickness: 12, len: 0.68 },
      lighting: { ambient: 0.7, diffuse: 0.78, roughness: 0.8, specular: 0.12 },
      hovertemplate:
        'Eksekusi S1+S2: %{x:.1f}%<br>Adopsi Scope 3: %{y:.1f}%<br>' +
        (isMargin ? 'Margin vs SBTi: %{z:,.1f} tCO₂e' : 'Total Reduksi: %{z:,.1f} tCO₂e') +
        '<extra>' +
        g.label +
        '</extra>'
    }
  ];

  if (state.showThreshold) {
    traces.push({
      type: 'scatter3d',
      mode: 'lines',
      x: [40, 120, 120, 40, 40],
      y: [40, 40, 120, 120, 40],
      z: [targetVal, targetVal, targetVal, targetVal, targetVal],
      line: { color: '#b91c1c', width: 5, dash: 'dash' },
      name: 'Ambang Wajib SBTi (10.411,84 tCO₂e)',
      showlegend: false,
      hovertemplate: 'Ambang Minimum SBTi 2036: 10.411,84 tCO₂e<extra></extra>'
    });
  }

  if (state.showOptimalPoint) {
    traces.push({
      type: 'scatter3d',
      mode: 'markers+text',
      x: [100, 112, 95],
      y: [100, 115, 65],
      z: isMargin ? [1306.28, 2540.5, -1380.2] : [11718.12, 12952.34, 9031.64],
      text: ['Rekomendasi PT XYZ (11.718 t)', 'Accelerated (12.952 t)', 'Quick Wins Only (9.032 t)'],
      textposition: 'top center',
      marker: { size: [8, 6, 6], color: ['#45b680', '#204f49', '#b91c1c'], symbol: 'diamond' },
      showlegend: false,
      hovertemplate: '%{text}<br>S1+S2: %{x}% · Scope 3: %{y}%<br>Z: %{z:,.1f} tCO₂e<extra></extra>'
    });
  }

  if (state.showTrajectories) {
    const pathX = [45, 65, 82, 92, 100];
    const pathY = [45, 58, 76, 90, 100];
    const pathZ = isMargin ? [-4200, -2150, -320, 680, recVal] : [6211, 8261, 10091, 11091, recVal];
    traces.push({
      type: 'scatter3d',
      mode: 'lines+markers',
      x: pathX,
      y: pathY,
      z: pathZ,
      line: { color: '#eab308', width: 6 },
      marker: { size: 4, color: '#eab308' },
      name: 'Lintasan Pertumbuhan Fase 1 → Fase 3',
      showlegend: false,
      hovertemplate: 'Lintasan Peta Jalan 2027–2036<br>S1+S2 %{x}% · S3 %{y}% · %{z:,.0f} tCO₂e<extra></extra>'
    });
  }

  const scene = {
    xaxis: { title: { text: 'Eksekusi S1+S2 (%)' }, range: [40, 120], backgroundcolor: '#f6f8f5', gridcolor: '#dce3d8' },
    yaxis: { title: { text: 'Adopsi Scope 3 (%)' }, range: [40, 120], backgroundcolor: '#f6f8f5', gridcolor: '#dce3d8' },
    zaxis: {
      title: { text: isMargin ? 'Margin SBTi (tCO₂e)' : 'Total Reduksi (tCO₂e)' },
      range: [g.min - 300, g.max + 500],
      gridcolor: '#dce3d8'
    },
    aspectmode: 'manual',
    aspectratio: { x: 1, y: 1, z: 0.72 * state.ve },
    dragmode: false,
    uirevision: state.terrainExtent,
    camera: terrainControls?.snapshot() ?? camera()
  };

  if (reset) {
    terrainControls?.dispose();
    terrainControls = null;
    scene.camera = camera();
    $('#camera-status').textContent = 'Kamera stabil · tanpa rotasi otomatis';
  }

  const chart = $('#terrain-chart');
  plot(
    chart,
    traces,
    { scene, margin: { l: 0, r: 15, t: 0, b: 0 }, uirevision: state.terrainExtent },
    { displayModeBar: false, scrollZoom: false }
  ).then(() => {
    if (!chart.isConnected || terrainControls) return;
    terrainControls = attachTerrainControls(chart, scene.camera, (cam, info) => {
      pendingCamera = { chart, cam };
      $('#camera-status').textContent = `Sudut ${info.elevation.toFixed(0)}° · kamera stabil`;
      flushCamera();
    });
    terrainControls.mode($('#mode-pan').getAttribute('aria-pressed') === 'true' ? 'pan' : 'orbit');
  });

  $('#terrain-label').textContent = g.label;
  $('#terrain-badge').textContent = 'VE ' + state.ve + '×';
  $('#terrain-caption').textContent = `${g.spacing}. ${T.resolutionNote}`;
  $('#terrain-provenance').innerHTML = `<p><strong>${T.label}</strong> · ${T.datum}</p><p>${T.status}</p><p>${T.collarComparison}</p>`;
}

function arrangeDataWorkspace() {
  const wrap = main.querySelector('.wrap');
  const box = document.createElement('div');
  box.className = 'workspace';
  const aside = document.createElement('aside');
  aside.className = 'panel sidebar';
  aside.innerHTML = '<h2>Filter Inventaris &amp; Inisiatif</h2>';
  aside.append(wrap.querySelector('.toolbar'));
  const info = document.createElement('p');
  info.className = 'small muted wide';
  info.textContent =
    'Telusuri 16 sumber emisi baseline 2025 atau 13 inisiatif dekarbonisasi 2036. Ekspor CSV memuat seluruh hasil filter.';
  aside.append(info);
  const stack = document.createElement('div');
  stack.className = 'content-stack';
  for (const child of [...wrap.children]) if (!child.classList.contains('page-title')) stack.append(child);
  box.append(aside, stack);
  wrap.append(box);
}

function dataPage() {
  const ev = getActiveEvaluation();
  main.innerHTML = `<div class="wrap">${pageTitle(
    'Inventaris GRK & matriks prioritas',
    'Eksplorasi Data Baseline 2025 & Prioritas MCDA',
    'Periksa rincian 16 sumber emisi PT XYZ beserta evaluasi 8 kriteria prioritas untuk 13 intervensi dekarbonisasi menuju 2036.'
  )}
  <div class="stats">
    <div class="stat"><b>26.387,96</b><span>Total Emisi Terlapor 2025 (tCO₂e)</span></div>
    <div class="stat"><b>23.309,33</b><span>Baseline Dalam Batas Target SBTi (tCO₂e)</span></div>
    <div class="stat"><b>10.411,84</b><span>Reduksi Wajib SBTi 2036 (tCO₂e)</span></div>
    <div class="stat"><b>11.718,12</b><span>Reduksi Skenario Rekomendasi (112,5%)</span></div>
  </div>
  <div class="panel">
    <div class="panel-head">
      <h2>Matriks Prioritas Multi-Kriteria (MCDA) vs Biaya Abatement (MACC)</h2>
      ${pill('13 Inisiatif Terukur', 'green')}
    </div>
    <div class="nag-controls" hidden role="group" aria-label="Zoom grafik MCDA">
      <button type="button" aria-label="Perkecil grafik">−</button>
      <button type="button" aria-label="Perbesar grafik">＋</button>
      <button type="button" aria-label="Reset zoom grafik">Reset</button>
      <span role="status" aria-live="polite">Zoom horizontal 1×</span>
    </div>
    <div class="chart-scroll" role="region" aria-label="Grafik Matriks Prioritas MCDA, dapat digeser horizontal" aria-describedby="nag-scroll-hint" tabindex="0">
      <div id="nag-chart" class="chart short"></div>
    </div>
    <p id="nag-scroll-hint" class="chart-scroll-hint">↔ Geser horizontal untuk melihat seluruh grafik pada panel sempit.<span class="nag-mobile-hint"> Di HP, gunakan tombol +/− untuk zoom.</span></p>
    <p class="chart-caption">Sumbu X: Skor Prioritas Komposit MCDA (0–100 dari 8 kriteria CYC 2026). Sumbu Y: Potensi Reduksi Tahunan (tCO₂e). Ukuran titik proporsional terhadap CAPEX.</p>
  </div>
  <div class="notice">
    <strong>Batas Target Scope 3 (CYC 2026 Handbook Hal. 16–17):</strong> Kategori 8 (Upstream Leased Assets: 527,57 tCO₂e) dan Kategori 12 (End-of-Life Sold Product: 2.551,06 tCO₂e) ditampilkan dalam inventaris lengkap namun dikecualikan dari perhitungan pemenuhan target SBTi 84%.
  </div>
  <section class="panel">
    <div class="panel-head">
      <h2>Penjelajah Tabel Kuantitatif</h2>
      <button id="export-data">Ekspor Hasil Filter (CSV)</button>
    </div>
    <div class="panel pad" style="border:0">
      <div class="toolbar">
        <label for="dataset">Dataset</label>
        <select id="dataset">
          <option value="sources">16 Sumber Baseline GRK 2025</option>
          <option value="initiatives">13 Inisiatif Dekarbonisasi 2036</option>
          <option value="trajectory">Lintasan Tahunan 2025–2036</option>
        </select>
        <label for="scope-select" id="scope-label">Scope</label>
        <select id="scope-select">
          <option value="all">Semua Scope</option>
          <option value="Scope 1">Scope 1</option>
          <option value="Scope 2">Scope 2</option>
          <option value="Scope 3">Scope 3</option>
        </select>
        <label for="phase-select" id="phase-label" hidden>Fase Roadmap</label>
        <select id="phase-select" hidden>
          <option value="all">Semua Fase</option>
          <option value="Phase 1">Phase 1 (2027–2028)</option>
          <option value="Phase 2">Phase 2 (2029–2033)</option>
          <option value="Phase 3">Phase 3 (2034–2036)</option>
        </select>
        <label class="sr-only" for="search">Cari ID atau Nama</label>
        <input id="search" type="search" placeholder="Cari kode / sumber / inisiatif…" value="${esc(state.query)}">
      </div>
      <p id="table-count" class="status-line" role="status"></p>
    </div>
    <div id="data-table" class="table-wrap"></div>
    <div class="panel-head">
      <button id="prev-page">← Sebelumnya</button>
      <span id="page-count" class="small muted"></span>
      <button id="next-page">Berikutnya →</button>
    </div>
  </section>
  ${sourceRef}</div>`;

  arrangeDataWorkspace();

  const inits = ev.initiatives;
  nagControls?.dispose();
  nagControls = attachNagNavigation({
    chart: $('#nag-chart'),
    scroller: $('.chart-scroll', main),
    controls: $('.nag-controls', main),
    render: mobile =>
      plot(
        $('#nag-chart'),
        [
          {
            type: 'scatter',
            mode: 'markers+text',
            x: inits.map(i => i.mcdaScore),
            y: inits.map(i => i.abated),
            text: inits.map(i => i.code),
            textposition: 'top center',
            marker: {
              size: inits.map(i => Math.max(12, Math.min(34, 10 + i.abated / 95))),
              color: inits.map(i =>
                i.scope === 'Scope 1' ? palette.green : i.scope === 'Scope 2' ? palette.mint : palette.sage
              ),
              line: { color: '#ffffff', width: 1.5 }
            },
            customdata: inits.map(
              i => `${i.code} · ${i.name}<br>${i.scope} · ${i.phase}<br>MACC: $${fmt(i.maccUsdPerTon, 1)}/tCO₂e`
            ),
            hovertemplate: '%{customdata}<br>Skor MCDA: %{x:.1f}<br>Reduksi: %{y:,.2f} tCO₂e<extra></extra>',
            showlegend: false
          }
        ],
        {
          xaxis: { title: { text: 'Skor Prioritas Multi-Kriteria MCDA (0–100)' }, range: [80, 96], gridcolor: '#e8eee9' },
          yaxis: { title: { text: 'Reduksi Aktual (tCO₂e/tahun)' }, range: [-150, 2650], gridcolor: '#e8eee9' },
          margin: { l: 68, r: 28, t: 24, b: 56 },
          ...(mobile ? { width: 720, height: $('#nag-chart').clientHeight, autosize: false } : {})
        },
        mobile ? { staticPlot: true, displayModeBar: false } : {}
      )
  });

  $('#dataset').value = state.dataSet;
  $('#scope-select').value = state.scopeSelect;
  $('#phase-select').value = state.phaseSelect;

  for (const [id, key] of [
    ['dataset', 'dataSet'],
    ['scope-select', 'scopeSelect'],
    ['phase-select', 'phaseSelect'],
    ['search', 'query']
  ]) {
    $('#' + id).addEventListener(id === 'search' ? 'input' : 'change', e => {
      state[key] = e.target.value;
      state.page = 0;
      renderDataTable();
    });
  }
  $('#prev-page').onclick = () => {
    state.page = Math.max(0, state.page - 1);
    renderDataTable();
  };
  $('#next-page').onclick = () => {
    state.page++;
    renderDataTable();
  };
  $('#export-data').onclick = () =>
    download('CYC2026_' + state.dataSet + '_filtered.csv', csvText(filteredRows()), 'text/csv;charset=utf-8');
  renderDataTable();
}

function filteredRows() {
  const ev = getActiveEvaluation();
  let rows;
  if (state.dataSet === 'sources') {
    rows = D.sources
      .filter(s => state.scopeSelect === 'all' || s.scope === state.scopeSelect)
      .map(s => ({
        ID: s.id,
        Scope: s.scope,
        Category: s.category,
        EmissionSource: s.name,
        Emissions2025_tCO2e: s.emissions,
        ShareTotal_Pct: s.shareTotalPct,
        InSBTiBoundary: s.inBoundary ? 'Ya (In-Boundary)' : 'Tidak (Excluded)',
        HotspotTier: s.hotspotTier,
        PrimaryIntervention: s.primaryLever
      }));
  } else if (state.dataSet === 'initiatives') {
    rows = ev.initiatives
      .filter(i => state.scopeSelect === 'all' || i.scope === state.scopeSelect)
      .filter(i => state.phaseSelect === 'all' || i.phase.includes(state.phaseSelect))
      .map(i => ({
        Code: i.code,
        Initiative: i.name,
        Scope: i.scope,
        Phase: i.phase,
        SequenceStep: i.sequenceStep,
        BaselineAffected_tCO2e: i.baselineAffected,
        Abated2036_tCO2e: i.abated,
        TargetContribution_Pct: i.shareOfTargetPct,
        CAPEX_MUSD: i.capexMusd,
        MACC_USD_per_t: i.maccUsdPerTon,
        MCDA_Score: i.mcdaScore
      }));
  } else {
    rows = ev.trajectory.map(t => ({
      Year: t.year,
      Scope12_tCO2e: t.scope12,
      Scope3_InBoundary_tCO2e: t.scope3In,
      Total_InBoundary_tCO2e: t.totalIn,
      SBTi_Linear_Target_tCO2e: t.sbtLinearTotal
    }));
  }

  const q = state.query.trim().toLowerCase();
  return rows.filter(
    r =>
      !q ||
      Object.values(r).some(v =>
        String(v ?? '')
          .toLowerCase()
          .includes(q)
      )
  );
}

function renderDataTable() {
  const rows = filteredRows();
  const pages = Math.max(1, Math.ceil(rows.length / 25));
  state.page = Math.min(state.page, pages - 1);
  const chunk = rows.slice(state.page * 25, state.page * 25 + 25);
  const cols = Object.keys(rows[0] || {});

  $('#scope-select').hidden = $('#scope-label').hidden = state.dataSet === 'trajectory';
  $('#phase-select').hidden = $('#phase-label').hidden = state.dataSet !== 'initiatives';

  $('#table-count').textContent = `${fmt(rows.length, 0)} baris hasil filter · ${
    state.dataSet === 'sources'
      ? 'Sumber: CYC 2026 Case Study Handbook (Tabel Baseline 2025)'
      : state.dataSet === 'initiatives'
      ? 'Sumber: Model Sekuensial Anti-Double-Counting & Prioritas MCDA'
      : 'Sumber: Simulasi Lintasan Tahunan 2025–2036'
  }`;

  $('#data-table').innerHTML = rows.length
    ? `<table><thead><tr>${cols.map(k => `<th>${esc(k)}</th>`).join('')}</tr></thead><tbody>${chunk
        .map(
          r =>
            `<tr>${cols
              .map(
                k =>
                  `<td class="${typeof r[k] === 'number' ? 'num' : ''}">${
                    typeof r[k] === 'number'
                      ? fmt(r[k], k === 'Year' ? 0 : 2)
                      : r[k] === null
                      ? '—'
                      : esc(r[k])
                  }</td>`
              )
              .join('')}</tr>`
        )
        .join('')}</tbody></table>`
    : '<div class="empty">Tidak ada catatan untuk filter ini. Ubah kata kunci atau filter Scope/Fase.</div>';

  $('#page-count').textContent = `Halaman ${state.page + 1} / ${pages}`;
  $('#prev-page').disabled = state.page === 0;
  $('#next-page').disabled = state.page >= pages - 1;
}

function methods() {
  const summary = computeBaselineSummary(D.sources);
  main.innerHTML = `<div class="wrap text-page">${pageTitle(
    'Metodologi & kepatuhan aturan kasus',
    'Setiap Angka Dapat Ditelusuri & Bebas Double Counting',
    'Integrasi data baseline resmi CYC 2026, hierarki mitigasi SBTi, kalkulasi sekuensial bertingkat, serta matriks prioritas 8 dimensi.'
  )}
  <div class="panel pad">
    <h2 style="margin-top:0">Acuan Studi Kasus Resmi</h2>
    <p><strong>${D.report}</strong> — Disusun untuk menjawab mandat Dewan Direksi PT XYZ: <em>"What combination and sequencing of decarbonization initiatives should PT XYZ implement to achieve its SBTi validated 2036 emissions reduction targets while protecting operational reliability and long-term business competitiveness?"</em></p>
    <div class="actions">
      <a class="button" href="data/provenance.json" download>Manifest Provenance (JSON)</a>
      <a class="button" href="data/pt_xyz_baseline_2025.csv" download>Tabel Baseline 2025 (CSV)</a>
      <a class="button" href="data/decarbonization_initiatives_2036.csv" download>Tabel 13 Inisiatif (CSV)</a>
    </div>
  </div>

  <div class="method-grid" style="margin-top:22px">
    <section class="panel pad">
      <h3>1. Rekonsiliasi Baseline &amp; Batas Target SBTi</h3>
      <p>Total emisi terlapor PT XYZ tahun 2025 adalah <strong>${fmt(summary.totalReported, 2)} tCO₂e</strong>, terdiri atas Scope 1 sebesar <strong>${fmt(summary.scope1, 2)} tCO₂e</strong> (15,7%), Scope 2 sebesar <strong>${fmt(summary.scope2, 2)} tCO₂e</strong> (9,1%), dan Scope 3 sebesar <strong>${fmt(summary.scope3Total, 2)} tCO₂e</strong> (75,2%).</p>
      <p>Sesuai CYC 2026 Handbook (Hal. 16–17), Kategori 8 (527,57 tCO₂e) dan Kategori 12 (2.551,06 tCO₂e) berada di luar batas target (<em>outside target boundary</em>). Sembilan kategori Scope 3 yang masuk batas target berjumlah eksak <strong>${fmt(summary.scope3InBoundary, 2)} tCO₂e</strong> (≈16.756,60 tCO₂e pada ringkasan tabel handbook, atau 84,48% dari Scope 3 terlapor).</p>
    </section>

    <section class="panel pad">
      <h3>2. Persamaan Sekuensial Anti-Double-Counting</h3>
      <p>Untuk mematuhi <strong>Case Rule #4</strong>, reduksi efisiensi energi dikurangkan terlebih dahulu dari baseline sebelum intervensi penggantian sumber energi dihitung:</p>
      <ul>
        <li><strong>Scope 2:</strong> Efisiensi Smart EMS &amp; VFD (-18% = 432,09 tCO₂e) menurunkan baseline listrik dari 2.400,52 menjadi <strong>1.968,43 tCO₂e</strong>. PLTS Atap (45%) dan I-REC (51,8%) kemudian dikalikan terhadap 1.968,43 tCO₂e, menghasilkan reduksi tambahan 1.904,81 tCO₂e dan mencegah hitung ganda sebesar <strong>418,27 tCO₂e</strong>.</li>
        <li><strong>Scope 1:</strong> Waste Heat Recovery boiler (-16,85% = 658,60 tCO₂e) menurunkan emisi pembakaran stasioner dari 3.907,92 menjadi <strong>3.249,32 tCO₂e</strong> sebelum co-firing biomassa &amp; heat pump (60% = 1.949,59 tCO₂e) diterapkan, mencegah hitung ganda <strong>394,82 tCO₂e</strong>.</li>
      </ul>
    </section>

    <section class="panel pad">
      <h3>3. Pemisahan Data Terverifikasi vs Asumsi Model</h3>
      <p>Sesuai <strong>Case Rule #1 &amp; #5</strong>, DSS ini memisahkan secara tegas:</p>
      <ul>
        <li><strong>Data Terverifikasi:</strong> Seluruh angka emisi tahun dasar 2025 per kategori dan parameter target SBTi 2036 (-63% Scope 1+2; -37,5% Scope 3 In-Boundary).</li>
        <li><strong>Asumsi Rekayasa &amp; Finansial:</strong> Faktor reduksi teknis per inisiatif, estimasi CAPEX, biaya abatement marginal (MACC), serta bobot kurva S implementasi 2027–2036.</li>
      </ul>
    </section>

    <section class="panel pad">
      <h3>4. Kebijakan Zero-Offset pada Target Near-Term 2036</h3>
      <p>Sesuai <strong>Case Rule #6</strong> dan standar SBTi Corporate Net-Zero, <strong>0 tCO₂e kredit karbon (carbon offset)</strong> digunakan untuk mengklaim pencapaian target reduksi 2036. Seluruh reduksi <strong>11.718,12 tCO₂e</strong> berasal dari dekarbonisasi langsung pada operasi dan rantai nilai PT XYZ.</p>
    </section>
  </div>

  <div class="notice">
    <strong>Audit Konsistensi Otomatis:</strong> Seluruh rumus diuji menggunakan unit test otomatis (<code>npm test</code>) yang memverifikasi kecocokan penjumlahan inventaris 2025, batas maksimum 2036, pencegahan double counting 813,09 tCO₂e, dan keamanan ekspor CSV.
  </div>

  <section class="panel pad">
    <h2>Ringkasan Verifikasi Kuantitatif</h2>
    <p>42 pemeriksaan otomatis terhadap dataset dan fungsi perhitungan lulus 100%. Skenario Rekomendasi menghasilkan emisi akhir Scope 1+2 sebesar <strong>1.168,36 tCO₂e</strong> (di bawah batas maksimum 2.424,45 tCO₂e) dan Scope 3 In-Boundary sebesar <strong>10.422,89 tCO₂e</strong> (di bawah batas maksimum 10.472,88 tCO₂e).</p>
    <a class="button" href="data/validation.json" download>Unduh Laporan Validasi (JSON)</a>
  </section>

  <h2>Diagram Acuan Strategi</h2>
  <div class="two-col">
    <figure class="panel pad" style="margin:0">
      <a href="assets/report-waterfall.svg" target="_blank" class="figure-link">
        <img src="assets/report-waterfall.svg" alt="Diagram Waterfall Sekuensial Anti-Double-Counting" loading="lazy">
      </a>
      <figcaption class="figure-caption">Gambar 2.1 · Waterfall Dekarbonisasi Sekuensial Tahap 1–5. Klik untuk ukuran penuh.</figcaption>
    </figure>
    <figure class="panel pad" style="margin:0">
      <a href="assets/report-roadmap.svg" target="_blank" class="figure-link">
        <img src="assets/report-roadmap.svg" alt="Peta Jalan Implementasi 3 Fase PT XYZ 2027–2036" loading="lazy">
      </a>
      <figcaption class="figure-caption">Gambar 3.1 · Peta Jalan 3 Fase &amp; Kerangka Tata Kelola KPI menuju 2036.</figcaption>
    </figure>
  </div></div>`;
}

export async function mountScience(root, route) {
  routeToken++;
  const token = routeToken;
  main = root;
  root.classList.remove('parameters-open');
  try {
    if (!D) {
      const response = await fetch('./data/evidence.json');
      if (!response.ok) throw new Error('data');
      D = await response.json();
    }
    if (token !== routeToken || !root.isConnected) return;
    ({ dss, terrain, data: dataPage, metode: methods }[route] || dss)();
    if (route !== 'metode') {
      const wrap = root.querySelector('.wrap');
      const toggle = document.createElement('button');
      toggle.className = 'parameter-toggle';
      toggle.setAttribute('aria-expanded', 'false');
      toggle.textContent = 'Atur parameter & skenario SBTi ▸';
      toggle.onclick = () => {
        const open = root.classList.toggle('parameters-open');
        toggle.setAttribute('aria-expanded', String(open));
        toggle.textContent = open ? 'Tutup parameter ▾' : 'Atur parameter & skenario SBTi ▸';
      };
      wrap.prepend(toggle);
    }
    root.querySelectorAll('a[href="#dss"]').forEach(a => (a.href = '#simulation'));
    root.querySelectorAll('a[href="#metode"]').forEach(a => (a.href = '#about'));
  } catch {
    if (token === routeToken) {
      root.innerHTML =
        '<div class="wrap"><h1>Data belum berhasil dimuat</h1><p>Periksa koneksi, lalu muat ulang halaman.</p><button onclick="location.reload()">Muat ulang</button></div>';
    }
  }
}

export function unmountScience() {
  routeToken++;
  if (main) purge();
}
