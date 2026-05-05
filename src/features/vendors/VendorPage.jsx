import React, { useEffect, useMemo, useState } from "react";
import { Trash2, ArrowUpCircle } from "lucide-react";
import {
  EXPENSE_CATEGORIES,
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
  getExpenseIcon,
  Section,
  Pill,
  MiniStat,
  EmptyState,
  InlineBanner,
  tabClass,
} from "../../shared/lib/rihlahCore";

const hasVendorProof = (payment) =>
  Boolean(
    payment?.buktiPath ||
      payment?.buktiDataUrl ||
      payment?.buktiUrl ||
      payment?.buktiNama
  );

export default function VendorPage({ app }) {
  const {
    authProfile,
    canEdit,
    canManageData: rawCanManageData,
    isFinalLocked,
    expenseForm,
    setExpenseForm,
    editingExpenseId,
    vendorPaymentForm,
    setVendorPaymentForm,
    vendorStatusFilter,
    setVendorStatusFilter,
    vendorView,
    setVendorView,
    showVendorPaymentAdvanced,
    setShowVendorPaymentAdvanced,
    showExpenseAdvanced,
    setShowExpenseAdvanced,
    selectedVendorFilter,
    setSelectedVendorFilter,
    paymentProofInputRef,
    vendorPaymentRows,
    expenseRows,
    expenseLookup,
    filteredExpenseRows,
    filteredVendorPayments,
    vendorFilterOptions,
    totalTagihan,
    totalVendorPaid,
    totalVendorAdmin,
    totalLinkedVendorPaid,
    totalVendorOutstanding,
    totalVendorOverpaid,
    totalVendorUnlinked,
    addOrUpdateExpense,
    editExpense,
    removeExpense,
    handleVendorProofUpload,
    addVendorPayment,
    removeVendorPayment,
    refreshVendorProofUrl,
    resetExpenseForm,
    resetVendorPaymentForm,
    selectedExpenseForForm,
    proofStatusText,
  } = app;

  const profileRole = String(authProfile?.role || "").toLowerCase();
  const canManageData = Boolean(
    rawCanManageData ||
      canEdit ||
      ["admin", "bendahara", "pengelola"].includes(profileRole)
  );

  const [vendorProofPreviewUrls, setVendorProofPreviewUrls] = useState({});
  const [expandedVendors, setExpandedVendors] = useState({});
  const [vendorProofFilter, setVendorProofFilter] = useState("all");

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
  }, [vendorProofPathSignature, vendorPaymentRows, refreshVendorProofUrl]);

  const vendorProofSummary = useMemo(() => {
    const rows = Array.isArray(filteredVendorPayments)
      ? filteredVendorPayments
      : [];

    const withProof = rows.filter(hasVendorProof);
    const withoutProof = rows.filter((payment) => !hasVendorProof(payment));

    return {
      total: rows.length,
      withProof: withProof.length,
      withoutProof: withoutProof.length,
    };
  }, [filteredVendorPayments]);

  const filteredVendorPaymentsByProof = useMemo(() => {
    const rows = Array.isArray(filteredVendorPayments)
      ? filteredVendorPayments
      : [];

    if (vendorProofFilter === "with-proof") {
      return rows.filter(hasVendorProof);
    }

    if (vendorProofFilter === "without-proof") {
      return rows.filter((payment) => !hasVendorProof(payment));
    }

    return rows;
  }, [filteredVendorPayments, vendorProofFilter]);

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

  const renderProofBadge = (payment) => {
    const proofExists = hasVendorProof(payment);

    return (
      <Pill tone={proofExists ? "emerald" : "rose"}>
        {proofExists ? "Dengan bukti" : "Tanpa bukti"}
      </Pill>
    );
  };

  const renderProofAction = (payment, proofPreviewUrl) => {
    const proofExists = hasVendorProof(payment) || proofPreviewUrl;

    if (!proofExists) {
      return (
        <p className="text-xs text-slate-400">Belum ada bukti pembayaran.</p>
      );
    }

    return (
      <div className="flex flex-wrap items-center gap-3">
        {proofPreviewUrl ? (
          <div className="inline-flex overflow-hidden rounded-2xl border bg-white p-2">
            <img
              src={proofPreviewUrl}
              alt={payment.buktiNama || "Bukti transfer"}
              className="h-20 w-20 rounded-xl object-cover"
            />
          </div>
        ) : null}

        <button
          type="button"
          onClick={() => openVendorProof(payment)}
          className={smallButton}
        >
          Lihat bukti
        </button>
      </div>
    );
  };

  const vendorBillsSection = (
    <Section
      title="Tagihan Vendor"
      subtitle={
        canManageData
          ? "Daftar kebutuhan biaya atau anggaran yang akan dibayar ke vendor."
          : undefined
      }
    >
      <div
        className={
          canManageData
            ? "grid gap-6 xl:grid-cols-[360px_minmax(0,1fr)] 2xl:grid-cols-[400px_minmax(0,1fr)]"
            : "grid gap-6"
        }
      >
        {canManageData ? (
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
              {canManageData ? (
                <button onClick={addOrUpdateExpense} className={buttonPrimary}>
                  {editingExpenseId ? "Simpan perubahan" : "Tambah tagihan"}
                </button>
              ) : null}

              {canManageData && editingExpenseId ? (
                <button onClick={resetExpenseForm} className={buttonOutline}>
                  Batal edit
                </button>
              ) : null}
            </div>
          </div>
        ) : null}

        <div className="min-w-0 w-full space-y-4">
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

            <div className="flex flex-wrap gap-2">
              {[
                "Semua",
                "Belum Dibayar",
                "DP / Cicilan",
                "Lunas",
                "Lebih Bayar",
              ].map((status) => (
                <button
                  key={status}
                  onClick={() => setVendorStatusFilter(status)}
                  className={tabClass(vendorStatusFilter === status)}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>

          {filteredExpenseRows.length === 0 ? (
            <EmptyState text="Belum ada data tagihan vendor pada filter ini." />
          ) : (
            <div className="space-y-4">
              {filteredExpenseRows.map((item) => {
                const isExpanded = Boolean(expandedVendors[item.id]);
                const payments = getPaymentsForExpense(item.id);
                const totalPaid = getPaymentTotalForExpense(item.id);
                const totalAdmin = getAdminTotalForExpense(item.id);
                const remaining = Math.max(
                  Number(item.nominal || 0) - totalPaid,
                  0
                );
                const overpaid = Math.max(
                  totalPaid - Number(item.nominal || 0),
                  0
                );

                return (
                  <div
                    key={item.id}
                    className="w-full rounded-3xl border bg-white p-5 shadow-sm"
                  >
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
                          <span className="w-fit rounded-2xl bg-slate-100 p-3 text-slate-700">
                            {getExpenseIcon(item.kategori)}
                          </span>

                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <h3 className="text-lg font-bold text-slate-900">
                                {item.nama}
                              </h3>
                              <Pill tone={getExpenseTone(item.status)}>
                                {item.status}
                              </Pill>
                              {item.isOverdue ? (
                                <Pill tone="rose">Lewat jatuh tempo</Pill>
                              ) : null}
                            </div>

                            <p className="mt-1 text-sm font-semibold text-slate-500">
                              {item.vendor || "-"}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2 lg:justify-end">
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

                        {canManageData ? (
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

                    <div className="mt-5 grid w-full gap-4 sm:grid-cols-2 xl:grid-cols-4">
                      <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                        <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                          Total
                        </p>
                        <p className="mt-2 text-xl font-extrabold text-slate-900">
                          {formatRupiah(item.nominal)}
                        </p>
                      </div>

                      <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
                        <p className="text-xs font-bold uppercase tracking-wide text-emerald-700">
                          Sudah dibayar
                        </p>
                        <p className="mt-2 text-xl font-extrabold text-emerald-900">
                          {formatRupiah(item.paid)}
                        </p>
                      </div>

                      <div className="rounded-2xl border border-rose-100 bg-rose-50 p-4">
                        <p className="text-xs font-bold uppercase tracking-wide text-rose-700">
                          Sisa
                        </p>
                        <p className="mt-2 text-xl font-extrabold text-rose-900">
                          {formatRupiah(item.remaining)}
                        </p>
                      </div>

                      <div className="rounded-2xl border border-sky-100 bg-sky-50 p-4">
                        <p className="text-xs font-bold uppercase tracking-wide text-sky-700">
                          Jatuh tempo
                        </p>
                        <p className="mt-2 text-xl font-extrabold text-sky-900">
                          {item.jatuhTempo || "-"}
                        </p>
                      </div>
                    </div>

                    {item.catatan ? (
                      <div className="mt-4 rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-600">
                        {item.catatan}
                      </div>
                    ) : null}

                    {isExpanded ? (
                      <div className="mt-5 w-full space-y-5 rounded-3xl border border-slate-200 bg-slate-50 p-5">
                        <div className="w-full rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                          <h3 className="text-xl font-bold text-slate-900">
                            Detail Tagihan
                          </h3>

                          <div className="mt-5 grid w-full grid-cols-1 gap-6 lg:grid-cols-2">
                            <div>
                              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                                Nama tagihan
                              </p>
                              <p className="mt-1 text-base font-bold text-slate-900">
                                {item.nama}
                              </p>
                            </div>

                            <div>
                              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                                Vendor
                              </p>
                              <p className="mt-1 text-base font-bold text-slate-900">
                                {item.vendor || "-"}
                              </p>
                            </div>

                            <div>
                              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                                Kategori
                              </p>
                              <p className="mt-1 text-base font-bold text-slate-900">
                                {item.kategori || "-"}
                              </p>
                            </div>

                            <div>
                              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                                Jatuh tempo
                              </p>
                              <p className="mt-1 text-base font-bold text-slate-900">
                                {item.jatuhTempo || "-"}
                              </p>
                            </div>

                            <div>
                              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                                Status
                              </p>
                              <p className="mt-1 text-base font-bold text-slate-900">
                                {item.status}
                              </p>
                            </div>

                            <div>
                              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                                Catatan
                              </p>
                              <p className="mt-1 text-base font-bold text-slate-900">
                                {item.catatan || "-"}
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="w-full rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                          <h3 className="text-xl font-bold text-slate-900">
                            Ringkasan Pembayaran
                          </h3>

                          <div className="mt-5 grid w-full grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                            <div className="rounded-2xl bg-slate-50 p-4">
                              <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                                Total tagihan
                              </p>
                              <p className="mt-2 text-xl font-extrabold text-slate-900">
                                {formatRupiah(item.nominal)}
                              </p>
                            </div>

                            <div className="rounded-2xl bg-emerald-50 p-4">
                              <p className="text-xs font-bold uppercase tracking-wide text-emerald-700">
                                Sudah dibayar
                              </p>
                              <p className="mt-2 text-xl font-extrabold text-emerald-900">
                                {formatRupiah(totalPaid)}
                              </p>
                            </div>

                            <div className="rounded-2xl bg-rose-50 p-4">
                              <p className="text-xs font-bold uppercase tracking-wide text-rose-700">
                                Sisa tagihan
                              </p>
                              <p className="mt-2 text-xl font-extrabold text-rose-900">
                                {formatRupiah(remaining)}
                              </p>
                            </div>

                            <div className="rounded-2xl bg-amber-50 p-4">
                              <p className="text-xs font-bold uppercase tracking-wide text-amber-700">
                                Biaya admin
                              </p>
                              <p className="mt-2 text-xl font-extrabold text-amber-900">
                                {formatRupiah(totalAdmin)}
                              </p>
                            </div>

                            {overpaid > 0 ? (
                              <div className="rounded-2xl bg-amber-50 p-4">
                                <p className="text-xs font-bold uppercase tracking-wide text-amber-700">
                                  Lebih bayar
                                </p>
                                <p className="mt-2 text-xl font-extrabold text-amber-900">
                                  {formatRupiah(overpaid)}
                                </p>
                              </div>
                            ) : null}
                          </div>
                        </div>

                        <div className="w-full rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                            <div>
                              <h3 className="text-xl font-bold text-slate-900">
                                Riwayat Pembayaran Vendor
                              </h3>
                              <p className="mt-1 text-sm text-slate-500">
                                Menampilkan semua pembayaran yang tertaut dengan
                                tagihan ini.
                              </p>
                            </div>

                            <Pill tone={getExpenseTone(item.status)}>
                              {item.status}
                            </Pill>
                          </div>

                          <div className="mt-6 space-y-4">
                            {payments.length === 0 ? (
                              <p className="rounded-2xl border border-dashed bg-slate-50 p-5 text-sm text-slate-500">
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
                                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-5"
                                  >
                                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                                      <div className="min-w-0 flex-1 space-y-4">
                                        <div className="flex flex-wrap items-center gap-3">
                                          <p className="text-2xl font-extrabold text-slate-900">
                                            {formatRupiah(payment.nominal)}
                                          </p>
                                          <Pill>{payment.jenis}</Pill>
                                          {renderProofBadge(payment)}
                                        </div>

                                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                                          <div>
                                            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                                              Tanggal
                                            </p>
                                            <p className="mt-1 font-semibold text-slate-800">
                                              {payment.tanggal || "-"}
                                            </p>
                                          </div>

                                          <div>
                                            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                                              Metode
                                            </p>
                                            <p className="mt-1 font-semibold text-slate-800">
                                              {payment.metode || "-"}
                                            </p>
                                          </div>

                                          <div>
                                            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                                              Akun tujuan
                                            </p>
                                            <p className="mt-1 font-semibold text-slate-800">
                                              {payment.akunTujuan ||
                                                "Akun belum diisi"}
                                            </p>
                                          </div>

                                          <div>
                                            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                                              Biaya admin
                                            </p>
                                            <p className="mt-1 font-semibold text-slate-800">
                                              {formatRupiah(payment.biayaAdmin)}
                                            </p>
                                          </div>
                                        </div>

                                        {payment.catatan ? (
                                          <p className="rounded-xl bg-white p-3 text-sm text-slate-600">
                                            {payment.catatan}
                                          </p>
                                        ) : null}

                                        {renderProofAction(payment, proofPreviewUrl)}
                                      </div>

                                      {canManageData ? (
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
                                  </div>
                                );
                              })
                            )}
                          </div>
                        </div>

                        {canManageData ? (
                          <div className="w-full rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                            <h3 className="text-xl font-bold text-slate-900">
                              Aksi Cepat
                            </h3>

                            <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
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
                            </div>
                          </div>
                        ) : null}
                      </div>
                    ) : null}
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
        canManageData
          ? "Catat DP, cicilan, atau pelunasan dan simpan bukti transfer seperlunya."
          : undefined
      }
    >
      <div
        className={
          canManageData
            ? "grid gap-6 xl:grid-cols-[360px_minmax(0,1fr)] 2xl:grid-cols-[400px_minmax(0,1fr)]"
            : "grid gap-6"
        }
      >
        {canManageData ? (
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

              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-medium text-slate-700">
                  Bukti transfer
                </label>
                {canManageData ? (
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
                <p className="text-xs text-slate-500">
                  Opsional. Upload bukti transfer saat mencatat DP, cicilan, atau pelunasan.
                </p>
                {proofStatusText ? (
                  <p className="text-xs text-slate-500">{proofStatusText}</p>
                ) : null}
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
              {canManageData ? (
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

        <div className="min-w-0 w-full space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <MiniStat
              label="Total pembayaran"
              value={`${vendorProofSummary.total} transaksi`}
              tone="amber"
            />
            <MiniStat
              label="Dengan bukti"
              value={`${vendorProofSummary.withProof} transaksi`}
              tone="emerald"
            />
            <MiniStat
              label="Tanpa bukti"
              value={`${vendorProofSummary.withoutProof} transaksi`}
              tone={vendorProofSummary.withoutProof > 0 ? "rose" : "slate"}
            />
          </div>

          <div className="rounded-2xl border bg-slate-50 p-4">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-700">
                  Filter Pembayaran Vendor
                </p>
                <p className="text-sm text-slate-500">
                  Gunakan filter bukti untuk audit pembayaran vendor yang sudah
                  atau belum memiliki bukti transfer.
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap xl:justify-end">
                <select
                  className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm"
                  value={selectedVendorFilter}
                  onChange={(event) =>
                    setSelectedVendorFilter(event.target.value)
                  }
                >
                  {vendorFilterOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>

                <div className="flex flex-wrap gap-2">
                  {[
                    { value: "all", label: "Semua bukti" },
                    { value: "with-proof", label: "Dengan bukti" },
                    { value: "without-proof", label: "Tanpa bukti" },
                  ].map((filter) => (
                    <button
                      key={filter.value}
                      type="button"
                      onClick={() => setVendorProofFilter(filter.value)}
                      className={tabClass(vendorProofFilter === filter.value)}
                    >
                      {filter.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {filteredVendorPaymentsByProof.length === 0 ? (
            <EmptyState
              text={
                vendorProofFilter === "without-proof"
                  ? "Tidak ada pembayaran vendor tanpa bukti pada filter ini."
                  : vendorProofFilter === "with-proof"
                    ? "Tidak ada pembayaran vendor dengan bukti pada filter ini."
                    : "Belum ada pembayaran vendor pada filter ini."
              }
            />
          ) : (
            <div className="space-y-4">
              {filteredVendorPaymentsByProof.map((item) => {
                const linkedExpense = expenseLookup[String(item.expenseId)];
                const vendorName =
                  linkedExpense?.vendor ||
                  item.vendorSnapshot ||
                  "Belum ditautkan";
                const proofPreviewUrl =
                  vendorProofPreviewUrls[item.id] || item.buktiDataUrl;

                return (
                  <div
                    key={item.id}
                    className="w-full rounded-3xl border bg-white p-5 shadow-sm"
                  >
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div className="min-w-0 flex-1 space-y-3">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-lg font-bold text-slate-900">
                            {vendorName}
                          </h3>
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
                          {renderProofBadge(item)}
                        </div>

                        <p className="text-sm text-slate-500">
                          {linkedExpense?.nama || "Pembayaran manual"} ·{" "}
                          {item.tanggal || "-"} · {item.metode || "-"}
                        </p>

                        <div className="grid w-full gap-4 sm:grid-cols-2 xl:grid-cols-4">
                          <div className="rounded-2xl bg-slate-50 p-4">
                            <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                              Nominal
                            </p>
                            <p className="mt-2 text-xl font-extrabold text-slate-900">
                              {formatRupiah(item.nominal)}
                            </p>
                          </div>

                          <div className="rounded-2xl bg-rose-50 p-4">
                            <p className="text-xs font-bold uppercase tracking-wide text-rose-700">
                              Admin
                            </p>
                            <p className="mt-2 text-xl font-extrabold text-rose-900">
                              {formatRupiah(item.biayaAdmin)}
                            </p>
                          </div>

                          <div className="rounded-2xl bg-slate-50 p-4">
                            <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                              Akun tujuan
                            </p>
                            <p className="mt-2 text-base font-extrabold text-slate-900">
                              {item.akunTujuan || "-"}
                            </p>
                          </div>

                          <div className="rounded-2xl bg-sky-50 p-4">
                            <p className="text-xs font-bold uppercase tracking-wide text-sky-700">
                              Status tagihan
                            </p>
                            <p className="mt-2 text-base font-extrabold text-sky-900">
                              {linkedExpense?.status || "Manual"}
                            </p>
                          </div>
                        </div>

                        {item.catatan ? (
                          <p className="rounded-xl bg-slate-50 p-3 text-sm text-slate-600">
                            {item.catatan}
                          </p>
                        ) : null}

                        {renderProofAction(item, proofPreviewUrl)}
                      </div>

                      {canManageData ? (
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
      {isFinalLocked ? (
        <InlineBanner
          title="Mode Final Aktif"
          text="Data vendor, tagihan, dan pembayaran vendor sedang dikunci. Export dan lihat data tetap bisa digunakan."
          tone="emerald"
        />
      ) : null}
      {canManageData ? vendorGuide : null}

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