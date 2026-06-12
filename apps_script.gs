// ══════════════════════════════════════════════════════════════
// APPS SCRIPT BMW KARIR — SMK
// Cara deploy:
// 1. Buka script.google.com → New Project
// 2. Paste seluruh kode ini
// 3. Deploy → New Deployment → Web App
//    Execute as: Me | Who has access: Anyone
// 4. Copy URL deployment → tempel ke APPS_SCRIPT_URL di form HTML
// ══════════════════════════════════════════════════════════════

const SHEET_NAME = "Data BMW";
const SPREADSHEET_ID = ""; // Kosongkan jika pakai sheet yang sama dengan script

// ── Entry point POST (dari form siswa)
function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    appendToSheet(data);
    return ContentService
      .createTextOutput(JSON.stringify({ status: "ok" }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ status: "error", message: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// ── Entry point GET (untuk test koneksi & dashboard)
function doGet(e) {
  const action = e.parameter.action;
  if (action === "getData") {
    const data = getAllData();
    return ContentService
      .createTextOutput(JSON.stringify({ status: "ok", data }))
      .setMimeType(ContentService.MimeType.JSON);
  }
  if (action === "getByNisn") {
    const nisn = e.parameter.nisn;
    const row = getByNisn(nisn);
    return ContentService
      .createTextOutput(JSON.stringify({ status: row ? "ok" : "not_found", data: row }))
      .setMimeType(ContentService.MimeType.JSON);
  }
  return ContentService
    .createTextOutput(JSON.stringify({ status: "ready", message: "BMW Apps Script aktif v2" }))
    .setMimeType(ContentService.MimeType.JSON);
}

// ── Tulis data ke sheet
function appendToSheet(data) {
  const ss = SPREADSHEET_ID
    ? SpreadsheetApp.openById(SPREADSHEET_ID)
    : SpreadsheetApp.getActiveSpreadsheet();

  let sheet = ss.getSheetByName(SHEET_NAME);

  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    const headers = [
      "No", "Timestamp", "Nama", "NISN", "Kelas/Jurusan", "Jenis Kelamin", "Sekolah", "Tanggal Tes", "Pelanggaran",
      // Holland RIASEC
      "H-Realistic", "H-Investigative", "H-Artistic", "H-Social", "H-Enterprising", "H-Conventional", "Kode Holland",
      // Big Five
      "BF-Openness", "BF-Conscientiousness", "BF-Extraversion", "BF-Agreeableness", "BF-Neuroticism", "BF-Stabilitas",
      // Efikasi Diri (menggantikan VARK)
      "EF-Umum", "EF-Akademik", "EF-Vokasional", "EF-Wirausaha",
      // BMW
      "Skor Bekerja", "Skor Kuliah", "Skor Wirausaha", "REKOMENDASI BMW",
      // Meta
      "Raw Answers"
    ];
    sheet.appendRow(headers);

    const headerRange = sheet.getRange(1, 1, 1, headers.length);
    headerRange.setBackground("#1A1A18");
    headerRange.setFontColor("#FFFFFF");
    headerRange.setFontWeight("bold");
    headerRange.setFontSize(11);
    sheet.setFrozenRows(1);

    // Lebar kolom
    sheet.setColumnWidth(1, 40);
    sheet.setColumnWidth(3, 200);
    sheet.setColumnWidth(5, 150);
    sheet.setColumnWidth(7, 180);
    sheet.setColumnWidth(30, 180);
    sheet.setColumnWidth(31, 400);

    // Warna group header
    sheet.getRange(1, 10, 1, 7).setBackground("#1E3A5F").setFontColor("#93C5FD"); // Holland
    sheet.getRange(1, 17, 1, 6).setBackground("#2D1B69").setFontColor("#C4B5FD"); // Big Five
    sheet.getRange(1, 23, 1, 4).setBackground("#14532D").setFontColor("#86EFAC"); // Efikasi
    sheet.getRange(1, 27, 1, 4).setBackground("#78350F").setFontColor("#FCD34D"); // BMW
  }

  // Hitung kode Holland (3 huruf tertinggi)
  const hollandScores = {
    R: data.h_R || 0, I: data.h_I || 0, A: data.h_A || 0,
    S: data.h_S || 0, E: data.h_E || 0, C: data.h_C || 0
  };
  const hollandCode = Object.entries(hollandScores)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(e => e[0])
    .join("");

  const lastRow = sheet.getLastRow();
  const rowNum = lastRow;

  const row = [
    rowNum,
    data.timestamp || new Date().toISOString(),
    data.nama || "",
    data.nisn || "",
    data.kelas || "",
    data.jk || "",
    data.sekolah || "",
    data.tgl || "",
    data.violations || 0,
    // Holland
    data.h_R || 0, data.h_I || 0, data.h_A || 0,
    data.h_S || 0, data.h_E || 0, data.h_C || 0,
    hollandCode,
    // Big Five
    data.bf_O || 0, data.bf_C || 0, data.bf_E || 0,
    data.bf_A || 0, data.bf_N || 0, data.bf_Nstabil || 0,
    // Efikasi Diri (menggantikan VARK)
    data.ef_umum || 0,
    data.ef_akademik || 0,
    data.ef_vokasional || 0,
    data.ef_wirausaha || 0,
    // BMW
    data.skor_B || 0, data.skor_M || 0, data.skor_W || 0,
    data.rekomendasi || "",
    data.rawAnswers || ""
  ];

  sheet.appendRow(row);

  const newRow = sheet.getLastRow();
  const dataRange = sheet.getRange(newRow, 1, 1, row.length - 1);
  const rek = data.rekomendasi || "";

  if (rek === "Bekerja") {
    dataRange.setBackground("#DBEAFE");
    sheet.getRange(newRow, 30).setBackground("#2563EB").setFontColor("#fff").setFontWeight("bold");
  } else if (rek === "Kuliah") {
    dataRange.setBackground("#EDE9FE");
    sheet.getRange(newRow, 30).setBackground("#7C3AED").setFontColor("#fff").setFontWeight("bold");
  } else if (rek === "Wirausaha") {
    dataRange.setBackground("#FEF3C7");
    sheet.getRange(newRow, 30).setBackground("#D97706").setFontColor("#fff").setFontWeight("bold");
  }

  if ((data.violations || 0) > 0) {
    sheet.getRange(newRow, 9).setBackground("#FEE2E2").setFontColor("#DC2626").setFontWeight("bold");
  }

  // Tandai efikasi rendah (< 40%)
  const efCols = { ef_umum: 23, ef_akademik: 24, ef_vokasional: 25, ef_wirausaha: 26 };
  for (const [key, col] of Object.entries(efCols)) {
    const val = data[key] || 0;
    if (val < 40) {
      sheet.getRange(newRow, col).setBackground("#FEE2E2").setFontColor("#DC2626");
    } else if (val >= 80) {
      sheet.getRange(newRow, col).setBackground("#DCFCE7").setFontColor("#16A34A");
    }
  }
}

// ══════════════════════════════════════════
// FUNGSI BANTU
// ══════════════════════════════════════════

function getAllData() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) return [];
  const rows = sheet.getDataRange().getValues();
  if (rows.length < 2) return [];
  const headers = rows[0];
  return rows.slice(1).map(row => {
    const obj = {};
    headers.forEach((h, i) => { obj[h] = row[i]; });
    return obj;
  });
}

