import { useState, useEffect, useCallback } from "react";

// ══════════════════════════════════════════════════════════════
// KONFIGURASI
// ══════════════════════════════════════════════════════════════
const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbx-m8GlmQnk24NoH8lqrnXiJuRyTt3MVKqRjza5ZwB1GRxrTMHEHJ8GFaTurEuVD2M/exec";
const PANITIA_PASSWORD = "bmwsmk2026"; // Ganti dengan password panitia

// ══════════════════════════════════════════════════════════════
// DATA DUMMY (hapus saat production)
// ══════════════════════════════════════════════════════════════
const DEMO_DATA = [
  { no:1, nama:"Andi Pratama", nisn:"0012345678", kelas:"X TKJ", jk:"Laki-laki", sekolah:"SMK Negeri 1", tgl:"2026-06-10", violations:0, h_R:82,h_I:60,h_A:50,h_S:55,h_E:70,h_C:78, hollandKode:"RCE", bf_O:65,bf_C:85,bf_E:72,bf_A:70,bf_N:35,bf_Nstabil:65, ef_umum:72,ef_akademik:55,ef_vokasional:82,ef_wirausaha:60, skor_B:42,skor_M:30,skor_W:28, rekomendasi:"Bekerja" },
  { no:2, nama:"Sari Dewi", nisn:"0023456789", kelas:"X AKL", jk:"Perempuan", sekolah:"SMK Negeri 1", tgl:"2026-06-10", violations:0, h_R:45,h_I:85,h_A:72,h_S:60,h_E:55,h_C:68, hollandKode:"IAC", bf_O:88,bf_C:82,bf_E:55,bf_A:75,bf_N:40,bf_Nstabil:60, ef_umum:78,ef_akademik:88,ef_vokasional:60,ef_wirausaha:45, skor_B:28,skor_M:48,skor_W:24, rekomendasi:"Kuliah" },
  { no:3, nama:"Budi Santoso", nisn:"0034567890", kelas:"X TKJ", jk:"Laki-laki", sekolah:"SMK Negeri 1", tgl:"2026-06-10", violations:1, h_R:55,h_I:60,h_A:70,h_S:72,h_E:88,h_C:45, hollandKode:"ESA", bf_O:82,bf_C:65,bf_E:90,bf_A:68,bf_N:45,bf_Nstabil:55, ef_umum:80,ef_akademik:50,ef_vokasional:58,ef_wirausaha:85, skor_B:22,skor_M:25,skor_W:53, rekomendasi:"Wirausaha" },
  { no:4, nama:"Maya Rahayu", nisn:"0045678901", kelas:"X AKL", jk:"Perempuan", sekolah:"SMK Negeri 1", tgl:"2026-06-10", violations:0, h_R:68,h_I:55,h_A:60,h_S:78,h_E:65,h_C:80, hollandKode:"CSR", bf_O:60,bf_C:88,bf_E:62,bf_A:85,bf_N:30,bf_Nstabil:70, ef_umum:75,ef_akademik:65,ef_vokasional:80,ef_wirausaha:50, skor_B:45,skor_M:32,skor_W:23, rekomendasi:"Bekerja" },
  { no:5, nama:"Rizki Hakim", nisn:"0056789012", kelas:"X MM", jk:"Laki-laki", sekolah:"SMK Negeri 1", tgl:"2026-06-10", violations:2, h_R:50,h_I:78,h_A:85,h_S:55,h_E:75,h_C:50, hollandKode:"AIE", bf_O:90,bf_C:60,bf_E:80,bf_A:65,bf_N:50,bf_Nstabil:50, ef_umum:65,ef_akademik:58,ef_vokasional:45,ef_wirausaha:82, skor_B:20,skor_M:30,skor_W:50, rekomendasi:"Wirausaha" },
];

// ══════════════════════════════════════════════════════════════
// HELPERS
// ══════════════════════════════════════════════════════════════
const WBM_COLOR = { Bekerja:"#2563EB", Kuliah:"#7C3AED", Wirausaha:"#D97706" };
const WBM_BG    = { Bekerja:"#DBEAFE", Kuliah:"#EDE9FE", Wirausaha:"#FEF3C7" };
const WBM_ICON  = { Bekerja:"💼", Kuliah:"🎓", Wirausaha:"🚀" };

