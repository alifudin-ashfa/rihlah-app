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
  Receipt,
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


export default function HomePage({ app }) {
  const {
    config,
    canEdit,
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
  if (!canEdit) {
    return (
      <div className="space-y-4 sm:space-y-6">
        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-gradient-to-br from-sky-600 via-sky-700 to-slate-900 p-4 text-white shadow-lg sm:p-5 lg:p-8">
          <div className="grid gap-6 2xl:grid-cols-[minmax(0,1.2fr)_minmax(340px,0.8fr)] 2xl:items-start">
            <div className="max-w-3xl">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-100 sm:text-sm">Dashboard Keuangan</p>
              <h1 className="mt-3 text-2xl font-bold tracking-tight sm:text-3xl lg:text-4xl">{config.namaKegiatan}</h1>
              <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-2">
                <div className="rounded-2xl bg-white/10 p-4 backdrop-blur-sm min-w-0">
                  <p className="text-sm text-sky-100">Saldo kas saat ini</p>
                  <p className="mt-2 text-[clamp(1.1rem,1.25vw,1.65rem)] font-bold leading-snug tracking-tight text-white tabular-nums whitespace-nowrap">{formatRupiah(saldoKasSaatIni)}</p>
                </div>
                <div className="rounded-2xl bg-white/10 p-4 backdrop-blur-sm min-w-0">
                  <p className="text-sm text-sky-100">Tunggakan iuran</p>
                  <p className="mt-2 text-[clamp(1.1rem,1.25vw,1.65rem)] font-bold leading-snug tracking-tight text-white tabular-nums whitespace-nowrap">{formatRupiah(totalIuranOutstanding)}</p>
                </div>
                <div className="rounded-2xl bg-white/10 p-4 backdrop-blur-sm min-w-0">
                  <p className="text-sm text-sky-100">Sisa tagihan vendor</p>
                  <p className="mt-2 text-[clamp(1.1rem,1.25vw,1.65rem)] font-bold leading-snug tracking-tight text-white tabular-nums whitespace-nowrap">{formatRupiah(totalVendorOutstanding)}</p>
                </div>
                <div className="rounded-2xl bg-white/10 p-4 backdrop-blur-sm min-w-0">
                  <p className="text-sm text-sky-100">Proyeksi saldo akhir</p>
                  <p className="mt-2 text-[clamp(1.1rem,1.25vw,1.65rem)] font-bold leading-snug tracking-tight text-white tabular-nums whitespace-nowrap">{formatRupiah(proyeksiSaldoAkhir)}</p>
                </div>
              </div>
            </div>

            <div className="w-full rounded-3xl bg-white p-4 text-slate-900 shadow-xl sm:p-5 xl:sticky xl:top-28">
              <p className="text-sm font-semibold text-slate-500">Status keuangan hari ini</p>
              <p className="mt-2 text-xl font-bold text-slate-900 sm:text-2xl">{financeHealth.title}</p>
              <p className="mt-2 text-sm text-slate-600">{financeHealth.text}</p>
              <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                <NavLink to="/santri" className={buttonPrimary}>
                  <Users className="mr-2 h-4 w-4" /> Lihat Santri
                </NavLink>
                <NavLink to="/vendor" className={buttonOutline}>
                  <Wallet className="mr-2 h-4 w-4" /> Lihat Vendor
                </NavLink>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4 2xl:space-y-6">
          <Section title="Ringkasan Operasional">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              <StatCard icon={<Users className="h-5 w-5 text-sky-700" />} label="Santri terdaftar" value={`${jumlahSantri} santri`} tone="bg-sky-100" helper={`${jumlahBelumBayar} belum bayar, ${jumlahCicilan} cicilan`} />
              <StatCard icon={<ArrowDownCircle className="h-5 w-5 text-emerald-700" />} label="Iuran sudah masuk" value={formatRupiah(totalIuranMasuk)} tone="bg-emerald-100" helper={`${jumlahLunas} santri sudah lunas`} />
              <StatCard icon={<Receipt className="h-5 w-5 text-amber-700" />} label="Total tagihan vendor" value={formatRupiah(totalTagihan)} tone="bg-amber-100" helper={`${expenseRows.length} tagihan tercatat`} />
              <StatCard icon={<Wallet className="h-5 w-5 text-rose-700" />} label="Arus keluar vendor" value={formatRupiah(totalArusKeluarVendor)} tone="bg-rose-100" helper={`Termasuk admin ${formatRupiah(totalVendorAdmin)}`} />
              <StatCard icon={<Landmark className="h-5 w-5 text-violet-700" />} label="Pemasukan lain" value={formatRupiah(totalOtherIncome)} tone="bg-violet-100" helper={`${otherIncomes.length} transaksi lain`} />
              <StatCard icon={<AlertTriangle className="h-5 w-5 text-slate-700" />} label="Pembayaran belum tertaut" value={formatRupiah(totalVendorUnlinked)} tone="bg-slate-100" helper="Tautkan agar laporan vendor tetap akurat" />
            </div>
          </Section>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-gradient-to-br from-sky-600 via-sky-700 to-slate-900 p-4 text-white shadow-lg sm:p-5 lg:p-8">
        <div className="grid gap-6 2xl:grid-cols-[minmax(0,1.2fr)_minmax(340px,0.8fr)] 2xl:items-start">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-100 sm:text-sm">Dashboard Bendahara</p>
            <h1 className="mt-3 text-2xl font-bold tracking-tight sm:text-3xl lg:text-4xl">{config.namaKegiatan}</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-sky-50 md:text-base">
              Pantau kondisi kas, prioritaskan tindak lanjut, dan jalankan pekerjaan harian tanpa harus membuka semua halaman terlebih dahulu.
            </p>
            <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-2">
              <div className="rounded-2xl bg-white/10 p-4 backdrop-blur-sm min-w-0">
                <p className="text-sm text-sky-100">Saldo kas saat ini</p>
                <p className="mt-2 text-[clamp(1.1rem,1.25vw,1.65rem)] font-bold leading-snug tracking-tight text-white tabular-nums whitespace-nowrap">{formatRupiah(saldoKasSaatIni)}</p>
              </div>
              <div className="rounded-2xl bg-white/10 p-4 backdrop-blur-sm min-w-0">
                <p className="text-sm text-sky-100">Tunggakan iuran</p>
                <p className="mt-2 text-[clamp(1.1rem,1.25vw,1.65rem)] font-bold leading-snug tracking-tight text-white tabular-nums whitespace-nowrap">{formatRupiah(totalIuranOutstanding)}</p>
              </div>
              <div className="rounded-2xl bg-white/10 p-4 backdrop-blur-sm min-w-0">
                <p className="text-sm text-sky-100">Sisa tagihan vendor</p>
                <p className="mt-2 text-[clamp(1.1rem,1.25vw,1.65rem)] font-bold leading-snug tracking-tight text-white tabular-nums whitespace-nowrap">{formatRupiah(totalVendorOutstanding)}</p>
              </div>
              <div className="rounded-2xl bg-white/10 p-4 backdrop-blur-sm min-w-0">
                <p className="text-sm text-sky-100">Proyeksi saldo akhir</p>
                <p className="mt-2 text-[clamp(1.1rem,1.25vw,1.65rem)] font-bold leading-snug tracking-tight text-white tabular-nums whitespace-nowrap">{formatRupiah(proyeksiSaldoAkhir)}</p>
              </div>
            </div>
          </div>

          <div className="w-full rounded-3xl bg-white p-4 text-slate-900 shadow-xl sm:p-5 xl:sticky xl:top-28">
            <p className="text-sm font-semibold text-slate-500">Status keuangan hari ini</p>
            <p className="mt-2 text-xl font-bold text-slate-900 sm:text-2xl">{financeHealth.title}</p>
            <p className="mt-2 text-sm text-slate-600">{financeHealth.text}</p>
            <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <NavLink to="/santri" className={buttonPrimary}>
                <Users className="mr-2 h-4 w-4" /> {canEdit ? "Catat Iuran" : "Lihat Santri"}
              </NavLink>
              <NavLink to="/vendor" className={buttonOutline}>
                <Wallet className="mr-2 h-4 w-4" /> {canEdit ? "Kelola Vendor" : "Lihat Vendor"}
              </NavLink>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-4 2xl:grid-cols-[1.15fr_0.85fr] 2xl:gap-6">
        <Section title="Perlu perhatian" subtitle="Prioritaskan item ini agar operasional tetap aman.">
          <div className="space-y-3">
            {warnings.length === 0 ? (
              <InlineBanner title="Semua aman" text="Saat ini tidak ada isu utama yang perlu ditindaklanjuti." tone="emerald" />
            ) : (
              warnings.slice(0, 4).map((warning, index) => (
                <InlineBanner key={index} title={`Prioritas ${index + 1}`} text={warning} tone={index === 0 ? financeHealth.tone : "amber"} />
              ))
            )}
          </div>
        </Section>

        <Section title="Aksi cepat" subtitle="Buka halaman yang paling sering dipakai tanpa mencari menu lain.">
          <div className="grid gap-3 lg:grid-cols-2">
            <NavLink to="/santri" className="rounded-2xl border border-slate-200 bg-slate-50 p-4 transition hover:bg-slate-100">
              <p className="text-sm font-semibold text-slate-900">{canEdit ? "Tambah santri / iuran" : "Lihat santri / iuran"}</p>
              <p className="mt-1 text-sm text-slate-500">{canEdit ? "Lengkapi biodata, cari santri, dan catat pembayaran." : "Lihat biodata, status, dan histori pembayaran santri."}</p>
            </NavLink>
            <NavLink to="/vendor" className="rounded-2xl border border-slate-200 bg-slate-50 p-4 transition hover:bg-slate-100">
              <p className="text-sm font-semibold text-slate-900">{canEdit ? "Tambah tagihan vendor" : "Lihat tagihan vendor"}</p>
              <p className="mt-1 text-sm text-slate-500">{canEdit ? "Masukkan anggaran, DP, pelunasan, dan bukti transfer." : "Lihat tagihan, pembayaran, dan bukti transfer vendor."}</p>
            </NavLink>
            <NavLink to="/kegiatan" className="rounded-2xl border border-slate-200 bg-slate-50 p-4 transition hover:bg-slate-100">
              <p className="text-sm font-semibold text-slate-900">{canEdit ? "Atur kegiatan" : "Lihat kegiatan"}</p>
              <p className="mt-1 text-sm text-slate-500">{canEdit ? "Perbarui iuran default, rekening tujuan, dan pemasukan lain." : "Lihat pengaturan kegiatan dan pemasukan lain."}</p>
            </NavLink>
            <NavLink to="/laporan" className="rounded-2xl border border-slate-200 bg-slate-50 p-4 transition hover:bg-slate-100">
              <p className="text-sm font-semibold text-slate-900">Lihat laporan</p>
              <p className="mt-1 text-sm text-slate-500">Baca ringkasan pimpinan, audit, dan ekspor data.</p>
            </NavLink>
          </div>
        </Section>
      </div>

      <div className="space-y-4 2xl:space-y-6">
        <Section title="Ringkasan operasional" subtitle="Angka kunci untuk memantau kesehatan kegiatan.">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <StatCard icon={<Users className="h-5 w-5 text-sky-700" />} label="Santri terdaftar" value={`${jumlahSantri} santri`} tone="bg-sky-100" helper={`${jumlahBelumBayar} belum bayar, ${jumlahCicilan} cicilan`} />
            <StatCard icon={<ArrowDownCircle className="h-5 w-5 text-emerald-700" />} label="Iuran sudah masuk" value={formatRupiah(totalIuranMasuk)} tone="bg-emerald-100" helper={`${jumlahLunas} santri sudah lunas`} />
            <StatCard icon={<Receipt className="h-5 w-5 text-amber-700" />} label="Total tagihan vendor" value={formatRupiah(totalTagihan)} tone="bg-amber-100" helper={`${expenseRows.length} tagihan tercatat`} />
            <StatCard icon={<Wallet className="h-5 w-5 text-rose-700" />} label="Arus keluar vendor" value={formatRupiah(totalArusKeluarVendor)} tone="bg-rose-100" helper={`Termasuk admin ${formatRupiah(totalVendorAdmin)}`} />
            <StatCard icon={<Landmark className="h-5 w-5 text-violet-700" />} label="Pemasukan lain" value={formatRupiah(totalOtherIncome)} tone="bg-violet-100" helper={`${otherIncomes.length} transaksi lain`} />
            <StatCard icon={<AlertTriangle className="h-5 w-5 text-slate-700" />} label="Pembayaran belum tertaut" value={formatRupiah(totalVendorUnlinked)} tone="bg-slate-100" helper="Tautkan agar laporan vendor tetap akurat" />
          </div>
        </Section>

        <Section title="Utilitas sistem" subtitle={canEdit ? "Simpan cadangan data dan kelola file laporan." : "Utilitas hanya tersedia untuk admin/bendahara."}>
          <div className="space-y-3">
            {canEdit ? (
              <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                <button onClick={exportCsvReport} className={buttonOutline}><Download className="mr-2 h-4 w-4" /> Export CSV</button>
                <button onClick={exportBackup} className={buttonOutline}>Backup JSON</button>
                <button onClick={() => importInputRef.current?.click()} className={buttonOutline}>Import JSON</button>
              </div>
            ) : (
              <InlineBanner title="Mode pelihat" text="Backup, import, reset, dan ekspor hanya tersedia setelah login sebagai admin/bendahara." tone="sky" />
            )}
            <input ref={importInputRef} type="file" accept="application/json" className="hidden" onChange={importBackup} />
            {canEdit ? (
              <button onClick={() => setHomeUtilitiesOpen((prev) => !prev)} className={smallButton}>
                {homeUtilitiesOpen ? "Sembunyikan utilitas lanjutan" : "Tampilkan utilitas lanjutan"}
              </button>
            ) : null}
            {canEdit && homeUtilitiesOpen ? (
              <div className="grid gap-3 lg:grid-cols-2">
                <button onClick={loadSampleData} className={buttonOutline}>Muat Data Contoh</button>
                <button onClick={resetAllData} className="inline-flex items-center justify-center rounded-xl border border-rose-300 bg-rose-50 px-4 py-2 text-sm font-medium text-rose-700 hover:bg-rose-100">
                  <RotateCcw className="mr-2 h-4 w-4" /> Reset Data
                </button>
              </div>
            ) : null}
          </div>
        </Section>
      </div>
    </div>
  );
}
