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


export default function KegiatanPage({ app }) {
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
    otherIncomes,
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
      <div className="grid gap-6 2xl:grid-cols-[1.05fr_0.95fr]">
        <Section id="kegiatan" title="Pengaturan kegiatan" subtitle="Isi hanya data dasar yang dipakai berulang oleh seluruh halaman.">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium text-slate-700">Nama kegiatan</label>
              <input className={inputClass} value={config.namaKegiatan} onChange={(event) => handleConfigChange("namaKegiatan", event.target.value)} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Jumlah pembimbing</label>
              <input className={inputClass} type="number" value={config.jumlahPembimbing} onChange={(event) => handleConfigChange("jumlahPembimbing", event.target.value)} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Iuran default santri</label>
              <input className={inputClass} type="number" value={config.iuranDefaultSantri} onChange={(event) => handleConfigChange("iuranDefaultSantri", event.target.value)} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Akun tujuan</label>
              <input className={inputClass} placeholder="Contoh: Bendahara Kegiatan" value={config.akunTujuan} onChange={(event) => handleConfigChange("akunTujuan", event.target.value)} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Nomor rekening / tujuan transfer</label>
              <input className={inputClass} placeholder="Contoh: BSI 123456789 a.n. Panitia" value={config.rekeningTujuan} onChange={(event) => handleConfigChange("rekeningTujuan", event.target.value)} />
            </div>
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium text-slate-700">Catatan kegiatan</label>
              <textarea className={textAreaClass} placeholder="Informasi tambahan untuk bendahara atau panitia" value={config.catatanKegiatan} onChange={(event) => handleConfigChange("catatanKegiatan", event.target.value)} />
            </div>
          </div>
          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <button onClick={applyDefaultTargetToAll} className={buttonOutline}>Samakan target semua santri</button>
            <Pill tone="sky">Total peserta {jumlahPeserta} orang</Pill>
          </div>
        </Section>

        <Section title="Target pendanaan" subtitle="Pisahkan target iuran, dana yang sudah masuk, dan dana yang masih perlu dicari.">
          <div className="space-y-4">
            <InlineBanner title={financeHealth.title} text={financeHealth.text} tone={financeHealth.tone} />
            <div className="grid gap-4 md:grid-cols-2">
              <MiniStat label="Target iuran seluruh santri" value={formatRupiah(totalIuranTarget)} tone="sky" />
              <MiniStat label="Iuran yang sudah masuk" value={formatRupiah(totalIuranMasuk)} tone="emerald" />
              <MiniStat label="Dana yang masih perlu dicari" value={formatRupiah(kekuranganDana)} tone={kekuranganDana > 0 ? "rose" : "emerald"} helper={jumlahSantri > 0 ? `${formatRupiah(kekuranganPerSantri)} per santri bila dibagi rata` : "Tambahkan santri lebih dulu"} />
              <MiniStat label="Minimal iuran agar biaya tertutup" value={formatRupiah(iuranMinimalPerSantri)} tone="slate" helper="Berdasarkan seluruh tagihan vendor" />
            </div>
          </div>
        </Section>
      </div>

      <Section title="Pemasukan lain" subtitle="Iuran santri dihitung otomatis dari transaksi santri. Tambahkan hanya pemasukan di luar iuran.">
        <div className="grid gap-6 2xl:grid-cols-[0.9fr_1.1fr]">
          <div className="space-y-4 rounded-2xl border bg-slate-50 p-4">
            <div className="grid gap-3 lg:grid-cols-2">
              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-medium text-slate-700">Nama pemasukan</label>
                <input className={inputClass} placeholder="Contoh: Donasi wali santri" value={incomeForm.nama} onChange={(event) => setIncomeForm((prev) => ({ ...prev, nama: event.target.value }))} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Sumber</label>
                <select className={selectClass} value={incomeForm.sumber} onChange={(event) => setIncomeForm((prev) => ({ ...prev, sumber: event.target.value }))}>
                  {INCOME_SOURCES.map((source) => <option key={source} value={source}>{source}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Nominal</label>
                <input className={inputClass} type="number" value={incomeForm.nominal} onChange={(event) => setIncomeForm((prev) => ({ ...prev, nominal: event.target.value }))} />
              </div>
            </div>
            <button onClick={() => setShowIncomeAdvanced((prev) => !prev)} className={smallButton}>
              {showIncomeAdvanced ? "Sembunyikan detail tambahan" : "Tampilkan detail tambahan"}
            </button>
            {showIncomeAdvanced ? (
              <div className="grid gap-3 lg:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Tanggal</label>
                  <input className={inputClass} type="date" value={incomeForm.tanggal} onChange={(event) => setIncomeForm((prev) => ({ ...prev, tanggal: event.target.value }))} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Metode</label>
                  <select className={selectClass} value={incomeForm.metode} onChange={(event) => setIncomeForm((prev) => ({ ...prev, metode: event.target.value }))}>
                    {PAYMENT_METHODS.map((method) => <option key={method} value={method}>{method}</option>)}
                  </select>
                </div>
                <div className="space-y-2 md:col-span-2">
                  <label className="text-sm font-medium text-slate-700">Akun masuk</label>
                  <input className={inputClass} value={incomeForm.akunMasuk} onChange={(event) => setIncomeForm((prev) => ({ ...prev, akunMasuk: event.target.value }))} />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <label className="text-sm font-medium text-slate-700">Catatan</label>
                  <textarea className={textAreaClass} value={incomeForm.catatan} onChange={(event) => setIncomeForm((prev) => ({ ...prev, catatan: event.target.value }))} />
                </div>
              </div>
            ) : null}
            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <button onClick={addOrUpdateIncome} className={buttonPrimary}>{editingIncomeId ? "Simpan perubahan" : "Tambah pemasukan"}</button>
              {editingIncomeId ? <button onClick={resetIncomeForm} className={buttonOutline}>Batal edit</button> : null}
            </div>
          </div>

          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              <MiniStat label="Iuran santri" value={formatRupiah(totalIuranMasuk)} tone="emerald" />
              <MiniStat label="Pemasukan lain" value={formatRupiah(totalOtherIncome)} tone="sky" />
              <MiniStat label="Total pemasukan" value={formatRupiah(totalPemasukan)} tone="violet" />
            </div>
            {otherIncomes.length === 0 ? (
              <EmptyState text="Belum ada pemasukan lain yang dicatat." />
            ) : (
              <div className="space-y-3">
                {otherIncomes.map((item) => (
                  <div key={item.id} className="rounded-2xl border bg-white p-4">
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-semibold text-slate-900">{item.nama}</p>
                          <Pill tone="sky">{item.sumber}</Pill>
                        </div>
                        <p className="mt-2 text-sm text-slate-500">{item.tanggal || "-"} · {item.metode || "-"} · {item.akunMasuk || "Akun belum diisi"}</p>
                        {item.catatan ? <p className="mt-2 text-sm text-slate-500">{item.catatan}</p> : null}
                      </div>
                      <div className="flex flex-col items-start gap-3 md:items-end">
                        <p className="text-lg font-bold text-slate-900">{formatRupiah(item.nominal)}</p>
                        <div className="flex gap-2">
                          <button onClick={() => editIncome(item)} className={smallButton}>Edit</button>
                          <button onClick={() => removeIncome(item.id)} className={smallButton}><Trash2 className="mr-1 h-3.5 w-3.5" /> Hapus</button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </Section>
    </div>
  );
}
