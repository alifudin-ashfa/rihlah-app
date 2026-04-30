import React, { useEffect, useMemo, useState } from "react";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import {
  Calendar,
  Download,
  FileText,
  Printer,
  Users,
  Wallet,
} from "lucide-react";
import {
  buttonOutline,
  buttonPrimary,
  formatRupiah,
  Section,
  Pill,
  MiniStat,
  EmptyState,
  InlineBanner,
  tabClass,
} from "../../shared/lib/rihlahCore";

const hasParticipantProof = (payment) =>
  Boolean(payment?.buktiDataUrl || payment?.buktiPath || payment?.buktiUrl);

const hasVendorProof = (payment) =>
  Boolean(
    payment?.buktiPath ||
      payment?.buktiDataUrl ||
      payment?.buktiUrl ||
      payment?.buktiNama
  );

const formatPrintDate = () =>
  new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date());

const formatFileDate = () => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

const isWithinDateRange = (dateValue, startDate, endDate) => {
  if (!startDate && !endDate) return true;
  if (!dateValue) return false;

  const normalizedDate = String(dateValue).slice(0, 10);
  if (startDate && normalizedDate < startDate) return false;
  if (endDate && normalizedDate > endDate) return false;

  return true;
};

const formatDisplayDate = (dateValue) => {
  if (!dateValue) return "";

  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(new Date(`${dateValue}T00:00:00`));
};

const buildPeriodLabel = (startDate, endDate) => {
  if (startDate && endDate) {
    return `${formatDisplayDate(startDate)} sampai ${formatDisplayDate(endDate)}`;
  }

  if (startDate) return `Mulai ${formatDisplayDate(startDate)}`;
  if (endDate) return `Sampai ${formatDisplayDate(endDate)}`;

  return "Semua tanggal";
};

const buildPeriodFileSuffix = (startDate, endDate) => {
  if (startDate && endDate) return `${startDate}-sampai-${endDate}`;
  if (startDate) return `mulai-${startDate}`;
  if (endDate) return `sampai-${endDate}`;

  return formatFileDate();
};

const sumNominal = (rows) =>
  rows.reduce((sum, row) => sum + Number(row?.nominal || 0), 0);

const sumVendorPaymentAmount = (rows) =>
  rows.reduce(
    (sum, row) => sum + Number(row?.nominal || 0) + Number(row?.biayaAdmin || 0),
    0
  );

const sanitizePdfText = (value) =>
  String(value ?? "-")
    .replace(/\u00a0/g, " ")
    .replace(/\u2011/g, "-")
    .replace(/\uFFFE/g, "-")
    .replace(/\s+/g, " ")
    .trim();

const rupiahForPdf = (value) => sanitizePdfText(formatRupiah(value));


const getFinalParticipantTone = (status) => {
  if (status === "Lunas") return "emerald";
  if (status === "Cicilan") return "amber";
  return "rose";
};

const getFinalVendorTone = (status) => {
  if (status === "Lunas") return "emerald";
  if (status === "Lebih Bayar") return "amber";
  if (status === "DP / Cicilan") return "sky";
  return "rose";
};

const addPdfHeader = (doc, title, printedAt, periodLabel) => {
  doc.setProperties({
    title,
    subject: "Rihlah Pesantren Islam Al Yaqut",
    creator: "Rihlah App",
  });

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(71, 85, 105);
  doc.text("RIHLAH PESANTREN ISLAM AL YAQUT", 14, 16);

  doc.setTextColor(15, 23, 42);
  doc.setFontSize(18);
  doc.text(title, 14, 25);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(71, 85, 105);
  doc.text(`Dibuat pada ${sanitizePdfText(printedAt)}`, 14, 32);

  const hasPeriod = Boolean(periodLabel);
  if (hasPeriod) {
    doc.text(`Periode: ${sanitizePdfText(periodLabel)}`, 14, 38);
  }

  const lineY = hasPeriod ? 44 : 38;
  doc.setDrawColor(203, 213, 225);
  doc.line(14, lineY, 196, lineY);

  return lineY + 8;
};

const addPdfFooter = (doc, printedAt) => {
  const pageCount = doc.getNumberOfPages();

  for (let page = 1; page <= pageCount; page += 1) {
    doc.setPage(page);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text(
      `Rihlah Al Yaqut • ${sanitizePdfText(printedAt)}`,
      14,
      287
    );
    doc.text(`Halaman ${page} dari ${pageCount}`, 196, 287, {
      align: "right",
    });
  }
};

const pdfTableTheme = {
  theme: "grid",
  styles: {
    font: "helvetica",
    fontSize: 8,
    cellPadding: 2,
    textColor: [15, 23, 42],
    lineColor: [203, 213, 225],
    lineWidth: 0.2,
    overflow: "linebreak",
  },
  headStyles: {
    fillColor: [241, 245, 249],
    textColor: [51, 65, 85],
    fontStyle: "bold",
  },
  alternateRowStyles: {
    fillColor: [248, 250, 252],
  },
};

const PrintStyles = () => (
  <style>{`
    @media print {
      @page {
        size: A4;
        margin: 12mm 10mm;
      }

      html,
      body,
      #root {
        background: #ffffff !important;
        color: #0f172a !important;
      }

      body {
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }

      nav,
      header,
      aside,
      .no-print,
      .print-hidden,
      button,
      input[type="file"] {
        display: none !important;
      }

      .print-root {
        display: block !important;
        width: 100% !important;
        max-width: none !important;
        margin: 0 !important;
        padding: 0 !important;
      }

      .print-only {
        display: block !important;
      }

      .print-section {
        box-shadow: none !important;
        border: 1px solid #cbd5e1 !important;
      }

      .print-section:not(.print-audit-section) {
        break-inside: avoid;
        page-break-inside: avoid;
      }

      .print-audit-section {
        break-inside: auto !important;
        page-break-inside: auto !important;
      }

      .print-card {
        break-inside: auto !important;
        page-break-inside: auto !important;
        box-shadow: none !important;
      }

      .print-row {
        break-inside: avoid;
        page-break-inside: avoid;
        box-shadow: none !important;
      }

      .print-grid-2 {
        display: grid !important;
        grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
        gap: 8px !important;
      }

      .print-grid-4 {
        display: grid !important;
        grid-template-columns: repeat(4, minmax(0, 1fr)) !important;
        gap: 8px !important;
      }

      .print-audit-detail-grid {
        display: grid !important;
        grid-template-columns: minmax(0, 1fr) !important;
        gap: 10px !important;
      }

      .print-appendix {
        break-before: page;
        page-break-before: always;
      }

      .print-compact * {
        line-height: 1.22 !important;
      }

      .print-compact .rounded-3xl,
      .print-compact .rounded-2xl,
      .print-compact .rounded-xl {
        border-radius: 8px !important;
      }

      .print-compact .p-6,
      .print-compact .sm\:p-6,
      .print-compact .p-5 {
        padding: 10px !important;
      }

      .print-compact .p-4 {
        padding: 8px !important;
      }

      .print-compact .mt-6 {
        margin-top: 10px !important;
      }

      .print-compact .mt-5,
      .print-compact .mt-4,
      .print-compact .space-y-5 > :not([hidden]) ~ :not([hidden]),
      .print-compact .space-y-4 > :not([hidden]) ~ :not([hidden]) {
        margin-top: 8px !important;
      }

      .print-compact .text-lg {
        font-size: 13px !important;
      }

      .print-compact .text-sm {
        font-size: 10px !important;
      }

      .print-compact .text-xs {
        font-size: 9px !important;
      }

      .print-table-wrap {
        display: block !important;
        margin-top: 8px !important;
        width: 100% !important;
        overflow: visible !important;
      }

      .print-table {
        display: table !important;
        width: 100% !important;
        table-layout: fixed !important;
        border-collapse: collapse !important;
        font-size: 8.5px !important;
      }

      .print-table thead {
        display: table-header-group !important;
      }

      .print-table tr {
        break-inside: avoid;
        page-break-inside: avoid;
      }

      .print-table th,
      .print-table td {
        border: 1px solid #cbd5e1 !important;
        padding: 4px 5px !important;
        text-align: left !important;
        vertical-align: top !important;
      }

      .print-table th {
        background: #f1f5f9 !important;
        color: #334155 !important;
        font-weight: 800 !important;
        white-space: nowrap !important;
      }

      .print-table .cell-name {
        font-weight: 800 !important;
        color: #0f172a !important;
        word-break: normal !important;
        overflow-wrap: anywhere !important;
      }

      .print-table .cell-class,
      .print-table .cell-date,
      .print-table .cell-method,
      .print-table .cell-type {
        white-space: nowrap !important;
      }

      .print-table .cell-note {
        color: #475569 !important;
        overflow-wrap: anywhere !important;
      }

      .print-table .cell-amount {
        text-align: right !important;
        white-space: nowrap !important;
        font-weight: 800 !important;
        color: #0f172a !important;
      }

      .audit-participant-table col:nth-child(1) { width: 34%; }
      .audit-participant-table col:nth-child(2) { width: 7%; }
      .audit-participant-table col:nth-child(3) { width: 13%; }
      .audit-participant-table col:nth-child(4) { width: 12%; }
      .audit-participant-table col:nth-child(5) { width: 18%; }
      .audit-participant-table col:nth-child(6) { width: 16%; }

      .audit-vendor-table {
        font-size: 8px !important;
      }

      .audit-vendor-table col:nth-child(1) { width: 18%; }
      .audit-vendor-table col:nth-child(2) { width: 19%; }
      .audit-vendor-table col:nth-child(3) { width: 11%; }
      .audit-vendor-table col:nth-child(4) { width: 10%; }
      .audit-vendor-table col:nth-child(5) { width: 10%; }
      .audit-vendor-table col:nth-child(6) { width: 13%; }
      .audit-vendor-table col:nth-child(7) { width: 10%; }
      .audit-vendor-table col:nth-child(8) { width: 9%; }

      .print-table-empty {
        margin-top: 8px !important;
        border: 1px solid #cbd5e1 !important;
        border-radius: 8px !important;
        padding: 8px !important;
        color: #475569 !important;
        background: #f8fafc !important;
        font-size: 10px !important;
      }
    }

    @media screen {
      .print-only {
        display: none !important;
      }
    }
  `}</style>
);

