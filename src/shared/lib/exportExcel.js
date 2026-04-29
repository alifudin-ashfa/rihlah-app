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