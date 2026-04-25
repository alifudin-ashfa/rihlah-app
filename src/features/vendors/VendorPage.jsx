import React, { useEffect, useState } from "react";
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

import { FileImage, Upload } from "lucide-react";

export default function VendorPage({ app }) {
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
    refreshVendorProofUrl,
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
    isUploadingProof,
    proofStatusText,
    selectedParticipantForPayment,
  } = app;

  const [vendorProofPreviewUrls, setVendorProofPreviewUrls] = useState({});

  const vendorProofPathSignature = filteredVendorPayments
    .map((item) => `${item.id}:${item.buktiPath || ""}`)
    .join("|");

  useEffect(() => {
    let isCancelled = false;

    const loadProofPreviews = async () => {
      const paymentsWithProof = filteredVendorPayments.filter((item) => item.buktiPath);

      if (paymentsWithProof.length === 0) {
        if (!isCancelled) setVendorProofPreviewUrls({});
        return;
      }

      const entries = await Promise.all(
        paymentsWithProof.map(async (item) => {
          const signedUrl = await refreshVendorProofUrl(item);
          return [item.id, signedUrl];
        })
      );

      if (isCancelled) return;

      setVendorProofPreviewUrls((prev) => {
        const next = { ...prev };

        entries.forEach(([id, signedUrl]) => {
          if (signedUrl) next[id] = signedUrl;
        });

        return next;
      });
    };

    loadProofPreviews();

    return () => {
      isCancelled = true;
    };
  }, [vendorProofPathSignature]);

  const vendorGuide = (
    <div className="rounded-2xl border border-sky-200 bg-sky-50 p-4 text-sm text-sky-800">
      <p className="font-semibold">Cara pakai halaman vendor</p>
      <ol className="mt-2 list-decimal space-y-1 pl-5">
        <li>Tambah tagihan vendor terlebih dahulu sebagai kebutuhan biaya.</li>
        <li>Saat ada DP atau pelunasan, catat di pembayaran vendor.</li>
        <li>Tautkan pembayaran ke tagihan agar rekap vendor tetap akurat.</li>
      </ol>
    </div>
  );

  const vendorBillsSection = (
    <Section title="Tagihan vendor" subtitle="Daftar kebutuhan biaya atau anggaran yang akan dibayar ke vendor.">
      <div className="grid gap-6 2xl:grid-cols-[0.88fr_1.12fr]">
        <div className="space-y-4 rounded-2xl border bg-slate-50 p-4">
          <div className="grid gap-3 lg:grid-cols-2">
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium text-slate-700">Nama tagihan</label>
              <input className={inputClass} placeholder="Contoh: Sewa bus" value={expenseForm.nama} onChange={(event) => setExpenseForm((prev) => ({ ...prev, nama: event.target.value }))} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Kategori</label>
              <select className={selectClass} value={expenseForm.kategori} onChange={(event) => setExpenseForm((prev) => ({ ...prev, kategori: event.target.value }))}>
                {EXPENSE_CATEGORIES.map((category) => <option key={category} value={category}>{category}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Nominal</label>
              <input className={inputClass} type="number" value={expenseForm.nominal} onChange={(event) => setExpenseForm((prev) => ({ ...prev, nominal: event.target.value }))} />
            </div>
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium text-slate-700">Nama vendor</label>
              <input className={inputClass} placeholder="Contoh: Vendor konsumsi" value={expenseForm.vendor} onChange={(event) => setExpenseForm((prev) => ({ ...prev, vendor: event.target.value }))} />
            </div>
          </div>
          <button onClick={() => setShowExpenseAdvanced((prev) => !prev)} className={smallButton}>
            {showExpenseAdvanced ? "Sembunyikan detail tambahan" : "Tampilkan detail tambahan"}
          </button>
          {showExpenseAdvanced ? (
            <div className="grid gap-3 lg:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Jatuh tempo</label>
                <input className={inputClass} type="date" value={expenseForm.jatuhTempo} onChange={(event) => setExpenseForm((prev) => ({ ...prev, jatuhTempo: event.target.value }))} />
              </div>
              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-medium text-slate-700">Catatan</label>
                <textarea className={textAreaClass} placeholder="Contoh: DP 30% sebelum keberangkatan" value={expenseForm.catatan} onChange={(event) => setExpenseForm((prev) => ({ ...prev, catatan: event.target.value }))} />
              </div>
            </div>
          ) : null}
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <button onClick={addOrUpdateExpense} className={buttonPrimary}>{editingExpenseId ? "Simpan perubahan" : "Tambah tagihan"}</button>
            {editingExpenseId ? <button onClick={resetExpenseForm} className={buttonOutline}>Batal edit</button> : null}
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex flex-col gap-4">
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <MiniStat label="Total tagihan" value={formatRupiah(totalTagihan)} tone="amber" />
              <MiniStat label="Sudah dibayar" value={formatRupiah(totalLinkedVendorPaid)} tone="emerald" />
              <MiniStat label="Sisa tagihan" value={formatRupiah(totalVendorOutstanding)} tone={totalVendorOutstanding > 0 ? "rose" : "emerald"} />
              <MiniStat label="Lebih bayar" value={formatRupiah(totalVendorOverpaid)} tone={totalVendorOverpaid > 0 ? "amber" : "slate"} />
            </div>
            <div className="flex flex-wrap gap-2 xl:justify-start">
              {["Semua", "Belum Dibayar", "DP / Cicilan", "Lunas", "Lebih Bayar"].map((status) => (
                <button key={status} onClick={() => setVendorStatusFilter(status)} className={tabClass(vendorStatusFilter === status)}>{status}</button>
              ))}
            </div>
          </div>
          {filteredExpenseRows.length === 0 ? <EmptyState text="Belum ada data tagihan vendor pada filter ini." /> : (
            <div className="space-y-3">
              {filteredExpenseRows.map((item) => (
                <div key={item.id} className="rounded-2xl border bg-white p-4">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="space-y-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-2xl bg-slate-100 p-3 text-slate-700">{getExpenseIcon(item.kategori)}</span>
                        <div>
                          <p className="font-semibold text-slate-900">{item.nama}</p>
                          <p className="text-sm text-slate-500">{item.vendor}</p>
                        </div>
                        <Pill tone={getExpenseTone(item.status)}>{item.status}</Pill>
                        {item.isOverdue ? <Pill tone="rose">Lewat jatuh tempo</Pill> : null}
                      </div>
                      <div className="grid gap-2 text-sm text-slate-600 sm:grid-cols-2 xl:grid-cols-4">
                        <p>Total: <strong>{formatRupiah(item.nominal)}</strong></p>
                        <p>Sudah dibayar: <strong>{formatRupiah(item.paid)}</strong></p>
                        <p>Sisa: <strong>{formatRupiah(item.remaining)}</strong></p>
                        <p>Jatuh tempo: <strong>{item.jatuhTempo || "-"}</strong></p>
                      </div>
                      {item.catatan ? <p className="text-sm text-slate-500">{item.catatan}</p> : null}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button onClick={() => { setVendorView("pembayaran"); setVendorPaymentForm((prev) => ({ ...prev, expenseId: item.id, vendorManual: item.vendor || item.nama })); }} className={smallButton}>Catat pembayaran</button>
                      <button onClick={() => editExpense(item)} className={smallButton}>Edit</button>
                      <button onClick={() => removeExpense(item)} className={smallButton}><Trash2 className="mr-1 h-3.5 w-3.5" /> Hapus</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Section>
  );

  const vendorPaymentsSection = (
    <Section title="Pembayaran vendor" subtitle="Catat DP, cicilan, atau pelunasan dan simpan bukti transfer seperlunya.">
      <div className="grid gap-6 2xl:grid-cols-[0.88fr_1.12fr]">
        <div className="space-y-4 rounded-2xl border bg-slate-50 p-4">
          <div className="grid gap-3 lg:grid-cols-2">
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium text-slate-700">Pilih tagihan</label>
              <select className={selectClass} value={vendorPaymentForm.expenseId} onChange={(event) => setVendorPaymentForm((prev) => ({ ...prev, expenseId: event.target.value }))}>
                <option value="">Tidak ditautkan / isi vendor manual</option>
                {expenseRows.map((item) => <option key={item.id} value={item.id}>{item.nama} · {item.vendor}</option>)}
              </select>
            </div>
            {!vendorPaymentForm.expenseId ? (
              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-medium text-slate-700">Nama vendor manual</label>
                <input className={inputClass} value={vendorPaymentForm.vendorManual} onChange={(event) => setVendorPaymentForm((prev) => ({ ...prev, vendorManual: event.target.value }))} />
              </div>
            ) : null}
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Tanggal</label>
              <input className={inputClass} type="date" value={vendorPaymentForm.tanggal} onChange={(event) => setVendorPaymentForm((prev) => ({ ...prev, tanggal: event.target.value }))} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Jenis pembayaran</label>
              <select className={selectClass} value={vendorPaymentForm.jenis} onChange={(event) => setVendorPaymentForm((prev) => ({ ...prev, jenis: event.target.value }))}>
                {VENDOR_PAYMENT_TYPES.map((type) => <option key={type} value={type}>{type}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Metode</label>
              <select className={selectClass} value={vendorPaymentForm.metode} onChange={(event) => setVendorPaymentForm((prev) => ({ ...prev, metode: event.target.value }))}>
                {PAYMENT_METHODS.map((method) => <option key={method} value={method}>{method}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Nominal</label>
              <input className={inputClass} type="number" value={vendorPaymentForm.nominal} onChange={(event) => setVendorPaymentForm((prev) => ({ ...prev, nominal: event.target.value }))} />
            </div>
          </div>
          <button onClick={() => setShowVendorPaymentAdvanced((prev) => !prev)} className={smallButton}>
            {showVendorPaymentAdvanced ? "Sembunyikan detail tambahan" : "Tampilkan detail tambahan"}
          </button>
          {showVendorPaymentAdvanced ? (
            <div className="grid gap-3 lg:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Akun tujuan</label>
                <input className={inputClass} value={vendorPaymentForm.akunTujuan} onChange={(event) => setVendorPaymentForm((prev) => ({ ...prev, akunTujuan: event.target.value }))} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Biaya admin</label>
                <input className={inputClass} type="number" value={vendorPaymentForm.biayaAdmin} onChange={(event) => setVendorPaymentForm((prev) => ({ ...prev, biayaAdmin: event.target.value }))} />
              </div>
              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-medium text-slate-700">Catatan</label>
                <textarea className={textAreaClass} placeholder="Tambahkan catatan pembayaran vendor" value={vendorPaymentForm.catatan} onChange={(event) => setVendorPaymentForm((prev) => ({ ...prev, catatan: event.target.value }))} />
              </div>
              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-medium text-slate-700">Bukti transfer</label>
                <input ref={paymentProofInputRef} type="file" accept="image/*" className={inputClass} onChange={handleVendorProofUpload} />
                {proofStatusText ? <p className="text-xs text-slate-500">{proofStatusText}</p> : null}
              </div>
            </div>
          ) : null}
          {selectedExpenseForForm ? <InlineBanner title="Tagihan terpilih" text={`${selectedExpenseForForm.nama} · sisa ${formatRupiah(selectedExpenseForForm.remaining)}`} tone={getExpenseTone(selectedExpenseForForm.status)} /> : null}
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <button onClick={addVendorPayment} className={buttonPrimary}><ArrowUpCircle className="mr-2 h-4 w-4" /> Simpan pembayaran</button>
            <button onClick={resetVendorPaymentForm} className={buttonOutline}>Reset form</button>
          </div>
        </div>

        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <MiniStat label="Total pembayaran" value={formatRupiah(totalVendorPaid)} tone="amber" />
            <MiniStat label="Total biaya admin" value={formatRupiah(totalVendorAdmin)} tone="rose" />
            <MiniStat label="Belum tertaut" value={formatRupiah(totalVendorUnlinked)} tone={totalVendorUnlinked > 0 ? "amber" : "slate"} />
          </div>
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm font-semibold text-slate-700">Filter vendor</p>
              <p className="text-sm text-slate-500">Tampilkan histori pembayaran per vendor bila dibutuhkan.</p>
            </div>
            <select className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm" value={selectedVendorFilter} onChange={(event) => setSelectedVendorFilter(event.target.value)}>
              {vendorFilterOptions.map((option) => <option key={option} value={option}>{option}</option>)}
            </select>
          </div>
          {filteredVendorPayments.length === 0 ? <EmptyState text="Belum ada pembayaran vendor pada filter ini." /> : (
            <div className="space-y-3">
              {filteredVendorPayments.map((item) => {
                const linkedExpense = expenseLookup[String(item.expenseId)];
                const vendorName = linkedExpense?.vendor || item.vendorSnapshot || "Belum ditautkan";
                const proofPreviewUrl = vendorProofPreviewUrls[item.id] || item.buktiDataUrl;
                return (
                  <div key={item.id} className="rounded-2xl border bg-white p-4">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div className="space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-semibold text-slate-900">{vendorName}</p>
                          <Pill tone={linkedExpense ? getExpenseTone(linkedExpense.status) : "slate"}>{item.jenis}</Pill>
                          {!item.expenseId ? <Pill tone="amber">Belum tertaut</Pill> : null}
                        </div>
                        <p className="text-sm text-slate-500">{linkedExpense?.nama || "Pembayaran manual"} · {item.tanggal || "-"} · {item.metode || "-"}</p>
                        <div className="grid gap-2 text-sm text-slate-600 sm:grid-cols-2 xl:grid-cols-4">
                          <p>Nominal: <strong>{formatRupiah(item.nominal)}</strong></p>
                          <p>Admin: <strong>{formatRupiah(item.biayaAdmin)}</strong></p>
                          <p>Akun tujuan: <strong>{item.akunTujuan || "-"}</strong></p>
                          <p>Status tagihan: <strong>{linkedExpense?.status || "Manual"}</strong></p>
                        </div>
                        {item.catatan ? <p className="text-sm text-slate-500">{item.catatan}</p> : null}
                        {item.buktiPath || proofPreviewUrl ? (
                          <div className="mt-2 flex flex-wrap items-center gap-3">
                            {proofPreviewUrl ? (
                              <div className="inline-flex overflow-hidden rounded-2xl border bg-slate-50 p-2">
                                <img
                                  src={proofPreviewUrl}
                                  alt={item.buktiNama || "Bukti transfer"}
                                  className="h-20 w-20 rounded-xl object-cover"
                                />
                              </div>
                            ) : null}

                            {item.buktiPath ? (
                              <button
                                type="button"
                                onClick={async () => {
                                  const signedUrl = await refreshVendorProofUrl(item);

                                  if (signedUrl) {
                                    window.open(signedUrl, "_blank", "noopener,noreferrer");
                                  }
                                }}
                                className={smallButton}
                              >
                                Lihat bukti
                              </button>
                            ) : null}
                          </div>
                        ) : null}
                      </div>
                      <button onClick={() => removeVendorPayment(item)} className={smallButton}><Trash2 className="mr-1 h-3.5 w-3.5" /> Hapus</button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </Section>
  );

  return (
    <div className="space-y-4 sm:space-y-6">
      {vendorGuide}
      <div className="flex flex-wrap gap-2">
        <button onClick={() => setVendorView("tagihan")} className={tabClass(vendorView === "tagihan")}>Tagihan vendor</button>
        <button onClick={() => setVendorView("pembayaran")} className={tabClass(vendorView === "pembayaran")}>Pembayaran vendor</button>
        <button onClick={() => setVendorView("semua")} className={tabClass(vendorView === "semua")}>Tampilkan semua</button>
      </div>
      {(vendorView === "tagihan" || vendorView === "semua") ? vendorBillsSection : null}
      {(vendorView === "pembayaran" || vendorView === "semua") ? vendorPaymentsSection : null}
    </div>
  );
}
