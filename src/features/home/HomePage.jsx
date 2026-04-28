import React from "react";
import { NavLink } from "react-router-dom";
import {
  ArrowDownCircle,
  AlertTriangle,
  Users,
  Landmark,
  Receipt,
  Wallet,
  Download,
  RotateCcw,
  TrendingUp,
  CheckCircle2,
  ClipboardList,
  FileText,
  Database,
} from "lucide-react";
import {
  buttonPrimary,
  buttonOutline,
  smallButton,
  formatRupiah,
  Section,
  StatCard,
  MiniStat,
  InlineBanner,
  ProgressBar,
} from "../../shared/lib/rihlahCore";

function safePercent(value, max) {
  const current = Number(value) || 0;
  const total = Number(max) || 0;

  if (total <= 0) return 0;

  return Math.min(100, Math.max(0, Math.round((current / total) * 100)));
}

function DashboardMetric({ label, value, helper, tone = "slate" }) {
  const toneMap = {
    slate: "border-white/15 bg-white/10 text-white",
    emerald: "border-emerald-300/30 bg-emerald-400/15 text-white",
    amber: "border-amber-300/30 bg-amber-400/15 text-white",
    rose: "border-rose-300/30 bg-rose-400/15 text-white",
    sky: "border-sky-300/30 bg-sky-400/15 text-white",
  };

  return (
    <div
      className={`min-w-0 rounded-2xl border p-4 backdrop-blur-sm ${
        toneMap[tone] || toneMap.slate
      }`}
    >
      <p className="text-sm font-semibold text-sky-100">{label}</p>
      <p className="mt-2 break-words text-[clamp(1.25rem,1.8vw,2rem)] font-extrabold leading-tight tracking-tight tabular-nums">
        {value}
      </p>
      {helper ? <p className="mt-2 text-xs leading-5 text-sky-100">{helper}</p> : null}
    </div>
  );
}