// ── Detail bidang/jurusan/usaha berdasarkan Holland dominan
const HOLLAND_DETAIL = {
  Bekerja:{
    R:"🔧 Bidang kerja: Teknisi / Mekanik / Operator — manufaktur, otomotif, konstruksi, elektronik/listrik.",
    I:"🔬 Bidang kerja: Analis Teknis / Quality Control / Lab Teknisi — pengujian produk, riset terapan, laboratorium.",
    A:"🎨 Bidang kerja: Desainer / Kreatif Industri — desain grafis, multimedia, konten digital, percetakan.",
    S:"🤝 Bidang kerja: Customer Service / Tenaga Kesehatan / Pendidik — pelayanan sosial, kesehatan, vokasi.",
    E:"📊 Bidang kerja: Sales / Marketing / Supervisor — penjualan, pemasaran, pengembangan bisnis, manajemen tim.",
    C:"📋 Bidang kerja: Administrasi / Staf Keuangan / Akuntan — tata kelola, pembukuan, arsip, back-office.",
  },
  Kuliah:{
    R:"🏗️ Jurusan yang cocok: Teknik Mesin · Teknik Sipil · Teknik Elektro · D3/D4 Teknologi Industri · Teknik Otomotif.",
    I:"💻 Jurusan yang cocok: Teknik Informatika · Ilmu Komputer · Matematika · Fisika · Farmasi · Biologi · Statistika.",
    A:"🎭 Jurusan yang cocok: Desain Komunikasi Visual · Seni Rupa · Arsitektur · Film & Televisi · Animasi · Sastra.",
    S:"💛 Jurusan yang cocok: Psikologi · Pendidikan · Kesehatan Masyarakat · Keperawatan · Sosiologi · Pekerjaan Sosial.",
    E:"🌐 Jurusan yang cocok: Manajemen Bisnis · Ilmu Komunikasi · Hukum · Administrasi Publik · Hubungan Internasional.",
    C:"💰 Jurusan yang cocok: Akuntansi · Sistem Informasi · Manajemen Keuangan · Administrasi Bisnis · Perpajakan.",
  },
  Wirausaha:{
    R:"🔩 Jenis usaha: Bengkel / Kontraktor Kecil / Servis Elektronik / Produksi Barang — usaha berbasis keterampilan teknis.",
    I:"💡 Jenis usaha: Konsultasi IT / Pengembangan Aplikasi / Jasa Analitik Data / Software House skala kecil.",
    A:"🎬 Jenis usaha: Desainer Freelance / Konten Kreator / Studio Foto & Video / Brand Lokal / Fashion.",
    S:"🌱 Jenis usaha: Lembaga Kursus / Les Privat / Katering Komunitas / Jasa Konseling / Childcare.",
    E:"🛒 Jenis usaha: Reseller / Dropship / Agen Properti / Event Organizer / Distribusi Produk.",
    C:"📑 Jenis usaha: Jasa Perpajakan / Pembukuan UMKM / Apotek Kecil / Jasa Administrasi Bisnis.",
  }
};

// ── Normalisasi baris dari Google Sheets → field JS
// Sheets mengirim key = nama header kolom (misal "Skor Bekerja", "Kode Holland")
// Dashboard butuh field JS (misal skor_B, hollandKode)
function normalizeRow(d) {
  const r = { ...d };
  const map = {
    "Nama":"nama","NISN":"nisn","Kelas/Jurusan":"kelas","Jenis Kelamin":"jk",
    "Sekolah":"sekolah","Tanggal Tes":"tgl","Pelanggaran":"violations",
    "H-Realistic":"h_R","H-Investigative":"h_I","H-Artistic":"h_A",
    "H-Social":"h_S","H-Enterprising":"h_E","H-Conventional":"h_C",
    "Kode Holland":"hollandKode",
    "BF-Openness":"bf_O","BF-Conscientiousness":"bf_C","BF-Extraversion":"bf_E",
    "BF-Agreeableness":"bf_A","BF-Neuroticism":"bf_N","BF-Stabilitas":"bf_Nstabil",
    "EF-Umum":"ef_umum","EF-Akademik":"ef_akademik",
    "EF-Vokasional":"ef_vokasional","EF-Wirausaha":"ef_wirausaha",
    "Skor Bekerja":"skor_B","Skor Kuliah":"skor_M","Skor Wirausaha":"skor_W",
    "REKOMENDASI WBM":"rekomendasi","Detail Rekomendasi":"detailRekomendasi",
    "Timestamp":"timestamp",
  };
  for (const [sheetKey, jsKey] of Object.entries(map)) {
    if (d[sheetKey] !== undefined && r[jsKey] === undefined) r[jsKey] = d[sheetKey];
  }
  // Pastikan angka bertipe number
  ["h_R","h_I","h_A","h_S","h_E","h_C",
   "bf_O","bf_C","bf_E","bf_A","bf_N","bf_Nstabil",
   "ef_umum","ef_akademik","ef_vokasional","ef_wirausaha",
   "skor_B","skor_M","skor_W","violations"
  ].forEach(f => { if (r[f] !== undefined) r[f] = Number(r[f]) || 0; });
  // Generate detail jika belum ada
  if (!r.detailRekomendasi && r.rekomendasi && r.hollandKode) {
    r.detailRekomendasi = HOLLAND_DETAIL[r.rekomendasi]?.[String(r.hollandKode)[0]] || "";
  }
  return r;
}

