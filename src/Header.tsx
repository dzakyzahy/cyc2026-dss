"use client";

import { Link } from './Link';
import { Menu, X } from 'lucide-react';
import { useState } from 'react';

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header
      onKeyDown={e => {
        if (e.key === 'Escape') setIsMenuOpen(false);
      }}
      className="sticky top-0 z-50 w-full border-b border-[#d6dfd6] bg-white/95 backdrop-blur-md"
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-3 sm:h-24 sm:px-6 lg:h-28 lg:px-8">
        {/* Left: Prominent Official Logos (ITB + CYC 2026 + IDCTA Youth/SRE) + Brand Wordmark */}
        <div className="flex min-w-0 items-center gap-2 sm:gap-4 lg:gap-6">
          <div className="flex shrink-0 items-center gap-2 sm:gap-3.5 lg:gap-5">
            <div className="flex shrink-0 items-center gap-2 sm:gap-3.5 lg:gap-4">
              <img
                src="./assets/itb.png"
                alt="Logo ITB"
                className="h-7 w-auto object-contain sm:h-12 lg:h-14"
              />
            </div>
            <div className="h-6 w-[1px] bg-[#c8d3c8] sm:h-10" />
            <img
              src="./assets/cyc2026.svg"
              alt="Carbon Youth Challenge 2026"
              className="h-7 w-auto object-contain sm:h-11 lg:h-13"
            />
            <div className="hidden md:block h-6 w-[1px] bg-[#c8d3c8] sm:h-10" />
            <img
              src="./assets/idcta.svg"
              alt="IDCTA Youth & SRE UPNVJ"
              className="hidden md:block h-7 w-auto object-contain sm:h-10 lg:h-12"
            />
          </div>

          <div className="h-7 w-[1.5px] bg-[#d6dfd6] sm:h-10 sm:w-[2px]" />

          <Link href="/" className="group min-w-0 shrink-0">
            <h1
              className="whitespace-nowrap bg-clip-text text-lg font-black tracking-tight text-transparent transition-opacity group-hover:opacity-90 sm:text-2xl lg:text-3xl xl:text-4xl"
              style={{
                backgroundImage: 'linear-gradient(to right, #204f49, #506e56, #868e69)',
              }}
            >
              CARBONTRACK-XYZ
            </h1>
          </Link>
        </div>

        {/* Right: Simple Hamburger Menu Only */}
        <div className="relative flex shrink-0 items-center">
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label="Menu Navigasi"
            aria-expanded={isMenuOpen}
            aria-controls="main-navigation"
            className="rounded-xl border border-[#d6dfd6] bg-white p-2 sm:p-2.5 text-[#204f49] shadow-sm transition-colors hover:bg-[#edf3ee] hover:text-[#173b36] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#204f49]"
          >
            {isMenuOpen ? <X className="h-6 w-6 sm:h-7 sm:w-7" /> : <Menu className="h-6 w-6 sm:h-7 sm:w-7" />}
          </button>

          {isMenuOpen && (
            <div
              id="main-navigation"
              className="absolute right-0 top-full mt-3 w-60 rounded-2xl border border-[#d6dfd6] bg-white py-2 shadow-xl"
            >
              <Link
                href="/"
                className="block px-5 py-3 text-sm font-semibold text-[#1a2f2b] hover:bg-[#edf3ee] hover:text-[#204f49]"
                onClick={() => setIsMenuOpen(false)}
              >
                Beranda
              </Link>
              <Link
                href="/simulation"
                className="block px-5 py-3 text-sm font-semibold text-[#1a2f2b] hover:bg-[#edf3ee] hover:text-[#204f49]"
                onClick={() => setIsMenuOpen(false)}
              >
                Command Center SBTi
              </Link>
              <Link
                href="/terrain"
                className="block px-5 py-3 text-sm font-semibold text-[#1a2f2b] hover:bg-[#edf3ee] hover:text-[#204f49]"
                onClick={() => setIsMenuOpen(false)}
              >
                3D Abatement Landscape
              </Link>
              <Link
                href="/data"
                className="block px-5 py-3 text-sm font-semibold text-[#1a2f2b] hover:bg-[#edf3ee] hover:text-[#204f49]"
                onClick={() => setIsMenuOpen(false)}
              >
                Inventaris &amp; Prioritas MCDA
              </Link>
              <Link
                href="/about"
                className="block px-5 py-3 text-sm font-semibold text-[#1a2f2b] hover:bg-[#edf3ee] hover:text-[#204f49]"
                onClick={() => setIsMenuOpen(false)}
              >
                Metodologi &amp; Aturan SBTi
              </Link>
              <Link
                href="/documentation"
                className="block px-5 py-3 text-sm font-semibold text-[#1a2f2b] hover:bg-[#edf3ee] hover:text-[#204f49]"
                onClick={() => setIsMenuOpen(false)}
              >
                Dokumentasi &amp; Unduhan
              </Link>
              <Link
                href="/team"
                className="block px-5 py-3 text-sm font-semibold text-[#1a2f2b] hover:bg-[#edf3ee] hover:text-[#204f49]"
                onClick={() => setIsMenuOpen(false)}
              >
                Profil Tim Strategi
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
