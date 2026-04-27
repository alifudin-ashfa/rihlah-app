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