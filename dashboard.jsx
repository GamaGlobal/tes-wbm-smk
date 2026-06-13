import { useState, useEffect, useCallback, useRef } from "react";

// ══════════════════════════════════════════════════════════════
// KONFIGURASI
// ══════════════════════════════════════════════════════════════
const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbx-m8GlmQnk24NoH8lqrnXiJuRyTt3MVKqRjza5ZwB1GRxrTMHEHJ8GFaTurEuVD2M/exec";
const PANITIA_PASSWORD = "wbmsmk2026"; // Ganti dengan password panitia
const REALTIME_INTERVAL = 15000; // auto-refresh setiap 15 detik

// ══════════════════════════════════════════════════════════════
// DATA DUMMY (hapus saat production)
// ══════════════════════════════════════════════════════════════
const DEMO_DATA = [
  { no:1, nama:"Andi Pratama", nisn:"0012345678", kelas:"X TKJ", jk:"Laki-laki", sekolah:"SMK Negeri 1", tgl:"2026-06-10", violations:0, h_R:82,h_I:60,h_A:50,h_S:55,h_E:70,h_C:78, hollandKode:"RCE", bf_O:65,bf_C:85,bf_E:72,bf_A:70,bf_N:35,bf_Nstabil:65, ef_umum:72,ef_akademik:55,ef_vokasional:82,ef_wirausaha:60, kog_numerik:71,kog_verbal:57,kog_logika:67,kog_total:13,kog_pct:65, skor_B:44,skor_M:29,skor_W:27, rekomendasi:"Bekerja" },
  { no:2, nama:"Sari Dewi", nisn:"0023456789", kelas:"X AKL", jk:"Perempuan", sekolah:"SMK Negeri 1", tgl:"2026-06-10", violations:0, h_R:45,h_I:85,h_A:72,h_S:60,h_E:55,h_C:68, hollandKode:"IAC", bf_O:88,bf_C:82,bf_E:55,bf_A:75,bf_N:40,bf_Nstabil:60, ef_umum:78,ef_akademik:88,ef_vokasional:60,ef_wirausaha:45, kog_numerik:86,kog_verbal:86,kog_logika:83,kog_total:18,kog_pct:90, skor_B:26,skor_M:52,skor_W:22, rekomendasi:"Kuliah" },
  { no:3, nama:"Budi Santoso", nisn:"0034567890", kelas:"X TKJ", jk:"Laki-laki", sekolah:"SMK Negeri 1", tgl:"2026-06-10", violations:1, h_R:55,h_I:60,h_A:70,h_S:72,h_E:88,h_C:45, hollandKode:"ESA", bf_O:82,bf_C:65,bf_E:90,bf_A:68,bf_N:45,bf_Nstabil:55, ef_umum:80,ef_akademik:50,ef_vokasional:58,ef_wirausaha:85, kog_numerik:43,kog_verbal:57,kog_logika:50,kog_total:10,kog_pct:50, skor_B:21,skor_M:24,skor_W:55, rekomendasi:"Wirausaha" },
  { no:4, nama:"Maya Rahayu", nisn:"0045678901", kelas:"X AKL", jk:"Perempuan", sekolah:"SMK Negeri 1", tgl:"2026-06-10", violations:0, h_R:68,h_I:55,h_A:60,h_S:78,h_E:65,h_C:80, hollandKode:"CSR", bf_O:60,bf_C:88,bf_E:62,bf_A:85,bf_N:30,bf_Nstabil:70, ef_umum:75,ef_akademik:65,ef_vokasional:80,ef_wirausaha:50, kog_numerik:57,kog_verbal:71,kog_logika:67,kog_total:13,kog_pct:65, skor_B:44,skor_M:31,skor_W:25, rekomendasi:"Bekerja" },
  { no:5, nama:"Rizki Hakim", nisn:"0056789012", kelas:"X MM", jk:"Laki-laki", sekolah:"SMK Negeri 1", tgl:"2026-06-10", violations:2, h_R:50,h_I:78,h_A:85,h_S:55,h_E:75,h_C:50, hollandKode:"AIE", bf_O:90,bf_C:60,bf_E:80,bf_A:65,bf_N:50,bf_Nstabil:50, ef_umum:65,ef_akademik:58,ef_vokasional:45,ef_wirausaha:82, kog_numerik:29,kog_verbal:43,kog_logika:33,kog_total:6,kog_pct:30, skor_B:19,skor_M:28,skor_W:53, rekomendasi:"Wirausaha" },
];

// ══════════════════════════════════════════════════════════════
// HELPERS
// ══════════════════════════════════════════════════════════════
const WBM_COLOR = { Bekerja:"#2563EB", Kuliah:"#7C3AED", Wirausaha:"#D97706" };
const WBM_BG    = { Bekerja:"#DBEAFE", Kuliah:"#EDE9FE", Wirausaha:"#FEF3C7" };
const WBM_ICON  = { Bekerja:"💼", Kuliah:"🎓", Wirausaha:"🚀" };
// Keep BMW aliases for backward compat in existing code below
const BMW_COLOR = WBM_COLOR, BMW_BG = WBM_BG, BMW_ICON = WBM_ICON;

const efKlasifikasi = (v) => {
  if (v >= 81) return { label:"Sangat Tinggi", color:"#16A34A" };
  if (v >= 61) return { label:"Tinggi", color:"#2563EB" };
  if (v >= 41) return { label:"Sedang", color:"#D97706" };
  if (v >= 21) return { label:"Rendah", color:"#EA580C" };
  return { label:"Sangat Rendah", color:"#DC2626" };
};

const kogKlasifikasi = (v) => {
  if (v >= 80) return { label:"Tinggi", color:"#16A34A" };
  if (v >= 60) return { label:"Cukup", color:"#2563EB" };
  if (v >= 40) return { label:"Sedang", color:"#D97706" };
  return { label:"Perlu Dikembangkan", color:"#DC2626" };
};

// ── Detail bidang/jurusan/usaha berdasarkan Holland dominan
const HOLLAND_DETAIL = {
  Bekerja:{R:"🔧 Teknisi/Mekanik/Operator — manufaktur, otomotif, konstruksi, elektronik.",I:"🔬 Analis/QC/Lab Teknisi — pengujian produk, riset terapan, laboratorium.",A:"🎨 Desainer/Kreatif — desain grafis, multimedia, konten digital, percetakan.",S:"🤝 CS/Perawat/Pendidik — pelayanan sosial, kesehatan, vokasi.",E:"📊 Sales/Marketing/Supervisor — penjualan, pemasaran, manajemen tim.",C:"📋 Administrasi/Keuangan/Akuntan — tata kelola, pembukuan, back-office."},
  Kuliah:{R:"🏗️ Teknik Mesin · Teknik Sipil · Teknik Elektro · D3/D4 Teknologi Industri.",I:"💻 Teknik Informatika · Ilmu Komputer · Matematika · Farmasi · Biologi.",A:"🎭 DKV · Seni Rupa · Arsitektur · Film & Televisi · Animasi.",S:"💛 Psikologi · Pendidikan · Kesehatan Masyarakat · Keperawatan · Sosiologi.",E:"🌐 Manajemen Bisnis · Komunikasi · Hukum · Administrasi Publik.",C:"💰 Akuntansi · Sistem Informasi · Manajemen Keuangan · Perpajakan."},
  Wirausaha:{R:"🔩 Bengkel/kontraktor kecil/servis elektronik/produksi barang.",I:"💡 Konsultasi IT/pengembangan aplikasi/jasa analitik.",A:"🎬 Desainer freelance/konten kreator/studio foto/fashion lokal.",S:"🌱 Kursus/les privat/katering komunitas/jasa konseling.",E:"🛒 Reseller/dropship/agen properti/event organizer.",C:"📑 Jasa perpajakan/pembukuan UMKM/apotek kecil."}
};

// ── Normalisasi row dari Google Sheets ke field JS
function normalizeRow(d) {
  const r = { ...d };
  const map = {
    "Nama":"nama","NISN":"nisn","Kelas/Jurusan":"kelas","Jenis Kelamin":"jk",
    "Sekolah":"sekolah","Tanggal Tes":"tgl","Pelanggaran":"violations",
    "H-Realistic":"h_R","H-Investigative":"h_I","H-Artistic":"h_A",
    "H-Social":"h_S","H-Enterprising":"h_E","H-Conventional":"h_C","Kode Holland":"hollandKode",
    "BF-Openness":"bf_O","BF-Conscientiousness":"bf_C","BF-Extraversion":"bf_E",
    "BF-Agreeableness":"bf_A","BF-Neuroticism":"bf_N","BF-Stabilitas":"bf_Nstabil",
    "EF-Umum":"ef_umum","EF-Akademik":"ef_akademik",
    "EF-Vokasional":"ef_vokasional","EF-Wirausaha":"ef_wirausaha",
    "KOG-Numerik":"kog_numerik","KOG-Verbal":"kog_verbal","KOG-Logika":"kog_logika",
    "KOG-Total":"kog_total","KOG-Pct":"kog_pct",
    "Skor Bekerja":"skor_B","Skor Kuliah":"skor_M","Skor Wirausaha":"skor_W",
    "REKOMENDASI WBM":"rekomendasi","Detail Rekomendasi":"detailRekomendasi",
    "Timestamp":"timestamp",
  };
  for (const [sheetKey, jsKey] of Object.entries(map)) {
    if (d[sheetKey] !== undefined && r[jsKey] === undefined) r[jsKey] = d[sheetKey];
  }
  ["h_R","h_I","h_A","h_S","h_E","h_C",
   "bf_O","bf_C","bf_E","bf_A","bf_N","bf_Nstabil",
   "ef_umum","ef_akademik","ef_vokasional","ef_wirausaha",
   "kog_numerik","kog_verbal","kog_logika","kog_total","kog_pct",
   "skor_B","skor_M","skor_W","violations"
  ].forEach(f => { if (r[f] !== undefined) r[f] = Number(r[f]) || 0; });
  if (!r.detailRekomendasi && r.rekomendasi && r.hollandKode) {
    r.detailRekomendasi = HOLLAND_DETAIL[r.rekomendasi]?.[String(r.hollandKode)[0]] || "";
  }
  return r;
}