function getByNisn(nisn) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) return null;
  const rows = sheet.getDataRange().getValues();
  if (rows.length < 2) return null;
  const headers = rows[0];
  const nisnIdx = headers.indexOf("NISN");
  for (let i = 1; i < rows.length; i++) {
    if (String(rows[i][nisnIdx]) === String(nisn)) {
      const obj = {};
      headers.forEach((h, j) => { obj[h] = rows[i][j]; });
      return obj;
    }
  }
  return null;
}

function buatRingkasan() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const dataSheet = ss.getSheetByName(SHEET_NAME);
  if (!dataSheet) { SpreadsheetApp.getUi().alert("Sheet data tidak ditemukan!"); return; }

  let summarySheet = ss.getSheetByName("Ringkasan");
  if (summarySheet) ss.deleteSheet(summarySheet);
  summarySheet = ss.insertSheet("Ringkasan");

  const rows = dataSheet.getDataRange().getValues();
  const data = rows.slice(1);
  const total = data.length;
  if (total === 0) { SpreadsheetApp.getUi().alert("Belum ada data!"); return; }

  const bekerja = data.filter(r => r[29] === "Bekerja").length;
  const kuliah  = data.filter(r => r[29] === "Kuliah").length;
  const wiraus  = data.filter(r => r[29] === "Wirausaha").length;

  summarySheet.getRange("A1").setValue("RINGKASAN TES BMW SMK").setFontSize(16).setFontWeight("bold");
  summarySheet.getRange("A2").setValue(`Generated: ${new Date().toLocaleString("id-ID")}`).setFontColor("#888");

  summarySheet.getRange("A4:B4").setValues([["Total Peserta", total]]);
  summarySheet.getRange("A5:B5").setValues([["Bekerja", bekerja]]).setBackground("#DBEAFE");
  summarySheet.getRange("A6:B6").setValues([["Kuliah", kuliah]]).setBackground("#EDE9FE");
  summarySheet.getRange("A7:B7").setValues([["Wirausaha", wiraus]]).setBackground("#FEF3C7");

  summarySheet.getRange("A9").setValue("RATA-RATA EFIKASI DIRI").setFontWeight("bold");
  const efKols = ["EF-Umum", "EF-Akademik", "EF-Vokasional", "EF-Wirausaha"];
  efKols.forEach((label, li) => {
    const colIdx = rows[0].indexOf(label);
    const avg = colIdx >= 0 ? Math.round(data.reduce((s, r) => s + (r[colIdx] || 0), 0) / total) : 0;
    summarySheet.getRange(10 + li, 1, 1, 2).setValues([[label, avg + "%"]]);
  });

  const avgB = data.reduce((s,r)=>s+(r[26]||0),0)/total;
  const avgM = data.reduce((s,r)=>s+(r[27]||0),0)/total;
  const avgW = data.reduce((s,r)=>s+(r[28]||0),0)/total;

  summarySheet.getRange("D4:E4").setValues([["Rata-rata Skor Bekerja", avgB.toFixed(1)+"%"]]);
  summarySheet.getRange("D5:E5").setValues([["Rata-rata Skor Kuliah", avgM.toFixed(1)+"%"]]);
  summarySheet.getRange("D6:E6").setValues([["Rata-rata Skor Wirausaha", avgW.toFixed(1)+"%"]]);

  SpreadsheetApp.getUi().alert(`Ringkasan berhasil dibuat!\nTotal: ${total} | B:${bekerja} | M:${kuliah} | W:${wiraus}`);
}

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu("🎯 BMW Tools")
    .addItem("📊 Buat Ringkasan Statistik", "buatRingkasan")
    .addItem("🔄 Refresh Header Format", "refreshHeader")
    .addToUi();
}

