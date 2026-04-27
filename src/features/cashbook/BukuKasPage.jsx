import { useMemo, useState } from "react";
import {
  buildCashbookRows,
  buildCashbookSummary,
} from "../../shared/lib/cashbookBuilder";
import { formatRupiah } from "../../shared/lib/rihlahCore";
import { exportCashbookExcel } from "../../shared/lib/exportExcel";
import { exportCashbookPdf } from "../../shared/lib/exportPdf";

function formatDate(value) {
  if (!value) return "-";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function SummaryCard({ label, value, helper, tone = "slate" }) {
  const toneClass = {
    emerald: "border-emerald-200 bg-emerald-50 text-emerald-900",
    rose: "border-rose-200 bg-rose-50 text-rose-900",
    sky: "border-sky-200 bg-sky-50 text-sky-900",
    slate: "border-slate-200 bg-white text-slate-900",
  }[tone];

  return (
    <div className={`rounded-2xl border p-4 shadow-sm ${toneClass}`}>
      <p className="text-xs font-semibold uppercase tracking-wide opacity-70">
        {label}
      </p>
      <p className="mt-2 text-xl font-bold">{value}</p>
      {helper ? <p className="mt-1 text-xs opacity-70">{helper}</p> : null}
    </div>
  );
}

export default function BukuKasPage({ app }) {
  const {
    participants = [],
    expenses = [],
    vendorPayments = [],
    otherIncomes = [],
    isViewerMode = false,
  } = app || {};

  const [filters, setFilters] = useState({
    startDate: "",
    endDate: "",
    type: "all",
    search: "",
  });

  const rows = useMemo(
    () =>
      buildCashbookRows({
        participants,
        expenses,
        vendorPayments,
        otherIncomes,
        filters,
      }),
    [
      participants,
      expenses,
      vendorPayments,
      otherIncomes,
      filters,
    ]
  );

  const summary = useMemo(() => buildCashbookSummary(rows), [rows]);

  const resetFilters = () => {
  setFilters({
    startDate: "",
    endDate: "",
    type: "all",
    search: "",
  });
};

const handleExportExcel = () => {
  exportCashbookExcel({
    rows,
    summary,
    filters,
    fileName: "buku-kas-rihlah.xlsx",
  });
};

const handleExportPdf = () => {
  exportCashbookPdf({
    rows,
    summary,
    filters,
    fileName: "buku-kas-rihlah.pdf",
  });
};

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
      <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-sm font-semibold text-sky-700">Keuangan</p>
            <h1 className="mt-1 text-2xl font-bold text-slate-950">
              Buku Kas
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-slate-600">
              Ringkasan semua uang masuk dan keluar dari iuran santri,
              pemasukan lain, dan pembayaran vendor.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
            Mode:{" "}
            <span className="font-semibold text-slate-900">
                {isViewerMode ? "Pelihat / Read-only" : "Pengelola"}
            </span>
          </div>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <SummaryCard
          label="Total Masuk"
          value={formatRupiah(summary.totalIncome)}
          helper="Iuran santri + pemasukan lain"
          tone="emerald"
        />
        <SummaryCard
          label="Total Keluar"
          value={formatRupiah(summary.totalExpense)}
          helper="Pembayaran vendor"
          tone="rose"
        />
        <SummaryCard
          label="Saldo"
          value={formatRupiah(summary.balance)}
          helper="Total masuk dikurangi total keluar"
          tone={summary.balance >= 0 ? "sky" : "rose"}
        />
        <SummaryCard
          label="Transaksi"
          value={`${summary.transactionCount} transaksi`}
          helper="Sesuai filter aktif"
          tone="slate"
        />
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="grid gap-3 md:grid-cols-5">
          <label className="space-y-1">
            <span className="text-xs font-semibold text-slate-600">
              Dari tanggal
            </span>
            <input
              type="date"
              value={filters.startDate}
              onChange={(event) =>
                setFilters((current) => ({
                  ...current,
                  startDate: event.target.value,
                }))
              }
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
            />
          </label>

          <label className="space-y-1">
            <span className="text-xs font-semibold text-slate-600">
              Sampai tanggal
            </span>
            <input
              type="date"
              value={filters.endDate}
              onChange={(event) =>
                setFilters((current) => ({
                  ...current,
                  endDate: event.target.value,
                }))
              }
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
            />
          </label>

          <label className="space-y-1">
            <span className="text-xs font-semibold text-slate-600">
              Tipe
            </span>
            <select
              value={filters.type}
              onChange={(event) =>
                setFilters((current) => ({
                  ...current,
                  type: event.target.value,
                }))
              }
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
            >
              <option value="all">Semua</option>
              <option value="income">Masuk</option>
              <option value="expense">Keluar</option>
            </select>
          </label>

          <label className="space-y-1 md:col-span-2">
            <span className="text-xs font-semibold text-slate-600">
              Cari transaksi
            </span>
            <input
              type="search"
              value={filters.search}
              onChange={(event) =>
                setFilters((current) => ({
                  ...current,
                  search: event.target.value,
                }))
              }
              placeholder="Cari santri, vendor, kategori, atau catatan"
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
            />
          </label>
        </div>

        <div className="mt-3 flex flex-wrap justify-end gap-2">
            <button
                type="button"
                onClick={resetFilters}
                className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50"
            >
                Reset filter
            </button>

            <button
                type="button"
                onClick={handleExportExcel}
                disabled={rows.length === 0}
                className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
                Download Excel
            </button>

            <button
                type="button"
                onClick={handleExportPdf}
                disabled={rows.length === 0}
                className="rounded-xl bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
                Download PDF
            </button>
        </div>
      </div>

      {rows.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-8 text-center shadow-sm">
          <p className="text-lg font-bold text-slate-900">
            Belum ada transaksi kas
          </p>
          <p className="mt-2 text-sm text-slate-600">
            Transaksi akan muncul otomatis dari pembayaran iuran, pemasukan
            lain, dan pembayaran vendor.
          </p>
        </div>
      ) : (
        <>
          <div className="hidden overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm lg:block">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3">Tanggal</th>
                  <th className="px-4 py-3">Tipe</th>
                  <th className="px-4 py-3">Kategori</th>
                  <th className="px-4 py-3">Deskripsi</th>
                  <th className="px-4 py-3 text-right">Masuk</th>
                  <th className="px-4 py-3 text-right">Keluar</th>
                  <th className="px-4 py-3 text-right">Saldo</th>
                  <th className="px-4 py-3">Bukti</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.map((row) => (
                  <tr key={row.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 text-slate-600">
                      {formatDate(row.date)}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                          row.type === "income"
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-rose-50 text-rose-700"
                        }`}
                      >
                        {row.type === "income" ? "Masuk" : "Keluar"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-700">
                      {row.category}
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-semibold text-slate-900">
                        {row.description}
                      </p>
                      {row.note ? (
                        <p className="mt-1 text-xs text-slate-500">
                          {row.note}
                        </p>
                      ) : null}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-emerald-700">
                      {row.income ? formatRupiah(row.income) : "-"}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-rose-700">
                      {row.expense ? formatRupiah(row.expense) : "-"}
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-slate-900">
                      {formatRupiah(row.runningBalance)}
                    </td>
                    <td className="px-4 py-3">
                      {row.proofUrl ? (
                        <a
                          href={row.proofUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="font-semibold text-sky-700 hover:text-sky-900"
                        >
                          Lihat
                        </a>
                      ) : (
                        <span className="text-xs text-slate-400">
                          Belum ada
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="grid gap-3 lg:hidden">
            {rows.map((row) => (
              <article
                key={row.id}
                className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                        row.type === "income"
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-rose-50 text-rose-700"
                      }`}
                    >
                      {row.type === "income" ? "Masuk" : "Keluar"} ·{" "}
                      {row.category}
                    </span>
                    <h3 className="mt-3 font-bold text-slate-900">
                      {row.description}
                    </h3>
                    <p className="mt-1 text-xs text-slate-500">
                      {formatDate(row.date)}
                    </p>
                  </div>

                  <p
                    className={`text-right text-lg font-bold ${
                      row.type === "income"
                        ? "text-emerald-700"
                        : "text-rose-700"
                    }`}
                  >
                    {row.type === "income" ? "+" : "-"}
                    {formatRupiah(row.type === "income" ? row.income : row.expense)}
                  </p>
                </div>

                {row.note ? (
                  <p className="mt-3 rounded-xl bg-slate-50 p-3 text-sm text-slate-600">
                    {row.note}
                  </p>
                ) : null}

                <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 text-sm">
                  <span className="text-slate-500">Saldo</span>
                  <span className="font-bold text-slate-900">
                    {formatRupiah(row.runningBalance)}
                  </span>
                </div>

                {row.proofUrl ? (
                  <a
                    href={row.proofUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-3 inline-flex rounded-xl border border-sky-200 px-3 py-2 text-sm font-semibold text-sky-700"
                  >
                    Lihat bukti
                  </a>
                ) : null}
              </article>
            ))}
          </div>
        </>
      )}
    </div>
  );
}