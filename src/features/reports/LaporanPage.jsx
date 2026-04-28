import React, { useMemo } from "react";
import { Download, AlertTriangle, Users, Wallet, FileText } from "lucide-react";
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

export default function LaporanPage({ app }) {
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

  return (
    <div className="space-y-4 sm:space-y-6">
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

      {laporanView === "ringkasan" || laporanView === "operasional" ? (
        <Section id="laporan" title="Laporan dan Narasi Otomatis">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
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

          <div className="mt-6 grid gap-4 2xl:grid-cols-2">
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
        </Section>
      ) : null}

      {canEdit && (laporanView === "operasional" || laporanView === "audit") ? (
        <Section
          title="Audit data dan tindak lanjut"
          subtitle="Pisahkan review audit dari ringkasan agar lebih mudah dibaca saat rapat atau pengecekan internal."
        >
          <div className="grid gap-4 2xl:grid-cols-2 2xl:gap-6">
            <div className="space-y-3">
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

            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-slate-900">
                Aksi laporan
              </h3>

              <div className="rounded-2xl border bg-slate-50 p-4">
                {canEdit ? (
                  <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
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

              <div className="rounded-2xl border bg-slate-50 p-4">
                <p className="text-sm font-semibold text-slate-700">
                  Ringkasan audit cepat
                </p>

                <div className="mt-3 grid gap-3 lg:grid-cols-2">
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

      {canEdit && laporanView === "audit" ? (
        <Section
          title="Audit Bukti Pembayaran"
          subtitle="Daftar transaksi yang belum memiliki bukti pembayaran, baik dari iuran santri maupun pembayaran vendor."
        >
          <div className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
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

            <div className="grid gap-5 2xl:grid-cols-2">
              <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
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

                <div className="mt-5 space-y-3">
                  {participantWithoutProof.length === 0 ? (
                    <EmptyState text="Semua transaksi iuran sudah memiliki bukti." />
                  ) : (
                    participantWithoutProof.map((payment) => (
                      <div
                        key={payment.id}
                        className="rounded-2xl border bg-slate-50 p-4"
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

              <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
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

                <div className="mt-5 space-y-3">
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
                          className="rounded-2xl border bg-slate-50 p-4"
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

                              <div className="mt-2 grid gap-2 text-sm text-slate-600 sm:grid-cols-2">
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

            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
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