function QuickActionCard({ to, icon, title, description, tone = "slate" }) {
  const toneMap = {
    slate: "bg-slate-50 text-slate-700",
    sky: "bg-sky-50 text-sky-700",
    emerald: "bg-emerald-50 text-emerald-700",
    amber: "bg-amber-50 text-amber-700",
    rose: "bg-rose-50 text-rose-700",
    violet: "bg-violet-50 text-violet-700",
  };

  return (
    <NavLink
      to={to}
      className="group rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-sky-200 hover:shadow-md"
    >
      <div className="flex items-start gap-3">
        <div
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${
            toneMap[tone] || toneMap.slate
          }`}
        >
          {icon}
        </div>
        <div className="min-w-0">
          <p className="font-bold text-slate-900 group-hover:text-sky-700">
            {title}
          </p>
          <p className="mt-1 text-sm leading-6 text-slate-500">{description}</p>
        </div>
      </div>
    </NavLink>
  );
}

function ProgressPanel({
  title,
  subtitle,
  value,
  max,
  percentLabel,
  leftLabel,
  rightLabel,
  tone = "sky",
}) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-lg font-bold text-slate-900">{title}</p>
          <p className="mt-1 text-sm leading-6 text-slate-500">{subtitle}</p>
        </div>
        <div className="rounded-2xl bg-slate-50 px-3 py-2 text-right">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Progress
          </p>
          <p className="font-extrabold text-slate-900">{percentLabel}</p>
        </div>
      </div>

      <div className="mt-5">
        <ProgressBar value={value} max={max} />
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div className="rounded-2xl bg-slate-50 p-4">
          <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
            {leftLabel}
          </p>
          <p className="mt-2 text-xl font-extrabold text-slate-900">
            {formatRupiah(value)}
          </p>
        </div>
        <div
          className={`rounded-2xl p-4 ${
            tone === "emerald"
              ? "bg-emerald-50"
              : tone === "rose"
                ? "bg-rose-50"
                : tone === "amber"
                  ? "bg-amber-50"
                  : "bg-sky-50"
          }`}
        >
          <p
            className={`text-xs font-bold uppercase tracking-wide ${
              tone === "emerald"
                ? "text-emerald-700"
                : tone === "rose"
                  ? "text-rose-700"
                  : tone === "amber"
                    ? "text-amber-700"
                    : "text-sky-700"
            }`}
          >
            {rightLabel}
          </p>
          <p className="mt-2 text-xl font-extrabold text-slate-900">
            {formatRupiah(max)}
          </p>
        </div>
      </div>
    </div>
  );
}

export default function HomePage({ app }) {
  const {
    config,
    canEdit,
    otherIncomes,
    expenseRows,
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
    totalVendorUnlinked,
    saldoKasSaatIni,
    proyeksiSaldoAkhir,
    jumlahSantri,
    jumlahLunas,
    jumlahCicilan,
    jumlahBelumBayar,
    warnings,
    financeHealth,
    exportBackup,
    importBackup,
    exportCsvReport,
    loadSampleData,
    resetAllData,
    homeUtilitiesOpen,
    setHomeUtilitiesOpen,
    importInputRef,
  } = app;

  const iuranPercent = safePercent(totalIuranMasuk, totalIuranTarget);
  const vendorPercent = safePercent(totalLinkedVendorPaid, totalTagihan);
  const isDeficit = proyeksiSaldoAkhir < 0;
  const activeWarnings = Array.isArray(warnings) ? warnings : [];

  return (
    <div className="space-y-5 sm:space-y-6">
      <div className="overflow-hidden rounded-[2rem] border border-slate-200 bg-gradient-to-br from-sky-600 via-sky-700 to-slate-950 p-4 text-white shadow-xl sm:p-6 lg:p-8">
        <div className="grid gap-6 2xl:grid-cols-[minmax(0,1.15fr)_minmax(360px,0.85fr)] 2xl:items-start">
          <div className="min-w-0">
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-sky-100 sm:text-sm">
              {canEdit ? "Dashboard Bendahara" : "Dashboard Keuangan"}
            </p>

            <h1 className="mt-3 max-w-5xl text-3xl font-extrabold tracking-tight sm:text-4xl lg:text-5xl">
              {config.namaKegiatan}
            </h1>

            <p className="mt-4 max-w-3xl text-sm leading-7 text-sky-50 md:text-base">
              Pantau saldo kas, iuran santri, tagihan vendor, dan prioritas
              operasional dari satu halaman ringkasan.
            </p>

            <div className="mt-7 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <DashboardMetric
                label="Saldo kas saat ini"
                value={formatRupiah(saldoKasSaatIni)}
                helper="Pemasukan dikurangi arus keluar"
                tone={saldoKasSaatIni >= 0 ? "emerald" : "rose"}
              />

              <DashboardMetric
                label="Total pemasukan"
                value={formatRupiah(totalPemasukan)}
                helper="Iuran santri + pemasukan lain"
                tone="sky"
              />

              <DashboardMetric
                label="Arus keluar vendor"
                value={formatRupiah(totalArusKeluarVendor)}
                helper={`Termasuk admin ${formatRupiah(totalVendorAdmin)}`}
                tone="amber"
              />

              <DashboardMetric
                label="Proyeksi saldo akhir"
                value={formatRupiah(proyeksiSaldoAkhir)}
                helper={
                  isDeficit
                    ? "Perlu perhatian karena proyeksi defisit"
                    : "Masih positif berdasarkan data saat ini"
                }
                tone={isDeficit ? "rose" : "emerald"}
              />
            </div>
          </div>

          <div className="rounded-[2rem] bg-white p-5 text-slate-900 shadow-2xl 2xl:sticky 2xl:top-28">
            <div className="flex items-start gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-sky-50 text-sky-700">
                <TrendingUp className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-500">
                  Status keuangan hari ini
                </p>
                <p className="mt-1 text-2xl font-extrabold text-slate-900">
                  {financeHealth.title}
                </p>
              </div>
            </div>

            <p className="mt-4 text-sm leading-7 text-slate-600">
              {financeHealth.text}
            </p>

            <div className="mt-5 grid gap-3">
              <div className="rounded-2xl bg-slate-50 p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold text-slate-600">
                    Progress iuran
                  </p>
                  <p className="font-bold text-slate-900">{iuranPercent}%</p>
                </div>
                <div className="mt-3">
                  <ProgressBar value={totalIuranMasuk} max={totalIuranTarget} />
                </div>
              </div>

              <div className="rounded-2xl bg-slate-50 p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold text-slate-600">
                    Progress vendor
                  </p>
                  <p className="font-bold text-slate-900">{vendorPercent}%</p>
                </div>
                <div className="mt-3">
                  <ProgressBar value={totalLinkedVendorPaid} max={totalTagihan} />
                </div>
              </div>
            </div>

            <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <NavLink to="/santri" className={buttonPrimary}>
                <Users className="mr-2 h-4 w-4" />
                {canEdit ? "Catat Iuran" : "Lihat Santri"}
              </NavLink>
              <NavLink to="/vendor" className={buttonOutline}>
                <Wallet className="mr-2 h-4 w-4" />
                {canEdit ? "Kelola Vendor" : "Lihat Vendor"}
              </NavLink>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(360px,0.55fr)]">
        <Section
          title="Perlu Perhatian"
          subtitle="Daftar prioritas yang perlu dipantau agar operasional tetap aman."
        >
          <div className="space-y-3">
            {activeWarnings.length === 0 ? (
              <InlineBanner
                title="Semua aman"
                text="Saat ini tidak ada isu utama yang perlu ditindaklanjuti."
                tone="emerald"
              />
            ) : (
              activeWarnings.slice(0, 5).map((warning, index) => (
                <InlineBanner
                  key={`${warning}-${index}`}
                  title={`Prioritas ${index + 1}`}
                  text={warning}
                  tone={index === 0 ? financeHealth.tone : "amber"}
                />
              ))
            )}
          </div>
        </Section>

        <Section
          title="Aksi Cepat"
          subtitle="Shortcut untuk pekerjaan yang paling sering dilakukan."
        >
          <div className="grid gap-3">
            <QuickActionCard
              to="/santri"
              icon={<Users className="h-5 w-5" />}
              title={canEdit ? "Tambah santri / iuran" : "Lihat santri / iuran"}
              description={
                canEdit
                  ? "Lengkapi biodata, cari santri, dan catat pembayaran."
                  : "Lihat biodata, status, dan histori pembayaran santri."
              }
              tone="sky"
            />

            <QuickActionCard
              to="/vendor"
              icon={<Receipt className="h-5 w-5" />}
              title={canEdit ? "Kelola tagihan vendor" : "Lihat tagihan vendor"}
              description={
                canEdit
                  ? "Masukkan anggaran, DP, pelunasan, dan bukti transfer."
                  : "Lihat tagihan, pembayaran, dan bukti transfer vendor."
              }
              tone="amber"
            />

            <QuickActionCard
              to="/buku-kas"
              icon={<ClipboardList className="h-5 w-5" />}
              title="Buka Buku Kas"
              description="Lihat semua transaksi masuk dan keluar dalam satu tabel."
              tone="emerald"
            />

            <QuickActionCard
              to="/laporan"
              icon={<FileText className="h-5 w-5" />}
              title="Lihat Laporan"
              description="Baca ringkasan pimpinan, audit, dan ekspor data."
              tone="violet"
            />
          </div>
        </Section>
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <ProgressPanel
          title="Progress Iuran Santri"
          subtitle={`${jumlahSantri} santri terdaftar · ${jumlahLunas} lunas · ${jumlahCicilan} cicilan · ${jumlahBelumBayar} belum bayar`}
          value={totalIuranMasuk}
          max={totalIuranTarget}
          percentLabel={`${iuranPercent}%`}
          leftLabel="Iuran masuk"
          rightLabel="Target iuran"
          tone={totalIuranOutstanding > 0 ? "amber" : "emerald"}
        />

        <ProgressPanel
          title="Progress Pembayaran Vendor"
          subtitle={`${expenseRows.length} tagihan vendor tercatat · sisa tagihan ${formatRupiah(totalVendorOutstanding)}`}
          value={totalLinkedVendorPaid}
          max={totalTagihan}
          percentLabel={`${vendorPercent}%`}
          leftLabel="Sudah dibayar"
          rightLabel="Total tagihan"
          tone={totalVendorOutstanding > 0 ? "rose" : "emerald"}
        />
      </div>

      <Section
        title="Ringkasan Operasional"
        subtitle="Angka kunci untuk memantau kondisi kegiatan."
      >
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <StatCard
            icon={<Users className="h-5 w-5 text-sky-700" />}
            label="Santri terdaftar"
            value={`${jumlahSantri} santri`}
            tone="bg-sky-100"
            helper={`${jumlahBelumBayar} belum bayar, ${jumlahCicilan} cicilan`}
          />

          <StatCard
            icon={<ArrowDownCircle className="h-5 w-5 text-emerald-700" />}
            label="Iuran sudah masuk"
            value={formatRupiah(totalIuranMasuk)}
            tone="bg-emerald-100"
            helper={`${jumlahLunas} santri sudah lunas`}
          />

          <StatCard
            icon={<Receipt className="h-5 w-5 text-amber-700" />}
            label="Total tagihan vendor"
            value={formatRupiah(totalTagihan)}
            tone="bg-amber-100"
            helper={`${expenseRows.length} tagihan tercatat`}
          />

          <StatCard
            icon={<Wallet className="h-5 w-5 text-rose-700" />}
            label="Arus keluar vendor"
            value={formatRupiah(totalArusKeluarVendor)}
            tone="bg-rose-100"
            helper={`Termasuk admin ${formatRupiah(totalVendorAdmin)}`}
          />

          <StatCard
            icon={<Landmark className="h-5 w-5 text-violet-700" />}
            label="Pemasukan lain"
            value={formatRupiah(totalOtherIncome)}
            tone="bg-violet-100"
            helper={`${otherIncomes.length} transaksi lain`}
          />

          <StatCard
            icon={<AlertTriangle className="h-5 w-5 text-slate-700" />}
            label="Pembayaran belum tertaut"
            value={formatRupiah(totalVendorUnlinked)}
            tone="bg-slate-100"
            helper="Tautkan agar laporan vendor tetap akurat"
          />
        </div>
      </Section>

      <Section
        title="Status Santri dan Vendor"
        subtitle="Ringkasan cepat untuk melihat kondisi administrasi."
      >
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-lg font-bold text-slate-900">
                  Status Iuran Santri
                </p>
                <p className="mt-1 text-sm text-slate-500">
                  Komposisi pembayaran iuran berdasarkan status.
                </p>
              </div>
              <div className="rounded-2xl bg-sky-50 p-3 text-sky-700">
                <Users className="h-5 w-5" />
              </div>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              <MiniStat
                label="Lunas"
                value={`${jumlahLunas}`}
                tone="emerald"
              />
              <MiniStat
                label="Cicilan"
                value={`${jumlahCicilan}`}
                tone="amber"
              />
              <MiniStat
                label="Belum bayar"
                value={`${jumlahBelumBayar}`}
                tone="rose"
              />
            </div>

            <div className="mt-5 rounded-2xl bg-slate-50 p-4">
              <p className="text-sm font-semibold text-slate-600">
                Tunggakan iuran
              </p>
              <p className="mt-2 text-2xl font-extrabold text-slate-900">
                {formatRupiah(totalIuranOutstanding)}
              </p>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-lg font-bold text-slate-900">
                  Status Tagihan Vendor
                </p>
                <p className="mt-1 text-sm text-slate-500">
                  Komposisi tagihan dan pembayaran vendor.
                </p>
              </div>
              <div className="rounded-2xl bg-amber-50 p-3 text-amber-700">
                <Receipt className="h-5 w-5" />
              </div>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-3">
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
                label="Sisa"
                value={formatRupiah(totalVendorOutstanding)}
                tone={totalVendorOutstanding > 0 ? "rose" : "emerald"}
              />
            </div>

            <div className="mt-5 rounded-2xl bg-slate-50 p-4">
              <p className="text-sm font-semibold text-slate-600">
                Pembayaran belum tertaut
              </p>
              <p className="mt-2 text-2xl font-extrabold text-slate-900">
                {formatRupiah(totalVendorUnlinked)}
              </p>
            </div>
          </div>
        </div>
      </Section>

      <Section
        title="Utilitas Sistem"
        subtitle={
          canEdit
            ? "Simpan cadangan data dan kelola file laporan."
            : "Utilitas hanya tersedia untuk admin/bendahara."
        }
      >
        <div className="space-y-4">
          {canEdit ? (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <button onClick={exportCsvReport} className={buttonOutline}>
                <Download className="mr-2 h-4 w-4" />
                Export CSV
              </button>

              <button onClick={exportBackup} className={buttonOutline}>
                <Database className="mr-2 h-4 w-4" />
                Backup JSON
              </button>

              <button
                onClick={() => importInputRef.current?.click()}
                className={buttonOutline}
              >
                Import JSON
              </button>

              <NavLink to="/laporan" className={buttonOutline}>
                <FileText className="mr-2 h-4 w-4" />
                Buka Laporan
              </NavLink>
            </div>
          ) : (
            <InlineBanner
              title="Mode pelihat"
              text="Backup, import, reset, dan ekspor hanya tersedia setelah login sebagai admin/bendahara."
              tone="sky"
            />
          )}

          <input
            ref={importInputRef}
            type="file"
            accept="application/json"
            className="hidden"
            onChange={importBackup}
          />

          {canEdit ? (
            <button
              onClick={() => setHomeUtilitiesOpen((prev) => !prev)}
              className={smallButton}
            >
              {homeUtilitiesOpen
                ? "Sembunyikan utilitas lanjutan"
                : "Tampilkan utilitas lanjutan"}
            </button>
          ) : null}

          {canEdit && homeUtilitiesOpen ? (
            <div className="grid gap-3 lg:grid-cols-2">
              <button onClick={loadSampleData} className={buttonOutline}>
                <CheckCircle2 className="mr-2 h-4 w-4" />
                Muat Data Contoh
              </button>

              <button
                onClick={resetAllData}
                className="inline-flex items-center justify-center rounded-xl border border-rose-300 bg-rose-50 px-4 py-2 text-sm font-medium text-rose-700 hover:bg-rose-100"
              >
                <RotateCcw className="mr-2 h-4 w-4" />
                Reset Data
              </button>
            </div>
          ) : null}
        </div>
      </Section>
    </div>
  );
}