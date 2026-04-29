import * as XLSX from "xlsx";

const EXCEL_CELL_TEXT_LIMIT = 32767;

function safeText(value, fallback = "-") {
  const text = String(value ?? "").trim();
  if (!text) return fallback;

  if (text.length <= EXCEL_CELL_TEXT_LIMIT) return text;

  return `${text.slice(0, EXCEL_CELL_TEXT_LIMIT - 20)}... [dipotong]`;
}

function getProofLabel(proofUrl) {
  const text = String(proofUrl || "").trim();

  if (!text) return "Belum ada";
  if (text.startsWith("data:")) return "Ada bukti";
  if (text.length > 120) return "Ada bukti";

  return text;
}

function formatPeriod(filters = {}) {
  if (filters.periodLabel) return filters.periodLabel;

  if (filters.startDate || filters.endDate) {
    return `${filters.startDate || "Awal"} - ${filters.endDate || "Akhir"}`;
  }

  return "Semua periode";
}

function setColumnWidths(sheet, widths) {
  sheet["!cols"] = widths.map((wch) => ({ wch }));
}

export function exportCashbookExcel({
  rows,
  summary,
  filters = {},
  fileName = "buku-kas-rihlah.xlsx",
}) {
  const workbook = XLSX.utils.book_new();
  const periode = formatPeriod(filters);

  const summarySheet = XLSX.utils.aoa_to_sheet([
    ["Laporan Buku Kas Rihlah Al-Yaqut"],
    ["Periode", periode],
    ["Dicetak", new Date().toLocaleString("id-ID")],
    [],
    ["Item", "Nilai"],
    ["Total Masuk", Number(summary.totalIncome || 0)],
    ["Total Keluar", Number(summary.totalExpense || 0)],
    ["Saldo", Number(summary.balance || 0)],
    ["Jumlah Transaksi", Number(summary.transactionCount || 0)],
  ]);

  setColumnWidths(summarySheet, [28, 28]);
  XLSX.utils.book_append_sheet(workbook, summarySheet, "Ringkasan");

  const cashbookRows = rows.map((row) => ({
    Tanggal: safeText(row.date),
    Tipe: row.type === "income" ? "Masuk" : "Keluar",
    Kategori: safeText(row.category),
    Deskripsi: safeText(row.description),
    "Nama Terkait": safeText(row.relatedName),
    Metode: safeText(row.method),
    Masuk: Number(row.income || 0),
    Keluar: Number(row.expense || 0),
    "Saldo Berjalan": Number(row.runningBalance || 0),
    Catatan: safeText(row.note),
    Bukti: getProofLabel(row.proofUrl),
  }));

  const cashbookSheet = XLSX.utils.json_to_sheet(cashbookRows);
  setColumnWidths(cashbookSheet, [14, 10, 20, 38, 28, 14, 16, 16, 18, 34, 16]);
  XLSX.utils.book_append_sheet(workbook, cashbookSheet, "Buku Kas");

  XLSX.writeFile(workbook, fileName);
}

function formatFileDate() {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export function exportOutstandingParticipantsExcel({
  rows = [],
  summary = {},
  fileName = `santri-belum-lunas-rihlah-${formatFileDate()}.xlsx`,
} = {}) {
  const workbook = XLSX.utils.book_new();

  const summarySheet = XLSX.utils.aoa_to_sheet([
    ["Daftar Santri Belum Lunas Rihlah Al-Yaqut"],
    ["Dicetak", new Date().toLocaleString("id-ID")],
    [],
    ["Item", "Nilai"],
    ["Total Santri Belum Lunas", Number(summary.count || rows.length || 0)],
    ["Total Target Iuran", Number(summary.totalTarget || 0)],
    ["Total Sudah Bayar", Number(summary.totalPaid || 0)],
    ["Total Sisa Tagihan", Number(summary.totalRemaining || 0)],
  ]);

  setColumnWidths(summarySheet, [30, 28]);
  XLSX.utils.book_append_sheet(workbook, summarySheet, "Ringkasan");

  const participantRows = rows.map((row, index) => ({
    No: index + 1,
    "Nama Santri": safeText(row.nama),
    Kelas: safeText(row.kelas, "Tanpa kelas"),
    Kamar: safeText(row.kamar, "Tanpa kamar"),
    "Target Iuran": Number(row.targetIuran || 0),
    "Sudah Bayar": Number(row.totalPaid || 0),
    "Sisa Tagihan": Number(row.remaining || 0),
    Status: safeText(row.status),
    "Pembayaran Terakhir": safeText(row.lastPaymentDate),
    Catatan: safeText(row.catatan),
  }));

  const participantSheet = XLSX.utils.json_to_sheet(participantRows);
  setColumnWidths(participantSheet, [6, 32, 14, 16, 16, 16, 16, 16, 20, 34]);
  XLSX.utils.book_append_sheet(workbook, participantSheet, "Santri Belum Lunas");

  XLSX.writeFile(workbook, fileName);
}