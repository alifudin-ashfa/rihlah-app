import React, { useEffect, useMemo, useState } from "react";
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
  const [expandedVendors, setExpandedVendors] = useState({});

  const vendorProofPathSignature = useMemo(
    () =>
      (vendorPaymentRows || [])
        .map((item) => `${item.id}:${item.buktiPath || ""}`)
        .join("|"),
    [vendorPaymentRows]
  );

  useEffect(() => {
    let isCancelled = false;

    const loadProofPreviews = async () => {
      const paymentsWithProof = (vendorPaymentRows || []).filter(
        (item) => item.buktiPath
      );

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

  const openDataOrUrl = (url) => {
    if (!url) {
      window.alert("Bukti pembayaran tidak tersedia.");
      return;
    }

    try {
      if (!url.startsWith("data:")) {
        window.open(url, "_blank", "noopener,noreferrer");
        return;
      }

      const [header, base64Data] = url.split(",");
      const mimeMatch = header.match(/data:(.*?);base64/);
      const mimeType = mimeMatch?.[1] || "application/octet-stream";

      const binaryString = window.atob(base64Data);
      const bytes = new Uint8Array(binaryString.length);

      for (let index = 0; index < binaryString.length; index += 1) {
        bytes[index] = binaryString.charCodeAt(index);
      }

      const blob = new Blob([bytes], { type: mimeType });
      const blobUrl = URL.createObjectURL(blob);

      window.open(blobUrl, "_blank", "noopener,noreferrer");

      setTimeout(() => {
        URL.revokeObjectURL(blobUrl);
      }, 60_000);
    } catch {
      window.alert("Gagal membuka bukti pembayaran.");
    }
  };

  const openVendorProof = async (payment) => {
    if (!payment) {
      window.alert("Bukti pembayaran tidak tersedia.");
      return;
    }

    if (payment.buktiPath) {
      const signedUrl =
        vendorProofPreviewUrls[payment.id] ||
        (await refreshVendorProofUrl(payment));

      if (signedUrl) {
        window.open(signedUrl, "_blank", "noopener,noreferrer");
        return;
      }
    }

    if (payment.buktiDataUrl) {
      openDataOrUrl(payment.buktiDataUrl);
      return;
    }

    window.alert("Bukti pembayaran tidak tersedia.");
  };

  const getPaymentsForExpense = (expenseId) =>
    (vendorPaymentRows || []).filter(
      (payment) => String(payment.expenseId || "") === String(expenseId || "")
    );

  const getPaymentTotalForExpense = (expenseId) =>
    getPaymentsForExpense(expenseId).reduce(
      (sum, payment) => sum + Number(payment.nominal || 0),
      0
    );

  const getAdminTotalForExpense = (expenseId) =>
    getPaymentsForExpense(expenseId).reduce(
      (sum, payment) => sum + Number(payment.biayaAdmin || 0),
      0
    );

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
    <Section
      title="Tagihan Vendor"
      subtitle={
        canEdit
          ? "Daftar kebutuhan biaya atau anggaran yang akan dibayar ke vendor."
          : undefined
      }
    >
      <div
        className={
          canEdit ? "grid gap-6 2xl:grid-cols-[0.88fr_1.12fr]" : "grid gap-6"
        }
      >
        {canEdit ? (
          <div className="space-y-4 rounded-2xl border bg-slate-50 p-4">
            <div className="grid gap-3 lg:grid-cols-2">
              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-medium text-slate-700">
                  Nama tagihan
                </label>
                <input
                  className={inputClass}
                  placeholder="Contoh: Sewa bus"
                  value={expenseForm.nama}
                  onChange={(event) =>
                    setExpenseForm((prev) => ({
                      ...prev,
                      nama: event.target.value,
                    }))
                  }
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">
                  Kategori
                </label>
                <select
                  className={selectClass}
                  value={expenseForm.kategori}
                  onChange={(event) =>
                    setExpenseForm((prev) => ({
                      ...prev,
                      kategori: event.target.value,
                    }))
                  }
                >
                  {EXPENSE_CATEGORIES.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">
                  Nominal
                </label>
                <input
                  className={inputClass}
                  type="number"
                  inputMode="numeric"
                  min="0"
                  placeholder="Contoh: 8000000"
                  value={expenseForm.nominal}
                  onChange={(event) =>
                    setExpenseForm((prev) => ({
                      ...prev,
                      nominal: event.target.value,
                    }))
                  }
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-medium text-slate-700">
                  Nama vendor
                </label>
                <input
                  className={inputClass}
                  placeholder="Contoh: Vendor konsumsi"
                  value={expenseForm.vendor}
                  onChange={(event) =>
                    setExpenseForm((prev) => ({
                      ...prev,
                      vendor: event.target.value,
                    }))
                  }
                />
              </div>
            </div>

            <button
              onClick={() => setShowExpenseAdvanced((prev) => !prev)}
              className={smallButton}
            >
              {showExpenseAdvanced
                ? "Sembunyikan detail tambahan"
                : "Tampilkan detail tambahan"}
            </button>

            {showExpenseAdvanced ? (
              <div className="grid gap-3 lg:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">
                    Jatuh tempo
                  </label>
                  <input
                    className={inputClass}
                    type="date"
                    value={expenseForm.jatuhTempo}
                    onChange={(event) =>
                      setExpenseForm((prev) => ({
                        ...prev,
                        jatuhTempo: event.target.value,
                      }))
                    }
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <label className="text-sm font-medium text-slate-700">
                    Catatan
                  </label>
                  <textarea
                    className={textAreaClass}
                    placeholder="Contoh: DP 30% sebelum keberangkatan"
                    value={expenseForm.catatan}
                    onChange={(event) =>
                      setExpenseForm((prev) => ({
                        ...prev,
                        catatan: event.target.value,
                      }))
                    }
                  />
                </div>
              </div>
            ) : null}

            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              {canEdit ? (
                <button onClick={addOrUpdateExpense} className={buttonPrimary}>
                  {editingExpenseId ? "Simpan perubahan" : "Tambah tagihan"}
                </button>
              ) : null}

              {canEdit && editingExpenseId ? (
                <button onClick={resetExpenseForm} className={buttonOutline}>
                  Batal edit
                </button>
              ) : null}
            </div>
          </div>
        ) : null}

        <div className="space-y-4">
          <div className="flex flex-col gap-4">
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <MiniStat
                label="Total tagihan"
                value={formatRupiah(totalTagihan)}
                tone="amber"
              />
              <MiniStat
                label="Sudah dibayar"
                value={formatRupiah(totalLinkedVendorPaid)}
                tone="emerald"
              />
              <MiniStat
                label="Sisa tagihan"
                value={formatRupiah(totalVendorOutstanding)}
                tone={totalVendorOutstanding > 0 ? "rose" : "emerald"}
              />
              <MiniStat
                label="Lebih bayar"
                value={formatRupiah(totalVendorOverpaid)}
                tone={totalVendorOverpaid > 0 ? "amber" : "slate"}
              />
            </div>

            <div className="flex flex-wrap gap-2 xl:justify-start">
              {["Semua", "Belum Dibayar", "DP / Cicilan", "Lunas", "Lebih Bayar"].map(
                (status) => (
                  <button
                    key={status}
                    onClick={() => setVendorStatusFilter(status)}
                    className={tabClass(vendorStatusFilter === status)}
                  >
                    {status}
                  </button>
                )
              )}
            </div>
          </div>

          {filteredExpenseRows.length === 0 ? (
            <EmptyState text="Belum ada data tagihan vendor pada filter ini." />
          ) : (
            <div className="space-y-3">
              {filteredExpenseRows.map((item) => {
                const isExpanded = Boolean(expandedVendors[item.id]);
                const payments = getPaymentsForExpense(item.id);
                const totalPaid = getPaymentTotalForExpense(item.id);
                const totalAdmin = getAdminTotalForExpense(item.id);
                const remaining = Math.max(Number(item.nominal || 0) - totalPaid, 0);
                const overpaid = Math.max(totalPaid - Number(item.nominal || 0), 0);

                return (
                  <div key={item.id} className="rounded-2xl border bg-white p-4">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div className="min-w-0 flex-1 space-y-3">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="rounded-2xl bg-slate-100 p-3 text-slate-700">
                            {getExpenseIcon(item.kategori)}
                          </span>

                          <div>
                            <p className="font-semibold text-slate-900">
                              {item.nama}
                            </p>
                            <p className="text-sm text-slate-500">
                              {item.vendor}
                            </p>
                          </div>

                          <Pill tone={getExpenseTone(item.status)}>
                            {item.status}
                          </Pill>

                          {item.isOverdue ? (
                            <Pill tone="rose">Lewat jatuh tempo</Pill>
                          ) : null}
                        </div>

                        <div className="grid gap-2 text-sm text-slate-600 sm:grid-cols-2 xl:grid-cols-4">
                          <p>
                            Total: <strong>{formatRupiah(item.nominal)}</strong>
                          </p>
                          <p>
                            Sudah dibayar:{" "}
                            <strong>{formatRupiah(item.paid)}</strong>
                          </p>
                          <p>
                            Sisa: <strong>{formatRupiah(item.remaining)}</strong>
                          </p>
                          <p>
                            Jatuh tempo:{" "}
                            <strong>{item.jatuhTempo || "-"}</strong>
                          </p>
                        </div>

                        {item.catatan ? (
                          <p className="text-sm text-slate-500">
                            {item.catatan}
                          </p>
                        ) : null}

                        {isExpanded ? (
                          <div className="rounded-2xl border bg-slate-50 p-4">
                            <div className="grid gap-4 lg:grid-cols-3">
                              <div className="rounded-2xl border bg-white p-4">
                                <p className="text-sm font-semibold text-slate-900">
                                  Detail Tagihan
                                </p>

                                <div className="mt-3 space-y-2 text-sm text-slate-600">
                                  <p>
                                    Nama tagihan:{" "}
                                    <strong className="text-slate-900">
                                      {item.nama}
                                    </strong>
                                  </p>
                                  <p>
                                    Vendor:{" "}
                                    <strong className="text-slate-900">
                                      {item.vendor || "-"}
                                    </strong>
                                  </p>
                                  <p>
                                    Kategori:{" "}
                                    <strong className="text-slate-900">
                                      {item.kategori || "-"}
                                    </strong>
                                  </p>
                                  <p>
                                    Jatuh tempo:{" "}
                                    <strong className="text-slate-900">
                                      {item.jatuhTempo || "-"}
                                    </strong>
                                  </p>
                                  <p>
                                    Status:{" "}
                                    <strong className="text-slate-900">
                                      {item.status}
                                    </strong>
                                  </p>

                                  {item.catatan ? (
                                    <p className="rounded-xl bg-slate-50 p-3 text-slate-600">
                                      {item.catatan}
                                    </p>
                                  ) : null}
                                </div>
                              </div>

                              <div className="rounded-2xl border bg-white p-4">
                                <p className="text-sm font-semibold text-slate-900">
                                  Ringkasan Pembayaran
                                </p>

                                <div className="mt-3 space-y-3">
                                  <div className="rounded-xl bg-slate-50 p-3">
                                    <p className="text-sm text-slate-500">
                                      Total tagihan
                                    </p>
                                    <p className="font-bold text-slate-900">
                                      {formatRupiah(item.nominal)}
                                    </p>
                                  </div>

                                  <div className="rounded-xl bg-emerald-50 p-3">
                                    <p className="text-sm text-emerald-700">
                                      Sudah dibayar
                                    </p>
                                    <p className="font-bold text-emerald-900">
                                      {formatRupiah(totalPaid)}
                                    </p>
                                  </div>

                                  <div className="rounded-xl bg-rose-50 p-3">
                                    <p className="text-sm text-rose-700">
                                      Sisa tagihan
                                    </p>
                                    <p className="font-bold text-rose-900">
                                      {formatRupiah(remaining)}
                                    </p>
                                  </div>

                                  {overpaid > 0 ? (
                                    <div className="rounded-xl bg-amber-50 p-3">
                                      <p className="text-sm text-amber-700">
                                        Lebih bayar
                                      </p>
                                      <p className="font-bold text-amber-900">
                                        {formatRupiah(overpaid)}
                                      </p>
                                    </div>
                                  ) : null}

                                  <div className="rounded-xl bg-slate-50 p-3">
                                    <p className="text-sm text-slate-500">
                                      Total biaya admin
                                    </p>
                                    <p className="font-bold text-slate-900">
                                      {formatRupiah(totalAdmin)}
                                    </p>
                                  </div>
                                </div>
                              </div>

                              <div className="rounded-2xl border bg-white p-4">
                                <p className="text-sm font-semibold text-slate-900">
                                  Aksi Cepat
                                </p>

                                <div className="mt-3 flex flex-col gap-2">
                                  {canEdit ? (
                                    <>
                                      <button
                                        onClick={() => {
                                          setVendorView("pembayaran");
                                          setVendorPaymentForm((prev) => ({
                                            ...prev,
                                            expenseId: item.id,
                                            vendorManual: item.vendor || item.nama,
                                          }));
                                        }}
                                        className={buttonPrimary}
                                      >
                                        Catat pembayaran
                                      </button>

                                      <button
                                        onClick={() => editExpense(item)}
                                        className={buttonOutline}
                                      >
                                        Edit tagihan
                                      </button>
                                    </>
                                  ) : (
                                    <p className="rounded-xl bg-slate-50 p-3 text-sm text-slate-500">
                                      Mode pelihat hanya dapat melihat detail tagihan.
                                    </p>
                                  )}
                                </div>
                              </div>
                            </div>

                            <div className="mt-4 rounded-2xl border bg-white p-4">
                              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                                <div>
                                  <p className="text-sm font-semibold text-slate-900">
                                    Riwayat Pembayaran Vendor
                                  </p>
                                  <p className="text-xs text-slate-500">
                                    Menampilkan semua pembayaran yang tertaut dengan
                                    tagihan ini.
                                  </p>
                                </div>

                                <Pill tone={getExpenseTone(item.status)}>
                                  {item.status}
                                </Pill>
                              </div>

                              <div className="mt-4 space-y-2">
                                {payments.length === 0 ? (
                                  <p className="rounded-xl border border-dashed bg-slate-50 p-4 text-sm text-slate-500">
                                    Belum ada pembayaran untuk tagihan ini.
                                  </p>
                                ) : (
                                  payments.map((payment) => {
                                    const proofPreviewUrl =
                                      vendorProofPreviewUrls[payment.id] ||
                                      payment.buktiDataUrl;

                                    return (
                                      <div
                                        key={payment.id}
                                        className="flex flex-col gap-3 rounded-xl border bg-slate-50 p-3 lg:flex-row lg:items-center lg:justify-between"
                                      >
                                        <div className="space-y-2">
                                          <div className="flex flex-wrap items-center gap-2">
                                            <p className="text-sm font-semibold text-slate-900">
                                              {formatRupiah(payment.nominal)}
                                            </p>
                                            <Pill>{payment.jenis}</Pill>
                                          </div>

                                          <p className="text-sm text-slate-500">
                                            {payment.tanggal || "-"} ·{" "}
                                            {payment.metode || "-"} ·{" "}
                                            {payment.akunTujuan || "Akun belum diisi"}
                                          </p>

                                          <div className="grid gap-2 text-sm text-slate-600 sm:grid-cols-2">
                                            <p>
                                              Biaya admin:{" "}
                                              <strong>
                                                {formatRupiah(payment.biayaAdmin)}
                                              </strong>
                                            </p>
                                            <p>
                                              Bukti:{" "}
                                              <strong>
                                                {payment.buktiNama || "-"}
                                              </strong>
                                            </p>
                                          </div>

                                          {payment.catatan ? (
                                            <p className="text-sm text-slate-500">
                                              {payment.catatan}
                                            </p>
                                          ) : null}

                                          {payment.buktiPath || proofPreviewUrl ? (
                                            <div className="flex flex-wrap items-center gap-3">
                                              {proofPreviewUrl ? (
                                                <div className="inline-flex overflow-hidden rounded-2xl border bg-white p-2">
                                                  <img
                                                    src={proofPreviewUrl}
                                                    alt={
                                                      payment.buktiNama ||
                                                      "Bukti transfer"
                                                    }
                                                    className="h-20 w-20 rounded-xl object-cover"
                                                  />
                                                </div>
                                              ) : null}

                                              <button
                                                type="button"
                                                onClick={() =>
                                                  openVendorProof(payment)
                                                }
                                                className={smallButton}
                                              >
                                                Lihat bukti
                                              </button>
                                            </div>
                                          ) : (
                                            <p className="text-xs text-slate-400">
                                              Belum ada bukti pembayaran.
                                            </p>
                                          )}
                                        </div>

                                        {canEdit ? (
                                          <button
                                            onClick={() =>
                                              removeVendorPayment(payment)
                                            }
                                            className={smallButton}
                                          >
                                            <Trash2 className="mr-1 h-3.5 w-3.5" />
                                            Hapus
                                          </button>
                                        ) : null}
                                      </div>
                                    );
                                  })
                                )}
                              </div>
                            </div>
                          </div>
                        ) : null}
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={() =>
                            setExpandedVendors((prev) => ({
                              ...prev,
                              [item.id]: !prev[item.id],
                            }))
                          }
                          className={smallButton}
                        >
                          {isExpanded ? "Tutup detail" : "Detail"}
                        </button>

                        {canEdit ? (
                          <>
                            <button
                              onClick={() => {
                                setVendorView("pembayaran");
                                setVendorPaymentForm((prev) => ({
                                  ...prev,
                                  expenseId: item.id,
                                  vendorManual: item.vendor || item.nama,
                                }));
                              }}
                              className={smallButton}
                            >
                              Catat pembayaran
                            </button>
                            <button
                              onClick={() => editExpense(item)}
                              className={smallButton}
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => removeExpense(item)}
                              className={smallButton}
                            >
                              <Trash2 className="mr-1 h-3.5 w-3.5" />
                              Hapus
                            </button>
                          </>
                        ) : null}
                      </div>
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

  const vendorPaymentsSection = (
    <Section
      title="Pembayaran Vendor"
      subtitle={
        canEdit
          ? "Catat DP, cicilan, atau pelunasan dan simpan bukti transfer seperlunya."
          : undefined
      }
    >
      <div
        className={
          canEdit ? "grid gap-6 2xl:grid-cols-[0.88fr_1.12fr]" : "grid gap-6"
        }
      >
        {canEdit ? (
          <div className="space-y-4 rounded-2xl border bg-slate-50 p-4">
            <div className="grid gap-3 lg:grid-cols-2">
              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-medium text-slate-700">
                  Pilih tagihan
                </label>
                <select
                  className={selectClass}
                  value={vendorPaymentForm.expenseId}
                  onChange={(event) =>
                    setVendorPaymentForm((prev) => ({
                      ...prev,
                      expenseId: event.target.value,
                    }))
                  }
                >
                  <option value="">Tidak ditautkan / isi vendor manual</option>
                  {expenseRows.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.nama} · {item.vendor}
                    </option>
                  ))}
                </select>
              </div>

              {!vendorPaymentForm.expenseId ? (
                <div className="space-y-2 md:col-span-2">
                  <label className="text-sm font-medium text-slate-700">
                    Nama vendor manual
                  </label>
                  <input
                    className={inputClass}
                    value={vendorPaymentForm.vendorManual}
                    onChange={(event) =>
                      setVendorPaymentForm((prev) => ({
                        ...prev,
                        vendorManual: event.target.value,
                      }))
                    }
                  />
                </div>
              ) : null}

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">
                  Tanggal
                </label>
                <input
                  className={inputClass}
                  type="date"
                  value={vendorPaymentForm.tanggal}
                  onChange={(event) =>
                    setVendorPaymentForm((prev) => ({
                      ...prev,
                      tanggal: event.target.value,
                    }))
                  }
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">
                  Jenis pembayaran
                </label>
                <select
                  className={selectClass}
                  value={vendorPaymentForm.jenis}
                  onChange={(event) =>
                    setVendorPaymentForm((prev) => ({
                      ...prev,
                      jenis: event.target.value,
                    }))
                  }
                >
                  {VENDOR_PAYMENT_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">
                  Metode
                </label>
                <select
                  className={selectClass}
                  value={vendorPaymentForm.metode}
                  onChange={(event) =>
                    setVendorPaymentForm((prev) => ({
                      ...prev,
                      metode: event.target.value,
                    }))
                  }
                >
                  {PAYMENT_METHODS.map((method) => (
                    <option key={method} value={method}>
                      {method}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">
                  Nominal
                </label>
                <input
                  className={inputClass}
                  type="number"
                  inputMode="numeric"
                  min="0"
                  placeholder="Contoh: 2500000"
                  value={vendorPaymentForm.nominal}
                  onChange={(event) =>
                    setVendorPaymentForm((prev) => ({
                      ...prev,
                      nominal: event.target.value,
                    }))
                  }
                />
              </div>
            </div>

            <button
              onClick={() => setShowVendorPaymentAdvanced((prev) => !prev)}
              className={smallButton}
            >
              {showVendorPaymentAdvanced
                ? "Sembunyikan detail tambahan"
                : "Tampilkan detail tambahan"}
            </button>

            {showVendorPaymentAdvanced ? (
              <div className="grid gap-3 lg:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">
                    Akun tujuan
                  </label>
                  <input
                    className={inputClass}
                    value={vendorPaymentForm.akunTujuan}
                    onChange={(event) =>
                      setVendorPaymentForm((prev) => ({
                        ...prev,
                        akunTujuan: event.target.value,
                      }))
                    }
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">
                    Biaya admin
                  </label>
                  <input
                    className={inputClass}
                    type="number"
                    inputMode="numeric"
                    min="0"
                    placeholder="Opsional"
                    value={vendorPaymentForm.biayaAdmin}
                    onChange={(event) =>
                      setVendorPaymentForm((prev) => ({
                        ...prev,
                        biayaAdmin: event.target.value,
                      }))
                    }
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <label className="text-sm font-medium text-slate-700">
                    Catatan
                  </label>
                  <textarea
                    className={textAreaClass}
                    placeholder="Tambahkan catatan pembayaran vendor"
                    value={vendorPaymentForm.catatan}
                    onChange={(event) =>
                      setVendorPaymentForm((prev) => ({
                        ...prev,
                        catatan: event.target.value,
                      }))
                    }
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <label className="text-sm font-medium text-slate-700">
                    Bukti transfer
                  </label>
                  {canEdit ? (
                    <input
                      ref={paymentProofInputRef}
                      type="file"
                      accept="image/*"
                      className={inputClass}
                      onChange={handleVendorProofUpload}
                    />
                  ) : (
                    <p className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-500">
                      Mode pelihat: upload bukti disembunyikan.
                    </p>
                  )}
                  {proofStatusText ? (
                    <p className="text-xs text-slate-500">{proofStatusText}</p>
                  ) : null}
                </div>
              </div>
            ) : null}

            {selectedExpenseForForm ? (
              <InlineBanner
                title="Tagihan terpilih"
                text={`${selectedExpenseForForm.nama} · sisa ${formatRupiah(
                  selectedExpenseForForm.remaining
                )}`}
                tone={getExpenseTone(selectedExpenseForForm.status)}
              />
            ) : null}

            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              {canEdit ? (
                <>
                  <button onClick={addVendorPayment} className={buttonPrimary}>
                    <ArrowUpCircle className="mr-2 h-4 w-4" />
                    Simpan pembayaran
                  </button>
                  <button
                    onClick={resetVendorPaymentForm}
                    className={buttonOutline}
                  >
                    Reset form
                  </button>
                </>
              ) : null}
            </div>
          </div>
        ) : null}

        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <MiniStat
              label="Total pembayaran"
              value={formatRupiah(totalVendorPaid)}
              tone="amber"
            />
            <MiniStat
              label="Total biaya admin"
              value={formatRupiah(totalVendorAdmin)}
              tone="rose"
            />
            <MiniStat
              label="Belum tertaut"
              value={formatRupiah(totalVendorUnlinked)}
              tone={totalVendorUnlinked > 0 ? "amber" : "slate"}
            />
          </div>

          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm font-semibold text-slate-700">
                Filter Vendor
              </p>
            </div>
            <select
              className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm"
              value={selectedVendorFilter}
              onChange={(event) => setSelectedVendorFilter(event.target.value)}
            >
              {vendorFilterOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>

          {filteredVendorPayments.length === 0 ? (
            <EmptyState text="Belum ada pembayaran vendor pada filter ini." />
          ) : (
            <div className="space-y-3">
              {filteredVendorPayments.map((item) => {
                const linkedExpense = expenseLookup[String(item.expenseId)];
                const vendorName =
                  linkedExpense?.vendor ||
                  item.vendorSnapshot ||
                  "Belum ditautkan";
                const proofPreviewUrl =
                  vendorProofPreviewUrls[item.id] || item.buktiDataUrl;

                return (
                  <div key={item.id} className="rounded-2xl border bg-white p-4">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div className="space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-semibold text-slate-900">
                            {vendorName}
                          </p>
                          <Pill
                            tone={
                              linkedExpense
                                ? getExpenseTone(linkedExpense.status)
                                : "slate"
                            }
                          >
                            {item.jenis}
                          </Pill>
                          {!item.expenseId ? (
                            <Pill tone="amber">Belum tertaut</Pill>
                          ) : null}
                        </div>

                        <p className="text-sm text-slate-500">
                          {linkedExpense?.nama || "Pembayaran manual"} ·{" "}
                          {item.tanggal || "-"} · {item.metode || "-"}
                        </p>

                        <div className="grid gap-2 text-sm text-slate-600 sm:grid-cols-2 xl:grid-cols-4">
                          <p>
                            Nominal: <strong>{formatRupiah(item.nominal)}</strong>
                          </p>
                          <p>
                            Admin: <strong>{formatRupiah(item.biayaAdmin)}</strong>
                          </p>
                          <p>
                            Akun tujuan:{" "}
                            <strong>{item.akunTujuan || "-"}</strong>
                          </p>
                          <p>
                            Status tagihan:{" "}
                            <strong>{linkedExpense?.status || "Manual"}</strong>
                          </p>
                        </div>

                        {item.catatan ? (
                          <p className="text-sm text-slate-500">{item.catatan}</p>
                        ) : null}

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

                            <button
                              type="button"
                              onClick={() => openVendorProof(item)}
                              className={smallButton}
                            >
                              Lihat bukti
                            </button>
                          </div>
                        ) : null}
                      </div>

                      {canEdit ? (
                        <button
                          onClick={() => removeVendorPayment(item)}
                          className={smallButton}
                        >
                          <Trash2 className="mr-1 h-3.5 w-3.5" />
                          Hapus
                        </button>
                      ) : null}
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
      {canEdit ? vendorGuide : null}

      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setVendorView("tagihan")}
          className={tabClass(vendorView === "tagihan")}
        >
          Tagihan vendor
        </button>
        <button
          onClick={() => setVendorView("pembayaran")}
          className={tabClass(vendorView === "pembayaran")}
        >
          Pembayaran vendor
        </button>
        <button
          onClick={() => setVendorView("semua")}
          className={tabClass(vendorView === "semua")}
        >
          Tampilkan semua
        </button>
      </div>

      {vendorView === "tagihan" || vendorView === "semua"
        ? vendorBillsSection
        : null}
      {vendorView === "pembayaran" || vendorView === "semua"
        ? vendorPaymentsSection
        : null}
    </div>
  );
}