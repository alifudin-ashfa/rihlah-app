import React from "react";
import { NavLink } from "react-router-dom";
import {
  Trash2,
  PlusCircle,
  Wallet,
  ArrowDownCircle,
  ArrowUpCircle,
  Search,
  Download,
  RotateCcw,
  AlertTriangle,
  Users,
  Landmark,
} from "lucide-react";
import {
  EXPENSE_CATEGORIES,
  INCOME_SOURCES,
  PAYMENT_METHODS,
  VENDOR_PAYMENT_TYPES,
  inputClass,
  selectClass,
  textAreaClass,
  buttonPrimary,
  buttonOutline,
  smallButton,
  formatRupiah,
  getExpenseTone,
  getParticipantTone,
  getExpenseIcon,
  Section,
  StatCard,
  Pill,
  MiniStat,
  EmptyState,
  InlineBanner,
  ProgressBar,
  tabClass,
} from "../../shared/lib/rihlahCore";


export default function LaporanPage({ app }) {
  const {
    config,
    expenseForm,
    setExpenseForm,
    editingExpenseId,
    incomeForm,
    setIncomeForm,
    editingIncomeId,
    vendorPaymentForm,
    setVendorPaymentForm,
    participantForm,
    setParticipantForm,
    editingParticipantId,
    participantPaymentForm,
    setParticipantPaymentForm,
    participantSearch,
    setParticipantSearch,
    participantStatusFilter,
    setParticipantStatusFilter,
    vendorStatusFilter,
    setVendorStatusFilter,
    vendorView,
    setVendorView,
    laporanView,
    setLaporanView,
    expandedParticipants,
    setExpandedParticipants,
    homeUtilitiesOpen,
    setHomeUtilitiesOpen,
    showVendorPaymentAdvanced,
    setShowVendorPaymentAdvanced,
    showParticipantAdvanced,
    setShowParticipantAdvanced,
    showIncomeAdvanced,
    setShowIncomeAdvanced,
    showExpenseAdvanced,
    setShowExpenseAdvanced,
    showPaymentAdvanced,
    setShowPaymentAdvanced,
    selectedVendorFilter,
    setSelectedVendorFilter,
    selectedPaymentParticipant,
    setSelectedPaymentParticipant,
    importInputRef,
    paymentProofInputRef,
    participantRows,
    vendorPaymentRows,
    expenseRows,
    expenseLookup,
    filteredParticipants,
    filteredExpenseRows,
    filteredVendorPayments,
    participantPaymentHistory,
    vendorFilterOptions,
    jumlahSantri,
    jumlahPembimbing,
    jumlahPeserta,
    totalIuranTarget,
    totalIuranMasuk,
    totalIuranOutstanding,
    totalOtherIncome,
    totalPemasukan,
    totalTagihan,
    totalVendorPaid,
    totalVendorAdmin,
    totalArusKeluarVendor,
    totalLinkedVendorPaid,
    totalVendorOutstanding,
    totalVendorOverpaid,
    totalIuranOverpaid,
    totalVendorUnlinked,
    saldoKasSaatIni,
    proyeksiSaldoAkhir,
    iuranMinimalPerSantri,
    kekuranganDana,
    kekuranganPerSantri,
    jumlahLunas,
    jumlahCicilan,
    jumlahBelumBayar,
    warnings,
    financeHealth,
    handleConfigChange,
    addOrUpdateExpense,
    editExpense,
    removeExpense,
    addOrUpdateIncome,
    editIncome,
    removeIncome,
    handleVendorProofUpload,
    addVendorPayment,
    removeVendorPayment,
    addOrUpdateParticipant,
    editParticipant,
    removeParticipant,
    addParticipantPayment,
    focusParticipantPaymentForm,
    removeParticipantPayment,
    applyDefaultTargetToAll,
    exportBackup,
    importBackup,
    exportCsvReport,
    loadSampleData,
    resetAllData,
    resetExpenseForm,
    resetIncomeForm,
    resetVendorPaymentForm,
    selectedExpenseForForm,
    selectedParticipantForPayment,
  } = app;
  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-wrap gap-2">
        <button onClick={() => setLaporanView("ringkasan")} className={tabClass(laporanView === "ringkasan")}>Ringkasan eksekutif</button>
        <button onClick={() => setLaporanView("operasional")} className={tabClass(laporanView === "operasional")}>Detail operasional</button>
        <button onClick={() => setLaporanView("audit")} className={tabClass(laporanView === "audit")}>Audit data</button>
      </div>

      {(laporanView === "ringkasan" || laporanView === "operasional") ? (
        <Section id="laporan" title="Laporan dan narasi otomatis" subtitle="Gunakan blok ini saat perlu menjelaskan kondisi ke pimpinan atau panitia.">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <MiniStat label="Total target iuran" value={formatRupiah(totalIuranTarget)} tone="sky" />
            <MiniStat label="Total iuran masuk" value={formatRupiah(totalIuranMasuk)} tone="emerald" />
            <MiniStat label="Total tagihan vendor" value={formatRupiah(totalTagihan)} tone="amber" />
            <MiniStat label="Pembayaran vendor + admin" value={formatRupiah(totalArusKeluarVendor)} tone="rose" />
            <MiniStat label="Saldo kas saat ini" value={formatRupiah(saldoKasSaatIni)} tone={saldoKasSaatIni >= 0 ? "emerald" : "rose"} />
            <MiniStat label="Proyeksi saldo akhir" value={formatRupiah(proyeksiSaldoAkhir)} tone={proyeksiSaldoAkhir >= 0 ? "emerald" : "rose"} />
            <MiniStat label="Sisa tagihan vendor" value={formatRupiah(totalVendorOutstanding)} tone={totalVendorOutstanding > 0 ? "amber" : "emerald"} />
            <MiniStat label="Pemasukan lain" value={formatRupiah(totalOtherIncome)} tone="violet" />
          </div>

          <div className="mt-6 grid gap-4 2xl:grid-cols-2">
            <InlineBanner title="Narasi pimpinan" text={`Kas saat ini ${formatRupiah(saldoKasSaatIni)}. Masih ada tunggakan iuran ${formatRupiah(totalIuranOutstanding)} dari ${jumlahBelumBayar + jumlahCicilan} santri.`} tone={financeHealth.tone} />
            <InlineBanner title="Narasi vendor" text={`Sisa tagihan vendor ${formatRupiah(totalVendorOutstanding)}. Jika seluruh tagihan dilunasi hari ini, proyeksi saldo akhir menjadi ${formatRupiah(proyeksiSaldoAkhir)}.`} tone={totalVendorOutstanding > 0 ? "amber" : "emerald"} />
          </div>
        </Section>
      ) : null}

      {(laporanView === "operasional" || laporanView === "audit") ? (
        <Section title="Audit data dan tindak lanjut" subtitle="Pisahkan review audit dari ringkasan agar lebih mudah dibaca saat rapat atau pengecekan internal.">
          <div className="grid gap-4 2xl:grid-cols-2 2xl:gap-6">
            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-slate-900">Item yang perlu dicek</h3>
              {warnings.length === 0 ? <EmptyState text="Tidak ada warning aktif saat ini." /> : warnings.map((warning, index) => (
                <InlineBanner key={index} title={`Audit ${index + 1}`} text={warning} tone="amber" />
              ))}
            </div>
            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-slate-900">Aksi laporan</h3>
              <div className="rounded-2xl border bg-slate-50 p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                  <button onClick={exportCsvReport} className={buttonOutline}><Download className="mr-2 h-4 w-4" /> Export CSV</button>
                  <button onClick={exportBackup} className={buttonOutline}>Backup JSON</button>
                  <button onClick={() => importInputRef.current?.click()} className={buttonOutline}>Import JSON</button>
                </div>
                <p className="mt-3 text-sm text-slate-500">Gunakan ekspor saat perlu rekap rapat, dan gunakan backup sebelum melakukan perubahan besar.</p>
              </div>
              <div className="rounded-2xl border bg-slate-50 p-4">
                <p className="text-sm font-semibold text-slate-700">Ringkasan audit cepat</p>
                <div className="mt-3 grid gap-3 lg:grid-cols-2">
                  <MiniStat label="Belum tertaut" value={formatRupiah(totalVendorUnlinked)} tone={totalVendorUnlinked > 0 ? "amber" : "slate"} />
                  <MiniStat label="Lebih bayar total" value={formatRupiah(totalVendorOverpaid + totalIuranOverpaid)} tone={totalVendorOverpaid + totalIuranOverpaid > 0 ? "amber" : "slate"} />
                </div>
              </div>
            </div>
          </div>
        </Section>
      ) : null}
    </div>
  );
}