export default function LaporanPage({ app }) {
  const [printScope, setPrintScope] = useState(null);
  const [filterStartDate, setFilterStartDate] = useState("");
  const [filterEndDate, setFilterEndDate] = useState("");

  const {
    canEdit,
    config,
    laporanView,
    setLaporanView,
    importInputRef,
    participantPaymentHistory,
    participantRows = [],
    vendorPaymentRows,
    expenseLookup,
    expenseRows = [],
    expenses,
    otherIncomes,
    totalIuranTarget,
    totalIuranMasuk,
    totalIuranOutstanding,
    totalOtherIncome,
    totalTagihan,
    totalArusKeluarVendor,
    totalVendorOutstanding,
    totalVendorOverpaid,
    totalIuranOverpaid,
    totalVendorUnlinked,
    saldoKasSaatIni,
    proyeksiSaldoAkhir,
    jumlahSantri = 0,
    jumlahLunas = 0,
    jumlahBelumBayar,
    jumlahCicilan,
    warnings,
    financeHealth,
    exportBackup,
    importBackup,
    exportCsvReport,
  } = app;

  const hasDateFilter = Boolean(filterStartDate || filterEndDate);
  const periodLabel = useMemo(
    () => buildPeriodLabel(filterStartDate, filterEndDate),
    [filterEndDate, filterStartDate]
  );
  const periodFileSuffix = useMemo(
    () => buildPeriodFileSuffix(filterStartDate, filterEndDate),
    [filterEndDate, filterStartDate]
  );

  const participantPaymentRows = useMemo(
    () =>
      Array.isArray(participantPaymentHistory) ? participantPaymentHistory : [],
    [participantPaymentHistory]
  );

  const allVendorPaymentRows = useMemo(
    () => (Array.isArray(vendorPaymentRows) ? vendorPaymentRows : []),
    [vendorPaymentRows]
  );

  const filteredParticipantPaymentRows = useMemo(
    () =>
      participantPaymentRows.filter((payment) =>
        isWithinDateRange(payment?.tanggal, filterStartDate, filterEndDate)
      ),
    [filterEndDate, filterStartDate, participantPaymentRows]
  );

  const filteredVendorPaymentRows = useMemo(
    () =>
      allVendorPaymentRows.filter((payment) =>
        isWithinDateRange(payment?.tanggal, filterStartDate, filterEndDate)
      ),
    [allVendorPaymentRows, filterEndDate, filterStartDate]
  );

  const filteredExpenses = useMemo(() => {
    const rows = Array.isArray(expenses) ? expenses : [];

    return rows.filter((expense) =>
      isWithinDateRange(expense?.jatuhTempo, filterStartDate, filterEndDate)
    );
  }, [expenses, filterEndDate, filterStartDate]);

  const filteredOtherIncomes = useMemo(() => {
    const rows = Array.isArray(otherIncomes) ? otherIncomes : [];

    return rows.filter((income) =>
      isWithinDateRange(income?.tanggal, filterStartDate, filterEndDate)
    );
  }, [filterEndDate, filterStartDate, otherIncomes]);

  const participantWithoutProof = useMemo(
    () => filteredParticipantPaymentRows.filter((payment) => !hasParticipantProof(payment)),
    [filteredParticipantPaymentRows]
  );

  const vendorWithoutProof = useMemo(
    () => filteredVendorPaymentRows.filter((payment) => !hasVendorProof(payment)),
    [filteredVendorPaymentRows]
  );

  const vendorAuditRows = filteredVendorPaymentRows;

  const auditProofSummary = useMemo(
    () => ({
      participantWithoutProofCount: participantWithoutProof.length,
      vendorWithoutProofCount: vendorWithoutProof.length,
      totalWithoutProof:
        participantWithoutProof.length + vendorWithoutProof.length,
      participantWithoutProofAmount: participantWithoutProof.reduce(
        (sum, payment) => sum + Number(payment.nominal || 0),
        0
      ),
      vendorWithoutProofAmount: vendorWithoutProof.reduce(
        (sum, payment) => sum + Number(payment.nominal || 0),
        0
      ),
    }),
    [participantWithoutProof, vendorWithoutProof]
  );

  const reportTotalIuranMasuk = hasDateFilter
    ? sumNominal(filteredParticipantPaymentRows)
    : totalIuranMasuk;
  const reportTotalOtherIncome = hasDateFilter
    ? sumNominal(filteredOtherIncomes)
    : totalOtherIncome;
  const reportTotalTagihan = hasDateFilter ? sumNominal(filteredExpenses) : totalTagihan;
  const reportTotalArusKeluarVendor = hasDateFilter
    ? sumVendorPaymentAmount(filteredVendorPaymentRows)
    : totalArusKeluarVendor;
  const reportSaldoKasSaatIni = hasDateFilter
    ? reportTotalIuranMasuk + reportTotalOtherIncome - reportTotalArusKeluarVendor
    : saldoKasSaatIni;
  const reportProyeksiSaldoAkhir = hasDateFilter
    ? reportTotalIuranMasuk + reportTotalOtherIncome - reportTotalTagihan
    : proyeksiSaldoAkhir;
  const reportTotalVendorOutstanding = hasDateFilter
    ? Math.max(reportTotalTagihan - reportTotalArusKeluarVendor, 0)
    : totalVendorOutstanding;

  const allParticipantWithoutProof = useMemo(
    () => participantPaymentRows.filter((payment) => !hasParticipantProof(payment)),
    [participantPaymentRows]
  );

  const allVendorWithoutProof = useMemo(
    () => allVendorPaymentRows.filter((payment) => !hasVendorProof(payment)),
    [allVendorPaymentRows]
  );

  const finalOutstandingParticipants = useMemo(() => {
    const rows = Array.isArray(participantRows) ? participantRows : [];

    return rows
      .filter((item) => Number(item?.remaining || 0) > 0 || item?.status !== "Lunas")
      .sort((a, b) => {
        const remainingA = Number(a?.remaining || 0);
        const remainingB = Number(b?.remaining || 0);

        if (remainingA !== remainingB) return remainingB - remainingA;

        return String(a?.nama || "").localeCompare(String(b?.nama || ""));
      });
  }, [participantRows]);

  const finalVendorStatusRows = useMemo(() => {
    const rows = Array.isArray(expenseRows) ? expenseRows : [];

    return [...rows].sort((a, b) => {
      const dateA = String(a?.jatuhTempo || "9999-12-31");
      const dateB = String(b?.jatuhTempo || "9999-12-31");

      if (dateA !== dateB) return dateA.localeCompare(dateB);

      return String(a?.vendor || a?.nama || "").localeCompare(
        String(b?.vendor || b?.nama || "")
      );
    });
  }, [expenseRows]);

  const finalTransactionsWithoutProof = useMemo(() => {
    const participantRows = allParticipantWithoutProof.map((payment) => ({
      id: `participant-${payment.id}`,
      jenis: "Iuran santri",
      nama: payment.participantName || "Santri tidak diketahui",
      detail: payment.participantClass || "Tanpa kelas",
      tanggal: payment.tanggal || "-",
      metode: payment.metode || "-",
      nominal: Number(payment.nominal || 0),
      catatan: payment.catatan || "-",
    }));

    const vendorRows = allVendorWithoutProof.map((payment) => {
      const linkedExpense = expenseLookup?.[String(payment.expenseId)];

      return {
        id: `vendor-${payment.id}`,
        jenis: "Pembayaran vendor",
        nama: linkedExpense?.vendor || payment.vendorSnapshot || "Belum ditautkan",
        detail: linkedExpense?.nama || "Pembayaran manual",
        tanggal: payment.tanggal || "-",
        metode: payment.metode || "-",
        nominal: Number(payment.nominal || 0),
        catatan: payment.catatan || "-",
      };
    });

    return [...participantRows, ...vendorRows].sort((a, b) =>
      String(a.tanggal || "").localeCompare(String(b.tanggal || ""))
    );
  }, [allParticipantWithoutProof, allVendorWithoutProof, expenseLookup]);

  const finalTotalMissingProofAmount = finalTransactionsWithoutProof.reduce(
    (sum, item) => sum + Number(item.nominal || 0),
    0
  );

  const finalStatus =
    finalOutstandingParticipants.length > 0 || finalTransactionsWithoutProof.length > 0
      ? "Belum Aman"
      : totalVendorOutstanding > 0 || totalVendorOverpaid + totalIuranOverpaid > 0
        ? "Perlu Dicek"
        : "Siap";

  const finalStatusTone =
    finalStatus === "Siap"
      ? "emerald"
      : finalStatus === "Belum Aman"
        ? "rose"
        : "amber";

  const finalStatusText =
    finalStatus === "Siap"
      ? "Data utama sudah siap untuk diserahkan ke panitia dan pimpinan. Tetap simpan backup final sebelum hari-H."
      : finalStatus === "Belum Aman"
        ? `Masih ada ${finalOutstandingParticipants.length} santri belum lunas/cicilan dan ${finalTransactionsWithoutProof.length} transaksi tanpa bukti. Lengkapi sebelum laporan final dibagikan.`
        : "Data sudah mendekati siap, tetapi masih ada item yang perlu dicek seperti sisa tagihan vendor atau selisih lebih bayar.";

  const targetIuranLabel = "Target iuran total kegiatan";
  const iuranMasukLabel = hasDateFilter
    ? "Iuran masuk periode"
    : "Total iuran masuk";
  const tagihanVendorLabel = hasDateFilter
    ? "Tagihan vendor jatuh tempo periode"
    : "Total tagihan vendor";
  const pembayaranVendorLabel = hasDateFilter
    ? "Pembayaran vendor periode + admin"
    : "Pembayaran vendor + admin";
  const saldoKasLabel = hasDateFilter ? "Saldo kas periode" : "Saldo kas saat ini";
  const proyeksiSaldoLabel = hasDateFilter
    ? "Proyeksi saldo periode"
    : "Proyeksi saldo akhir";
  const sisaTagihanVendorLabel = hasDateFilter
    ? "Sisa tagihan vendor periode"
    : "Sisa tagihan vendor";
  const pemasukanLainLabel = hasDateFilter
    ? "Pemasukan lain periode"
    : "Pemasukan lain";

  const narasiPimpinanText = hasDateFilter
    ? `Pada periode ${periodLabel}, saldo kas periode adalah ${formatRupiah(
        reportSaldoKasSaatIni
      )}. Target dan tunggakan iuran tetap dihitung dari total kegiatan: masih ada tunggakan ${formatRupiah(
        totalIuranOutstanding
      )} dari ${jumlahBelumBayar + jumlahCicilan} santri.`
    : `Kas saat ini ${formatRupiah(
        reportSaldoKasSaatIni
      )}. Masih ada tunggakan iuran ${formatRupiah(
        totalIuranOutstanding
      )} dari ${jumlahBelumBayar + jumlahCicilan} santri.`;

  const narasiVendorText = hasDateFilter
    ? `Pada periode ${periodLabel}, pembayaran vendor + admin sebesar ${formatRupiah(
        reportTotalArusKeluarVendor
      )}. Tagihan vendor jatuh tempo periode ini ${formatRupiah(
        reportTotalTagihan
      )}, sehingga sisa tagihan vendor periode menjadi ${formatRupiah(
        reportTotalVendorOutstanding
      )}.`
    : `Sisa tagihan vendor ${formatRupiah(
        reportTotalVendorOutstanding
      )}. Jika seluruh tagihan dilunasi hari ini, proyeksi saldo akhir menjadi ${formatRupiah(
        reportProyeksiSaldoAkhir
      )}.`;

  const narasiPimpinanPdfText = sanitizePdfText(narasiPimpinanText);
  const narasiVendorPdfText = sanitizePdfText(narasiVendorText);

  const hasMissingProof = auditProofSummary.totalWithoutProof > 0;
  const printDate = useMemo(() => formatPrintDate(), []);

  const requestPrint = (scope) => {
    if ((scope === "audit" || scope === "final") && !canEdit) return;
    setPrintScope(scope);

    window.requestAnimationFrame(() => {
      window.setTimeout(() => {
        window.print();
      }, 80);
    });
  };

  const resetDateFilter = () => {
    setFilterStartDate("");
    setFilterEndDate("");
  };

  useEffect(() => {
    const resetPrintScope = () => setPrintScope(null);
    window.addEventListener("afterprint", resetPrintScope);
    return () => window.removeEventListener("afterprint", resetPrintScope);
  }, []);

  const showReportSection =
    printScope === "laporan" ||
    (!printScope &&
      (laporanView === "ringkasan" || laporanView === "operasional"));

  const showOperationalAuditSection =
    canEdit &&
    !printScope &&
    (laporanView === "operasional" || laporanView === "audit");

  const showProofAuditSection =
    canEdit && (printScope === "audit" || (!printScope && laporanView === "audit"));

  const showFinalSection =
    canEdit && (printScope === "final" || (!printScope && laporanView === "final"));

  const downloadReportPdf = () => {
    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    const generatedAt = formatPrintDate();
    let y = addPdfHeader(doc, "Laporan Keuangan Kegiatan", generatedAt, periodLabel);

    autoTable(doc, {
      ...pdfTableTheme,
      startY: y,
      margin: { left: 14, right: 14 },
      head: [["Komponen", "Nilai"]],
      body: [
        [targetIuranLabel, rupiahForPdf(totalIuranTarget)],
        [iuranMasukLabel, rupiahForPdf(reportTotalIuranMasuk)],
        [tagihanVendorLabel, rupiahForPdf(reportTotalTagihan)],
        [pembayaranVendorLabel, rupiahForPdf(reportTotalArusKeluarVendor)],
        [saldoKasLabel, rupiahForPdf(reportSaldoKasSaatIni)],
        [proyeksiSaldoLabel, rupiahForPdf(reportProyeksiSaldoAkhir)],
        [sisaTagihanVendorLabel, rupiahForPdf(reportTotalVendorOutstanding)],
        [pemasukanLainLabel, rupiahForPdf(reportTotalOtherIncome)],
      ],
      columnStyles: {
        0: { cellWidth: 95 },
        1: { cellWidth: 87, halign: "right", fontStyle: "bold" },
      },
    });

    y = doc.lastAutoTable.finalY + 8;

    autoTable(doc, {
      ...pdfTableTheme,
      startY: y,
      margin: { left: 14, right: 14 },
      head: [["Narasi", "Keterangan"]],
      body: [
        ["Narasi pimpinan", narasiPimpinanPdfText],
        ["Narasi vendor", narasiVendorPdfText],
      ],
      columnStyles: {
        0: { cellWidth: 42, fontStyle: "bold" },
        1: { cellWidth: 140 },
      },
    });

    y = doc.lastAutoTable.finalY + 8;

    autoTable(doc, {
      ...pdfTableTheme,
      startY: y,
      margin: { left: 14, right: 14 },
      head: [["Ringkasan Audit Cepat", "Nilai"]],
      body: [
        ["Transaksi tanpa bukti", `${auditProofSummary.totalWithoutProof} transaksi`],
        [
          "Nominal tanpa bukti",
          rupiahForPdf(
            auditProofSummary.participantWithoutProofAmount +
              auditProofSummary.vendorWithoutProofAmount
          ),
        ],
        ["Belum tertaut", rupiahForPdf(totalVendorUnlinked)],
        [
          "Lebih bayar total",
          rupiahForPdf(totalVendorOverpaid + totalIuranOverpaid),
        ],
      ],
      columnStyles: {
        0: { cellWidth: 95 },
        1: { cellWidth: 87, halign: "right", fontStyle: "bold" },
      },
    });

    addPdfFooter(doc, generatedAt);
    doc.save(`laporan-keuangan-rihlah-${periodFileSuffix}.pdf`);
  };

  const downloadFinalReportPdf = () => {
    if (!canEdit) return;

    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    const generatedAt = formatPrintDate();
    let y = addPdfHeader(
      doc,
      "Laporan Final Panitia",
      generatedAt,
      "Data final keseluruhan kegiatan"
    );

    autoTable(doc, {
      ...pdfTableTheme,
      startY: y,
      margin: { left: 14, right: 14 },
      head: [["Komponen", "Nilai"]],
      body: [
        ["Nama kegiatan", sanitizePdfText(config?.namaKegiatan || "Rihlah Pesantren Islam Al Yaqut")],
        ["Tanggal kegiatan", "6-7 Mei 2026"],
        ["Total santri", `${jumlahSantri} santri`],
        ["Santri lunas", `${jumlahLunas} santri`],
        ["Santri belum lunas/cicilan", `${finalOutstandingParticipants.length} santri`],
        ["Total target iuran", rupiahForPdf(totalIuranTarget)],
        ["Total iuran masuk", rupiahForPdf(totalIuranMasuk)],
        ["Total tunggakan", rupiahForPdf(totalIuranOutstanding)],
        ["Total tagihan vendor", rupiahForPdf(totalTagihan)],
        ["Pembayaran vendor + admin", rupiahForPdf(totalArusKeluarVendor)],
        ["Saldo kas saat ini", rupiahForPdf(saldoKasSaatIni)],
        ["Proyeksi saldo akhir", rupiahForPdf(proyeksiSaldoAkhir)],
      ],
      columnStyles: {
        0: { cellWidth: 85, fontStyle: "bold" },
        1: { cellWidth: 97, halign: "right" },
      },
    });

    y = doc.lastAutoTable.finalY + 8;

    autoTable(doc, {
      ...pdfTableTheme,
      startY: y,
      margin: { left: 14, right: 14 },
      head: [["Status final", "Keterangan"]],
      body: [[finalStatus, sanitizePdfText(finalStatusText)]],
      columnStyles: {
        0: { cellWidth: 38, fontStyle: "bold" },
        1: { cellWidth: 144 },
      },
    });

    y = doc.lastAutoTable.finalY + 8;

    if (y > 235) {
      doc.addPage();
      y = 16;
    }

    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42);
    doc.text("Daftar Santri Belum Lunas", 14, y);
    y += 5;

    autoTable(doc, {
      ...pdfTableTheme,
      startY: y,
      margin: { left: 14, right: 14 },
      head: [["Nama", "Kelas", "Kamar", "Target", "Sudah Bayar", "Sisa", "Status"]],
      body:
        finalOutstandingParticipants.length > 0
          ? finalOutstandingParticipants.map((item) => [
              sanitizePdfText(item.nama),
              sanitizePdfText(item.kelas || "-"),
              sanitizePdfText(item.kamar || "-"),
              rupiahForPdf(item.targetIuran),
              rupiahForPdf(item.totalPaid),
              rupiahForPdf(item.remaining),
              sanitizePdfText(item.status || "-"),
            ])
          : [["Semua santri sudah lunas.", "", "", "", "", "", ""]],
      styles: {
        ...pdfTableTheme.styles,
        fontSize: 6.8,
        cellPadding: 1.5,
      },
      columnStyles: {
        0: { cellWidth: 45, fontStyle: "bold" },
        1: { cellWidth: 13, halign: "center" },
        2: { cellWidth: 18 },
        3: { cellWidth: 24, halign: "right" },
        4: { cellWidth: 26, halign: "right" },
        5: { cellWidth: 24, halign: "right", fontStyle: "bold" },
        6: { cellWidth: 32 },
      },
    });

    y = doc.lastAutoTable.finalY + 8;

    if (y > 235) {
      doc.addPage();
      y = 16;
    }

    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42);
    doc.text("Status Vendor", 14, y);
    y += 5;

    autoTable(doc, {
      ...pdfTableTheme,
      startY: y,
      margin: { left: 14, right: 14 },
      head: [["Vendor", "Keperluan", "Jatuh Tempo", "Tagihan", "Dibayar", "Sisa", "Status"]],
      body:
        finalVendorStatusRows.length > 0
          ? finalVendorStatusRows.map((item) => [
              sanitizePdfText(item.vendor || "-"),
              sanitizePdfText(item.nama || "-"),
              sanitizePdfText(item.jatuhTempo || "-"),
              rupiahForPdf(item.nominal),
              rupiahForPdf(item.paid),
              rupiahForPdf(item.remaining),
              sanitizePdfText(item.status || "-"),
            ])
          : [["Belum ada tagihan vendor.", "", "", "", "", "", ""]],
      styles: {
        ...pdfTableTheme.styles,
        fontSize: 6.8,
        cellPadding: 1.5,
      },
      columnStyles: {
        0: { cellWidth: 32, fontStyle: "bold" },
        1: { cellWidth: 35 },
        2: { cellWidth: 22 },
        3: { cellWidth: 25, halign: "right" },
        4: { cellWidth: 25, halign: "right" },
        5: { cellWidth: 25, halign: "right", fontStyle: "bold" },
        6: { cellWidth: 18 },
      },
    });

    y = doc.lastAutoTable.finalY + 8;

    if (y > 235) {
      doc.addPage();
      y = 16;
    }

    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42);
    doc.text("Transaksi Tanpa Bukti", 14, y);
    y += 5;

    autoTable(doc, {
      ...pdfTableTheme,
      startY: y,
      margin: { left: 14, right: 14 },
      head: [["Jenis", "Nama/Keperluan", "Tanggal", "Metode", "Nominal", "Catatan"]],
      body:
        finalTransactionsWithoutProof.length > 0
          ? finalTransactionsWithoutProof.map((item) => [
              sanitizePdfText(item.jenis),
              sanitizePdfText(`${item.nama} - ${item.detail}`),
              sanitizePdfText(item.tanggal),
              sanitizePdfText(item.metode),
              rupiahForPdf(item.nominal),
              sanitizePdfText(item.catatan),
            ])
          : [["Semua transaksi sudah memiliki bukti.", "", "", "", "", ""]],
      styles: {
        ...pdfTableTheme.styles,
        fontSize: 6.8,
        cellPadding: 1.5,
      },
      columnStyles: {
        0: { cellWidth: 28, fontStyle: "bold" },
        1: { cellWidth: 55 },
        2: { cellWidth: 22 },
        3: { cellWidth: 20 },
        4: { cellWidth: 26, halign: "right", fontStyle: "bold" },
        5: { cellWidth: 31 },
      },
    });

    addPdfFooter(doc, generatedAt);
    doc.save(`laporan-final-panitia-rihlah-${formatFileDate()}.pdf`);
  };

  const downloadAuditPdf = () => {
    if (!canEdit) return;

    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    const generatedAt = formatPrintDate();
    let y = addPdfHeader(doc, "Lampiran Audit Bukti Pembayaran", generatedAt, periodLabel);

    autoTable(doc, {
      ...pdfTableTheme,
      startY: y,
      margin: { left: 14, right: 14 },
      head: [["Ringkasan Audit", "Nilai"]],
      body: [
        [
          "Iuran tanpa bukti",
          `${auditProofSummary.participantWithoutProofCount} transaksi`,
        ],
        [
          "Nominal iuran tanpa bukti",
          rupiahForPdf(auditProofSummary.participantWithoutProofAmount),
        ],
        [
          "Vendor tanpa bukti",
          `${auditProofSummary.vendorWithoutProofCount} transaksi`,
        ],
        [
          "Total transaksi tanpa bukti",
          `${auditProofSummary.totalWithoutProof} transaksi`,
        ],
      ],
      columnStyles: {
        0: { cellWidth: 95 },
        1: { cellWidth: 87, halign: "right", fontStyle: "bold" },
      },
    });

    y = doc.lastAutoTable.finalY + 8;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42);
    doc.text("Iuran Santri Tanpa Bukti", 14, y);
    y += 5;

    autoTable(doc, {
      ...pdfTableTheme,
      startY: y,
      margin: { left: 14, right: 14 },
      head: [["Nama santri", "Kelas", "Tanggal", "Metode", "Catatan", "Nominal"]],
      body:
        participantWithoutProof.length > 0
          ? participantWithoutProof.map((payment) => [
              sanitizePdfText(payment.participantName || "Santri tidak diketahui"),
              sanitizePdfText(payment.participantClass || "Tanpa kelas"),
              sanitizePdfText(payment.tanggal || "-"),
              sanitizePdfText(payment.metode || "-"),
              sanitizePdfText(payment.catatan || "-"),
              rupiahForPdf(payment.nominal),
            ])
          : [["Semua transaksi iuran sudah memiliki bukti.", "", "", "", "", ""]],
      styles: {
        ...pdfTableTheme.styles,
        fontSize: 7.2,
        cellPadding: 1.7,
      },
      columnStyles: {
        0: { cellWidth: 58, fontStyle: "bold" },
        1: { cellWidth: 13, halign: "center" },
        2: { cellWidth: 24 },
        3: { cellWidth: 22 },
        4: { cellWidth: 35 },
        5: { cellWidth: 30, halign: "right", fontStyle: "bold" },
      },
      didDrawPage: () => {},
    });

    y = doc.lastAutoTable.finalY + 8;

    if (y > 245) {
      doc.addPage();
      y = 16;
    }

    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42);
    doc.text("Daftar Pembayaran Vendor", 14, y);
    y += 5;

    const vendorBody =
      vendorAuditRows.length > 0
        ? vendorAuditRows.map((payment) => {
            const linkedExpense = expenseLookup?.[String(payment.expenseId)];
            const vendorName =
              linkedExpense?.vendor ||
              payment.vendorSnapshot ||
              "Belum ditautkan";
            const expenseName = linkedExpense?.nama || "Pembayaran manual";
            const proofStatus = hasVendorProof(payment) ? "Ada bukti" : "Tanpa bukti";

            return [
              sanitizePdfText(vendorName),
              sanitizePdfText(expenseName),
              sanitizePdfText(payment.tanggal || "-"),
              sanitizePdfText(payment.metode || "-"),
              sanitizePdfText(payment.jenis || "-"),
              sanitizePdfText(payment.akunTujuan || "-"),
              sanitizePdfText(payment.catatan || "-"),
              rupiahForPdf(payment.nominal),
              proofStatus,
            ];
          })
        : [["Belum ada pembayaran vendor.", "", "", "", "", "", "", "", ""]];

    autoTable(doc, {
      ...pdfTableTheme,
      startY: y,
      margin: { left: 14, right: 14 },
      head: [
        [
          "Vendor",
          "Keperluan",
          "Tanggal",
          "Metode",
          "Jenis",
          "Akun tujuan",
          "Catatan",
          "Nominal",
          "Status bukti",
        ],
      ],
      body: vendorBody,
      styles: {
        ...pdfTableTheme.styles,
        fontSize: 6.2,
        cellPadding: 1.3,
      },
      columnStyles: {
        0: { cellWidth: 26, fontStyle: "bold" },
        1: { cellWidth: 29 },
        2: { cellWidth: 18 },
        3: { cellWidth: 15 },
        4: { cellWidth: 14 },
        5: { cellWidth: 22 },
        6: { cellWidth: 22 },
        7: { cellWidth: 20, halign: "right", fontStyle: "bold" },
        8: { cellWidth: 16, fontStyle: "bold" },
      },
    });

    y = doc.lastAutoTable.finalY + 8;

    if (y > 255) {
      doc.addPage();
      y = 16;
    }

    autoTable(doc, {
      ...pdfTableTheme,
      startY: y,
      margin: { left: 14, right: 14 },
      head: [["Catatan audit bukti pembayaran"]],
      body: [
        [
          "Transaksi dianggap lengkap jika memiliki data bukti seperti file, data URL, URL, path storage, atau nama bukti yang tersimpan. Jika ada transaksi tanpa bukti, lengkapi dari halaman Santri atau Vendor sesuai jenis transaksinya.",
        ],
      ],
      styles: {
        ...pdfTableTheme.styles,
        fontSize: 8,
      },
    });

    addPdfFooter(doc, generatedAt);
    doc.save(`audit-bukti-pembayaran-rihlah-${periodFileSuffix}.pdf`);
  };

  return (
    <div className="print-root print-compact space-y-4 sm:space-y-6">
      <PrintStyles />

      <div className="print-only border-b border-slate-300 pb-4">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
          Rihlah Pesantren Islam Al Yaqut
        </p>
        <h1 className="mt-2 text-2xl font-extrabold text-slate-950">
          {printScope === "audit"
            ? "Lampiran Audit Bukti Pembayaran"
            : printScope === "final"
              ? "Laporan Final Panitia"
              : "Laporan Keuangan Kegiatan"}
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          Dicetak pada {printDate}
        </p>
        <p className="mt-1 text-sm text-slate-600">
          Periode: {periodLabel}
        </p>
      </div>

      <div className="no-print rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
              <Calendar className="h-4 w-4 text-slate-500" />
              Filter tanggal laporan
            </div>
            <p className="mt-1 text-sm text-slate-500">
              Periode aktif: <span className="font-semibold text-slate-700">{periodLabel}</span>
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] sm:items-end">
            <label className="text-sm font-medium text-slate-700">
              Tanggal awal
              <input
                type="date"
                value={filterStartDate}
                max={filterEndDate || undefined}
                onChange={(event) => setFilterStartDate(event.target.value)}
                className="mt-1 h-10 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-slate-500"
              />
            </label>

            <label className="text-sm font-medium text-slate-700">
              Tanggal akhir
              <input
                type="date"
                value={filterEndDate}
                min={filterStartDate || undefined}
                onChange={(event) => setFilterEndDate(event.target.value)}
                className="mt-1 h-10 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-slate-500"
              />
            </label>

            <button
              type="button"
              onClick={resetDateFilter}
              className={buttonOutline}
              disabled={!hasDateFilter}
            >
              Reset filter
            </button>
          </div>
        </div>
      </div>

      <div className="no-print flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setLaporanView("ringkasan")}
            className={tabClass(laporanView === "ringkasan")}
          >
            Ringkasan Eksekutif
          </button>

          <button
            onClick={() => setLaporanView("operasional")}
            className={tabClass(laporanView === "operasional")}
          >
            Detail Operasional
          </button>

          {canEdit ? (
            <button
              onClick={() => setLaporanView("final")}
              className={tabClass(laporanView === "final")}
            >
              Final Panitia
            </button>
          ) : null}

          {canEdit ? (
            <button
              onClick={() => setLaporanView("audit")}
              className={tabClass(laporanView === "audit")}
            >
              Audit data
            </button>
          ) : null}
        </div>

        <div className="flex flex-wrap gap-2">
          <button onClick={() => requestPrint("laporan")} className={buttonOutline}>
            <Printer className="mr-2 h-4 w-4" />
            Cetak Laporan
          </button>

          <button onClick={downloadReportPdf} className={buttonOutline}>
            <Download className="mr-2 h-4 w-4" />
            Download PDF Laporan
          </button>

          {canEdit ? (
            <>
              <button onClick={() => requestPrint("audit")} className={buttonOutline}>
                <Printer className="mr-2 h-4 w-4" />
                Cetak Audit
              </button>

              <button onClick={downloadAuditPdf} className={buttonOutline}>
                <Download className="mr-2 h-4 w-4" />
                Download PDF Audit
              </button>

              <button onClick={() => requestPrint("final")} className={buttonOutline}>
                <Printer className="mr-2 h-4 w-4" />
                Cetak Final
              </button>

              <button onClick={downloadFinalReportPdf} className={buttonPrimary}>
                <Download className="mr-2 h-4 w-4" />
                PDF Final
              </button>
            </>
          ) : null}
        </div>
      </div>

      {showReportSection ? (
        <Section
          id="laporan"
          title="Laporan dan Narasi Otomatis"
          className="print-section"
        >
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4 print-grid-4">
            <MiniStat
              label={targetIuranLabel}
              value={formatRupiah(totalIuranTarget)}
              tone="sky"
            />
            <MiniStat
              label={iuranMasukLabel}
              value={formatRupiah(reportTotalIuranMasuk)}
              tone="emerald"
            />
            <MiniStat
              label={tagihanVendorLabel}
              value={formatRupiah(reportTotalTagihan)}
              tone="amber"
            />
            <MiniStat
              label={pembayaranVendorLabel}
              value={formatRupiah(reportTotalArusKeluarVendor)}
              tone="rose"
            />
            <MiniStat
              label={saldoKasLabel}
              value={formatRupiah(reportSaldoKasSaatIni)}
              tone={reportSaldoKasSaatIni >= 0 ? "emerald" : "rose"}
            />
            <MiniStat
              label={proyeksiSaldoLabel}
              value={formatRupiah(reportProyeksiSaldoAkhir)}
              tone={reportProyeksiSaldoAkhir >= 0 ? "emerald" : "rose"}
            />
            <MiniStat
              label={sisaTagihanVendorLabel}
              value={formatRupiah(reportTotalVendorOutstanding)}
              tone={reportTotalVendorOutstanding > 0 ? "amber" : "emerald"}
            />
            <MiniStat
              label={pemasukanLainLabel}
              value={formatRupiah(reportTotalOtherIncome)}
              tone="violet"
            />
          </div>

          <div className="mt-6 grid gap-4 2xl:grid-cols-2 print-grid-2">
            <InlineBanner
              title="Narasi pimpinan"
              text={narasiPimpinanText}
              tone={financeHealth.tone}
            />

            <InlineBanner
              title="Narasi vendor"
              text={narasiVendorText}
              tone={reportTotalVendorOutstanding > 0 ? "amber" : "emerald"}
            />
          </div>

          <div className="print-only mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-sm font-bold text-slate-900">
              Ringkasan audit cepat
            </p>
            <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-4 print-grid-4">
              <MiniStat
                label="Transaksi tanpa bukti"
                value={`${auditProofSummary.totalWithoutProof} transaksi`}
                tone={hasMissingProof ? "rose" : "emerald"}
              />
              <MiniStat
                label="Nominal tanpa bukti"
                value={formatRupiah(
                  auditProofSummary.participantWithoutProofAmount +
                    auditProofSummary.vendorWithoutProofAmount
                )}
                tone={
                  auditProofSummary.participantWithoutProofAmount +
                    auditProofSummary.vendorWithoutProofAmount >
                  0
                    ? "rose"
                    : "emerald"
                }
              />
              <MiniStat
                label="Belum tertaut"
                value={formatRupiah(totalVendorUnlinked)}
                tone={totalVendorUnlinked > 0 ? "amber" : "slate"}
              />
              <MiniStat
                label="Lebih bayar total"
                value={formatRupiah(totalVendorOverpaid + totalIuranOverpaid)}
                tone={
                  totalVendorOverpaid + totalIuranOverpaid > 0
                    ? "amber"
                    : "slate"
                }
              />
            </div>
          </div>
        </Section>
      ) : null}

      {showFinalSection ? (
        <Section
          id="laporan-final"
          title="Laporan Final Panitia"
          subtitle="Ringkasan akhir untuk rapat panitia dan pimpinan sebelum Rihlah 6-7 Mei 2026."
          className="print-section print-audit-section"
        >
          <div className="space-y-5">
            <InlineBanner
              title={`Status final: ${finalStatus}`}
              text={finalStatusText}
              tone={finalStatusTone}
            />

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4 print-grid-4">
              <MiniStat label="Total santri" value={`${jumlahSantri} santri`} helper={`${jumlahLunas} lunas · ${jumlahCicilan} cicilan · ${jumlahBelumBayar} belum bayar`} tone="sky" />
              <MiniStat label="Total target iuran" value={formatRupiah(totalIuranTarget)} tone="sky" />
              <MiniStat label="Total iuran masuk" value={formatRupiah(totalIuranMasuk)} tone="emerald" />
              <MiniStat label="Total tunggakan" value={formatRupiah(totalIuranOutstanding)} tone={totalIuranOutstanding > 0 ? "rose" : "emerald"} />
              <MiniStat label="Total tagihan vendor" value={formatRupiah(totalTagihan)} tone="amber" />
              <MiniStat label="Pembayaran vendor + admin" value={formatRupiah(totalArusKeluarVendor)} tone="rose" />
              <MiniStat label="Saldo kas saat ini" value={formatRupiah(saldoKasSaatIni)} tone={saldoKasSaatIni >= 0 ? "emerald" : "rose"} />
              <MiniStat label="Proyeksi saldo akhir" value={formatRupiah(proyeksiSaldoAkhir)} tone={proyeksiSaldoAkhir >= 0 ? "emerald" : "rose"} />
            </div>

            <div className="no-print flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <button onClick={() => requestPrint("final")} className={buttonOutline}>
                <Printer className="mr-2 h-4 w-4" />
                Cetak Laporan Final
              </button>
              <button onClick={downloadFinalReportPdf} className={buttonPrimary}>
                <Download className="mr-2 h-4 w-4" />
                Download PDF Laporan Final
              </button>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm print-card">
              <div className="flex items-start gap-3">
                <div className="rounded-2xl bg-rose-50 p-3 text-rose-700"><Users className="h-5 w-5" /></div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Daftar Santri Belum Lunas</h3>
                  <p className="mt-1 text-sm text-slate-500">Data ini bisa dipakai untuk follow-up pembayaran sebelum hari-H.</p>
                </div>
              </div>
              <div className="mt-5 overflow-x-auto print-table-wrap">
                {finalOutstandingParticipants.length === 0 ? (
                  <div className="print-table-empty">Semua santri sudah lunas berdasarkan data saat ini.</div>
                ) : (
                  <table className="print-table w-full min-w-[900px] border-collapse text-sm">
                    <thead><tr><th>Nama santri</th><th>Kelas</th><th>Kamar</th><th>Target</th><th>Sudah bayar</th><th>Sisa</th><th>Status</th><th>Catatan</th></tr></thead>
                    <tbody>
                      {finalOutstandingParticipants.map((item) => (
                        <tr key={item.id} className="border-b border-slate-100">
                          <td className="cell-name p-3 font-bold text-slate-900">{item.nama}</td>
                          <td className="cell-class p-3">{item.kelas || "-"}</td>
                          <td className="cell-note p-3">{item.kamar || "-"}</td>
                          <td className="cell-amount p-3 text-right font-bold">{formatRupiah(item.targetIuran)}</td>
                          <td className="cell-amount p-3 text-right font-bold">{formatRupiah(item.totalPaid)}</td>
                          <td className="cell-amount p-3 text-right font-bold">{formatRupiah(item.remaining)}</td>
                          <td className="p-3"><Pill tone={getFinalParticipantTone(item.status)}>{item.status || "-"}</Pill></td>
                          <td className="cell-note p-3">{item.catatan || "-"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm print-card">
              <div className="flex items-start gap-3">
                <div className="rounded-2xl bg-amber-50 p-3 text-amber-700"><Wallet className="h-5 w-5" /></div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Status Vendor dan Tagihan</h3>
                  <p className="mt-1 text-sm text-slate-500">Pantau sisa tagihan, DP, pelunasan, dan status setiap vendor.</p>
                </div>
              </div>
              <div className="mt-5 overflow-x-auto print-table-wrap">
                {finalVendorStatusRows.length === 0 ? (
                  <div className="print-table-empty">Belum ada tagihan vendor.</div>
                ) : (
                  <table className="print-table w-full min-w-[860px] border-collapse text-sm">
                    <thead><tr><th>Vendor</th><th>Keperluan</th><th>Jatuh tempo</th><th>Tagihan</th><th>Dibayar</th><th>Sisa</th><th>Status</th></tr></thead>
                    <tbody>
                      {finalVendorStatusRows.map((item) => (
                        <tr key={item.id} className="border-b border-slate-100">
                          <td className="cell-name p-3 font-bold text-slate-900">{item.vendor || "-"}</td>
                          <td className="cell-note p-3">{item.nama || "-"}</td>
                          <td className="cell-date p-3">{item.jatuhTempo || "-"}</td>
                          <td className="cell-amount p-3 text-right font-bold">{formatRupiah(item.nominal)}</td>
                          <td className="cell-amount p-3 text-right font-bold">{formatRupiah(item.paid)}</td>
                          <td className="cell-amount p-3 text-right font-bold">{formatRupiah(item.remaining)}</td>
                          <td className="p-3"><Pill tone={getFinalVendorTone(item.status)}>{item.status || "-"}</Pill></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm print-card">
              <div className="flex items-start gap-3">
                <div className="rounded-2xl bg-slate-100 p-3 text-slate-700"><FileText className="h-5 w-5" /></div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Transaksi Tanpa Bukti</h3>
                  <p className="mt-1 text-sm text-slate-500">Total nominal tanpa bukti: {formatRupiah(finalTotalMissingProofAmount)}.</p>
                </div>
              </div>
              <div className="mt-5 overflow-x-auto print-table-wrap">
                {finalTransactionsWithoutProof.length === 0 ? (
                  <div className="print-table-empty">Semua transaksi iuran dan vendor sudah memiliki bukti.</div>
                ) : (
                  <table className="print-table w-full min-w-[900px] border-collapse text-sm">
                    <thead><tr><th>Jenis</th><th>Nama / Keperluan</th><th>Tanggal</th><th>Metode</th><th>Nominal</th><th>Catatan</th></tr></thead>
                    <tbody>
                      {finalTransactionsWithoutProof.map((item) => (
                        <tr key={item.id} className="border-b border-slate-100">
                          <td className="cell-type p-3 font-bold text-slate-900">{item.jenis}</td>
                          <td className="cell-name p-3"><p className="font-bold text-slate-900">{item.nama}</p><p className="text-xs text-slate-500">{item.detail}</p></td>
                          <td className="cell-date p-3">{item.tanggal}</td>
                          <td className="cell-method p-3">{item.metode}</td>
                          <td className="cell-amount p-3 text-right font-bold">{formatRupiah(item.nominal)}</td>
                          <td className="cell-note p-3">{item.catatan}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </div>
        </Section>
      ) : null}

      {showOperationalAuditSection ? (
        <Section
          title="Audit data dan tindak lanjut"
          subtitle="Pisahkan review audit dari ringkasan agar lebih mudah dibaca saat rapat atau pengecekan internal."
          className="print-section"
        >
          <div className="grid gap-4 2xl:grid-cols-2 2xl:gap-6 print-grid-2">
            <div className="space-y-3 print-card">
              <h3 className="text-lg font-semibold text-slate-900">
                Item yang perlu dicek
              </h3>

              {warnings.length === 0 ? (
                <EmptyState text="Tidak ada warning aktif saat ini." />
              ) : (
                warnings.map((warning, index) => (
                  <InlineBanner
                    key={index}
                    title={`Audit ${index + 1}`}
                    text={warning}
                    tone="amber"
                  />
                ))
              )}
            </div>

            <div className="space-y-3 print-card">
              <h3 className="text-lg font-semibold text-slate-900">
                Aksi laporan
              </h3>

              <div className="rounded-2xl border bg-slate-50 p-4 print-card">
                {canEdit ? (
                  <div className="no-print flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                    <button onClick={exportCsvReport} className={buttonOutline}>
                      <Download className="mr-2 h-4 w-4" />
                      Export CSV
                    </button>

                    <button onClick={exportBackup} className={buttonOutline}>
                      Backup JSON
                    </button>

                    <button
                      onClick={() => importInputRef.current?.click()}
                      className={buttonOutline}
                    >
                      Import JSON
                    </button>
                  </div>
                ) : (
                  <InlineBanner
                    title="Mode pelihat"
                    text="Export, backup, dan import hanya tersedia untuk admin/bendahara."
                    tone="sky"
                  />
                )}

                <p className="mt-3 text-sm text-slate-500">
                  {canEdit
                    ? "Gunakan ekspor saat perlu rekap rapat, dan gunakan backup sebelum melakukan perubahan besar."
                    : "Anda tetap bisa membaca laporan dan audit tanpa login."}
                </p>
              </div>

              <div className="rounded-2xl border bg-slate-50 p-4 print-card">
                <p className="text-sm font-semibold text-slate-700">
                  Ringkasan audit cepat
                </p>

                <div className="mt-3 grid gap-3 lg:grid-cols-2 print-grid-2">
                  <MiniStat
                    label="Belum tertaut"
                    value={formatRupiah(totalVendorUnlinked)}
                    tone={totalVendorUnlinked > 0 ? "amber" : "slate"}
                  />
                  <MiniStat
                    label="Lebih bayar total"
                    value={formatRupiah(totalVendorOverpaid + totalIuranOverpaid)}
                    tone={
                      totalVendorOverpaid + totalIuranOverpaid > 0
                        ? "amber"
                        : "slate"
                    }
                  />
                </div>
              </div>
            </div>
          </div>
        </Section>
      ) : null}

      {showProofAuditSection ? (
        <Section
          title="Audit Bukti Pembayaran"
          subtitle="Daftar transaksi yang belum memiliki bukti pembayaran, baik dari iuran santri maupun pembayaran vendor."
          className="print-section print-audit-section"
        >
          <div className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4 print-grid-4">
              <MiniStat
                label="Iuran tanpa bukti"
                value={`${auditProofSummary.participantWithoutProofCount} transaksi`}
                tone={
                  auditProofSummary.participantWithoutProofCount > 0
                    ? "rose"
                    : "emerald"
                }
              />
              <MiniStat
                label="Nominal iuran tanpa bukti"
                value={formatRupiah(auditProofSummary.participantWithoutProofAmount)}
                tone={
                  auditProofSummary.participantWithoutProofAmount > 0
                    ? "rose"
                    : "emerald"
                }
              />
              <MiniStat
                label="Vendor tanpa bukti"
                value={`${auditProofSummary.vendorWithoutProofCount} transaksi`}
                tone={
                  auditProofSummary.vendorWithoutProofCount > 0
                    ? "rose"
                    : "emerald"
                }
              />
              <MiniStat
                label="Total transaksi tanpa bukti"
                value={`${auditProofSummary.totalWithoutProof} transaksi`}
                tone={hasMissingProof ? "rose" : "emerald"}
              />
            </div>

            {hasMissingProof ? (
              <InlineBanner
                title="Ada transaksi tanpa bukti"
                text="Lengkapi bukti pembayaran agar audit kas lebih rapi dan mudah diverifikasi."
                tone="amber"
              />
            ) : (
              <InlineBanner
                title="Semua bukti pembayaran lengkap"
                text="Tidak ada transaksi iuran atau vendor yang terdeteksi tanpa bukti pembayaran."
                tone="emerald"
              />
            )}

            <div className="grid gap-5 2xl:grid-cols-2 print-audit-detail-grid">
              <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm print-card">
                <div className="flex items-start gap-3">
                  <div className="rounded-2xl bg-sky-50 p-3 text-sky-700">
                    <Users className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">
                      Iuran Santri Tanpa Bukti
                    </h3>
                    <p className="mt-1 text-sm text-slate-500">
                      Transaksi iuran yang belum memiliki bukti pembayaran.
                    </p>
                  </div>
                </div>

                <div className="print-only print-table-wrap">
                  {participantWithoutProof.length === 0 ? (
                    <div className="print-table-empty">
                      Semua transaksi iuran sudah memiliki bukti.
                    </div>
                  ) : (
                    <table className="print-table audit-participant-table">
                      <colgroup>
                        <col />
                        <col />
                        <col />
                        <col />
                        <col />
                        <col />
                      </colgroup>
                      <thead>
                        <tr>
                          <th>Nama santri</th>
                          <th>Kelas</th>
                          <th>Tanggal</th>
                          <th>Metode</th>
                          <th>Catatan</th>
                          <th>Nominal</th>
                        </tr>
                      </thead>
                      <tbody>
                        {participantWithoutProof.map((payment) => (
                          <tr key={`print-${payment.id}`}>
                            <td className="cell-name">
                              {payment.participantName || "Santri tidak diketahui"}
                            </td>
                            <td className="cell-class">
                              {payment.participantClass || "Tanpa kelas"}
                            </td>
                            <td className="cell-date">{payment.tanggal || "-"}</td>
                            <td className="cell-method">{payment.metode || "-"}</td>
                            <td className="cell-note">{payment.catatan || "-"}</td>
                            <td className="cell-amount">
                              {formatRupiah(payment.nominal)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>

                <div className="no-print mt-5 space-y-3">
                  {participantWithoutProof.length === 0 ? (
                    <EmptyState text="Semua transaksi iuran sudah memiliki bukti." />
                  ) : (
                    participantWithoutProof.map((payment) => (
                      <div
                        key={payment.id}
                        className="rounded-2xl border bg-slate-50 p-4 print-row"
                      >
                        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="font-bold text-slate-900">
                                {payment.participantName || "Santri tidak diketahui"}
                              </p>
                              <Pill tone="rose">Tanpa bukti</Pill>
                            </div>

                            <p className="mt-1 text-sm text-slate-500">
                              {payment.participantClass || "Tanpa kelas"} ·{" "}
                              {payment.tanggal || "-"} · {payment.metode || "-"}
                            </p>

                            {payment.catatan ? (
                              <p className="mt-2 rounded-xl bg-white p-3 text-sm text-slate-600">
                                {payment.catatan}
                              </p>
                            ) : null}
                          </div>

                          <p className="text-lg font-extrabold text-slate-900">
                            {formatRupiah(payment.nominal)}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm print-card">
                <div className="flex items-start gap-3">
                  <div className="rounded-2xl bg-amber-50 p-3 text-amber-700">
                    <Wallet className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">
                      Pembayaran Vendor Tanpa Bukti
                    </h3>
                    <p className="mt-1 text-sm text-slate-500">
                      Transaksi pembayaran vendor yang belum memiliki bukti
                      transfer.
                    </p>
                  </div>
                </div>

                <div className="print-only print-table-wrap">
                  {vendorWithoutProof.length === 0 ? (
                    <div className="print-table-empty">
                      Semua pembayaran vendor sudah memiliki bukti.
                    </div>
                  ) : (
                    <table className="print-table audit-vendor-table">
                      <colgroup>
                        <col />
                        <col />
                        <col />
                        <col />
                        <col />
                        <col />
                        <col />
                        <col />
                      </colgroup>
                      <thead>
                        <tr>
                          <th>Vendor</th>
                          <th>Keperluan</th>
                          <th>Tanggal</th>
                          <th>Metode</th>
                          <th>Jenis</th>
                          <th>Akun tujuan</th>
                          <th>Catatan</th>
                          <th>Nominal</th>
                        </tr>
                      </thead>
                      <tbody>
                        {vendorWithoutProof.map((payment) => {
                          const linkedExpense = expenseLookup[String(payment.expenseId)];
                          const vendorName =
                            linkedExpense?.vendor ||
                            payment.vendorSnapshot ||
                            "Belum ditautkan";
                          const expenseName =
                            linkedExpense?.nama || "Pembayaran manual";

                          return (
                            <tr key={`print-${payment.id}`}>
                              <td className="cell-name">{vendorName}</td>
                              <td className="cell-note">{expenseName}</td>
                              <td className="cell-date">{payment.tanggal || "-"}</td>
                              <td className="cell-method">{payment.metode || "-"}</td>
                              <td className="cell-type">{payment.jenis || "-"}</td>
                              <td className="cell-note">{payment.akunTujuan || "-"}</td>
                              <td className="cell-note">{payment.catatan || "-"}</td>
                              <td className="cell-amount">
                                {formatRupiah(payment.nominal)}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  )}
                </div>

                <div className="no-print mt-5 space-y-3">
                  {vendorWithoutProof.length === 0 ? (
                    <EmptyState text="Semua pembayaran vendor sudah memiliki bukti." />
                  ) : (
                    vendorWithoutProof.map((payment) => {
                      const linkedExpense = expenseLookup[String(payment.expenseId)];
                      const vendorName =
                        linkedExpense?.vendor ||
                        payment.vendorSnapshot ||
                        "Belum ditautkan";
                      const expenseName =
                        linkedExpense?.nama || "Pembayaran manual";

                      return (
                        <div
                          key={payment.id}
                          className="rounded-2xl border bg-slate-50 p-4 print-row"
                        >
                          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                            <div>
                              <div className="flex flex-wrap items-center gap-2">
                                <p className="font-bold text-slate-900">
                                  {vendorName}
                                </p>
                                <Pill tone="rose">Tanpa bukti</Pill>
                              </div>

                              <p className="mt-1 text-sm text-slate-500">
                                {expenseName} · {payment.tanggal || "-"} ·{" "}
                                {payment.metode || "-"}
                              </p>

                              <div className="mt-2 grid gap-2 text-sm text-slate-600 sm:grid-cols-2 print-grid-2">
                                <p>
                                  Jenis:{" "}
                                  <strong className="text-slate-900">
                                    {payment.jenis || "-"}
                                  </strong>
                                </p>
                                <p>
                                  Akun tujuan:{" "}
                                  <strong className="text-slate-900">
                                    {payment.akunTujuan || "-"}
                                  </strong>
                                </p>
                              </div>

                              {payment.catatan ? (
                                <p className="mt-2 rounded-xl bg-white p-3 text-sm text-slate-600">
                                  {payment.catatan}
                                </p>
                              ) : null}
                            </div>

                            <p className="text-lg font-extrabold text-slate-900">
                              {formatRupiah(payment.nominal)}
                            </p>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5 print-card">
              <div className="flex items-start gap-3">
                <div className="rounded-2xl bg-slate-100 p-3 text-slate-700">
                  <FileText className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-bold text-slate-900">
                    Catatan audit bukti pembayaran
                  </p>
                  <p className="mt-1 text-sm leading-6 text-slate-600">
                    Transaksi dianggap lengkap jika memiliki data bukti seperti
                    file, data URL, URL, path storage, atau nama bukti yang
                    tersimpan. Jika ada transaksi tanpa bukti, lengkapi dari
                    halaman Santri atau Vendor sesuai jenis transaksinya.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </Section>
      ) : null}

      <input
        ref={importInputRef}
        type="file"
        accept="application/json"
        className="hidden"
        onChange={importBackup}
      />
    </div>
  );
}