const efKlasifikasi = (v) => {
  if (v >= 81) return { label:"Sangat Tinggi", color:"#16A34A" };
  if (v >= 61) return { label:"Tinggi", color:"#2563EB" };
  if (v >= 41) return { label:"Sedang", color:"#D97706" };
  if (v >= 21) return { label:"Rendah", color:"#EA580C" };
  return { label:"Sangat Rendah", color:"#DC2626" };
};

function Badge({ val }) {
  return (
    <span style={{ background:WBM_BG[val]||"#f3f4f6", color:WBM_COLOR[val]||"#374151", fontWeight:700, fontSize:11, padding:"3px 10px", borderRadius:20 }}>
      {WBM_ICON[val]} {val}
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

  // Gunakan normalizeRow agar data Sheets maupun data JS sama-sama bisa dibaca
  const s2 = normalizeRow(siswa);
  const topHolland = s2.hollandKode ? String(s2.hollandKode)[0] : 'R';
  const detailBidang = s2.detailRekomendasi ||
    (HOLLAND_DETAIL[s2.rekomendasi]?.[topHolland] ?? '');

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
<title>Laporan WBM — ${s2.nama}</title>
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
      <div style="font-size:22px;font-weight:800">Analisis WBM — SMK Kelas 1</div>
      <div style="font-size:12px;color:#aaa;margin-top:2px">Holland RIASEC · Big Five Personality · Efikasi Diri</div>
    </div>
  </div>

  ${(s2.violations||0)>0?`<div style="background:#FEE2E2;border:1px solid #FCA5A5;border-radius:8px;padding:10px 14px;font-size:12px;color:#DC2626;margin-bottom:16px">⚠️ Terdeteksi ${s2.violations} pelanggaran (pindah tab) selama tes berlangsung.</div>`:''}

  <div class="card">
    <h3>👤 Data Diri Siswa</h3>
    <div class="info-grid">
      <div class="info-row"><span class="info-key">Nama</span><span class="info-val">${s2.nama}</span></div>
      <div class="info-row"><span class="info-key">NISN</span><span class="info-val">${s2.nisn||'-'}</span></div>
      <div class="info-row"><span class="info-key">Kelas/Jurusan</span><span class="info-val">${s2.kelas}</span></div>
      <div class="info-row"><span class="info-key">Jenis Kelamin</span><span class="info-val">${s2.jk||'-'}</span></div>
      <div class="info-row"><span class="info-key">Sekolah</span><span class="info-val">${s2.sekolah||'-'}</span></div>
      <div class="info-row"><span class="info-key">Tanggal Tes</span><span class="info-val">${s2.tgl||'-'}</span></div>
    </div>
  </div>

  <div class="rek-box" style="background:${WBM_COLOR[s2.rekomendasi]};color:#fff">
    <div style="font-size:11px;letter-spacing:.12em;text-transform:uppercase;opacity:.8;margin-bottom:8px">Rekomendasi Jalur Karir</div>
    <h2>${WBM_ICON[s2.rekomendasi]} ${s2.rekomendasi==='Kuliah'?'Melanjutkan Kuliah':s2.rekomendasi}</h2>
    <p>${rekDesc[s2.rekomendasi]}</p>
  </div>

  ${detailBidang ? `<div class="card" style="border-left:4px solid ${WBM_COLOR[s2.rekomendasi]}">
    <h3 style="color:${WBM_COLOR[s2.rekomendasi]}">${WBM_ICON[s2.rekomendasi]} Detail Rekomendasi Berdasarkan Profil Holland</h3>
    <p style="font-size:13px;color:#374151;line-height:1.8;margin-top:6px">${detailBidang}</p>
  </div>` : ''}

  <div class="card">
    <h3>📊 Skor WBM</h3>
    ${[['💼 Bekerja',s2.skor_B,'#2563EB'],['🎓 Melanjutkan Kuliah',s2.skor_M,'#7C3AED'],['🚀 Wirausaha',s2.skor_W,'#D97706']]
      .map(([l,v,c])=>`<div class="bar-wrap"><div class="bar-label"><span>${l}</span><span style="color:${c}">${v}%</span></div><div class="bar-bg"><div class="bar-fill" style="width:${v}%;background:${c}"></div></div></div>`).join('')}
  </div>

  <div class="grid2">
    <div class="card">
      <h3>🎯 Holland RIASEC <span style="font-weight:400;color:#6b7280;font-size:11px">(kode: ${s2.hollandKode||'—'})</span></h3>
      ${[['R','Realistic',s2.h_R,'#3B82F6'],['I','Investigative',s2.h_I,'#8B5CF6'],['A','Artistic',s2.h_A,'#EC4899'],['S','Social',s2.h_S,'#10B981'],['E','Enterprising',s2.h_E,'#F59E0B'],['C','Conventional',s2.h_C,'#6B7280']]
        .sort((a,b)=>b[2]-a[2]).map(([k,l,v,c])=>`<div class="score-row"><span>${k} — ${l}</span><span style="font-weight:700;color:${c}">${v}%</span></div>`).join('')}
    </div>
    <div class="card">
      <h3>🧬 Big Five Personality</h3>
      ${[['O','Openness',s2.bf_O,'#7C3AED'],['C','Conscientiousness',s2.bf_C,'#2563EB'],['E','Extraversion',s2.bf_E,'#F59E0B'],['A','Agreeableness',s2.bf_A,'#10B981'],['N','Neuroticism',s2.bf_N,'#EF4444']]
        .map(([k,l,v,c])=>`<div class="score-row"><span>${k} — ${l}</span><span style="font-weight:700;color:${c}">${v}%</span></div>`).join('')}
    </div>
  </div>

  <div class="card">
    <h3>💪 Efikasi Diri</h3>
    ${[['⚡','Efikasi Diri Umum',s2.ef_umum,'#6D28D9'],['📖','Efikasi Akademik (→Kuliah)',s2.ef_akademik,'#0D9488'],['🔧','Efikasi Vokasional (→Bekerja)',s2.ef_vokasional,'#2563EB'],['🚀','Efikasi Kewirausahaan (→Wirausaha)',s2.ef_wirausaha,'#D97706']]
      .map(([icon,l,v,c])=>`<div class="ef-row"><span>${icon} ${l}</span><span style="display:flex;gap:8px;align-items:center"><span class="ef-badge" style="background:${c}22;color:${c}">${efKlsLabel(v)}</span><span style="font-weight:800;color:${c}">${v}%</span></span></div>`).join('')}
    <div style="background:#F9FAFB;border-radius:8px;padding:10px;margin-top:12px;font-size:11px;color:#6B7280;line-height:1.7">
      <strong>Panduan:</strong> ≥81% Sangat Tinggi · 61–80% Tinggi · 41–60% Sedang · 21–40% Rendah · &lt;21% Sangat Rendah
    </div>
  </div>

  <div class="card">
    <h3>💡 Saran Pengembangan</h3>
    <ul class="saran-list">
      ${(saranMap[s2.rekomendasi]||[]).map(s=>`<li><span>✅</span><span>${s}</span></li>`).join('')}
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
      if (json.status === "ok" && json.data) setHasil(normalizeRow(json.data));
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

  const getDetail = (d) => d.detailRekomendasi || (HOLLAND_DETAIL[d.rekomendasi]?.[String(d.hollandKode||'')[0]] ?? '');

  return (
    <div style={s.wrap}>
      <div style={s.hdr}>
        <div style={{ maxWidth:640, margin:"0 auto" }}>
          <div style={{ fontSize:10, letterSpacing:".12em", textTransform:"uppercase", color:"#888", marginBottom:4 }}>Cek Hasil Tes</div>
          <div style={{ fontSize:20, fontWeight:800 }}>🎯 WBM Karir — Hasil Saya</div>
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
            <div style={{ ...s.card, background:WBM_COLOR[hasil.rekomendasi], color:"#fff", textAlign:"center" }}>
              <div style={{ fontSize:11, letterSpacing:".1em", textTransform:"uppercase", opacity:.8, marginBottom:8 }}>Rekomendasi Jalur Karir</div>
              <div style={{ fontSize:32 }}>{WBM_ICON[hasil.rekomendasi]}</div>
              <div style={{ fontSize:26, fontWeight:800, marginTop:6 }}>
                {hasil.rekomendasi === "Kuliah" ? "Melanjutkan Kuliah" : hasil.rekomendasi}
              </div>
              <div style={{ fontSize:12, opacity:.85, marginTop:8 }}>{hasil.nama} · {hasil.kelas}</div>
            </div>

            <div style={s.card}>
              <div style={{ fontWeight:700, marginBottom:12 }}>📊 Skor WBM</div>
              <ScoreBar label="💼 Bekerja" value={hasil.skor_B} color="#2563EB" />
              <ScoreBar label="🎓 Melanjutkan Kuliah" value={hasil.skor_M} color="#7C3AED" />
              <ScoreBar label="🚀 Wirausaha" value={hasil.skor_W} color="#D97706" />
            </div>

            {getDetail(hasil) && (
              <div style={{ ...s.card, borderLeft:`4px solid ${WBM_COLOR[hasil.rekomendasi]}` }}>
                <div style={{ fontWeight:700, fontSize:13, marginBottom:8, color:WBM_COLOR[hasil.rekomendasi] }}>
                  {WBM_ICON[hasil.rekomendasi]} Detail Rekomendasi
                </div>
                <div style={{ fontSize:13, color:"#374151", lineHeight:1.75 }}>{getDetail(hasil)}</div>
              </div>
            )}

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
          <div style={{ fontSize:22, fontWeight:800, color:"#fff" }}>WBM Karir — SMK</div>
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
        <div style={{ fontSize:13, color:"#666", marginBottom:40 }}>Bekerja · Melanjutkan Kuliah · Wirausaha</div>
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
// DASHBOARD PANITIA (utama)
// ══════════════════════════════════════════════════════════════
function DashboardPanitiaMain({ onLogout }) {
  const [data, setData]         = useState(DEMO_DATA);
  const [loading, setLoading]   = useState(false);
  const [search, setSearch]     = useState("");
  const [filterRek, setFilterRek] = useState("Semua");
  const [filterKelas, setFilterKelas] = useState("Semua");
  const [selected, setSelected] = useState(null);
  const [tab, setTab]           = useState("tabel");

  const fetchData = useCallback(async () => {
    if (APPS_SCRIPT_URL.includes("GANTI")) return;
    setLoading(true);
    try {
      const res = await fetch(APPS_SCRIPT_URL + "?action=getData");
      const json = await res.json();
      if (json.data) setData(json.data.map(normalizeRow));
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

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
            <div style={{ fontSize:11, color:"#888", marginTop:2 }}>Holland RIASEC · Big Five · Efikasi Diri · {data.length} peserta</div>
          </div>
          <div style={{ display:"flex", gap:8 }}>
            <button onClick={fetchData} style={s.btn("#fff","#333")} disabled={loading}>{loading?"⏳ Memuat…":"🔄 Refresh"}</button>
            <button onClick={onLogout} style={s.btn("#fff","#555")}>🔓 Keluar</button>
          </div>
        </div>
      </div>

      <div style={s.main}>
        {/* STAT CARDS */}
        <div style={{ display:"grid", gridTemplateColumns:"repeat(5,1fr)", gap:12, marginBottom:20 }}>
          {[
            { label:"Total Peserta", val:stats.total, color:"#111", bg:"#F7F6F3", icon:"👥" },
            { label:"Bekerja", val:stats.bekerja, color:"#2563EB", bg:"#DBEAFE", icon:"💼" },
            { label:"Kuliah", val:stats.kuliah, color:"#7C3AED", bg:"#EDE9FE", icon:"🎓" },
            { label:"Wirausaha", val:stats.wirausaha, color:"#D97706", bg:"#FEF3C7", icon:"🚀" },
            { label:"Ada Pelanggaran", val:stats.violations, color:"#DC2626", bg:"#FEE2E2", icon:"⚠️" },
          ].map(st => (
            <div key={st.label} style={{ ...s.card, background:st.bg, textAlign:"center", padding:16 }}>
              <div style={{ fontSize:22, marginBottom:4 }}>{st.icon}</div>
              <div style={{ fontSize:28, fontWeight:800, color:st.color }}>{st.val}</div>
              <div style={{ fontSize:11, color:"#6B7280", fontWeight:600 }}>{st.label}</div>
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
                  style={s.btn(filterRek===r?"#fff":WBM_COLOR[r]||"#111", filterRek===r?(WBM_COLOR[r]||"#111"):"#fff")}>
                  {r==="Semua"?"Semua":WBM_ICON[r]+" "+r}
                </button>
              ))}
              <select value={filterKelas} onChange={e=>setFilterKelas(e.target.value)}
                style={{ border:"1.5px solid #E4E0D8", borderRadius:8, padding:"7px 12px", fontSize:12, fontFamily:"inherit" }}>
                {kelasList.map(k=><option key={k}>{k}</option>)}
              </select>
              <span style={{ fontSize:12, color:"#888" }}>{filtered.length} siswa</span>
            </div>

            <div style={{ ...s.card, padding:0, overflow:"hidden" }}>
              <div style={{ overflowX:"auto" }}>
                <table style={{ width:"100%", borderCollapse:"collapse", fontSize:12 }}>
                  <thead>
                    <tr style={{ background:"#111110", color:"#fff" }}>
                      {["No","Nama","NISN","Kelas","J/K","B","K","W","Holland","O","C","E","A","N","EfUmum","EfAkad","EfVokas","EfWira","Rekomendasi","⚠️","Aksi"].map(h=>(
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
              <div style={{ fontWeight:700, marginBottom:16 }}>📊 Distribusi WBM</div>
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
              <div style={{ background:WBM_COLOR[selected.rekomendasi], color:"#fff", borderRadius:10, padding:"16px 20px", marginBottom:16, textAlign:"center" }}>
                <div style={{ fontSize:11, opacity:.8, marginBottom:4, letterSpacing:".1em", textTransform:"uppercase" }}>Rekomendasi</div>
                <div style={{ fontSize:22, fontWeight:800 }}>{WBM_ICON[selected.rekomendasi]} {selected.rekomendasi==="Kuliah"?"Melanjutkan Kuliah":selected.rekomendasi}</div>
              </div>
              {(() => {
                const d = selected.detailRekomendasi ||
                  HOLLAND_DETAIL[selected.rekomendasi]?.[String(selected.hollandKode||'')[0]];
                return d ? (
                  <div style={{ background:WBM_COLOR[selected.rekomendasi]+"18", border:`1.5px solid ${WBM_COLOR[selected.rekomendasi]}40`, borderRadius:8, padding:"10px 14px", marginBottom:14, fontSize:12, color:"#374151", lineHeight:1.7 }}>
                    <span style={{ fontWeight:700, color:WBM_COLOR[selected.rekomendasi] }}>Detail bidang: </span>{d}
                  </div>
                ) : null;
              })()}
              <ScoreBar label="💼 Bekerja" value={selected.skor_B} color="#2563EB" />
              <ScoreBar label="🎓 Kuliah" value={selected.skor_M} color="#7C3AED" />
              <ScoreBar label="🚀 Wirausaha" value={selected.skor_W} color="#D97706" />
              <div style={{ fontWeight:700, fontSize:13, margin:"16px 0 10px" }}>💪 Efikasi Diri</div>
              <EfikasiBar label="Efikasi Umum" value={selected.ef_umum} icon="⚡" />
              <EfikasiBar label="Efikasi Akademik" value={selected.ef_akademik} icon="📖" />
              <EfikasiBar label="Efikasi Vokasional" value={selected.ef_vokasional} icon="🔧" />
              <EfikasiBar label="Efikasi Kewirausahaan" value={selected.ef_wirausaha} icon="🚀" />
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
