import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { formatRupiah } from "./rihlahCore";

function formatDate(value) {
  if (!value) return "-";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

export function exportCashbookPdf({
  rows,
  summary,
  filters = {},
  fileName = "buku-kas-rihlah.pdf",
}) {
  const doc = new jsPDF({
    orientation: "landscape",
  });

  const periode =
    filters.startDate || filters.endDate
      ? `${filters.startDate || "Awal"} - ${filters.endDate || "Akhir"}`
      : "Semua periode";

  doc.setFontSize(16);
  doc.text("Laporan Buku Kas Rihlah Al-Yaqut", 14, 16);

  doc.setFontSize(10);
  doc.text(`Periode: ${periode}`, 14, 24);
  doc.text(`Dicetak: ${new Date().toLocaleString("id-ID")}`, 14, 30);

  autoTable(doc, {
    startY: 38,
    head: [["Ringkasan", "Nilai"]],
    body: [
      ["Total Masuk", formatRupiah(summary.totalIncome)],
      ["Total Keluar", formatRupiah(summary.totalExpense)],
      ["Saldo", formatRupiah(summary.balance)],
      ["Jumlah Transaksi", `${summary.transactionCount} transaksi`],
    ],
    styles: {
      fontSize: 9,
      cellPadding: 2,
    },
  });

  autoTable(doc, {
    startY: doc.lastAutoTable.finalY + 8,
    head: [
      [
        "Tanggal",
        "Tipe",
        "Kategori",
        "Deskripsi",
        "Metode",
        "Masuk",
        "Keluar",
        "Saldo",
      ],
    ],
    body: rows.map((row) => [
      formatDate(row.date),
      row.type === "income" ? "Masuk" : "Keluar",
      row.category,
      row.description,
      row.method || "-",
      row.income ? formatRupiah(row.income) : "-",
      row.expense ? formatRupiah(row.expense) : "-",
      formatRupiah(row.runningBalance),
    ]),
    styles: {
      fontSize: 7,
      cellPadding: 2,
    },
    headStyles: {
      fontSize: 7,
    },
    columnStyles: {
      0: { cellWidth: 25 },
      1: { cellWidth: 18 },
      2: { cellWidth: 32 },
      3: { cellWidth: 58 },
      4: { cellWidth: 22 },
      5: { halign: "right", cellWidth: 28 },
      6: { halign: "right", cellWidth: 28 },
      7: { halign: "right", cellWidth: 28 },
    },
  });

  doc.save(fileName);
}

function formatFileDate() {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export function exportOutstandingParticipantsPdf({
  rows = [],
  summary = {},
  fileName = `santri-belum-lunas-rihlah-${formatFileDate()}.pdf`,
} = {}) {
  const doc = new jsPDF({
    orientation: "landscape",
  });

  doc.setFontSize(16);
  doc.text("Daftar Santri Belum Lunas Rihlah Al-Yaqut", 14, 16);

  doc.setFontSize(10);
  doc.text(`Dicetak: ${new Date().toLocaleString("id-ID")}`, 14, 24);

  autoTable(doc, {
    startY: 32,
    head: [["Ringkasan", "Nilai"]],
    body: [
      ["Total Santri Belum Lunas", `${summary.count || rows.length || 0} santri`],
      ["Total Target Iuran", formatRupiah(summary.totalTarget || 0)],
      ["Total Sudah Bayar", formatRupiah(summary.totalPaid || 0)],
      ["Total Sisa Tagihan", formatRupiah(summary.totalRemaining || 0)],
    ],
    styles: {
      fontSize: 9,
      cellPadding: 2,
    },
  });

  autoTable(doc, {
    startY: doc.lastAutoTable.finalY + 8,
    head: [
      [
        "No",
        "Nama Santri",
        "Kelas",
        "Kamar",
        "Target Iuran",
        "Sudah Bayar",
        "Sisa Tagihan",
        "Status",
        "Catatan",
      ],
    ],
    body: rows.map((row, index) => [
      index + 1,
      row.nama || "-",
      row.kelas || "-",
      row.kamar || "-",
      formatRupiah(row.targetIuran || 0),
      formatRupiah(row.totalPaid || 0),
      formatRupiah(row.remaining || 0),
      row.status || "-",
      row.catatan || "-",
    ]),
    styles: {
      fontSize: 7,
      cellPadding: 2,
      overflow: "linebreak",
    },
    headStyles: {
      fontSize: 7,
    },
    columnStyles: {
      0: { cellWidth: 10, halign: "center" },
      1: { cellWidth: 50 },
      2: { cellWidth: 18 },
      3: { cellWidth: 22 },
      4: { cellWidth: 28, halign: "right" },
      5: { cellWidth: 28, halign: "right" },
      6: { cellWidth: 28, halign: "right" },
      7: { cellWidth: 24 },
      8: { cellWidth: 56 },
    },
  });

  doc.save(fileName);
}