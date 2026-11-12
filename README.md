# CarbonTrack-XYZ™ — CYC 2026 Decision Support System

Decision Support System (DSS) interaktif untuk studi kasus **Designing a Science-Based Decarbonization Strategy (PT XYZ Menuju 2036)** pada kompetisi **Carbon Youth Challenge (CYC) 2026** yang diselenggarakan oleh **Indonesia Carbon Trade Association (IDCTA) Youth** dan **SRE UPN Veteran Jakarta** dalam rangkaian **Carbon Digital Conference (CDC) 2026**.

**Live Website (GitHub Pages):** https://dzakyzahy.github.io/cyc2026-dss/

## Fitur Utama

1. **Command Center Dekarbonisasi SBTi 2036 (`#simulation`)**:
   - Simulasi interaktif intensitas eksekusi operasional (Scope 1+2), bauran listrik terbarukan (PLTS Atap + Green Tariff/I-REC), dan tingkat adopsi rantai nilai Scope 3.
   - **Sequential Anti-Double-Counting Engine (CYC 2026 Case Rule #4)**: Efisiensi listrik Smart EMS/VFD (-18%) dan Waste Heat Recovery boiler (-16,85%) dipotong terlebih dahulu dari baseline sebelum intervensi energi terbarukan dan fuel-switching dihitung, mencegah hitung ganda sebesar **813,09 tCO₂e**.
   - **Hotspot & Materiality Analysis**: Pemetaan 16 sumber emisi tahun dasar 2025 (**26.387,96 tCO₂e**) dengan pemisahan eksplisit antara 14 sumber dalam batas target SBTi (**23.309,33 tCO₂e**) dan 2 kategori di luar batas target (**Cat 8: 527,57 tCO₂e** & **Cat 12: 2.551,06 tCO₂e**).
   - **Governance Stage-Gate & KPI Checklist**: Evaluasi kesiapan tata kelola per skenario berbasis *Shadow Carbon Price* USD 28/tCO₂e yang tersimpan di browser dan dapat diekspor ke JSON.

2. **3D Abatement & Trade-off Landscape (`#terrain`)**:
   - Visualisasi permukaan respons tiga dimensi (grid 25 × 25) yang memetakan interaksi antara eksekusi operasional Scope 1+2 dan transformasi rantai pasok Scope 3 terhadap ambang wajib SBTi (**10.411,84 tCO₂e**).
   - Kontrol kamera *OrbitControls* stabil tanpa rotasi otomatis (Putar, Geser, Zoom +/−, dan Reset).

3. **Inventaris GRK & Matriks Prioritas MCDA (`#data`)**:
   - Evaluasi 13 inisiatif dekarbonisasi menggunakan 8 dimensi prioritas CYC 2026 (*Emissions Reduction Potential, Implementation Complexity, Technological Readiness, Operational Risk, Strategic Importance, Scalability, Stakeholder Dependency, Implementation Speed*).
   - Penjelajah tabel interaktif dengan filter Scope/Fase, pencarian instan, dan ekspor CSV berproteksi penuh.

4. **Metodologi & Dokumentasi (`#about` & `#documentation`)**:
   - Penjelasan transparan yang membedakan angka baseline terverifikasi dari asumsi pemodelan teknis/finansial (Case Rule #1 & #5) serta kepatuhan *Zero Carbon Offset* untuk target near-term 2036 (Case Rule #6).

## Pengembangan & Verifikasi

```sh
npm install
npm test
npm run dev
npm run build
```

Hasil build produksi berada di folder `docs/` beserta `.nojekyll` untuk publikasi langsung melalui GitHub Pages.
