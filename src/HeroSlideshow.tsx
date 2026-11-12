import { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const slides = [
  {
    title: 'Profil Baseline GRK 2025 & Batas Target SBTi',
    file: 'report-baseline.svg',
    kind: 'report',
    credit: 'CYC 2026 Case Study · 26.387,96 tCO₂e (Scope 1, 2 & 84% Scope 3 In-Boundary)'
  },
  {
    title: 'Waterfall Sekuensial Anti-Double-Counting 2036',
    file: 'report-waterfall.svg',
    kind: 'report',
    credit: 'CYC 2026 Case Rule #4 · Efisiensi mendahului EBT & Fuel Switching (-11.718 tCO₂e)'
  },
  {
    title: 'Peta Jalan 3 Fase (2027–2036) & Tata Kelola KPI',
    file: 'report-roadmap.svg',
    kind: 'report',
    credit: 'Foundation (2027–2028) → Scale (2029–2033) → Target Delivery (2034–2036)'
  },
  {
    title: 'Matriks Prioritas Multi-Kriteria (MCDA) & MACC',
    file: 'report-matrix.svg',
    kind: 'report',
    credit: 'Evaluasi 8 Dimensi Prioritas CYC 2026 · Dampak Iklim × Kelayakan × Keandalan'
  }
];

export default function HeroSlideshow() {
  const [active, setActive] = useState(0);
  const [reducedMotion, setReducedMotion] = useState(
    () => window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
  const [hidden, setHidden] = useState(document.hidden);

  useEffect(() => {
    const visibility = () => setHidden(document.hidden);
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
    const motion = () => setReducedMotion(preference.matches);
    document.addEventListener('visibilitychange', visibility);
    preference.addEventListener('change', motion);
    return () => {
      document.removeEventListener('visibilitychange', visibility);
      preference.removeEventListener('change', motion);
    };
  }, []);

  useEffect(() => {
    if (reducedMotion || hidden) return;
    const timer = window.setTimeout(() => setActive(index => (index + 1) % slides.length), 4_000);
    return () => window.clearTimeout(timer);
  }, [active, reducedMotion, hidden]);

  function choose(index: number) {
    setActive((index + slides.length) % slides.length);
  }

  return (
    <div className="contents" role="region" aria-roledescription="carousel" aria-label="Galeri Strategi Dekarbonisasi PT XYZ">
      {slides.map((slide, index) => (
        <div
          key={slide.file}
          className={'hero-slide ' + (active === index ? 'is-active' : '')}
          aria-hidden={active !== index}
        >
          <img
            src={'./assets/' + slide.file}
            alt={slide.title}
            className={'hero-slide-image hero-slide-' + slide.kind}
            decoding="async"
          />
        </div>
      ))}
      <div className="hero-gallery-controls">
        <div className="hero-gallery-navigation">
          <button type="button" onClick={() => choose(active - 1)} aria-label="Gambar sebelumnya">
            <ChevronLeft size={20} />
          </button>
          <span className="hero-gallery-caption" aria-live="off">
            {slides[active].title}
          </span>
          <button type="button" onClick={() => choose(active + 1)} aria-label="Gambar berikutnya">
            <ChevronRight size={20} />
          </button>
        </div>
        <p className="hero-gallery-credit">{slides[active].credit}</p>
      </div>
    </div>
  );
}
