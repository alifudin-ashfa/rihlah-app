import React, { useMemo, useState } from "react";
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
  readFileAsDataUrl,
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
import { exportOutstandingParticipantsExcel } from "../../shared/lib/exportExcel";
import { exportOutstandingParticipantsPdf } from "../../shared/lib/exportPdf";

const hasPaymentProof = (payment) =>
  Boolean(payment?.buktiDataUrl || payment?.buktiPath || payment?.buktiUrl);

function formatFileDate() {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export default function SantriPage({ app }) {
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

  const [paymentProofFilter, setPaymentProofFilter] = useState("all");

  const paymentProofSummary = useMemo(() => {
    const rows = Array.isArray(participantPaymentHistory)
      ? participantPaymentHistory
      : [];

    const withProof = rows.filter(hasPaymentProof);
    const withoutProof = rows.filter((payment) => !hasPaymentProof(payment));

    return {
      total: rows.length,
      withProof: withProof.length,
      withoutProof: withoutProof.length,
    };
  }, [participantPaymentHistory]);

  const filteredParticipantPaymentHistory = useMemo(() => {
    const rows = Array.isArray(participantPaymentHistory)
      ? participantPaymentHistory
      : [];

    if (paymentProofFilter === "with-proof") {
      return rows.filter(hasPaymentProof);
    }

    if (paymentProofFilter === "without-proof") {
      return rows.filter((payment) => !hasPaymentProof(payment));
    }

    return rows;
  }, [participantPaymentHistory, paymentProofFilter]);

  const outstandingParticipants = useMemo(
    () =>
      (Array.isArray(participantRows) ? participantRows : [])
        .filter((item) => Number(item.remaining || 0) > 0 || item.status !== "Lunas")
        .sort((a, b) => {
          const remainingA = Number(a.remaining || 0);
          const remainingB = Number(b.remaining || 0);
          if (remainingA !== remainingB) return remainingB - remainingA;
          return String(a.nama || "").localeCompare(String(b.nama || ""));
        }),
    [participantRows]
  );

  const outstandingSummary = useMemo(
    () => ({
      count: outstandingParticipants.length,
      totalTarget: outstandingParticipants.reduce(
        (sum, item) => sum + Number(item.targetIuran || 0),
        0
      ),
      totalPaid: outstandingParticipants.reduce(
        (sum, item) => sum + Number(item.totalPaid || 0),
        0
      ),
      totalRemaining: outstandingParticipants.reduce(
        (sum, item) => sum + Number(item.remaining || 0),
        0
      ),
    }),
    [outstandingParticipants]
  );

  const handleExportOutstandingExcel = () => {
    exportOutstandingParticipantsExcel({
      rows: outstandingParticipants,
      summary: outstandingSummary,
      fileName: `santri-belum-lunas-rihlah-${formatFileDate()}.xlsx`,
    });
  };

  const handleExportOutstandingPdf = () => {
    exportOutstandingParticipantsPdf({
      rows: outstandingParticipants,
      summary: outstandingSummary,
      fileName: `santri-belum-lunas-rihlah-${formatFileDate()}.pdf`,
    });
  };

  const handleParticipantProofUpload = async (event) => {
    const file = event.target.files?.[0];

    if (!file) return;

    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
      "application/pdf",
    ];

    if (!allowedTypes.includes(file.type)) {
      window.alert("Bukti pembayaran harus berupa JPG, PNG, WEBP, atau PDF.");
      event.target.value = "";
      return;
    }

    const maxSizeBytes = 500 * 1024;

    if (file.size > maxSizeBytes) {
      window.alert(
        "Ukuran bukti maksimal 500 KB. Kompres gambar terlebih dahulu sebelum upload."
      );
      event.target.value = "";
      return;
    }

    try {
      const dataUrl = await readFileAsDataUrl(file);

      setParticipantPaymentForm((prev) => ({
        ...prev,
        buktiNama: file.name,
        buktiDataUrl: dataUrl,
      }));
    } catch {
      window.alert("Gagal membaca file bukti pembayaran.");
    }
  };

  const openPaymentProof = (payment) => {
    const dataUrl = payment?.buktiDataUrl;

    if (!dataUrl) {
      window.alert("Bukti pembayaran tidak tersedia.");
      return;
    }

    try {
      if (!dataUrl.startsWith("data:")) {
        window.open(dataUrl, "_blank", "noopener,noreferrer");
        return;
      }

      const [header, base64Data] = dataUrl.split(",");
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

  return (
    <div className="space-y-4 sm:space-y-6">
      <Section id="santri" title="Rekap Santri dan Pembayaran Iuran">
        <div className="space-y-4 sm:space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
            <MiniStat
              label="Total santri"
              value={`${jumlahSantri} santri`}
              tone="sky"
            />
            <MiniStat
              label="Lunas"
              value={`${jumlahLunas} santri`}
              tone="emerald"
            />
            <MiniStat
              label="Cicilan"
              value={`${jumlahCicilan} santri`}
              tone="amber"
            />
            <MiniStat
              label="Belum bayar"
              value={`${jumlahBelumBayar} santri`}
              tone="rose"
            />
            <MiniStat
              label="Iuran masuk"
              value={formatRupiah(totalIuranMasuk)}
              tone="emerald"
            />
            <MiniStat
              label="Tunggakan iuran"
              value={formatRupiah(totalIuranOutstanding)}
              tone={totalIuranOutstanding > 0 ? "amber" : "emerald"}
            />
          </div>

          <div className="rounded-2xl border bg-slate-50 p-4">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">
                  Cari dan Filter Santri
                </h3>
              </div>

              <div className="relative w-full lg:w-80">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  className={`${inputClass} pl-9`}
                  placeholder="Cari Santri"
                  value={participantSearch}
                  onChange={(event) => setParticipantSearch(event.target.value)}
                />
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {["Semua", "Belum Bayar", "Cicilan", "Lunas"].map((status) => (
                <button
                  key={status}
                  onClick={() => setParticipantStatusFilter(status)}
                  className={tabClass(participantStatusFilter === status)}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">
                  Export Santri Belum Lunas
                </h3>
                <p className="mt-1 text-sm leading-6 text-slate-600">
                  Gunakan daftar ini untuk follow-up pembayaran sebelum Rihlah 6–7 Mei 2026.
                </p>
              </div>

              <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap xl:justify-end">
                <button
                  type="button"
                  onClick={handleExportOutstandingExcel}
                  disabled={outstandingParticipants.length === 0}
                  className={buttonOutline}
                >
                  <Download className="mr-2 h-4 w-4" />
                  Export Excel Belum Lunas
                </button>

                <button
                  type="button"
                  onClick={handleExportOutstandingPdf}
                  disabled={outstandingParticipants.length === 0}
                  className={buttonOutline}
                >
                  <Download className="mr-2 h-4 w-4" />
                  Export PDF Belum Lunas
                </button>
              </div>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <MiniStat
                label="Santri belum lunas"
                value={`${outstandingSummary.count} santri`}
                tone={outstandingSummary.count > 0 ? "rose" : "emerald"}
              />
              <MiniStat
                label="Sudah dibayar"
                value={formatRupiah(outstandingSummary.totalPaid)}
                tone="emerald"
              />
              <MiniStat
                label="Sisa tagihan"
                value={formatRupiah(outstandingSummary.totalRemaining)}
                tone={outstandingSummary.totalRemaining > 0 ? "amber" : "emerald"}
              />
            </div>
          </div>

          {canEdit ? (
            <div className="grid gap-4 2xl:grid-cols-2 2xl:gap-6">
              <div className="space-y-4 rounded-2xl border bg-slate-50 p-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900">
                      Tambah / edit santri
                    </h3>
                    <p className="text-sm text-slate-500">
                      Simpan hanya data yang benar-benar penting untuk operasional.
                    </p>
                  </div>

                  <button
                    onClick={() => setShowParticipantAdvanced((prev) => !prev)}
                    className={smallButton}
                  >
                    {showParticipantAdvanced
                      ? "Sembunyikan detail"
                      : "Tampilkan detail"}
                  </button>
                </div>

                <div className="grid gap-3 lg:grid-cols-2">
                  <div className="space-y-2 md:col-span-2">
                    <label className="text-sm font-medium text-slate-700">
                      Nama santri
                    </label>
                    <input
                      className={inputClass}
                      placeholder="Nama santri"
                      value={participantForm.nama}
                      onChange={(event) =>
                        setParticipantForm((prev) => ({
                          ...prev,
                          nama: event.target.value,
                        }))
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">
                      Kelas
                    </label>
                    <input
                      className={inputClass}
                      placeholder="Contoh: 8A"
                      value={participantForm.kelas}
                      onChange={(event) =>
                        setParticipantForm((prev) => ({
                          ...prev,
                          kelas: event.target.value,
                        }))
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">
                      Kamar / kelompok
                    </label>
                    <input
                      className={inputClass}
                      placeholder="Contoh: Kamar 1"
                      value={participantForm.kamar}
                      onChange={(event) =>
                        setParticipantForm((prev) => ({
                          ...prev,
                          kamar: event.target.value,
                        }))
                      }
                    />
                  </div>
                </div>

                {showParticipantAdvanced ? (
                  <div className="grid gap-3">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-700">
                        Target iuran
                      </label>
                      <input
                        className={inputClass}
                        type="number"
                        inputMode="numeric"
                        min="0"
                        placeholder={String(config.iuranDefaultSantri)}
                        aria-describedby="target-iuran-help"
                        value={participantForm.targetIuran}
                        onChange={(event) =>
                          setParticipantForm((prev) => ({
                            ...prev,
                            targetIuran: event.target.value,
                          }))
                        }
                      />
                    </div>

                    <p
                      id="target-iuran-help"
                      className="-mt-2 text-xs text-slate-500"
                    >
                      Kosongkan untuk memakai nominal default. Masukkan angka tanpa titik,
                      contoh: 500000.
                    </p>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-700">
                        Catatan
                      </label>
                      <textarea
                        className={textAreaClass}
                        placeholder="Catatan khusus santri"
                        value={participantForm.catatan}
                        onChange={(event) =>
                          setParticipantForm((prev) => ({
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
                    <>
                      <button onClick={addOrUpdateParticipant} className={buttonPrimary}>
                        <PlusCircle className="mr-2 h-4 w-4" />
                        {editingParticipantId ? "Simpan perubahan" : "Simpan santri"}
                      </button>

                      {editingParticipantId ? (
                        <button onClick={resetParticipantForm} className={buttonOutline}>
                          Batal edit
                        </button>
                      ) : null}
                    </>
                  ) : null}
                </div>
              </div>

              <div className="space-y-4 rounded-2xl border bg-slate-50 p-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900">
                      Catat pembayaran iuran
                    </h3>
                    <p className="text-sm text-slate-500">
                      Pilih santri, isi nominal, lalu simpan. Detail tambahan bersifat
                      opsional.
                    </p>
                  </div>

                  <button
                    onClick={() => setShowPaymentAdvanced((prev) => !prev)}
                    className={smallButton}
                  >
                    {showPaymentAdvanced ? "Sembunyikan detail" : "Tampilkan detail"}
                  </button>
                </div>

                <div className="grid gap-3 lg:grid-cols-2">
                  <div className="space-y-2 md:col-span-2">
                    <label className="text-sm font-medium text-slate-700">
                      Pilih santri
                    </label>
                    <select
                      className={selectClass}
                      value={participantPaymentForm.participantId}
                      onChange={(event) =>
                        setParticipantPaymentForm((prev) => ({
                          ...prev,
                          participantId: event.target.value,
                        }))
                      }
                    >
                      <option value="">Pilih santri</option>
                      {participantRows.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.nama} - {item.kelas || "Tanpa kelas"}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">
                      Tanggal bayar
                    </label>
                    <input
                      className={inputClass}
                      type="date"
                      value={participantPaymentForm.tanggal}
                      onChange={(event) =>
                        setParticipantPaymentForm((prev) => ({
                          ...prev,
                          tanggal: event.target.value,
                        }))
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">
                      Nominal pembayaran
                    </label>
                    <input
                      className={inputClass}
                      type="number"
                      inputMode="numeric"
                      min="0"
                      placeholder="Contoh: 500000"
                      aria-describedby="nominal-iuran-help"
                      value={participantPaymentForm.nominal}
                      onChange={(event) =>
                        setParticipantPaymentForm((prev) => ({
                          ...prev,
                          nominal: event.target.value,
                        }))
                      }
                    />
                    <p id="nominal-iuran-help" className="text-xs text-slate-500">
                      Masukkan angka tanpa titik. Nominal wajib lebih dari 0.
                    </p>
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <label className="text-sm font-medium text-slate-700">
                      Bukti pembayaran
                    </label>
                    <input
                      className={inputClass}
                      type="file"
                      accept="image/jpeg,image/png,image/webp,application/pdf"
                      onChange={handleParticipantProofUpload}
                    />
                    <p className="text-xs text-slate-500">
                      Opsional. Format JPG, PNG, WEBP, atau PDF. Maksimal 500 KB.
                    </p>

                    {participantPaymentForm.buktiNama ? (
                      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
                        <span className="font-semibold">Bukti dipilih:</span>
                        <span>{participantPaymentForm.buktiNama}</span>
                        {participantPaymentForm.buktiDataUrl ? (
                          <button
                            type="button"
                            onClick={() =>
                              openPaymentProof({
                                buktiDataUrl: participantPaymentForm.buktiDataUrl,
                                buktiNama: participantPaymentForm.buktiNama,
                              })
                            }
                            className="font-semibold underline"
                          >
                            Lihat
                          </button>
                        ) : null}
                      </div>
                    ) : null}
                  </div>
                </div>

                {showPaymentAdvanced ? (
                  <div className="grid gap-3 lg:grid-cols-2">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-700">
                        Metode
                      </label>
                      <select
                        className={selectClass}
                        value={participantPaymentForm.metode}
                        onChange={(event) =>
                          setParticipantPaymentForm((prev) => ({
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
                        Akun masuk
                      </label>
                      <input
                        className={inputClass}
                        placeholder={config.akunTujuan || "Kas / Rekening"}
                        value={participantPaymentForm.akunMasuk}
                        onChange={(event) =>
                          setParticipantPaymentForm((prev) => ({
                            ...prev,
                            akunMasuk: event.target.value,
                          }))
                        }
                      />
                    </div>

                    <div className="space-y-2 md:col-span-2">
                      <label className="text-sm font-medium text-slate-700">
                        Catatan transaksi
                      </label>
                      <textarea
                        className={textAreaClass}
                        placeholder="Contoh: Cicilan 1"
                        value={participantPaymentForm.catatan}
                        onChange={(event) =>
                          setParticipantPaymentForm((prev) => ({
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
                    <button onClick={addParticipantPayment} className={buttonPrimary}>
                      <ArrowDownCircle className="mr-2 h-4 w-4" />
                      Simpan pembayaran
                    </button>
                  ) : null}

                  {selectedParticipantForPayment ? (
                    <Pill tone={getParticipantTone(selectedParticipantForPayment.status)}>
                      {selectedParticipantForPayment.nama}: sisa{" "}
                      {formatRupiah(selectedParticipantForPayment.remaining)}
                    </Pill>
                  ) : (
                    <Pill>Pilih santri untuk melihat sisa tagihan</Pill>
                  )}
                </div>
              </div>
            </div>
          ) : null}

          <div className="space-y-3">
            {filteredParticipants.length === 0 ? (
              <EmptyState text="Belum ada data santri yang cocok dengan pencarian." />
            ) : (
              filteredParticipants.map((item) => {
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
                          {item.overpaid > 0 ? (
                            <Pill tone="amber">
                              Lebih bayar {formatRupiah(item.overpaid)}
                            </Pill>
                          ) : null}
                        </div>

                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-sm text-slate-600">
                            <span>Progress iuran</span>
                            <strong>
                              {formatRupiah(item.totalPaid)} /{" "}
                              {formatRupiah(item.targetIuran)}
                            </strong>
                          </div>
                          <ProgressBar value={item.totalPaid} max={item.targetIuran} />
                        </div>

                        <div className="grid gap-2 text-sm text-slate-600 sm:grid-cols-2 2xl:grid-cols-4">
                          <p>
                            Target: <strong>{formatRupiah(item.targetIuran)}</strong>
                          </p>
                          <p>
                            Sudah bayar:{" "}
                            <strong>{formatRupiah(item.totalPaid)}</strong>
                          </p>
                          <p>
                            Sisa: <strong>{formatRupiah(item.remaining)}</strong>
                          </p>
                          <p>
                            Pembayaran terakhir:{" "}
                            <strong>{item.lastPaymentDate || "-"}</strong>
                          </p>
                        </div>

                        {item.catatan ? (
                          <p className="text-sm text-slate-500">{item.catatan}</p>
                        ) : null}

                        {isExpanded ? (
                          <div className="rounded-2xl border bg-slate-50 p-4">
                            <div className="grid gap-4 lg:grid-cols-3">
                              <div className="rounded-2xl border bg-white p-4">
                                <p className="text-sm font-semibold text-slate-900">
                                  Biodata Santri
                                </p>

                                <div className="mt-3 space-y-2 text-sm text-slate-600">
                                  <p>
                                    Nama:{" "}
                                    <strong className="text-slate-900">
                                      {item.nama}
                                    </strong>
                                  </p>
                                  <p>
                                    Kelas:{" "}
                                    <strong className="text-slate-900">
                                      {item.kelas || "Tanpa kelas"}
                                    </strong>
                                  </p>
                                  <p>
                                    Kamar/Kelompok:{" "}
                                    <strong className="text-slate-900">
                                      {item.kamar || "Tanpa kamar"}
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
                                  Ringkasan Iuran
                                </p>

                                <div className="mt-3 space-y-3">
                                  <div>
                                    <div className="flex items-center justify-between text-sm text-slate-600">
                                      <span>Progress</span>
                                      <strong className="text-slate-900">
                                        {formatRupiah(item.totalPaid)} /{" "}
                                        {formatRupiah(item.targetIuran)}
                                      </strong>
                                    </div>
                                    <div className="mt-2">
                                      <ProgressBar
                                        value={item.totalPaid}
                                        max={item.targetIuran}
                                      />
                                    </div>
                                  </div>

                                  <div className="grid gap-2 text-sm">
                                    <div className="rounded-xl bg-slate-50 p-3">
                                      <p className="text-slate-500">Target iuran</p>
                                      <p className="font-bold text-slate-900">
                                        {formatRupiah(item.targetIuran)}
                                      </p>
                                    </div>

                                    <div className="rounded-xl bg-emerald-50 p-3">
                                      <p className="text-emerald-700">Sudah bayar</p>
                                      <p className="font-bold text-emerald-900">
                                        {formatRupiah(item.totalPaid)}
                                      </p>
                                    </div>

                                    <div className="rounded-xl bg-amber-50 p-3">
                                      <p className="text-amber-700">Sisa</p>
                                      <p className="font-bold text-amber-900">
                                        {formatRupiah(item.remaining)}
                                      </p>
                                    </div>
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
                                        onClick={() =>
                                          focusParticipantPaymentForm(item.id)
                                        }
                                        className={buttonPrimary}
                                      >
                                        Catat pembayaran
                                      </button>
                                      <button
                                        onClick={() => editParticipant(item)}
                                        className={buttonOutline}
                                      >
                                        Edit data santri
                                      </button>
                                    </>
                                  ) : (
                                    <p className="rounded-xl bg-slate-50 p-3 text-sm text-slate-500">
                                      Mode pelihat hanya dapat melihat detail data.
                                    </p>
                                  )}
                                </div>
                              </div>
                            </div>

                            <div className="mt-4 rounded-2xl border bg-white p-4">
                              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                                <div>
                                  <p className="text-sm font-semibold text-slate-900">
                                    Riwayat Pembayaran
                                  </p>
                                  <p className="text-xs text-slate-500">
                                    Menampilkan seluruh transaksi pembayaran santri ini.
                                  </p>
                                </div>
                                <Pill tone={getParticipantTone(item.status)}>
                                  {item.status}
                                </Pill>
                              </div>

                              <div className="mt-4 space-y-2">
                                {item.payments.length === 0 ? (
                                  <p className="rounded-xl border border-dashed bg-slate-50 p-4 text-sm text-slate-500">
                                    Belum ada transaksi pembayaran.
                                  </p>
                                ) : (
                                  item.payments.map((payment) => {
                                    const proofExists = hasPaymentProof(payment);

                                    return (
                                      <div
                                        key={payment.id}
                                        className="flex flex-col gap-3 rounded-xl border bg-slate-50 p-3 lg:flex-row lg:items-center lg:justify-between"
                                      >
                                        <div>
                                          <div className="flex flex-wrap items-center gap-2">
                                            <p className="text-sm font-semibold text-slate-900">
                                              {formatRupiah(payment.nominal)}
                                            </p>
                                            <Pill tone={proofExists ? "emerald" : "rose"}>
                                              {proofExists ? "Dengan bukti" : "Tanpa bukti"}
                                            </Pill>
                                          </div>

                                          <p className="mt-1 text-sm text-slate-500">
                                            {payment.tanggal || "-"} ·{" "}
                                            {payment.metode || "-"} ·{" "}
                                            {payment.akunMasuk || "Akun belum diisi"}
                                          </p>

                                          {payment.catatan ? (
                                            <p className="mt-1 text-xs text-slate-500">
                                              {payment.catatan}
                                            </p>
                                          ) : null}

                                          {proofExists ? (
                                            <button
                                              type="button"
                                              onClick={() => openPaymentProof(payment)}
                                              className="mt-2 inline-flex rounded-lg border border-sky-200 bg-white px-3 py-1.5 text-xs font-semibold text-sky-700 hover:bg-sky-50"
                                            >
                                              Lihat bukti{" "}
                                              {payment.buktiNama
                                                ? `(${payment.buktiNama})`
                                                : ""}
                                            </button>
                                          ) : (
                                            <p className="mt-2 text-xs text-slate-400">
                                              Belum ada bukti pembayaran.
                                            </p>
                                          )}
                                        </div>

                                        {canEdit ? (
                                          <button
                                            onClick={() =>
                                              removeParticipantPayment(
                                                item.id,
                                                payment.id
                                              )
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
                            setExpandedParticipants((prev) => ({
                              ...prev,
                              [item.id]: !prev[item.id],
                            }))
                          }
                          className={smallButton}
                        >
                          {isExpanded ? "Tutup detail" : "Detail"}
                        </button>

                        {canEdit ? (
                          <button
                            onClick={() => removeParticipant(item.id)}
                            className={smallButton}
                          >
                            <Trash2 className="mr-1 h-3.5 w-3.5" />
                            Hapus
                          </button>
                        ) : null}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </Section>

      <Section
        title="Histori pembayaran iuran"
        subtitle="Tampilan audit cepat untuk seluruh transaksi pembayaran santri."
      >
        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-3">
            <MiniStat
              label="Total transaksi histori"
              value={`${paymentProofSummary.total} transaksi`}
              tone="sky"
            />
            <MiniStat
              label="Dengan bukti"
              value={`${paymentProofSummary.withProof} transaksi`}
              tone="emerald"
            />
            <MiniStat
              label="Tanpa bukti"
              value={`${paymentProofSummary.withoutProof} transaksi`}
              tone={paymentProofSummary.withoutProof > 0 ? "rose" : "slate"}
            />
          </div>

          <div className="rounded-2xl border bg-slate-50 p-4">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-700">
                  Filter histori pembayaran
                </p>
                <p className="text-sm text-slate-500">
                  Gunakan filter ini untuk audit transaksi yang sudah atau belum
                  memiliki bukti pembayaran.
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap xl:justify-end">
                <select
                  className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm"
                  value={selectedPaymentParticipant}
                  onChange={(event) =>
                    setSelectedPaymentParticipant(event.target.value)
                  }
                >
                  <option value="all">Semua santri</option>
                  {participantRows.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.nama}
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
                      onClick={() => setPaymentProofFilter(filter.value)}
                      className={tabClass(paymentProofFilter === filter.value)}
                    >
                      {filter.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {filteredParticipantPaymentHistory.length === 0 ? (
            <EmptyState
              text={
                paymentProofFilter === "without-proof"
                  ? "Tidak ada transaksi iuran tanpa bukti pada filter ini."
                  : paymentProofFilter === "with-proof"
                    ? "Tidak ada transaksi iuran dengan bukti pada filter ini."
                    : "Belum ada transaksi pembayaran iuran."
              }
            />
          ) : (
            <div className="space-y-3">
              {filteredParticipantPaymentHistory.map((payment) => {
                const proofExists = hasPaymentProof(payment);

                return (
                  <div key={payment.id} className="rounded-2xl border bg-white p-4">
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-semibold text-slate-900">
                            {payment.participantName}
                          </p>

                          <Pill tone={proofExists ? "emerald" : "rose"}>
                            {proofExists ? "Dengan bukti" : "Tanpa bukti"}
                          </Pill>
                        </div>

                        <p className="mt-1 text-sm text-slate-500">
                          {payment.participantClass || "Tanpa kelas"} ·{" "}
                          {payment.tanggal || "-"} · {payment.metode || "-"}
                        </p>

                        {payment.catatan ? (
                          <p className="mt-1 text-xs text-slate-500">
                            {payment.catatan}
                          </p>
                        ) : null}

                        {proofExists ? (
                          <button
                            type="button"
                            onClick={() => openPaymentProof(payment)}
                            className="mt-2 inline-flex rounded-lg border border-sky-200 px-3 py-1.5 text-xs font-semibold text-sky-700 hover:bg-sky-50"
                          >
                            Lihat bukti{" "}
                            {payment.buktiNama ? `(${payment.buktiNama})` : ""}
                          </button>
                        ) : (
                          <p className="mt-2 text-xs text-slate-400">
                            Belum ada bukti pembayaran.
                          </p>
                        )}
                      </div>

                      <p className="text-lg font-bold text-slate-900">
                        {formatRupiah(payment.nominal)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </Section>
    </div>
  );
}