function Badge({ val }) {
  return (
    <span style={{ background:BMW_BG[val]||"#f3f4f6", color:BMW_COLOR[val]||"#374151", fontWeight:700, fontSize:11, padding:"3px 10px", borderRadius:20 }}>
      {BMW_ICON[val]} {val}
    </span>
  );
}

function ScoreBar({ label, value, color }) {
  return (
    <div style={{ marginBottom:8 }}>
      <div style={{ display:"flex", justifyContent:"space-between", fontSize:12, fontWeight:600, marginBottom:4 }}>
        <span>{label}</span><span style={{ color }}>{value}%</span>
      </div>
      <div style={{ background:"#E5E7EB", borderRadius:4, height:8, overflow:"hidden" }}>
        <div style={{ width:`${value}%`, height:"100%", background:color, borderRadius:4, transition:"width .8s ease" }} />
      </div>
    </div>
  );
}

function EfikasiBar({ label, value, icon }) {
  const kls = efKlasifikasi(value);
  return (
    <div style={{ marginBottom:10 }}>
      <div style={{ display:"flex", justifyContent:"space-between", fontSize:12, fontWeight:600, marginBottom:3 }}>
        <span>{icon} {label}</span>
        <span style={{ display:"flex", gap:6, alignItems:"center" }}>
          <span style={{ fontSize:10, background:kls.color+"22", color:kls.color, padding:"1px 7px", borderRadius:10, fontWeight:700 }}>{kls.label}</span>
          <span style={{ color:kls.color, fontWeight:800 }}>{value}%</span>
        </span>
      </div>
      <div style={{ background:"#E5E7EB", borderRadius:4, height:8, overflow:"hidden" }}>
        <div style={{ width:`${value}%`, height:"100%", background:kls.color, borderRadius:4 }} />
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// LAPORAN PDF
// ══════════════════════════════════════════════════════════════
function cetakLaporan(siswa) {
  const win = window.open("", "_blank");
  const rekDesc = {
    Bekerja:"Berdasarkan profil psikologis Anda, kecenderungan terbesar mengarah pada jalur BEKERJA setelah lulus SMK. Anda memiliki orientasi praktis yang kuat, ketekunan, dan efikasi vokasional tinggi yang mendukung kesiapan terjun ke dunia kerja.",
    Kuliah:"Berdasarkan profil psikologis Anda, kecenderungan terbesar mengarah pada jalur MELANJUTKAN KULIAH. Anda memiliki keterbukaan intelektual, kemampuan berpikir analitis, dan efikasi akademik yang mendukung keberhasilan di perguruan tinggi.",
    Wirausaha:"Berdasarkan profil psikologis Anda, kecenderungan terbesar mengarah pada jalur WIRAUSAHA. Anda memiliki jiwa kepemimpinan, keberanian mengambil risiko, dan efikasi kewirausahaan yang menjadi modal utama membangun usaha mandiri."
  };
  const saranMap = {
    Bekerja:["Persiapkan portofolio keterampilan teknis dari jurusan SMK secara profesional","Ikuti program magang/PKL dengan serius untuk membangun relasi kerja nyata","Kejar sertifikasi kompetensi relevan (LSP/BNSP) untuk meningkatkan nilai jual","Manfaatkan bursa kerja dan job fair yang diadakan sekolah atau Disnaker","Kembangkan soft skill komunikasi dan etos kerja untuk memperkuat profil kerja"],
    Kuliah:["Riset perguruan tinggi yang memiliki program sesuai jurusan SMK (Politeknik, D3, S1)","Persiapkan diri untuk seleksi SNBP/SNBT dan cari informasi beasiswa sejak dini","Tingkatkan kemampuan literasi, numerasi, dan bahasa Inggris untuk seleksi","Bangun prestasi akademik di SMK sebagai bahan portofolio pendaftaran","Konsultasikan pilihan prodi dengan guru BK dan pertimbangkan biaya pendidikan"],
    Wirausaha:["Validasi ide usaha kecil di lingkungan sekitar — mulai tanpa modal besar","Bangun jaringan (networking) dan cari mentor wirausaha dari komunitas SMK atau UMKM","Manfaatkan program Wirausaha Muda, inkubator bisnis, atau kompetisi startup","Pelajari dasar-dasar manajemen keuangan, pemasaran digital, dan legalitas usaha","Bergabung dengan komunitas pengusaha muda dan aktif mengikuti pelatihan vokasi"]
  };
  const efKlsLabel = (v) => v>=81?"Sangat Tinggi":v>=61?"Tinggi":v>=41?"Sedang":v>=21?"Rendah":"Sangat Rendah";

  const html = `<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="UTF-8">
<title>Laporan BMW — ${siswa.nama}</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:'Plus Jakarta Sans',sans-serif;background:#fff;color:#111;font-size:13px;line-height:1.6}
  @media print{body{-webkit-print-color-adjust:exact;print-color-adjust:exact}}
  .page{max-width:780px;margin:0 auto;padding:32px}
  .header{background:#111;color:#fff;border-radius:12px;padding:28px;margin-bottom:20px;display:flex;align-items:center;gap:20px}
  .rek-box{border-radius:12px;padding:24px;margin-bottom:20px;text-align:center}
  .rek-box h2{font-size:28px;font-weight:800;margin-bottom:8px}
  .rek-box p{font-size:13px;opacity:.9;line-height:1.7}
  .grid2{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:16px}
  .card{border:1px solid #e5e7eb;border-radius:10px;padding:18px;margin-bottom:16px}
  .card h3{font-size:13px;font-weight:700;margin-bottom:12px}
  .score-row{display:flex;justify-content:space-between;font-size:12px;padding:4px 0;border-bottom:1px solid #f3f4f6}
  .score-row:last-child{border-bottom:none}
  .bar-wrap{margin-bottom:8px}
  .bar-label{display:flex;justify-content:space-between;font-size:11px;font-weight:600;margin-bottom:3px}
  .bar-bg{background:#e5e7eb;border-radius:4px;height:10px;overflow:hidden}
  .bar-fill{height:100%;border-radius:4px}
  .ef-row{display:flex;justify-content:space-between;font-size:12px;padding:5px 0;border-bottom:1px solid #f3f4f6;align-items:center}
  .ef-badge{font-size:10px;padding:2px 8px;border-radius:10px;font-weight:700}
  .saran-list li{padding:5px 0;border-bottom:1px solid #f3f4f6;font-size:12px;list-style:none;display:flex;gap:8px}
  .info-grid{display:grid;grid-template-columns:1fr 1fr;gap:6px;font-size:12px}
  .info-row{display:flex;gap:8px;padding:4px 0;border-bottom:1px solid #f3f4f6}
  .info-key{color:#6b7280;min-width:100px}
  .info-val{font-weight:600}
  .print-btn{background:#111;color:#fff;border:none;padding:12px 24px;border-radius:8px;font-size:14px;font-weight:700;cursor:pointer;margin-bottom:20px;font-family:inherit}
  @media print{.print-btn{display:none}}
</style>
</head>
<body>
<div class="page">
  <button class="print-btn" onclick="window.print()">🖨️ Cetak / Simpan PDF</button>
  <div class="header">
    <div style="font-size:40px">📋</div>
    <div>
      <div style="font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:#888;margin-bottom:4px">Laporan Hasil Tes Karir Terpadu</div>
      <div style="font-size:22px;font-weight:800">Analisis BMW — SMK Kelas 1</div>
      <div style="font-size:12px;color:#aaa;margin-top:2px">Holland RIASEC · Big Five Personality · Efikasi Diri</div>
    </div>
  </div>

  ${(siswa.violations||0)>0?`<div style="background:#FEE2E2;border:1px solid #FCA5A5;border-radius:8px;padding:10px 14px;font-size:12px;color:#DC2626;margin-bottom:16px">⚠️ Terdeteksi ${siswa.violations} pelanggaran (pindah tab) selama tes berlangsung.</div>`:''}

  <div class="card">
    <h3>👤 Data Diri Siswa</h3>
    <div class="info-grid">
      <div class="info-row"><span class="info-key">Nama</span><span class="info-val">${siswa.nama}</span></div>
      <div class="info-row"><span class="info-key">NISN</span><span class="info-val">${siswa.nisn||'-'}</span></div>
      <div class="info-row"><span class="info-key">Kelas/Jurusan</span><span class="info-val">${siswa.kelas}</span></div>
      <div class="info-row"><span class="info-key">Jenis Kelamin</span><span class="info-val">${siswa.jk||'-'}</span></div>
      <div class="info-row"><span class="info-key">Sekolah</span><span class="info-val">${siswa.sekolah||'-'}</span></div>
      <div class="info-row"><span class="info-key">Tanggal Tes</span><span class="info-val">${siswa.tgl||'-'}</span></div>
    </div>
  </div>

  <div class="rek-box" style="background:${BMW_COLOR[siswa.rekomendasi]};color:#fff">
    <div style="font-size:11px;letter-spacing:.12em;text-transform:uppercase;opacity:.8;margin-bottom:8px">Rekomendasi Jalur Karir</div>
    <h2>${BMW_ICON[siswa.rekomendasi]} ${siswa.rekomendasi==='Kuliah'?'Melanjutkan Kuliah':siswa.rekomendasi}</h2>
    <p>${rekDesc[siswa.rekomendasi]}</p>
  </div>

  <div class="card">
    <h3>📊 Skor BMW</h3>
    ${[['💼 Bekerja',siswa.skor_B,'#2563EB'],['🎓 Melanjutkan Kuliah',siswa.skor_M,'#7C3AED'],['🚀 Wirausaha',siswa.skor_W,'#D97706']]
      .map(([l,v,c])=>`<div class="bar-wrap"><div class="bar-label"><span>${l}</span><span style="color:${c}">${v}%</span></div><div class="bar-bg"><div class="bar-fill" style="width:${v}%;background:${c}"></div></div></div>`).join('')}
  </div>

  ${(()=>{
    const det = siswa.detailRekomendasi || (HOLLAND_DETAIL[siswa.rekomendasi]?.[String(siswa.hollandKode||'')[0]]) || '';
    const label = siswa.rekomendasi==='Bekerja'?'🔎 Bidang Pekerjaan yang Sesuai':siswa.rekomendasi==='Kuliah'?'🎓 Rekomendasi Jurusan':'🚀 Bidang Wirausaha yang Sesuai';
    const c = BMW_COLOR[siswa.rekomendasi];
    return det ? `<div class="card" style="background:${BMW_BG[siswa.rekomendasi]};border:1.5px solid ${c}40">
      <h3 style="color:${c}">${label}</h3>
      <div style="font-size:13px;color:#111;line-height:1.7">${det}</div>
    </div>` : '';
  })()}

  <div class="grid2">
    <div class="card">
      <h3>🎯 Holland RIASEC <span style="font-weight:400;color:#6b7280;font-size:11px">(kode: ${siswa.hollandKode||'—'})</span></h3>
      ${[['R','Realistic',siswa.h_R,'#3B82F6'],['I','Investigative',siswa.h_I,'#8B5CF6'],['A','Artistic',siswa.h_A,'#EC4899'],['S','Social',siswa.h_S,'#10B981'],['E','Enterprising',siswa.h_E,'#F59E0B'],['C','Conventional',siswa.h_C,'#6B7280']]
        .sort((a,b)=>b[2]-a[2]).map(([k,l,v,c])=>`<div class="score-row"><span>${k} — ${l}</span><span style="font-weight:700;color:${c}">${v}%</span></div>`).join('')}
    </div>
    <div class="card">
      <h3>🧬 Big Five Personality</h3>
      ${[['O','Openness',siswa.bf_O,'#7C3AED'],['C','Conscientiousness',siswa.bf_C,'#2563EB'],['E','Extraversion',siswa.bf_E,'#F59E0B'],['A','Agreeableness',siswa.bf_A,'#10B981'],['N','Neuroticism',siswa.bf_N,'#EF4444']]
        .map(([k,l,v,c])=>`<div class="score-row"><span>${k} — ${l}</span><span style="font-weight:700;color:${c}">${v}%</span></div>`).join('')}
    </div>
  </div>

  <div class="card">
    <h3>💪 Efikasi Diri</h3>
    ${[['⚡','Efikasi Diri Umum',siswa.ef_umum,'#6D28D9'],['📖','Efikasi Akademik (→Kuliah)',siswa.ef_akademik,'#0D9488'],['🔧','Efikasi Vokasional (→Bekerja)',siswa.ef_vokasional,'#2563EB'],['🚀','Efikasi Kewirausahaan (→Wirausaha)',siswa.ef_wirausaha,'#D97706']]
      .map(([icon,l,v,c])=>`<div class="ef-row"><span>${icon} ${l}</span><span style="display:flex;gap:8px;align-items:center"><span class="ef-badge" style="background:${c}22;color:${c}">${efKlsLabel(v)}</span><span style="font-weight:800;color:${c}">${v}%</span></span></div>`).join('')}
    <div style="background:#F9FAFB;border-radius:8px;padding:10px;margin-top:12px;font-size:11px;color:#6B7280;line-height:1.7">
      <strong>Panduan:</strong> ≥81% Sangat Tinggi · 61–80% Tinggi · 41–60% Sedang · 21–40% Rendah · &lt;21% Sangat Rendah
    </div>
  </div>

  <div class="card">
    <h3>🧠 Kemampuan Kognitif</h3>
    <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;margin-bottom:14px">
      ${[['Numerik',siswa.kog_numerik,'#D97706','7 soal'],['Verbal',siswa.kog_verbal,'#7C3AED','7 soal'],['Logika',siswa.kog_logika,'#0D9488','6 soal']].map(([l,v,c,sub])=>{
        const kl=v>=80?'Tinggi':v>=60?'Cukup':v>=40?'Sedang':'Perlu Dikembangkan';
        return `<div style="background:${c}12;border:1px solid ${c}30;border-radius:10px;padding:12px;text-align:center">
          <div style="font-size:11px;color:${c};font-weight:700;margin-bottom:4px">${l}</div>
          <div style="font-size:24px;font-weight:800;color:${c}">${v||0}%</div>
          <div style="font-size:10px;color:#888;margin-top:2px">${sub} · ${kl}</div>
          <div style="background:#e5e7eb;border-radius:4px;height:6px;overflow:hidden;margin-top:8px">
            <div style="width:${v||0}%;height:100%;background:${c};border-radius:4px"></div>
          </div>
        </div>`;
      }).join('')}
    </div>
    <div style="background:#FEF3C7;border:1px solid #FCD34D;border-radius:8px;padding:10px 14px;font-size:12px;display:flex;justify-content:space-between;align-items:center">
      <span>Total benar: <strong>${siswa.kog_total||0}/20 soal</strong></span>
      <span style="font-weight:800;font-size:14px;color:${(siswa.kog_pct||0)>=75?'#16A34A':(siswa.kog_pct||0)>=50?'#D97706':'#DC2626'}">${siswa.kog_pct||0}% — ${(siswa.kog_pct||0)>=80?'Tinggi':(siswa.kog_pct||0)>=60?'Cukup':(siswa.kog_pct||0)>=40?'Sedang':'Perlu Dikembangkan'}</span>
    </div>
    <div style="font-size:11px;color:#888;margin-top:8px;line-height:1.6">
      <strong>Catatan:</strong> Skor kognitif berkontribusi pada skor WBM final (bobot 15–20%). 
      Numerik & Logika mendukung jalur Bekerja dan Kuliah. Logika & Verbal mendukung jalur Wirausaha.
    </div>
  </div>

  <div class="card">
    <h3>💡 Saran Pengembangan</h3>
    <ul class="saran-list">
      ${(saranMap[siswa.rekomendasi]||[]).map(s=>`<li><span>✅</span><span>${s}</span></li>`).join('')}
    </ul>
  </div>

  <div style="text-align:center;font-size:11px;color:#aaa;margin-top:24px;padding-top:16px;border-top:1px solid #e5e7eb">
    <p>Laporan ini digenerate oleh Sistem Tes WBM SMK · ${new Date().toLocaleDateString('id-ID',{day:'numeric',month:'long',year:'numeric'})}</p>
    <p style="margin-top:4px">Hasil bersifat panduan awal — konsultasikan dengan guru BK untuk pendalaman lebih lanjut</p>
  </div>
</div>
</body>
</html>`;

  win.document.write(html);
  win.document.close();
}

// ══════════════════════════════════════════════════════════════
// VIEW PESERTA — Cari hasil dengan NISN
// ══════════════════════════════════════════════════════════════
function ViewPeserta({ onBack }) {
  const [nisn, setNisn] = useState("");
  const [hasil, setHasil] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const cariHasil = async () => {
    if (!nisn.trim()) { setError("Masukkan NISN terlebih dahulu."); return; }
    setError(""); setLoading(true); setHasil(null);
    try {
      if (APPS_SCRIPT_URL.includes("GANTI")) {
        // Demo mode: cari dari DEMO_DATA
        const found = DEMO_DATA.find(d => d.nisn === nisn.trim());
        setTimeout(() => {
          if (found) setHasil(found);
          else setError("Data dengan NISN tersebut belum ditemukan. Pastikan tes sudah selesai dikerjakan.");
          setLoading(false);
        }, 600);
        return;
      }
      const res = await fetch(`${APPS_SCRIPT_URL}?action=getByNisn&nisn=${nisn.trim()}`);
      const json = await res.json();
      if (json.status === "ok" && json.data) setHasil(json.data);
      else setError("Data dengan NISN tersebut belum ditemukan.");
    } catch {
      setError("Gagal menghubungi server. Coba lagi.");
    }
    setLoading(false);
  };

  const s = {
    wrap: { fontFamily:"'Plus Jakarta Sans',sans-serif", background:"#F7F6F3", minHeight:"100vh", color:"#111" },
    hdr: { background:"#111110", color:"#fff", padding:"20px 24px" },
    main: { maxWidth:640, margin:"0 auto", padding:"28px 16px" },
    card: { background:"#fff", border:"1px solid #E4E0D8", borderRadius:12, padding:20, marginBottom:16 },
  };

  return (
    <div style={s.wrap}>
      <div style={s.hdr}>
        <div style={{ maxWidth:640, margin:"0 auto" }}>
          <div style={{ fontSize:10, letterSpacing:".12em", textTransform:"uppercase", color:"#888", marginBottom:4 }}>Cek Hasil Tes</div>
          <div style={{ fontSize:20, fontWeight:800 }}>🎯 BMW Karir — Hasil Saya</div>
          <div style={{ fontSize:11, color:"#888", marginTop:2 }}>Masukkan NISN untuk melihat rekomendasi karir Anda</div>
        </div>
      </div>
      <div style={s.main}>
        <div style={s.card}>
          <div style={{ fontSize:13, fontWeight:700, marginBottom:14 }}>📋 Masukkan NISN Anda</div>
          <div style={{ display:"flex", gap:10 }}>
            <input
              value={nisn} onChange={e=>setNisn(e.target.value)}
              onKeyDown={e=>e.key==="Enter"&&cariHasil()}
              placeholder="Contoh: 0012345678"
              style={{ flex:1, border:"1.5px solid #E4E0D8", borderRadius:8, padding:"10px 14px", fontSize:14, fontFamily:"inherit", outline:"none" }}
            />
            <button onClick={cariHasil} disabled={loading}
              style={{ background:"#111", color:"#fff", border:"none", borderRadius:8, padding:"10px 20px", fontSize:13, fontWeight:700, cursor:"pointer", fontFamily:"inherit", whiteSpace:"nowrap" }}>
              {loading ? "⏳" : "🔍 Cari"}
            </button>
          </div>
          {error && <div style={{ background:"#FEE2E2", border:"1px solid #FCA5A5", borderRadius:8, padding:"10px 14px", fontSize:12, color:"#DC2626", marginTop:12 }}>{error}</div>}
        </div>

        {hasil && (
          <>
            <div style={{ ...s.card, background:BMW_COLOR[hasil.rekomendasi], color:"#fff", textAlign:"center" }}>
              <div style={{ fontSize:11, letterSpacing:".1em", textTransform:"uppercase", opacity:.8, marginBottom:8 }}>Rekomendasi Jalur Karir</div>
              <div style={{ fontSize:32 }}>{BMW_ICON[hasil.rekomendasi]}</div>
              <div style={{ fontSize:26, fontWeight:800, marginTop:6 }}>
                {hasil.rekomendasi === "Kuliah" ? "Melanjutkan Kuliah" : hasil.rekomendasi}
              </div>
              <div style={{ fontSize:12, opacity:.85, marginTop:8 }}>{hasil.nama} · {hasil.kelas}</div>
            </div>

            <div style={s.card}>
              <div style={{ fontWeight:700, marginBottom:12 }}>📊 Skor BMW</div>
              <ScoreBar label="💼 Bekerja" value={hasil.skor_B} color="#2563EB" />
              <ScoreBar label="🎓 Melanjutkan Kuliah" value={hasil.skor_M} color="#7C3AED" />
              <ScoreBar label="🚀 Wirausaha" value={hasil.skor_W} color="#D97706" />

              {/* DETAIL REKOMENDASI */}
              {(hasil.detailRekomendasi || HOLLAND_DETAIL[hasil.rekomendasi]?.[String(hasil.hollandKode||'')[0]]) && (
                <div style={{ background:BMW_BG[hasil.rekomendasi], border:`1.5px solid ${BMW_COLOR[hasil.rekomendasi]}40`, borderRadius:10, padding:"12px 16px", marginTop:4 }}>
                  <div style={{ fontSize:10, fontWeight:800, letterSpacing:".1em", textTransform:"uppercase", color:BMW_COLOR[hasil.rekomendasi], marginBottom:5 }}>
                    {hasil.rekomendasi==="Bekerja" ? "🔎 Bidang Pekerjaan yang Sesuai" : hasil.rekomendasi==="Kuliah" ? "🎓 Rekomendasi Jurusan" : "🚀 Bidang Wirausaha yang Sesuai"}
                  </div>
                  <div style={{ fontSize:13, color:"#111", lineHeight:1.6 }}>
                    {hasil.detailRekomendasi || HOLLAND_DETAIL[hasil.rekomendasi]?.[String(hasil.hollandKode||'')[0]] || "—"}
                  </div>
                </div>
              )}
            </div>

            <div style={s.card}>
              <div style={{ fontWeight:700, marginBottom:12 }}>💪 Efikasi Diri</div>
              <EfikasiBar label="Efikasi Umum" value={hasil.ef_umum} icon="⚡" />
              <EfikasiBar label="Efikasi Akademik" value={hasil.ef_akademik} icon="📖" />
              <EfikasiBar label="Efikasi Vokasional" value={hasil.ef_vokasional} icon="🔧" />
              <EfikasiBar label="Efikasi Kewirausahaan" value={hasil.ef_wirausaha} icon="🚀" />
            </div>

            <div style={s.card}>
              <div style={{ fontWeight:700, marginBottom:12 }}>🎯 Profil Holland RIASEC</div>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:6, fontSize:12 }}>
                {[['R','Realistic','#3B82F6'],['I','Investigative','#8B5CF6'],['A','Artistic','#EC4899'],['S','Social','#10B981'],['E','Enterprising','#F59E0B'],['C','Conventional','#6B7280']].map(([k,l,c])=>(
                  <div key={k} style={{ display:"flex", justifyContent:"space-between", padding:"4px 8px", background:"#F9FAFB", borderRadius:6 }}>
                    <span>{k} — {l}</span><span style={{ fontWeight:700, color:c }}>{hasil[`h_${k}`]}%</span>
                  </div>
                ))}
              </div>
            </div>

            <button onClick={()=>cetakLaporan(hasil)}
              style={{ width:"100%", background:"#111", color:"#fff", border:"none", borderRadius:10, padding:14, fontSize:14, fontWeight:700, cursor:"pointer", fontFamily:"inherit" }}>
              🖨️ Cetak Laporan PDF Lengkap
            </button>
          </>
        )}

        <div style={{ textAlign:"center", marginTop:20 }}>
          <button onClick={onBack}
            style={{ background:"none", border:"1.5px solid #E4E0D8", borderRadius:8, padding:"8px 20px", fontSize:12, fontWeight:700, cursor:"pointer", color:"#666", fontFamily:"inherit" }}>
            ← Kembali
          </button>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// LOGIN PANITIA
// ══════════════════════════════════════════════════════════════
function LoginPanitia({ onLogin }) {
  const [pw, setPw] = useState("");
  const [error, setError] = useState("");

  const tryLogin = () => {
    if (pw === PANITIA_PASSWORD) { onLogin(); }
    else { setError("Password salah. Coba lagi."); setPw(""); }
  };

  return (
    <div style={{ fontFamily:"'Plus Jakarta Sans',sans-serif", background:"#111110", minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", padding:20 }}>
      <div style={{ background:"#1c1c1a", border:"1px solid #333", borderRadius:16, padding:"36px 32px", width:"100%", maxWidth:400 }}>
        <div style={{ textAlign:"center", marginBottom:28 }}>
          <div style={{ fontSize:40, marginBottom:12 }}>🔐</div>
          <div style={{ fontSize:11, letterSpacing:".14em", textTransform:"uppercase", color:"#666", marginBottom:6 }}>Dashboard Panitia</div>
          <div style={{ fontSize:22, fontWeight:800, color:"#fff" }}>BMW Karir — SMK</div>
          <div style={{ fontSize:12, color:"#666", marginTop:4 }}>Masukkan password untuk melanjutkan</div>
        </div>
        <input
          type="password" value={pw}
          onChange={e=>setPw(e.target.value)}
          onKeyDown={e=>e.key==="Enter"&&tryLogin()}
          placeholder="Password panitia…"
          style={{ width:"100%", background:"#2a2a28", border:"1.5px solid #444", borderRadius:10, padding:"12px 16px", fontSize:15, color:"#fff", fontFamily:"inherit", outline:"none", marginBottom:10 }}
        />
        {error && <div style={{ fontSize:12, color:"#EF4444", marginBottom:10, textAlign:"center" }}>{error}</div>}
        <button onClick={tryLogin}
          style={{ width:"100%", background:"#F59E0B", color:"#111", border:"none", borderRadius:10, padding:13, fontSize:15, fontWeight:800, cursor:"pointer", fontFamily:"inherit" }}>
          Masuk →
        </button>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// HALAMAN PILIH MODE
// ══════════════════════════════════════════════════════════════
function HalamanPilih({ onPeserta, onPanitia }) {
  return (
    <div style={{ fontFamily:"'Plus Jakarta Sans',sans-serif", background:"#111110", minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", padding:20 }}>
      <div style={{ textAlign:"center", width:"100%", maxWidth:520 }}>
        <div style={{ fontSize:52, marginBottom:16 }}>🎯</div>
        <div style={{ fontSize:11, letterSpacing:".14em", textTransform:"uppercase", color:"#888", marginBottom:8 }}>Sistem Tes Karir</div>
        <div style={{ fontSize:28, fontWeight:800, color:"#fff", marginBottom:4 }}>WBM — SMK</div>
        <div style={{ fontSize:13, color:"#666", marginBottom:40 }}>Wirausaha · Bekerja · Melanjutkan Kuliah</div>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
          <button onClick={onPeserta}
            style={{ background:"#1c1c1a", border:"1.5px solid #333", borderRadius:14, padding:"28px 20px", cursor:"pointer", textAlign:"center", transition:"border-color .2s" }}
            onMouseEnter={e=>e.currentTarget.style.borderColor="#F59E0B"}
            onMouseLeave={e=>e.currentTarget.style.borderColor="#333"}>
            <div style={{ fontSize:32, marginBottom:10 }}>🎓</div>
            <div style={{ fontSize:15, fontWeight:700, color:"#fff", marginBottom:6 }}>Saya Peserta</div>
            <div style={{ fontSize:12, color:"#888", lineHeight:1.6 }}>Lihat hasil tes dengan memasukkan NISN</div>
          </button>
          <button onClick={onPanitia}
            style={{ background:"#1c1c1a", border:"1.5px solid #333", borderRadius:14, padding:"28px 20px", cursor:"pointer", textAlign:"center", transition:"border-color .2s" }}
            onMouseEnter={e=>e.currentTarget.style.borderColor="#F59E0B"}
            onMouseLeave={e=>e.currentTarget.style.borderColor="#333"}>
            <div style={{ fontSize:32, marginBottom:10 }}>🔐</div>
            <div style={{ fontSize:15, fontWeight:700, color:"#fff", marginBottom:6 }}>Saya Panitia</div>
            <div style={{ fontSize:12, color:"#888", lineHeight:1.6 }}>Dashboard lengkap dengan password</div>
          </button>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// CETAK SEMUA PDF (satu dokumen untuk semua / filtered siswa)
// ══════════════════════════════════════════════════════════════
function cetakSemuaPDF(siswaList, judulFilter = "Semua Siswa") {
  if (!siswaList || siswaList.length === 0) {
    alert("Tidak ada data siswa untuk dicetak.");
    return;
  }
  const win = window.open("", "_blank");

  const efKlsLabel = (v) => v>=81?"Sangat Tinggi":v>=61?"Tinggi":v>=41?"Sedang":v>=21?"Rendah":"Sangat Rendah";
  const kogLabel = (v) => v>=80?"Tinggi":v>=60?"Cukup":v>=40?"Sedang":"Perlu Dikembangkan";
  const rekDesc = {
    Bekerja:"Memiliki orientasi praktis, ketekunan, dan efikasi vokasional tinggi.",
    Kuliah:"Memiliki keterbukaan intelektual, kemampuan analitis, dan efikasi akademik tinggi.",
    Wirausaha:"Memiliki jiwa kepemimpinan, keberanian mengambil risiko, dan efikasi kewirausahaan tinggi."
  };

  const stats = {
    total: siswaList.length,
    bekerja: siswaList.filter(d=>d.rekomendasi==="Bekerja").length,
    kuliah: siswaList.filter(d=>d.rekomendasi==="Kuliah").length,
    wirausaha: siswaList.filter(d=>d.rekomendasi==="Wirausaha").length,
  };

  // Halaman ringkasan di awal
  const ringkasanHTML = `
  <div class="page page-break">
    <div class="cover-header">
      <div style="font-size:40px;margin-bottom:12px">📋</div>
      <div style="font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:#888;margin-bottom:6px">Laporan Hasil Tes Karir WBM SMK</div>
      <div style="font-size:26px;font-weight:800">Rekap ${judulFilter}</div>
      <div style="font-size:12px;color:#aaa;margin-top:6px">Dicetak: ${new Date().toLocaleDateString('id-ID',{weekday:'long',day:'numeric',month:'long',year:'numeric'})}</div>
    </div>
    <div class="stat-grid">
      <div class="stat-box" style="background:#F7F6F3"><div class="stat-num" style="color:#111">${stats.total}</div><div class="stat-lbl">Total Peserta</div></div>
      <div class="stat-box" style="background:#DBEAFE"><div class="stat-num" style="color:#2563EB">${stats.bekerja}</div><div class="stat-lbl">💼 Bekerja</div></div>
      <div class="stat-box" style="background:#EDE9FE"><div class="stat-num" style="color:#7C3AED">${stats.kuliah}</div><div class="stat-lbl">🎓 Kuliah</div></div>
      <div class="stat-box" style="background:#FEF3C7"><div class="stat-num" style="color:#D97706">${stats.wirausaha}</div><div class="stat-lbl">🚀 Wirausaha</div></div>
    </div>
    <table class="rekap-table">
      <thead>
        <tr><th>No</th><th>Nama</th><th>NISN</th><th>Kelas</th><th>Rekomendasi</th><th>Bekerja</th><th>Kuliah</th><th>Wirausaha</th><th>Kognitif</th><th>Holland</th><th>⚠️</th></tr>
      </thead>
      <tbody>
        ${siswaList.map((d,i)=>`
        <tr class="rek-${d.rekomendasi}">
          <td>${i+1}</td>
          <td style="font-weight:600">${d.nama||'—'}</td>
          <td>${d.nisn||'—'}</td>
          <td>${d.kelas||'—'}</td>
          <td><span class="badge-${d.rekomendasi}">${d.rekomendasi==="Kuliah"?"🎓 Kuliah":d.rekomendasi==="Bekerja"?"💼 Bekerja":"🚀 Wirausaha"}</span></td>
          <td>${d.skor_B||0}%</td>
          <td>${d.skor_M||0}%</td>
          <td>${d.skor_W||0}%</td>
          <td>${d.kog_pct||0}%</td>
          <td style="font-family:monospace;font-weight:700">${d.hollandKode||'—'}</td>
          <td>${(d.violations||0)>0?`<span style="color:#DC2626;font-weight:700">${d.violations}x</span>`:'—'}</td>
        </tr>`).join('')}
      </tbody>
    </table>
  </div>`;

  // Satu halaman per siswa
  const siswaPages = siswaList.map(siswa => {
    const s2 = normalizeRow(siswa);
    const c = {Bekerja:"#2563EB",Kuliah:"#7C3AED",Wirausaha:"#D97706"}[s2.rekomendasi]||"#111";
    const detail = s2.detailRekomendasi || (HOLLAND_DETAIL[s2.rekomendasi]?.[String(s2.hollandKode||'')[0]] ?? '');
    return `
    <div class="page page-break">
      <div class="page-header">
        <div>
          <div style="font-size:10px;letter-spacing:.1em;text-transform:uppercase;color:#888">Laporan Individual — Tes Karir WBM SMK</div>
          <div style="font-size:18px;font-weight:800;margin-top:3px">${s2.nama||'—'}</div>
          <div style="font-size:11px;color:#aaa">${s2.kelas||''} · ${s2.sekolah||''} · NISN: ${s2.nisn||'—'}</div>
        </div>
        <div style="font-size:10px;color:#aaa;text-align:right">${s2.tgl||''}</div>
      </div>
      ${(s2.violations||0)>0?`<div class="warn-box">⚠️ Terdeteksi ${s2.violations} pelanggaran selama tes</div>`:''}
      <div class="rek-box-full" style="background:${c}">
        <div style="font-size:10px;letter-spacing:.1em;text-transform:uppercase;opacity:.8;margin-bottom:6px">Rekomendasi Jalur Karir</div>
        <div style="font-size:22px;font-weight:800">${{Bekerja:"💼 Bekerja",Kuliah:"🎓 Melanjutkan Kuliah",Wirausaha:"🚀 Wirausaha"}[s2.rekomendasi]}</div>
        <div style="font-size:12px;margin-top:8px;opacity:.9">${rekDesc[s2.rekomendasi]||''}</div>
      </div>
      ${detail?`<div class="detail-box" style="border-left:3px solid ${c};background:${c}10"><span style="font-weight:700;color:${c}">Detail Bidang: </span>${detail}</div>`:''}
      <div class="grid3">
        <div class="mini-card" style="background:#EFF6FF;border:1px solid #BFDBFE">
          <div style="font-size:10px;font-weight:700;color:#2563EB">💼 Skor Bekerja</div>
          <div style="font-size:26px;font-weight:800;color:#2563EB">${s2.skor_B||0}%</div>
        </div>
        <div class="mini-card" style="background:#F5F3FF;border:1px solid #DDD6FE">
          <div style="font-size:10px;font-weight:700;color:#7C3AED">🎓 Skor Kuliah</div>
          <div style="font-size:26px;font-weight:800;color:#7C3AED">${s2.skor_M||0}%</div>
        </div>
        <div class="mini-card" style="background:#FFFBEB;border:1px solid #FDE68A">
          <div style="font-size:10px;font-weight:700;color:#D97706">🚀 Skor Wirausaha</div>
          <div style="font-size:26px;font-weight:800;color:#D97706">${s2.skor_W||0}%</div>
        </div>
      </div>
      <div class="grid2">
        <div>
          <div class="section-title">🎯 Holland RIASEC</div>
          <div style="font-family:monospace;font-size:28px;font-weight:800;color:#2563EB;margin-bottom:8px">${s2.hollandKode||'—'}</div>
          ${[['R','#3B82F6'],['I','#8B5CF6'],['A','#EC4899'],['S','#10B981'],['E','#F59E0B'],['C','#6B7280']].map(([k,col])=>`
            <div class="bar-row">
              <span style="min-width:12px;font-weight:700;color:${col}">${k}</span>
              <div class="bar-bg"><div class="bar-fill" style="width:${s2[`h_${k}`]||0}%;background:${col}"></div></div>
              <span style="font-weight:700;color:${col}">${s2[`h_${k}`]||0}%</span>
            </div>`).join('')}
        </div>
        <div>
          <div class="section-title">🧬 Big Five</div>
          ${[['O','Openness','#7C3AED'],['C','Conscientiousness','#2563EB'],['E','Extraversion','#F59E0B'],['A','Agreeableness','#10B981'],['N','Neuroticism','#EF4444']].map(([k,l,col])=>`
            <div class="bar-row">
              <span style="min-width:12px;font-weight:700;color:${col}">${k}</span>
              <div class="bar-bg"><div class="bar-fill" style="width:${s2[`bf_${k}`]||0}%;background:${col}"></div></div>
              <span style="font-weight:700;color:${col}">${s2[`bf_${k}`]||0}%</span>
            </div>`).join('')}
        </div>
      </div>
      <div class="section-title">💪 Efikasi Diri</div>
      ${[['ef_umum','⚡ Efikasi Umum','#6D28D9'],['ef_akademik','📖 Akademik','#0D9488'],['ef_vokasional','🔧 Vokasional','#2563EB'],['ef_wirausaha','🚀 Kewirausahaan','#D97706']].map(([k,l,col])=>`
        <div class="ef-row2">
          <span>${l}</span>
          <span class="ef-badge2" style="background:${col}22;color:${col}">${efKlsLabel(s2[k]||0)}</span>
          <span style="font-weight:800;color:${col};min-width:36px;text-align:right">${s2[k]||0}%</span>
        </div>`).join('')}
      <div class="section-title" style="margin-top:12px">🧠 Kemampuan Kognitif</div>
      <div class="grid3" style="margin-top:8px">
        ${[['Numerik',s2.kog_numerik,'#D97706','7 soal'],['Verbal',s2.kog_verbal,'#7C3AED','7 soal'],['Logika',s2.kog_logika,'#0D9488','6 soal']].map(([l,v,col,sub])=>`
          <div class="mini-card" style="background:${col}10;border:1px solid ${col}30;text-align:center">
            <div style="font-size:10px;font-weight:700;color:${col}">${l} (${sub})</div>
            <div style="font-size:22px;font-weight:800;color:${col}">${v||0}%</div>
            <div style="font-size:9px;color:#888">${kogLabel(v||0)}</div>
          </div>`).join('')}
      </div>
      <div class="kog-total">🧠 Total: <strong>${s2.kog_total||0}/20 benar · ${s2.kog_pct||0}% · ${kogLabel(s2.kog_pct||0)}</strong></div>
    </div>`;
  }).join('');

  const html = `<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="UTF-8">
<title>Laporan WBM — ${judulFilter} (${siswaList.length} siswa)</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:'Plus Jakarta Sans',sans-serif;background:#fff;color:#111;font-size:12px}
  @media print{
    body{-webkit-print-color-adjust:exact;print-color-adjust:exact}
    .no-print{display:none!important}
    .page-break{page-break-before:always}
    .page-break:first-child{page-break-before:avoid}
  }
  .print-bar{background:#111;color:#fff;padding:12px 24px;display:flex;gap:10px;align-items:center;position:sticky;top:0;z-index:99}
  .print-bar button{background:#F59E0B;color:#111;border:none;padding:8px 18px;border-radius:7px;font-weight:800;font-size:13px;cursor:pointer;font-family:inherit}
  .print-bar span{font-size:13px;color:#aaa}
  .page{max-width:800px;margin:0 auto;padding:28px 32px 36px}
  .cover-header{background:#111;color:#fff;border-radius:12px;padding:28px;margin-bottom:20px;text-align:center}
  .stat-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:20px}
  .stat-box{border-radius:10px;padding:14px;text-align:center;border:1px solid #E4E0D8}
  .stat-num{font-size:28px;font-weight:800;margin-bottom:4px}
  .stat-lbl{font-size:11px;color:#6B7280;font-weight:600}
  .rekap-table{width:100%;border-collapse:collapse;font-size:11px;margin-top:8px}
  .rekap-table th{background:#111;color:#fff;padding:8px 10px;text-align:left;font-size:10px}
  .rekap-table td{padding:7px 10px;border-bottom:1px solid #E4E0D8}
  .rekap-table tr:nth-child(even){background:#FAFAF8}
  .rek-Bekerja td{border-left:3px solid #2563EB}
  .rek-Kuliah td{border-left:3px solid #7C3AED}
  .rek-Wirausaha td{border-left:3px solid #D97706}
  .badge-Bekerja{background:#DBEAFE;color:#2563EB;padding:2px 8px;border-radius:10px;font-weight:700;white-space:nowrap}
  .badge-Kuliah{background:#EDE9FE;color:#7C3AED;padding:2px 8px;border-radius:10px;font-weight:700;white-space:nowrap}
  .badge-Wirausaha{background:#FEF3C7;color:#D97706;padding:2px 8px;border-radius:10px;font-weight:700;white-space:nowrap}
  .page-header{display:flex;justify-content:space-between;align-items:flex-start;padding:16px 20px;background:#111;color:#fff;border-radius:10px;margin-bottom:14px}
  .warn-box{background:#FEE2E2;border:1px solid #FCA5A5;border-radius:7px;padding:8px 12px;font-size:11px;color:#DC2626;margin-bottom:10px}
  .rek-box-full{color:#fff;border-radius:10px;padding:16px 20px;margin-bottom:12px;text-align:center}
  .detail-box{border-radius:8px;padding:10px 14px;font-size:12px;color:#374151;line-height:1.7;margin-bottom:12px}
  .grid2{display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:12px}
  .grid3{display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px;margin-bottom:10px}
  .mini-card{border-radius:8px;padding:10px 12px}
  .section-title{font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:.08em;color:#374151;margin-bottom:6px;margin-top:10px}
  .bar-row{display:flex;align-items:center;gap:6px;margin-bottom:5px;font-size:11px}
  .bar-bg{flex:1;background:#E5E7EB;border-radius:3px;height:7px;overflow:hidden}
  .bar-fill{height:100%;border-radius:3px}
  .ef-row2{display:flex;justify-content:space-between;align-items:center;padding:4px 0;border-bottom:1px solid #F3F4F6;font-size:11px}
  .ef-badge2{font-size:10px;padding:1px 7px;border-radius:10px;font-weight:700}
  .kog-total{background:#FEF3C7;border:1px solid #FCD34D;border-radius:7px;padding:8px 12px;font-size:11px;margin-top:6px}
</style>
</head>
<body>
  <div class="no-print print-bar">
    <button onclick="window.print()">🖨️ Cetak / Simpan PDF</button>
    <span>${siswaList.length} laporan individual + 1 halaman rekap</span>
    <span style="margin-left:auto;font-size:11px">Tip: Pilih "Simpan sebagai PDF" di dialog print</span>
  </div>
  ${ringkasanHTML}
  ${siswaPages}
</body>
</html>`;

  win.document.write(html);
  win.document.close();
}

// ══════════════════════════════════════════════════════════════
// DASHBOARD PANITIA (utama)
// ══════════════════════════════════════════════════════════════
function DashboardPanitiaMain({ onLogout }) {
  const [data, setData]             = useState(DEMO_DATA);
  const [loading, setLoading]       = useState(false);
  const [search, setSearch]         = useState("");
  const [filterRek, setFilterRek]   = useState("Semua");
  const [filterKelas, setFilterKelas] = useState("Semua");
  const [selected, setSelected]     = useState(null);
  const [tab, setTab]               = useState("tabel");
  const [realtimeOn, setRealtimeOn] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [newCount, setNewCount]     = useState(0);
  const prevCountRef                = useRef(DEMO_DATA.length);
  const intervalRef                 = useRef(null);

  const fetchData = useCallback(async (silent = false) => {
    if (APPS_SCRIPT_URL.includes("GANTI")) return;
    if (!silent) setLoading(true);
    try {
      const res = await fetch(APPS_SCRIPT_URL + "?action=getData&t=" + Date.now());
      const json = await res.json();
      if (json.data) {
        const normalized = json.data.map(normalizeRow);
        setData(normalized);
        const added = normalized.length - prevCountRef.current;
        if (added > 0 && prevCountRef.current > 0) setNewCount(n => n + added);
        prevCountRef.current = normalized.length;
        setLastUpdate(new Date());
      }
    } catch {}
    if (!silent) setLoading(false);
  }, []);

  // Initial load
  useEffect(() => { fetchData(); }, [fetchData]);

  // Real-time polling
  useEffect(() => {
    if (realtimeOn) {
      intervalRef.current = setInterval(() => fetchData(true), REALTIME_INTERVAL);
    } else {
      clearInterval(intervalRef.current);
    }
    return () => clearInterval(intervalRef.current);
  }, [realtimeOn, fetchData]);

  const kelasList = ["Semua", ...new Set(data.map(d => d.kelas).filter(Boolean))];
  const filtered = data.filter(d => {
    const q = search.toLowerCase();
    return (!q || d.nama?.toLowerCase().includes(q) || d.nisn?.includes(q) || d.kelas?.toLowerCase().includes(q))
      && (filterRek === "Semua" || d.rekomendasi === filterRek)
      && (filterKelas === "Semua" || d.kelas === filterKelas);
  });

  const stats = {
    total: data.length,
    bekerja: data.filter(d=>d.rekomendasi==="Bekerja").length,
    kuliah: data.filter(d=>d.rekomendasi==="Kuliah").length,
    wirausaha: data.filter(d=>d.rekomendasi==="Wirausaha").length,
    violations: data.filter(d=>(d.violations||0)>0).length,
    kogRendah: data.filter(d=>(d.kog_pct||0)<40).length,
    kogAvg: data.length ? Math.round(data.reduce((s,d)=>s+(d.kog_pct||0),0)/data.length) : 0,
  };

  const s = {
    wrap: { fontFamily:"'Plus Jakarta Sans',sans-serif", background:"#F7F6F3", minHeight:"100vh", color:"#111" },
    hdr: { background:"#111110", color:"#fff", padding:"20px 24px" },
    main: { maxWidth:1200, margin:"0 auto", padding:"20px 16px" },
    card: { background:"#fff", border:"1px solid #E4E0D8", borderRadius:12, padding:20 },
    btn:  (color="#111", bg="#fff") => ({ background:bg, color, border:`1.5px solid ${bg==="#fff"?"#E4E0D8":bg}`, borderRadius:8, padding:"7px 14px", fontSize:12, fontWeight:700, cursor:"pointer", fontFamily:"inherit" }),
    tab:  (active) => ({ padding:"8px 16px", borderRadius:8, fontWeight:700, fontSize:13, cursor:"pointer", background:active?"#111":"transparent", color:active?"#fff":"#666", border:"none", fontFamily:"inherit" }),
  };

  return (
    <div style={s.wrap}>
      <div style={s.hdr}>
        <div style={{ maxWidth:1200, margin:"0 auto", display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:12 }}>
          <div>
            <div style={{ fontSize:10, letterSpacing:".12em", textTransform:"uppercase", color:"#888", marginBottom:4 }}>Dashboard Panitia · SMK Kelas 1</div>
            <div style={{ fontSize:22, fontWeight:800 }}>🎯 WBM Karir — Data Siswa</div>
            <div style={{ display:"flex", alignItems:"center", gap:10, marginTop:4, flexWrap:"wrap" }}>
              <div style={{ fontSize:11, color:"#888" }}>Holland · Big Five · Efikasi · Kognitif · {data.length} peserta</div>
              {/* LIVE INDICATOR */}
              <div style={{ display:"flex", alignItems:"center", gap:6, background:"#1a1a18", borderRadius:20, padding:"3px 10px" }}>
                <div style={{ width:7, height:7, borderRadius:"50%", background: realtimeOn ? "#4ade80" : "#6B7280",
                  boxShadow: realtimeOn ? "0 0 0 2px #4ade8044" : "none",
                  animation: realtimeOn ? "pulse 2s infinite" : "none" }} />
                <span style={{ fontSize:10, color: realtimeOn ? "#4ade80" : "#6B7280", fontWeight:700 }}>
                  {realtimeOn ? "LIVE" : "PAUSED"}
                </span>
                {lastUpdate && <span style={{ fontSize:10, color:"#555" }}>· {lastUpdate.toLocaleTimeString('id-ID',{hour:'2-digit',minute:'2-digit',second:'2-digit'})}</span>}
                {newCount > 0 && (
                  <span style={{ background:"#F59E0B", color:"#111", fontSize:10, fontWeight:800, padding:"1px 6px", borderRadius:10 }}
                    onClick={()=>setNewCount(0)}>+{newCount} baru ✕</span>
                )}
              </div>
            </div>
          </div>
          <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
            <button onClick={()=>setRealtimeOn(v=>!v)}
              style={{ ...s.btn(realtimeOn?"#4ade80":"#6B7280", "#1a1a18"), border:"1.5px solid "+(realtimeOn?"#4ade8044":"#333") }}>
              {realtimeOn ? "⏸ Pause Live" : "▶ Resume Live"}
            </button>
            <button onClick={()=>fetchData(false)} style={s.btn("#fff","#333")} disabled={loading}>
              {loading ? "⏳" : "🔄"} Refresh
            </button>
            <button onClick={()=>cetakSemuaPDF(filtered, filterRek==="Semua"?"Semua Siswa":filterRek)}
              style={s.btn("#fff","#1a6b35")}>
              🖨️ Cetak Semua PDF
            </button>
            <button onClick={onLogout} style={s.btn("#fff","#555")}>🔓 Keluar</button>
          </div>
        </div>
      </div>
      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}`}</style>

      <div style={s.main}>
        {/* NOTIFIKASI PESERTA BARU */}
        {newCount > 0 && (
          <div style={{ background:"#ECFDF5", border:"1.5px solid #6EE7B7", borderRadius:10, padding:"10px 16px", marginBottom:16,
            display:"flex", alignItems:"center", justifyContent:"space-between", fontSize:13 }}>
            <span>🟢 <strong>{newCount} peserta baru</strong> selesai mengerjakan tes. Data sudah diperbarui.</span>
            <button onClick={()=>setNewCount(0)}
              style={{ background:"none", border:"none", color:"#6B7280", cursor:"pointer", fontSize:16 }}>✕</button>
          </div>
        )}

        {/* STAT CARDS */}
        <div style={{ display:"grid", gridTemplateColumns:"repeat(6,1fr)", gap:12, marginBottom:20 }}>
          {[
            { label:"Total Peserta", val:stats.total, color:"#111", bg:"#F7F6F3", icon:"👥" },
            { label:"Bekerja", val:stats.bekerja, color:"#2563EB", bg:"#DBEAFE", icon:"💼" },
            { label:"Kuliah", val:stats.kuliah, color:"#7C3AED", bg:"#EDE9FE", icon:"🎓" },
            { label:"Wirausaha", val:stats.wirausaha, color:"#D97706", bg:"#FEF3C7", icon:"🚀" },
            { label:"Kog. Rendah", val:stats.kogRendah, color:"#DC2626", bg:"#FEE2E2", icon:"🧠" },
            { label:"Pelanggaran", val:stats.violations, color:"#DC2626", bg:"#FEE2E2", icon:"⚠️" },
          ].map(st => (
            <div key={st.label} style={{ ...s.card, background:st.bg, textAlign:"center", padding:16 }}>
              <div style={{ fontSize:22, marginBottom:4 }}>{st.icon}</div>
              <div style={{ fontSize:26, fontWeight:800, color:st.color }}>{st.val}</div>
              <div style={{ fontSize:10, color:"#6B7280", fontWeight:600 }}>{st.label}</div>
            </div>
          ))}
        </div>

        {/* TABS */}
        <div style={{ display:"flex", gap:4, marginBottom:16, background:"#E4E0D8", borderRadius:10, padding:4, width:"fit-content" }}>
          <button style={s.tab(tab==="tabel")} onClick={()=>setTab("tabel")}>📋 Data Siswa</button>
          <button style={s.tab(tab==="statistik")} onClick={()=>setTab("statistik")}>📊 Statistik</button>
        </div>

        {tab === "tabel" && (
          <>
            <div style={{ ...s.card, marginBottom:16, display:"flex", gap:10, flexWrap:"wrap", alignItems:"center" }}>
              <input placeholder="🔍 Cari nama, NISN, kelas…" value={search} onChange={e=>setSearch(e.target.value)}
                style={{ flex:1, minWidth:200, border:"1.5px solid #E4E0D8", borderRadius:8, padding:"8px 12px", fontSize:13, fontFamily:"inherit", outline:"none" }} />
              {["Semua","Bekerja","Kuliah","Wirausaha"].map(r => (
                <button key={r} onClick={()=>setFilterRek(r)}
                  style={s.btn(filterRek===r?"#fff":BMW_COLOR[r]||"#111", filterRek===r?(BMW_COLOR[r]||"#111"):"#fff")}>
                  {r==="Semua"?"Semua":BMW_ICON[r]+" "+r}
                </button>
              ))}
              <select value={filterKelas} onChange={e=>setFilterKelas(e.target.value)}
                style={{ border:"1.5px solid #E4E0D8", borderRadius:8, padding:"7px 12px", fontSize:12, fontFamily:"inherit" }}>
                {kelasList.map(k=><option key={k}>{k}</option>)}
              </select>
              <span style={{ fontSize:12, color:"#888" }}>{filtered.length} siswa</span>
              {filtered.length > 0 && filtered.length < data.length && (
                <button onClick={()=>cetakSemuaPDF(filtered, `${filterRek!=="Semua"?filterRek+" · ":""}${filterKelas!=="Semua"?filterKelas:""}`)}
                  style={{ ...s.btn("#fff","#374151"), fontSize:11 }}>
                  🖨️ PDF ({filtered.length})
                </button>
              )}
            </div>

            <div style={{ ...s.card, padding:0, overflow:"hidden" }}>
              <div style={{ overflowX:"auto" }}>
                <table style={{ width:"100%", borderCollapse:"collapse", fontSize:12 }}>
                  <thead>
                    <tr style={{ background:"#111110", color:"#fff" }}>
                      {["No","Nama","NISN","Kelas","J/K","B","K","W","Holland","O","C","E","A","N","EfUmum","EfAkad","EfVokas","EfWira","🧠Num","🧠Ver","🧠Log","🧠%","Rekomendasi","⚠️","Aksi"].map(h=>(
                        <th key={h} style={{ padding:"10px 10px", textAlign:"left", fontWeight:700, fontSize:11, whiteSpace:"nowrap" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.length===0 && <tr><td colSpan={21} style={{ textAlign:"center", padding:32, color:"#888" }}>Belum ada data</td></tr>}
                    {filtered.map((d,i) => (
                      <tr key={i} style={{ background:i%2===0?"#fff":"#fafaf8", borderBottom:"1px solid #E4E0D8" }}>
                        <td style={{ padding:"8px 10px", color:"#888" }}>{d.no||i+1}</td>
                        <td style={{ padding:"8px 10px", fontWeight:600, whiteSpace:"nowrap" }}>{d.nama}</td>
                        <td style={{ padding:"8px 10px", color:"#888" }}>{d.nisn||'—'}</td>
                        <td style={{ padding:"8px 10px" }}>{d.kelas}</td>
                        <td style={{ padding:"8px 10px" }}>{d.jk==="Laki-laki"?"♂":"♀"}</td>
                        <td style={{ padding:"8px 10px", color:"#2563EB", fontWeight:700 }}>{d.skor_B}%</td>
                        <td style={{ padding:"8px 10px", color:"#7C3AED", fontWeight:700 }}>{d.skor_M}%</td>
                        <td style={{ padding:"8px 10px", color:"#D97706", fontWeight:700 }}>{d.skor_W}%</td>
                        <td style={{ padding:"8px 10px", fontFamily:"monospace", fontWeight:700 }}>{d.hollandKode||'—'}</td>
                        <td style={{ padding:"8px 10px" }}>{d.bf_O}</td>
                        <td style={{ padding:"8px 10px" }}>{d.bf_C}</td>
                        <td style={{ padding:"8px 10px" }}>{d.bf_E}</td>
                        <td style={{ padding:"8px 10px" }}>{d.bf_A}</td>
                        <td style={{ padding:"8px 10px" }}>{d.bf_N}</td>
                        {/* Efikasi — dengan warna status */}
                        {[d.ef_umum, d.ef_akademik, d.ef_vokasional, d.ef_wirausaha].map((v,ei)=>(
                          <td key={ei} style={{ padding:"8px 10px", fontWeight:700, color:v>=61?"#16A34A":v>=41?"#D97706":"#DC2626" }}>{v}%</td>
                        ))}
                        {/* Kognitif */}
                        {[d.kog_numerik, d.kog_verbal, d.kog_logika].map((v,ki)=>{
                          const kc=kogKlasifikasi(v||0).color;
                          return <td key={ki} style={{ padding:"8px 10px", fontWeight:700, color:kc }}>{v||0}%</td>;
                        })}
                        <td style={{ padding:"8px 10px", fontWeight:800, color:kogKlasifikasi(d.kog_pct||0).color }}>{d.kog_pct||0}%</td>
                        <td style={{ padding:"8px 10px" }}><Badge val={d.rekomendasi} /></td>
                        <td style={{ padding:"8px 10px", textAlign:"center" }}>{(d.violations||0)>0&&<span style={{ color:"#DC2626", fontWeight:700 }}>{d.violations}x</span>}</td>
                        <td style={{ padding:"8px 10px", whiteSpace:"nowrap" }}>
                          <button onClick={()=>setSelected(d)} style={{ ...s.btn("#111","#fff"), marginRight:6 }}>Detail</button>
                          <button onClick={()=>cetakLaporan(d)} style={s.btn("#fff","#111")}>🖨️ PDF</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {tab === "statistik" && (
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
            <div style={s.card}>
              <div style={{ fontWeight:700, marginBottom:16 }}>📊 Distribusi BMW</div>
              {[["Bekerja",stats.bekerja,"#2563EB"],["Kuliah",stats.kuliah,"#7C3AED"],["Wirausaha",stats.wirausaha,"#D97706"]].map(([l,v,c])=>(
                <div key={l} style={{ marginBottom:12 }}>
                  <div style={{ display:"flex", justifyContent:"space-between", fontSize:12, fontWeight:600, marginBottom:4 }}>
                    <span>{l}</span><span style={{ color:c }}>{v} siswa ({stats.total>0?Math.round(v/stats.total*100):0}%)</span>
                  </div>
                  <div style={{ background:"#e5e7eb", borderRadius:4, height:12, overflow:"hidden" }}>
                    <div style={{ width:`${stats.total>0?v/stats.total*100:0}%`, height:"100%", background:c, borderRadius:4 }} />
                  </div>
                </div>
              ))}
            </div>

            <div style={s.card}>
              <div style={{ fontWeight:700, marginBottom:16 }}>🎯 Rata-rata Holland RIASEC</div>
              {[["R","Realistic","#3B82F6"],["I","Investigative","#8B5CF6"],["A","Artistic","#EC4899"],["S","Social","#10B981"],["E","Enterprising","#F59E0B"],["C","Conventional","#6B7280"]].map(([k,l,c])=>{
                const avg = data.length>0?Math.round(data.reduce((s,d)=>s+(d[`h_${k}`]||0),0)/data.length):0;
                return <ScoreBar key={k} label={`${k} — ${l}`} value={avg} color={c} />;
              })}
            </div>

            <div style={s.card}>
              <div style={{ fontWeight:700, marginBottom:16 }}>🧬 Rata-rata Big Five</div>
              {[["O","Openness","#7C3AED"],["C","Conscientiousness","#2563EB"],["E","Extraversion","#F59E0B"],["A","Agreeableness","#10B981"],["N","Neuroticism","#EF4444"]].map(([k,l,c])=>{
                const avg = data.length>0?Math.round(data.reduce((s,d)=>s+(d[`bf_${k}`]||0),0)/data.length):0;
                return <ScoreBar key={k} label={`${k} — ${l}`} value={avg} color={c} />;
              })}
            </div>

            <div style={s.card}>
              <div style={{ fontWeight:700, marginBottom:16 }}>💪 Rata-rata Efikasi Diri</div>
              {[["ef_umum","⚡ Efikasi Umum","#6D28D9"],["ef_akademik","📖 Efikasi Akademik","#0D9488"],["ef_vokasional","🔧 Efikasi Vokasional","#2563EB"],["ef_wirausaha","🚀 Efikasi Wirausaha","#D97706"]].map(([k,l,c])=>{
                const avg = data.length>0?Math.round(data.reduce((s,d)=>s+(d[k]||0),0)/data.length):0;
                const kls = efKlasifikasi(avg);
                return (
                  <div key={k} style={{ marginBottom:10 }}>
                    <div style={{ display:"flex", justifyContent:"space-between", fontSize:12, fontWeight:600, marginBottom:3 }}>
                      <span>{l}</span>
                      <span style={{ display:"flex", gap:6, alignItems:"center" }}>
                        <span style={{ fontSize:10, background:kls.color+"22", color:kls.color, padding:"1px 7px", borderRadius:10 }}>{kls.label}</span>
                        <span style={{ color:kls.color, fontWeight:800 }}>{avg}%</span>
                      </span>
                    </div>
                    <div style={{ background:"#e5e7eb", borderRadius:4, height:8, overflow:"hidden" }}>
                      <div style={{ width:`${avg}%`, height:"100%", background:kls.color, borderRadius:4 }} />
                    </div>
                  </div>
                );
              })}
              <div style={{ background:"#F9FAFB", borderRadius:8, padding:"10px 12px", marginTop:12, fontSize:11, color:"#6B7280" }}>
                ≥81% Sangat Tinggi · 61–80% Tinggi · 41–60% Sedang · 21–40% Rendah · &lt;21% Sangat Rendah
              </div>
            </div>
          </div>
        )}
      </div>

      {/* MODAL DETAIL */}
      {selected && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,.6)", zIndex:1000, display:"flex", alignItems:"center", justifyContent:"center", padding:16 }}
          onClick={e=>{ if(e.target===e.currentTarget) setSelected(null); }}>
          <div style={{ background:"#fff", borderRadius:16, width:"100%", maxWidth:580, maxHeight:"90vh", overflow:"auto" }}>
            <div style={{ background:"#111", color:"#fff", padding:"20px 24px", borderRadius:"16px 16px 0 0", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
              <div>
                <div style={{ fontWeight:800, fontSize:18 }}>{selected.nama}</div>
                <div style={{ fontSize:12, color:"#aaa" }}>{selected.kelas} · {selected.sekolah}</div>
              </div>
              <button onClick={()=>setSelected(null)} style={{ background:"none", border:"none", color:"#aaa", fontSize:22, cursor:"pointer" }}>✕</button>
            </div>
            <div style={{ padding:24 }}>
              <div style={{ background:BMW_COLOR[selected.rekomendasi], color:"#fff", borderRadius:10, padding:"16px 20px", marginBottom:16, textAlign:"center" }}>
                <div style={{ fontSize:11, opacity:.8, marginBottom:4, letterSpacing:".1em", textTransform:"uppercase" }}>Rekomendasi</div>
                <div style={{ fontSize:22, fontWeight:800 }}>{BMW_ICON[selected.rekomendasi]} {selected.rekomendasi==="Kuliah"?"Melanjutkan Kuliah":selected.rekomendasi}</div>
              </div>
              <ScoreBar label="💼 Bekerja" value={selected.skor_B} color="#2563EB" />
              <ScoreBar label="🎓 Kuliah" value={selected.skor_M} color="#7C3AED" />
              <ScoreBar label="🚀 Wirausaha" value={selected.skor_W} color="#D97706" />

              {/* DETAIL REKOMENDASI */}
              {(selected.detailRekomendasi || HOLLAND_DETAIL[selected.rekomendasi]?.[String(selected.hollandKode||'')[0]]) && (
                <div style={{ background:BMW_BG[selected.rekomendasi], border:`1.5px solid ${BMW_COLOR[selected.rekomendasi]}40`, borderRadius:10, padding:"12px 16px", marginBottom:4, marginTop:4 }}>
                  <div style={{ fontSize:10, fontWeight:800, letterSpacing:".1em", textTransform:"uppercase", color:BMW_COLOR[selected.rekomendasi], marginBottom:5 }}>
                    {selected.rekomendasi==="Bekerja" ? "🔎 Bidang Pekerjaan yang Sesuai" : selected.rekomendasi==="Kuliah" ? "🎓 Rekomendasi Jurusan" : "🚀 Bidang Wirausaha yang Sesuai"}
                  </div>
                  <div style={{ fontSize:13, color:"#111", lineHeight:1.6 }}>
                    {selected.detailRekomendasi || HOLLAND_DETAIL[selected.rekomendasi]?.[String(selected.hollandKode||'')[0]] || "—"}
                  </div>
                </div>
              )}
              <div style={{ fontWeight:700, fontSize:13, margin:"16px 0 10px" }}>💪 Efikasi Diri</div>
              <EfikasiBar label="Efikasi Umum" value={selected.ef_umum} icon="⚡" />
              <EfikasiBar label="Efikasi Akademik" value={selected.ef_akademik} icon="📖" />
              <EfikasiBar label="Efikasi Vokasional" value={selected.ef_vokasional} icon="🔧" />
              <EfikasiBar label="Efikasi Kewirausahaan" value={selected.ef_wirausaha} icon="🚀" />

              {/* KOGNITIF */}
              <div style={{ fontWeight:700, fontSize:13, margin:"16px 0 10px" }}>🧠 Kemampuan Kognitif</div>
              {[
                ["Numerik",selected.kog_numerik,"7 soal"],
                ["Verbal",selected.kog_verbal,"7 soal"],
                ["Logika",selected.kog_logika,"6 soal"],
              ].map(([l,v,sub])=>{
                const kk=kogKlasifikasi(v||0);
                return (
                  <div key={l} style={{ marginBottom:8 }}>
                    <div style={{ display:"flex", justifyContent:"space-between", fontSize:12, fontWeight:600, marginBottom:3 }}>
                      <span>{l} <span style={{ color:"#aaa", fontWeight:400 }}>({sub})</span></span>
                      <span style={{ display:"flex", gap:6, alignItems:"center" }}>
                        <span style={{ fontSize:10, background:kk.color+"22", color:kk.color, padding:"1px 7px", borderRadius:10, fontWeight:700 }}>{kk.label}</span>
                        <span style={{ color:kk.color, fontWeight:800 }}>{v||0}%</span>
                      </span>
                    </div>
                    <div style={{ background:"#E5E7EB", borderRadius:4, height:8, overflow:"hidden" }}>
                      <div style={{ width:`${v||0}%`, height:"100%", background:kk.color, borderRadius:4 }} />
                    </div>
                  </div>
                );
              })}
              <div style={{ background:"#FEF3C7", border:"1px solid #FCD34D", borderRadius:8, padding:"8px 12px", fontSize:12, marginTop:4 }}>
                🧠 Total Kognitif: <strong>{selected.kog_total||0}/20</strong> benar &nbsp;·&nbsp;
                <span style={{ color:kogKlasifikasi(selected.kog_pct||0).color, fontWeight:800 }}>{selected.kog_pct||0}% — {kogKlasifikasi(selected.kog_pct||0).label}</span>
              </div>
              <div style={{ marginTop:14, display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, fontSize:12 }}>
                <div style={{ background:"#f9fafb", borderRadius:8, padding:12 }}>
                  <div style={{ fontWeight:700, marginBottom:6 }}>🎯 Holland Top 3</div>
                  <div style={{ fontFamily:"monospace", fontSize:22, fontWeight:800, color:"#2563EB" }}>{selected.hollandKode}</div>
                </div>
                <div style={{ background:"#f9fafb", borderRadius:8, padding:12 }}>
                  <div style={{ fontWeight:700, marginBottom:6 }}>🧬 Big Five</div>
                  <div style={{ fontSize:11 }}>
                    {[['O',selected.bf_O,'#7C3AED'],['C',selected.bf_C,'#2563EB'],['E',selected.bf_E,'#F59E0B'],['A',selected.bf_A,'#10B981'],['N',selected.bf_N,'#EF4444']].map(([k,v,c])=>(
                      <span key={k} style={{ display:"inline-block", margin:"2px 3px", background:c+"22", color:c, padding:"1px 7px", borderRadius:8, fontWeight:700 }}>{k}:{v}</span>
                    ))}
                  </div>
                </div>
              </div>
              {(selected.violations||0)>0 && (
                <div style={{ background:"#FEE2E2", border:"1px solid #FCA5A5", borderRadius:8, padding:"10px 14px", marginTop:12, fontSize:12, color:"#DC2626" }}>
                  ⚠️ Terdeteksi {selected.violations} pelanggaran saat tes
                </div>
              )}
              <button onClick={()=>cetakLaporan(selected)}
                style={{ ...s.btn("#fff","#111"), width:"100%", padding:14, fontSize:14, marginTop:16, textAlign:"center" }}>
                🖨️ Cetak Laporan PDF
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// ROOT COMPONENT
// ══════════════════════════════════════════════════════════════
export default function App() {
  const [mode, setMode] = useState("pilih"); // pilih | peserta | login | panitia

  if (mode === "peserta") return <ViewPeserta onBack={()=>setMode("pilih")} />;
  if (mode === "login")   return <LoginPanitia onLogin={()=>setMode("panitia")} />;
  if (mode === "panitia") return <DashboardPanitiaMain onLogout={()=>setMode("pilih")} />;
  return <HalamanPilih onPeserta={()=>setMode("peserta")} onPanitia={()=>setMode("login")} />;
}
