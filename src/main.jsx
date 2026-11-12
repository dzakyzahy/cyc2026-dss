import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource/inter/latin-400.css';
import '@fontsource/inter/latin-600.css';
import '@fontsource/inter/latin-700.css';
import '@fontsource/inter/latin-800.css';
import '@fontsource/inter/latin-900.css';
import '@fontsource/jetbrains-mono/latin-400.css';
import '@fontsource/jetbrains-mono/latin-700.css';
import './reference.css';
import './styles.css';
import './science/science.css';
import Landing from './Landing';
import Team from './Team';
import { Header } from './Header';
import { Link } from './Link';
import { mountScience, unmountScience } from './science/workspace.js';
import { ArrowLeft, FileText, Map, Layers, FlaskConical, ClipboardList } from 'lucide-react';

const tabs = [
  ['simulation', 'Command Center SBTi 2036', Map],
  ['terrain', '3D Abatement Landscape', Layers],
  ['data', 'Inventaris & Prioritas MCDA', FlaskConical]
];

function ScientificView({ page }) {
  const root = useRef(null);
  useEffect(() => {
    mountScience(root.current, { simulation: 'dss', terrain: 'terrain', data: 'data', about: 'metode' }[page]);
    return () => unmountScience();
  }, [page]);
  return (
    <div className={'min-h-screen flex flex-col ' + (page === 'about' ? 'bg-gray-50' : 'bg-gray-100')}>
      <Header />
      {page !== 'about' && (
        <nav
          aria-label="Modul DSS"
          className="science-nav bg-white border-b border-gray-200 sticky top-16 sm:top-24 lg:top-28 z-20"
        >
          <div className="flex overflow-x-auto">
            {tabs.map(([id, label, Icon]) => (
              <Link
                key={id}
                href={'/' + id}
                aria-current={page === id ? 'page' : undefined}
                className={
                  'flex items-center gap-2 whitespace-nowrap border-b-2 px-4 py-3.5 text-xs sm:text-sm font-semibold lg:px-6 ' +
                  (page === id
                    ? 'border-[#204f49] text-[#204f49]'
                    : 'border-transparent text-[#52665f] hover:text-[#1a2f2b]')
                }
              >
                <Icon size={16} />
                {label}
              </Link>
            ))}
          </div>
        </nav>
      )}
      <main
        tabIndex={-1}
        ref={root}
        className={'science flex-1 ' + (page === 'about' ? 'method-page' : 'workspace-page')}
        id="main-content"
      >
        <div className="p-12 text-gray-600">Memuat data strategi dekarbonisasi PT XYZ…</div>
      </main>
    </div>
  );
}

function Documentation() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main tabIndex={-1} id="main-content" className="max-w-7xl mx-auto px-6 py-12 space-y-10">
        <Link href="/" className="inline-flex items-center text-sm font-semibold text-[#52665f] hover:text-[#204f49]">
          <ArrowLeft size={16} className="mr-2" />
          Kembali ke Beranda
        </Link>
        <div className="space-y-4 max-w-3xl">
          <span className="text-xs font-bold uppercase tracking-widest text-[#204f49]">
            Carbon Youth Challenge 2026 · PT XYZ Case Study
          </span>
          <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-[#1a2f2b]">
            Dokumentasi <span className="text-[#204f49]">Strategi SBTi 2036</span>
          </h1>
          <p className="text-[#52665f] leading-relaxed">
            Diagram arsitektur dekarbonisasi, analisis hotspot baseline 2025, perhitungan sekuensial anti-double-counting, serta dataset CSV/JSON yang dapat diunduh langsung untuk verifikasi Dewan Juri CYC 2026.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-7">
          {[
            [
              'Profil Baseline GRK 2025 & Batas Target SBTi',
              'Gambar 1.1 · Pemetaan 16 sumber emisi (26.387,96 tCO₂e) & eksklusi Cat 8/Cat 12',
              'report-baseline.svg'
            ],
            [
              'Waterfall Sekuensial Anti-Double-Counting',
              'Gambar 2.1 · Tahapan efisiensi energi sebelum pengadaan EBT & fuel switching',
              'report-waterfall.svg'
            ],
            [
              'Peta Jalan 3 Fase (2027–2036) & Tata Kelola',
              'Gambar 3.1 · Foundation (2027–2028), Scale (2029–2033), dan Delivery (2034–2036)',
              'report-roadmap.svg'
            ],
            [
              'Matriks Prioritas Multi-Kriteria (MCDA) & MACC',
              'Gambar 4.1 · Evaluasi 8 dimensi kelayakan, risiko operasional, dan biaya abatement',
              'report-matrix.svg'
            ]
          ].map(([title, caption, img]) => (
            <figure className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden" key={img}>
              <figcaption className="p-5 border-b border-gray-100">
                <h2 className="font-bold">{title}</h2>
                <p className="text-xs text-gray-500 mt-1">{caption}</p>
              </figcaption>
              <a href={'./assets/' + img} target="_blank" rel="noreferrer" className="block p-4">
                <img src={'./assets/' + img} alt={title} className="w-full h-auto" />
              </a>
            </figure>
          ))}
        </div>

        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {[
            ['Inventaris Baseline 2025 (CSV)', 'pt_xyz_baseline_2025.csv', FileText],
            ['Portofolio 13 Inisiatif 2036 (CSV)', 'decarbonization_initiatives_2036.csv', Map],
            ['Manifest Provenance & Asumsi', 'provenance.json', Layers],
            ['Laporan Audit Anti-Double-Count', 'validation.json', ClipboardList]
          ].map(([label, file, Icon]) => (
            <a
              key={file}
              href={'./data/' + file}
              download
              className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm hover:border-emerald-600 transition-colors"
            >
              <Icon className="text-emerald-700 mb-4" />
              <h2 className="font-semibold">{label}</h2>
              <span className="text-xs text-gray-500 mt-2 block">Unduh dokumen pendukung</span>
            </a>
          ))}
        </section>
      </main>
    </div>
  );
}

function App() {
  const current = () =>
    ({ dss: 'simulation', metode: 'about', tim: 'team', beranda: '' }[location.hash.slice(1)] ??
      location.hash.slice(1));
  const [page, setPage] = useState(current);
  useEffect(() => {
    const change = () => setPage(current());
    window.addEventListener('hashchange', change);
    return () => window.removeEventListener('hashchange', change);
  }, []);
  useLayoutEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
    document.title =
      'CarbonTrack-XYZ | ' +
      ({
        simulation: 'Command Center SBTi 2036',
        terrain: '3D Abatement Landscape',
        data: 'Inventaris & Prioritas MCDA',
        about: 'Metodologi & Aturan SBTi',
        team: 'Tim Strategi ITB',
        documentation: 'Dokumentasi'
      }[page] || 'CYC 2026 SBTi Strategy DSS');
  }, [page]);
  return (
    <>
      <a
        href="#main-content"
        className="skip-link"
        onClick={e => {
          e.preventDefault();
          document.querySelector('main')?.focus();
        }}
      >
        Lewati ke isi
      </a>
      {page === 'team' ? (
        <Team />
      ) : page === 'documentation' ? (
        <Documentation />
      ) : ['simulation', 'terrain', 'data', 'about'].includes(page) ? (
        <ScientificView page={page} />
      ) : (
        <Landing />
      )}
    </>
  );
}

const appRoot = import.meta.hot?.data.root ?? createRoot(document.getElementById('root'));
if (import.meta.hot) import.meta.hot.data.root = appRoot;
appRoot.render(<App />);