function refreshHeader() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) return;
  const range = sheet.getRange(1, 1, 1, sheet.getLastColumn());
  range.setBackground("#1A1A18").setFontColor("#FFFFFF").setFontWeight("bold");
  SpreadsheetApp.getUi().alert("Header diperbarui!");
}

function sendNotification(data) {
  const email = "email_panitia@sekolah.sch.id"; // GANTI
  const subject = `[BMW Tes] Jawaban baru: ${data.nama} — ${data.rekomendasi}`;
  const body = `
Siswa baru telah menyelesaikan tes BMW.

Nama    : ${data.nama}
NISN    : ${data.nisn}
Kelas   : ${data.kelas}
Sekolah : ${data.sekolah}
Hasil   : ${data.rekomendasi}
Skor    : Bekerja ${data.skor_B}% | Kuliah ${data.skor_M}% | Wirausaha ${data.skor_W}%
Holland : ${data.h_R}/${data.h_I}/${data.h_A}/${data.h_S}/${data.h_E}/${data.h_C}
Efikasi : Umum ${data.ef_umum}% | Akad ${data.ef_akademik}% | Vokas ${data.ef_vokasional}% | Wira ${data.ef_wirausaha}%
Pelanggaran: ${data.violations}
  `;
  MailApp.sendEmail(email, subject, body);
}
