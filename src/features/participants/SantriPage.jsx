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


export default function SantriPage({ app }) {
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
    resetParticipantForm,
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
      <Section id="santri" title="Rekap santri dan pembayaran iuran" subtitle="Fokuskan halaman ini untuk follow-up pembayaran dan monitoring status tiap santri.">
        <div className="space-y-4 sm:space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
            <MiniStat label="Total santri" value={`${jumlahSantri} santri`} tone="sky" />
            <MiniStat label="Lunas" value={`${jumlahLunas} santri`} tone="emerald" />
            <MiniStat label="Cicilan" value={`${jumlahCicilan} santri`} tone="amber" />
            <MiniStat label="Belum bayar" value={`${jumlahBelumBayar} santri`} tone="rose" />
            <MiniStat label="Iuran masuk" value={formatRupiah(totalIuranMasuk)} tone="emerald" />
            <MiniStat label="Tunggakan iuran" value={formatRupiah(totalIuranOutstanding)} tone={totalIuranOutstanding > 0 ? "amber" : "emerald"} />
          </div>

          <div className="rounded-2xl border bg-slate-50 p-4">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">Cari dan filter santri</h3>
                <p className="text-sm text-slate-500">Gunakan filter status agar bendahara bisa cepat follow-up.</p>
              </div>
              <div className="relative w-full lg:w-80">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input className={`${inputClass} pl-9`} placeholder="Cari santri" value={participantSearch} onChange={(event) => setParticipantSearch(event.target.value)} />
              </div>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {["Semua", "Belum Bayar", "Cicilan", "Lunas"].map((status) => (
                <button key={status} onClick={() => setParticipantStatusFilter(status)} className={tabClass(participantStatusFilter === status)}>{status}</button>
              ))}
            </div>
          </div>

          <div className="grid gap-4 2xl:grid-cols-2 2xl:gap-6">
            <div className="space-y-4 rounded-2xl border bg-slate-50 p-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">Tambah / edit santri</h3>
                  <p className="text-sm text-slate-500">Simpan hanya data yang benar-benar penting untuk operasional.</p>
                </div>
                <button onClick={() => setShowParticipantAdvanced((prev) => !prev)} className={smallButton}>{showParticipantAdvanced ? "Sembunyikan detail" : "Tampilkan detail"}</button>
              </div>
              <div className="grid gap-3 lg:grid-cols-2">
                <div className="space-y-2 md:col-span-2">
                  <label className="text-sm font-medium text-slate-700">Nama santri</label>
                  <input className={inputClass} placeholder="Nama santri" value={participantForm.nama} onChange={(event) => setParticipantForm((prev) => ({ ...prev, nama: event.target.value }))} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Kelas</label>
                  <input className={inputClass} placeholder="Contoh: 8A" value={participantForm.kelas} onChange={(event) => setParticipantForm((prev) => ({ ...prev, kelas: event.target.value }))} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Kamar / kelompok</label>
                  <input className={inputClass} placeholder="Contoh: Kamar 1" value={participantForm.kamar} onChange={(event) => setParticipantForm((prev) => ({ ...prev, kamar: event.target.value }))} />
                </div>
              </div>
              {showParticipantAdvanced ? (
                <div className="grid gap-3">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">Target iuran</label>
                    <input className={inputClass} type="number" placeholder={String(config.iuranDefaultSantri)} value={participantForm.targetIuran} onChange={(event) => setParticipantForm((prev) => ({ ...prev, targetIuran: event.target.value }))} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">Catatan</label>
                    <textarea className={textAreaClass} placeholder="Catatan khusus santri" value={participantForm.catatan} onChange={(event) => setParticipantForm((prev) => ({ ...prev, catatan: event.target.value }))} />
                  </div>
                </div>
              ) : null}
              <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                <button onClick={addOrUpdateParticipant} className={buttonPrimary}><PlusCircle className="mr-2 h-4 w-4" /> {editingParticipantId ? "Simpan perubahan" : "Simpan santri"}</button>
                {editingParticipantId ? <button onClick={resetParticipantForm} className={buttonOutline}>Batal edit</button> : null}
              </div>
            </div>

            <div className="space-y-4 rounded-2xl border bg-slate-50 p-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">Catat pembayaran iuran</h3>
                  <p className="text-sm text-slate-500">Pilih santri, isi nominal, lalu simpan. Detail tambahan bersifat opsional.</p>
                </div>
                <button onClick={() => setShowPaymentAdvanced((prev) => !prev)} className={smallButton}>{showPaymentAdvanced ? "Sembunyikan detail" : "Tampilkan detail"}</button>
              </div>
              <div className="grid gap-3 lg:grid-cols-2">
                <div className="space-y-2 md:col-span-2">
                  <label className="text-sm font-medium text-slate-700">Pilih santri</label>
                  <select className={selectClass} value={participantPaymentForm.participantId} onChange={(event) => setParticipantPaymentForm((prev) => ({ ...prev, participantId: event.target.value }))}>
                    <option value="">Pilih santri</option>
                    {participantRows.map((item) => <option key={item.id} value={item.id}>{item.nama} - {item.kelas || "Tanpa kelas"}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Tanggal bayar</label>
                  <input className={inputClass} type="date" value={participantPaymentForm.tanggal} onChange={(event) => setParticipantPaymentForm((prev) => ({ ...prev, tanggal: event.target.value }))} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Nominal pembayaran</label>
                  <input className={inputClass} type="number" placeholder="0" value={participantPaymentForm.nominal} onChange={(event) => setParticipantPaymentForm((prev) => ({ ...prev, nominal: event.target.value }))} />
                </div>
              </div>
              {showPaymentAdvanced ? (
                <div className="grid gap-3 lg:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">Metode</label>
                    <select className={selectClass} value={participantPaymentForm.metode} onChange={(event) => setParticipantPaymentForm((prev) => ({ ...prev, metode: event.target.value }))}>
                      {PAYMENT_METHODS.map((method) => <option key={method} value={method}>{method}</option>)}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">Akun masuk</label>
                    <input className={inputClass} placeholder={config.akunTujuan || "Kas / Rekening"} value={participantPaymentForm.akunMasuk} onChange={(event) => setParticipantPaymentForm((prev) => ({ ...prev, akunMasuk: event.target.value }))} />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <label className="text-sm font-medium text-slate-700">Catatan transaksi</label>
                    <textarea className={textAreaClass} placeholder="Contoh: Cicilan 1" value={participantPaymentForm.catatan} onChange={(event) => setParticipantPaymentForm((prev) => ({ ...prev, catatan: event.target.value }))} />
                  </div>
                </div>
              ) : null}
              <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                <button onClick={addParticipantPayment} className={buttonPrimary}><ArrowDownCircle className="mr-2 h-4 w-4" /> Simpan pembayaran</button>
                {selectedParticipantForPayment ? (
                  <Pill tone={getParticipantTone(selectedParticipantForPayment.status)}>{selectedParticipantForPayment.nama}: sisa {formatRupiah(selectedParticipantForPayment.remaining)}</Pill>
                ) : (
                  <Pill>Pilih santri untuk melihat sisa tagihan</Pill>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-3">
            {filteredParticipants.length === 0 ? <EmptyState text="Belum ada data santri yang cocok dengan pencarian." /> : filteredParticipants.map((item) => {
              const isExpanded = Boolean(expandedParticipants[item.id]);
              return (
                <div key={item.id} className="rounded-2xl border bg-white p-4">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0 flex-1 space-y-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-semibold text-slate-900">{item.nama}</p>
                        <Pill>{item.kelas || "Tanpa kelas"}</Pill>
                        <Pill>{item.kamar || "Tanpa kamar"}</Pill>
                        <Pill tone={getParticipantTone(item.status)}>{item.status}</Pill>
                        {item.overpaid > 0 ? <Pill tone="amber">Lebih bayar {formatRupiah(item.overpaid)}</Pill> : null}
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm text-slate-600">
                          <span>Progress iuran</span>
                          <strong>{formatRupiah(item.totalPaid)} / {formatRupiah(item.targetIuran)}</strong>
                        </div>
                        <ProgressBar value={item.totalPaid} max={item.targetIuran} />
                      </div>
                      <div className="grid gap-2 text-sm text-slate-600 sm:grid-cols-2 2xl:grid-cols-4">
                        <p>Target: <strong>{formatRupiah(item.targetIuran)}</strong></p>
                        <p>Sudah bayar: <strong>{formatRupiah(item.totalPaid)}</strong></p>
                        <p>Sisa: <strong>{formatRupiah(item.remaining)}</strong></p>
                        <p>Pembayaran terakhir: <strong>{item.lastPaymentDate || "-"}</strong></p>
                      </div>
                      {item.catatan ? <p className="text-sm text-slate-500">{item.catatan}</p> : null}
                      {isExpanded ? (
                        <div className="rounded-2xl border bg-slate-50 p-3">
                          <p className="text-sm font-medium text-slate-700">Histori pembayaran</p>
                          <div className="mt-3 space-y-2">
                            {item.payments.length === 0 ? <p className="text-sm text-slate-500">Belum ada transaksi pembayaran.</p> : item.payments.map((payment) => (
                              <div key={payment.id} className="flex flex-col gap-2 rounded-xl border bg-white p-3 lg:flex-row lg:items-center lg:justify-between">
                                <div>
                                  <p className="text-sm font-medium text-slate-900">{formatRupiah(payment.nominal)}</p>
                                  <p className="text-sm text-slate-500">{payment.tanggal || "-"} · {payment.metode || "-"} · {payment.akunMasuk || "Akun belum diisi"}</p>
                                  {payment.catatan ? <p className="mt-1 text-xs text-slate-500">{payment.catatan}</p> : null}
                                </div>
                                <button onClick={() => removeParticipantPayment(item.id, payment.id)} className={smallButton}><Trash2 className="mr-1 h-3.5 w-3.5" /> Hapus</button>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : null}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button onClick={() => focusParticipantPaymentForm(item.id)} className={smallButton}>Catat bayar</button>
                      <button onClick={() => editParticipant(item)} className={smallButton}>Edit</button>
                      <button onClick={() => setExpandedParticipants((prev) => ({ ...prev, [item.id]: !prev[item.id] }))} className={smallButton}>{isExpanded ? "Sembunyikan histori" : "Lihat histori"}</button>
                      <button onClick={() => removeParticipant(item.id)} className={smallButton}><Trash2 className="mr-1 h-3.5 w-3.5" /> Hapus</button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </Section>

      <Section title="Histori pembayaran iuran" subtitle="Tampilan audit cepat untuk seluruh transaksi pembayaran santri.">
        <div className="space-y-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm font-semibold text-slate-700">Filter histori per santri</p>
              <p className="text-sm text-slate-500">Gunakan saat ingin mengecek transaksi santri tertentu.</p>
            </div>
            <select className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm" value={selectedPaymentParticipant} onChange={(event) => setSelectedPaymentParticipant(event.target.value)}>
              <option value="all">Semua santri</option>
              {participantRows.map((item) => <option key={item.id} value={item.id}>{item.nama}</option>)}
            </select>
          </div>
          {participantPaymentHistory.length === 0 ? <EmptyState text="Belum ada transaksi pembayaran iuran." /> : (
            <div className="space-y-3">
              {participantPaymentHistory.map((payment) => (
                <div key={payment.id} className="rounded-2xl border bg-white p-4">
                  <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                      <p className="font-semibold text-slate-900">{payment.participantName}</p>
                      <p className="text-sm text-slate-500">{payment.participantClass || "Tanpa kelas"} · {payment.tanggal || "-"} · {payment.metode || "-"}</p>
                    </div>
                    <p className="text-lg font-bold text-slate-900">{formatRupiah(payment.nominal)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Section>
    </div>
  );
}
