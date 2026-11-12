"use client";

import React from 'react';
import { Link } from './Link';
import { Header } from './Header';
import HeroSlideshow from './HeroSlideshow';
import { ArrowRight } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#f6f8f4] text-[#1a2f2b] flex flex-col font-sans">
      <Header />

      {/* HERO SECTION:
          Layer 1 (z-0): Strategy Diagrams Slideshow + Warm Guidebook Right-Side Fade
          Layer 2 (z-10): Animated Guidebook-Palette Snaking Ribbons (#204f49, #506e56, #868e69, #45b680)
          Layer 3 (z-20): Invisible Compartment Aligned Top-Right on Laptop + Centered Mobile Layout
      */}
      <section className="relative isolate w-full min-h-0 lg:min-h-[85vh] flex items-start justify-center lg:justify-end overflow-hidden bg-white border-b border-[#d6dfd6]">
        <HeroSlideshow />
        {/* Fade the gallery behind the introduction while keeping the left side visible. */}
        <div className="absolute inset-0 z-0 bg-white/75 sm:bg-white/70 lg:bg-transparent lg:bg-[linear-gradient(to_right,rgba(255,255,255,0)_0%,rgba(255,255,255,0.08)_28%,rgba(255,255,255,0.88)_53%,rgba(255,255,255,0.98)_100%)]" />
        <div className="absolute inset-x-0 bottom-0 h-16 z-0 bg-gradient-to-t from-white to-transparent" />

        {/* LAYER 2 (MIDDLE): Full-Canvas Snaking Ribbons in CYC 2026 Guidebook Palette */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 z-10 w-full h-full overflow-hidden"
        >
          <svg
            viewBox="0 0 1600 900"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="w-full h-full object-cover opacity-55 lg:opacity-100"
            preserveAspectRatio="xMidYMid slice"
          >
            <defs>
              {/* Gradient 1: Deep Teal-Forest (#204f49) -> Olive-Khaki (#868e69) -> Sage (#506e56) -> SRE Mint (#45b680) */}
              <linearGradient id="gcRibbonGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#204f49">
                  <animate
                    attributeName="stop-color"
                    values="#204f49;#506e56;#868e69;#204f49"
                    dur="7s"
                    repeatCount="indefinite"
                  />
                </stop>
                <stop offset="35%" stopColor="#868e69">
                  <animate
                    attributeName="stop-color"
                    values="#868e69;#204f49;#45b680;#868e69"
                    dur="7s"
                    repeatCount="indefinite"
                  />
                </stop>
                <stop offset="70%" stopColor="#506e56">
                  <animate
                    attributeName="stop-color"
                    values="#506e56;#868e69;#204f49;#506e56"
                    dur="7s"
                    repeatCount="indefinite"
                  />
                </stop>
                <stop offset="100%" stopColor="#45b680">
                  <animate
                    attributeName="stop-color"
                    values="#45b680;#506e56;#204f49;#45b680"
                    dur="7s"
                    repeatCount="indefinite"
                  />
                </stop>
              </linearGradient>

              {/* Gradient 2: Sage (#506e56) -> Olive-Khaki (#868e69) -> Deep Teal-Forest (#204f49) */}
              <linearGradient id="gcRibbonGrad2" x1="100%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#506e56">
                  <animate
                    attributeName="stop-color"
                    values="#506e56;#204f49;#868e69;#506e56"
                    dur="9s"
                    repeatCount="indefinite"
                  />
                </stop>
                <stop offset="45%" stopColor="#868e69">
                  <animate
                    attributeName="stop-color"
                    values="#868e69;#45b680;#204f49;#868e69"
                    dur="9s"
                    repeatCount="indefinite"
                  />
                </stop>
                <stop offset="100%" stopColor="#204f49">
                  <animate
                    attributeName="stop-color"
                    values="#204f49;#868e69;#506e56;#204f49"
                    dur="9s"
                    repeatCount="indefinite"
                  />
                </stop>
              </linearGradient>
            </defs>

            {/* Subtle Full Track Guide 1 */}
            <path
              d="M -80 180 C 220 -30, 480 340, 820 170 C 1140 10, 1010 520, 1340 470 C 1560 440, 1410 770, 1680 860"
              stroke="url(#gcRibbonGrad1)"
              strokeWidth="68"
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity="0.14"
            />

            {/* Subtle Full Track Guide 2 */}
            <path
              d="M 1520 -60 C 1220 120, 1520 350, 1140 430 C 780 510, 620 250, 310 470 C 110 610, 220 820, -80 870"
              stroke="url(#gcRibbonGrad2)"
              strokeWidth="62"
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity="0.14"
            />

            {/* Animated Ribbon 1 */}
            <path
              d="M -80 180 C 220 -30, 480 340, 820 170 C 1140 10, 1010 520, 1340 470 C 1560 440, 1410 770, 1680 860"
              stroke="url(#gcRibbonGrad1)"
              strokeWidth="68"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="gc-snake-ribbon-main"
            />

            {/* Animated Ribbon 2 */}
            <path
              d="M 1520 -60 C 1220 120, 1520 350, 1140 430 C 780 510, 620 250, 310 470 C 110 610, 220 820, -80 870"
              stroke="url(#gcRibbonGrad2)"
              strokeWidth="62"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="gc-snake-ribbon-cross"
            />
          </svg>
        </div>

        {/* LAYER 3 (TOP): Centered Responsive Mobile Layout (< lg) | Top-Right Invisible Compartment on Laptop (lg:) */}
        <div className="relative z-20 w-full max-w-[1480px] mx-auto px-4 sm:px-8 lg:px-14 pt-7 pb-24 sm:pt-9 sm:pb-24 lg:pt-10 lg:pb-16 flex flex-col items-center text-center lg:items-end lg:text-right">
          <div className="w-full max-w-xl lg:max-w-[790px] flex flex-col items-center lg:items-end space-y-4">
            {/* Competition Pill Badge in Guidebook Olive-Cream */}
            <span className="inline-block max-w-full rounded-full bg-[#edf3ee]/95 border border-[#868e69] px-3.5 py-1.5 sm:px-4 text-[10px] sm:text-xs lg:text-sm font-bold text-[#204f49] tracking-wide shadow-2xs">
              CARBON YOUTH CHALLENGE 2026 | IDCTA YOUTH &amp; SRE UPNVJ • CDC 2026
            </span>

            {/* Title: Strictly 2 Lines on Laptop */}
            <h2
              className="text-[27px] sm:text-4xl lg:text-[42px] xl:text-[46px] font-black tracking-tight text-[#1a2f2b] leading-[1.14] lg:leading-[1.12]"
              style={{
                paintOrder: 'stroke fill',
                WebkitTextStroke: '1.1px #000000',
                textShadow: '0 2px 12px rgba(255,255,255,.9)'
              }}
            >
              <span className="block lg:whitespace-nowrap">
                PT XYZ <span className="text-[#204f49]" style={{ paintOrder: 'stroke fill', WebkitTextStroke: '1.3px #000000' }}>SBTi 2036 PATHWAY</span>
              </span>
              <span className="block lg:whitespace-nowrap">Decision Support System</span>
            </h2>

            <p
              className="text-sm sm:text-base lg:text-[18px] xl:text-[19px] text-[#1a2f2b] font-semibold leading-relaxed max-w-md sm:max-w-lg lg:max-w-[660px]"
              style={{
                paintOrder: 'stroke fill',
                WebkitTextStroke: '.35px #000000',
                textShadow: '0 1px 10px rgba(255,255,255,.92)'
              }}
            >
              <span className="lg:block">Arsitektur strategi <strong>dekarbonisasi berbasis sains (SBTi)</strong></span>{' '}
              <span className="lg:block">untuk menjawab mandat Dewan Direksi PT XYZ menuju 2036.</span>{' '}
              <span className="lg:block">Telusuri <strong className="text-[#204f49]">baseline 26.387,96 tCO₂e</strong>, <strong>13 intervensi prioritas</strong>,</span>{' '}
              <span className="lg:block">kalkulasi sekuensial <strong className="text-[#204f49]">bebas double-counting</strong>, serta</span>{' '}
              <span className="lg:block">penutupan gap <strong>≥ 10.411,84 tCO₂e</strong> tanpa kompensasi offset.</span>
            </p>

            {/* Primary & Secondary Action Buttons */}
            <div className="relative z-30 w-full max-w-md sm:max-w-xl pt-2 flex flex-col items-center lg:items-end gap-3">
              <div className="grid w-full grid-cols-1 sm:grid-cols-2 gap-3">
                <Link
                  href="/simulation"
                  className="group flex w-full items-center justify-center gap-2 rounded-xl bg-[#204f49] hover:bg-[#173b36] py-3.5 sm:py-4 px-5 text-base font-bold text-white shadow-md transition-all"
                >
                  Buka Command Center SBTi
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>
                <Link
                  href="/terrain"
                  className="flex w-full items-center justify-center rounded-xl border-2 border-[#204f49] bg-white/95 hover:bg-[#edf3ee] py-3.5 sm:py-4 px-5 text-base font-bold text-[#204f49] shadow-sm transition-all"
                >
                  Lanskap 3D Abatement
                </Link>
              </div>

              <div className="grid w-full grid-cols-3 gap-2.5">
                <Link
                  href="/about"
                  className="flex items-center justify-center rounded-lg border border-[#c8d3c8] bg-white/95 hover:bg-[#edf3ee] py-2.5 px-3 text-xs sm:text-sm font-semibold text-[#1a2f2b] transition-colors"
                >
                  Metodologi
                </Link>
                <Link
                  href="/documentation"
                  className="flex items-center justify-center rounded-lg border border-[#c8d3c8] bg-white/95 hover:bg-[#edf3ee] py-2.5 px-3 text-xs sm:text-sm font-semibold text-[#1a2f2b] transition-colors"
                >
                  Dokumentasi
                </Link>
                <Link
                  href="/team"
                  className="flex items-center justify-center rounded-lg border border-[#c8d3c8] bg-white/95 hover:bg-[#edf3ee] py-2.5 px-3 text-xs sm:text-sm font-semibold text-[#1a2f2b] transition-colors"
                >
                  Tim Strategi
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Guidebook Signature Gradient Banner Strip */}
      <div
        className="w-full py-3.5 px-6 text-white border-b border-[#d6dfd6]"
        style={{ backgroundImage: 'linear-gradient(to right, #204f49, #506e56, #868e69)' }}
      >
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2 text-xs sm:text-sm font-semibold">
          <span>MITIGATION HIERARCHY: AVOID → REDUCE → SUBSTITUTE → COMPENSATE (RESIDUAL ONLY)</span>
          <span className="font-mono">SBTi 2036 TARGET: -63% SCOPE 1+2 &amp; -37,5% SCOPE 3 (84% BOUNDARY)</span>
        </div>
      </div>

      <main tabIndex={-1} className="flex-1 max-w-7xl w-full mx-auto px-6 py-16 space-y-16">
        {/* 4 Key Competition Metrics */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            ['Inventaris Baseline 2025', '26.387,96', 'tCO₂e', 'Scope 1 (15,7%) · Scope 2 (9,1%) · Scope 3 (75,2%)'],
            ['Target Scope 1 + Scope 2', '-63,0%', '≥ 4.128,11 tCO₂e', '100% coverage · Maksimum 2.424,45 tCO₂e di 2036'],
            ['Target Scope 3 (SBTi 84%)', '-37,5%', '≥ 6.283,73 tCO₂e', 'Basis 16.756,60 tCO₂e · Cat 8 & 12 dikecualikan'],
            ['Total Reduksi Wajib 2036', '10.411,84', 'tCO₂e', 'Skenario Rekomendasi mencapai -11.718,12 tCO₂e']
          ].map(([label, value, unit, note]) => (
            <div key={label} className="p-6 rounded-2xl bg-white border border-[#d6dfd6] shadow-sm">
              <span className="text-xs font-bold uppercase tracking-wider text-[#204f49] block mb-2">{label}</span>
              <div className="text-3xl font-extrabold font-mono text-[#1a2f2b]">
                {value} <span className="text-sm font-normal text-[#52665f]">{unit}</span>
              </div>
              <p className="text-xs text-[#52665f] mt-2 font-medium">{note}</p>
            </div>
          ))}
        </section>

        {/* Visual Strategy Highlights */}
        <section className="space-y-8">
          <div className="max-w-3xl">
            <span className="text-xs font-bold uppercase tracking-widest text-[#204f49] block mb-1">
              Hotspot Materiality, Sequential Abatement &amp; 2036 Roadmap
            </span>
            <h3 className="text-2xl sm:text-3xl font-extrabold text-[#1a2f2b]">
              Menjawab Pertanyaan Dewan Direksi PT XYZ secara Kuantitatif
            </h3>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {[
              [
                'Analisis Sekuensial Anti-Double-Counting',
                'Tahap 1–5 · Efisiensi mendahului pengadaan EBT & biomassa',
                'report-waterfall.svg',
                'Case Rule #4 Compliant'
              ],
              [
                'Peta Jalan 3 Fase & Tata Kelola Eksekusi',
                'Foundation (2027–2028) · Scale (2029–2033) · Delivery (2034–2036)',
                'report-roadmap.svg',
                'SBTi 2036 Validated'
              ]
            ].map(([label, title, img, badge]) => (
              <div key={label} className="rounded-2xl overflow-hidden border border-[#d6dfd6] bg-white shadow-sm flex flex-col">
                <div className="p-5 border-b border-[#e8eee8] flex flex-wrap gap-3 items-center justify-between">
                  <div>
                    <span className="text-xs font-mono text-[#204f49] font-bold uppercase">{label}</span>
                    <h4 className="text-base font-bold text-[#1a2f2b]">{title}</h4>
                  </div>
                  <span className="px-3 py-1 rounded-full text-xs font-semibold bg-[#edf3ee] text-[#204f49] border border-[#b8ccb9]">
                    {badge}
                  </span>
                </div>
                <a
                  href={'./assets/' + img}
                  target="_blank"
                  rel="noreferrer"
                  className="p-4 flex-1 flex items-center justify-center bg-white"
                >
                  <img
                    src={'./assets/' + img}
                    alt={title}
                    className="w-full h-auto rounded-lg object-contain border border-[#d6dfd6] bg-white"
                  />
                </a>
              </div>
            ))}
          </div>
        </section>

        {/* 4 Core Strategy Pillars matching the Board's 4 Questions */}
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            [
              '01 • Where Are We Now?',
              'Hotspot & Materialitas',
              'Empat sumber utama — S3 Cat 1 (6.098,98 t), S3 Cat 10 (4.745,86 t), S1 Stationary Combustion (3.907,92 t), dan S3 Cat 9 (2.532,03 t) — menyumbang 74,0% dari seluruh emisi dalam batas target SBTi.',
              'Cat 8 & Cat 12 dikecualikan (Outside Boundary)'
            ],
            [
              '02 • Where To Go?',
              'Target Sains 2036',
              'PT XYZ wajib memangkas Scope 1+2 sebesar ≥63% (-4.128,11 tCO₂e) dan Scope 3 In-Boundary sebesar ≥37,5% (-6.283,73 tCO₂e) paling lambat 2036 tanpa mengandalkan carbon offset.',
              'Total Target ≥ 10.411,84 tCO₂e'
            ],
            [
              '03 • How We Get There?',
              'Kalkulasi Bebas Hitung Ganda',
              'Efisiensi listrik (-18%) dan WHR boiler (-16,85%) dieksekusi pertama untuk menurunkan baseline energi sebelum PLTS Atap 2,5 MWp, Green Tariff/I-REC, dan Co-Firing Biomassa diterapkan.',
              'Menghindari 813,09 tCO₂e double counting'
            ],
            [
              '04 • How We Execute?',
              'Prioritas MCDA & Roadmap',
              'Pemeringkatan 13 inisiatif menggunakan 8 dimensi CYC 2026 dan Shadow Carbon Price USD 28/tCO₂e. Menghasilkan surplus kepatuhan +1.306,28 tCO₂e (112,5% target) pada 2036.',
              '3 Fase Terukur · Audit ISO 14064-1'
            ]
          ].map(([label, title, body, note]) => (
            <div key={label} className="p-6 rounded-2xl bg-white border border-[#d6dfd6] shadow-sm flex flex-col justify-between">
              <div>
                <span className="text-xs font-mono font-bold text-[#204f49] block mb-2">PILAR {label}</span>
                <h4 className="text-lg font-bold text-[#1a2f2b] mb-2">{title}</h4>
                <p className="text-[#52665f] text-sm leading-relaxed">{body}</p>
              </div>
              <div className="mt-5 pt-3 border-t border-[#e8eee8] text-xs text-[#204f49] font-mono font-semibold">
                {note}
              </div>
            </div>
          ))}
        </section>
      </main>

      <footer className="py-8 px-6 text-[#52665f] text-xs border-t border-[#d6dfd6] bg-white">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-4">
            <img src="./assets/itb.png" alt="ITB" className="h-8 w-auto object-contain" />
            <img src="./assets/cyc2026.svg" alt="CYC 2026" className="h-8 w-auto object-contain" />
            <img src="./assets/idcta.svg" alt="IDCTA Youth" className="h-8 w-auto object-contain" />
            <span className="font-bold text-[#1a2f2b]">DECARBONIZATION STRATEGY TEAM · ITB</span>
          </div>
          <p className="text-[#52665f]">© 2026 CarbonTrack-XYZ™ Decision Support System · Carbon Youth Challenge 2026.</p>
        </div>
        <section aria-labelledby="usage-disclaimer" className="max-w-7xl mx-auto mt-6 pt-6 border-t border-[#d6dfd6] leading-relaxed">
          <h2 id="usage-disclaimer" className="font-semibold text-[#1a2f2b] mb-2">
            Batas penggunaan &amp; kepatuhan aturan studi kasus CYC 2026
          </h2>
          <p>
            Sistem pendukung keputusan (DSS) ini dirancang khusus untuk studi kasus PT XYZ pada kompetisi Carbon Youth Challenge (CYC) 2026 yang diselenggarakan oleh IDCTA Youth dan SRE UPN Veteran Jakarta. Seluruh angka baseline mengacu pada dokumen resmi CYC 2026 Handbook, sedangkan parameter intervensi, kurva biaya (MACC), dan penjadwalan fase merupakan pemodelan kuantitatif tim yang dibedakan secara transparan dari data terverifikasi. Sesuai Case Rule #6, tidak ada kredit karbon (carbon offsets) yang dihitung sebagai pengganti reduksi emisi langsung pada rantai nilai.
          </p>
        </section>
      </footer>
    </div>
  );
}
