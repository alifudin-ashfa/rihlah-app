import * as XLSX from "xlsx";

export function exportCashbookExcel({
  rows,
  summary,
  filters = {},
  fileName = "buku-kas-rihlah.xlsx",
}) {
  const workbook = XLSX.utils.book_new();

  const periode =
    filters.startDate || filters.endDate
      ? `${filters.startDate || "Awal"} - ${filters.endDate || "Akhir"}`
      : "Semua periode";

  const summarySheet = XLSX.utils.aoa_to_sheet([
    ["Laporan Buku Kas Rihlah Al-Yaqut"],
    ["Periode", periode],
    ["Dicetak", new Date().toLocaleString("id-ID")],
    [],
    ["Item", "Nilai"],
    ["Total Masuk", summary.totalIncome],
    ["Total Keluar", summary.totalExpense],
    ["Saldo", summary.balance],
    ["Jumlah Transaksi", summary.transactionCount],
  ]);

  XLSX.utils.book_append_sheet(workbook, summarySheet, "Ringkasan");

  const cashbookRows = rows.map((row) => ({
    Tanggal: row.date,
    Tipe: row.type === "income" ? "Masuk" : "Keluar",
    Kategori: row.category,
    Deskripsi: row.description,
    "Nama Terkait": row.relatedName,
    Metode: row.method,
    Masuk: row.income,
    Keluar: row.expense,
    "Saldo Berjalan": row.runningBalance,
    Catatan: row.note,
    Bukti: row.proofUrl,
  }));

  const cashbookSheet = XLSX.utils.json_to_sheet(cashbookRows);
  XLSX.utils.book_append_sheet(workbook, cashbookSheet, "Buku Kas");

  XLSX.writeFile(workbook, fileName);
}