import React, { useEffect, useMemo, useState } from "react";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import {
  Download,
  FileText,
  Printer,
  Users,
  Wallet,
} from "lucide-react";
import {
  buttonOutline,
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

const sanitizePdfText = (value) =>
  String(value ?? "-")
    .replace(/\u00a0/g, " ")
    .replace(/\u2011/g, "-")
    .replace(/\uFFFE/g, "-")
    .replace(/\s+/g, " ")
    .trim();

const rupiahForPdf = (value) => sanitizePdfText(formatRupiah(value));

const addPdfHeader = (doc, title, printedAt) => {
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

  doc.setDrawColor(203, 213, 225);
  doc.line(14, 38, 196, 38);

  return 46;
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

  const {
    canEdit,
    laporanView,
    setLaporanView,
    importInputRef,
    participantPaymentHistory,
    vendorPaymentRows,
    expenseLookup,
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
    jumlahBelumBayar,
    jumlahCicilan,
    warnings,
    financeHealth,
    exportBackup,
    importBackup,
    exportCsvReport,
  } = app;

  const participantWithoutProof = useMemo(() => {
    const rows = Array.isArray(participantPaymentHistory)
      ? participantPaymentHistory
      : [];

    return rows.filter((payment) => !hasParticipantProof(payment));
  }, [participantPaymentHistory]);

  const vendorWithoutProof = useMemo(() => {
    const rows = Array.isArray(vendorPaymentRows) ? vendorPaymentRows : [];

    return rows.filter((payment) => !hasVendorProof(payment));
  }, [vendorPaymentRows]);

  const vendorAuditRows = useMemo(
    () => (Array.isArray(vendorPaymentRows) ? vendorPaymentRows : []),
    [vendorPaymentRows]
  );

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

  const hasMissingProof = auditProofSummary.totalWithoutProof > 0;
  const printDate = useMemo(() => formatPrintDate(), []);

  const requestPrint = (scope) => {
    if (scope === "audit" && !canEdit) return;
    setPrintScope(scope);

    window.requestAnimationFrame(() => {
      window.setTimeout(() => {
        window.print();
      }, 80);
    });
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

  const downloadReportPdf = () => {
    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    const generatedAt = formatPrintDate();
    let y = addPdfHeader(doc, "Laporan Keuangan Kegiatan", generatedAt);

    autoTable(doc, {
      ...pdfTableTheme,
      startY: y,
      margin: { left: 14, right: 14 },
      head: [["Komponen", "Nilai"]],
      body: [
        ["Total target iuran", rupiahForPdf(totalIuranTarget)],
        ["Total iuran masuk", rupiahForPdf(totalIuranMasuk)],
        ["Total tagihan vendor", rupiahForPdf(totalTagihan)],
        ["Pembayaran vendor + admin", rupiahForPdf(totalArusKeluarVendor)],
        ["Saldo kas saat ini", rupiahForPdf(saldoKasSaatIni)],
        ["Proyeksi saldo akhir", rupiahForPdf(proyeksiSaldoAkhir)],
        ["Sisa tagihan vendor", rupiahForPdf(totalVendorOutstanding)],
        ["Pemasukan lain", rupiahForPdf(totalOtherIncome)],
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
        [
          "Narasi pimpinan",
          `Kas saat ini ${rupiahForPdf(
            saldoKasSaatIni
          )}. Masih ada tunggakan iuran ${rupiahForPdf(
            totalIuranOutstanding
          )} dari ${jumlahBelumBayar + jumlahCicilan} santri.`,
        ],
        [
          "Narasi vendor",
          `Sisa tagihan vendor ${rupiahForPdf(
            totalVendorOutstanding
          )}. Jika seluruh tagihan dilunasi hari ini, proyeksi saldo akhir menjadi ${rupiahForPdf(
            proyeksiSaldoAkhir
          )}.`,
        ],
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
    doc.save(`laporan-keuangan-rihlah-${formatFileDate()}.pdf`);
  };

  const downloadAuditPdf = () => {
    if (!canEdit) return;

    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    const generatedAt = formatPrintDate();
    let y = addPdfHeader(doc, "Lampiran Audit Bukti Pembayaran", generatedAt);

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
    doc.save(`audit-bukti-pembayaran-rihlah-${formatFileDate()}.pdf`);
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
            : "Laporan Keuangan Kegiatan"}
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          Dicetak pada {printDate}
        </p>
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
              label="Total target iuran"
              value={formatRupiah(totalIuranTarget)}
              tone="sky"
            />
            <MiniStat
              label="Total iuran masuk"
              value={formatRupiah(totalIuranMasuk)}
              tone="emerald"
            />
            <MiniStat
              label="Total tagihan vendor"
              value={formatRupiah(totalTagihan)}
              tone="amber"
            />
            <MiniStat
              label="Pembayaran vendor + admin"
              value={formatRupiah(totalArusKeluarVendor)}
              tone="rose"
            />
            <MiniStat
              label="Saldo kas saat ini"
              value={formatRupiah(saldoKasSaatIni)}
              tone={saldoKasSaatIni >= 0 ? "emerald" : "rose"}
            />
            <MiniStat
              label="Proyeksi saldo akhir"
              value={formatRupiah(proyeksiSaldoAkhir)}
              tone={proyeksiSaldoAkhir >= 0 ? "emerald" : "rose"}
            />
            <MiniStat
              label="Sisa tagihan vendor"
              value={formatRupiah(totalVendorOutstanding)}
              tone={totalVendorOutstanding > 0 ? "amber" : "emerald"}
            />
            <MiniStat
              label="Pemasukan lain"
              value={formatRupiah(totalOtherIncome)}
              tone="violet"
            />
          </div>

          <div className="mt-6 grid gap-4 2xl:grid-cols-2 print-grid-2">
            <InlineBanner
              title="Narasi pimpinan"
              text={`Kas saat ini ${formatRupiah(
                saldoKasSaatIni
              )}. Masih ada tunggakan iuran ${formatRupiah(
                totalIuranOutstanding
              )} dari ${jumlahBelumBayar + jumlahCicilan} santri.`}
              tone={financeHealth.tone}
            />

            <InlineBanner
              title="Narasi vendor"
              text={`Sisa tagihan vendor ${formatRupiah(
                totalVendorOutstanding
              )}. Jika seluruh tagihan dilunasi hari ini, proyeksi saldo akhir menjadi ${formatRupiah(
                proyeksiSaldoAkhir
              )}.`}
              tone={totalVendorOutstanding > 0 ? "amber" : "emerald"}
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
