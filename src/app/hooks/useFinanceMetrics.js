import { useMemo } from "react";
import { clampMin, formatRupiah } from "../../shared/lib/rihlahCore";

export function useFinanceMetrics({ config, participantRows, otherIncomes, expenseRows, vendorPaymentRows }) {
  const jumlahSantri = participantRows.length;
  const jumlahPembimbing = clampMin(config.jumlahPembimbing);
  const jumlahPeserta = jumlahSantri + jumlahPembimbing;

  const totalIuranTarget = useMemo(() => participantRows.reduce((sum, item) => sum + item.targetIuran, 0), [participantRows]);
  const totalIuranMasuk = useMemo(() => participantRows.reduce((sum, item) => sum + item.totalPaid, 0), [participantRows]);
  const totalIuranOutstanding = useMemo(() => participantRows.reduce((sum, item) => sum + item.remaining, 0), [participantRows]);
  const totalIuranOverpaid = useMemo(() => participantRows.reduce((sum, item) => sum + item.overpaid, 0), [participantRows]);
  const totalOtherIncome = useMemo(() => otherIncomes.reduce((sum, item) => sum + clampMin(item.nominal), 0), [otherIncomes]);
  const totalPemasukan = totalIuranMasuk + totalOtherIncome;

  const totalTagihan = useMemo(() => expenseRows.reduce((sum, item) => sum + item.nominal, 0), [expenseRows]);
  const totalVendorPaid = useMemo(() => vendorPaymentRows.reduce((sum, item) => sum + clampMin(item.nominal), 0), [vendorPaymentRows]);
  const totalVendorAdmin = useMemo(() => vendorPaymentRows.reduce((sum, item) => sum + clampMin(item.biayaAdmin), 0), [vendorPaymentRows]);
  const totalArusKeluarVendor = totalVendorPaid + totalVendorAdmin;
  const totalLinkedVendorPaid = useMemo(() => expenseRows.reduce((sum, item) => sum + item.paid, 0), [expenseRows]);
  const totalVendorOutstanding = useMemo(() => expenseRows.reduce((sum, item) => sum + item.remaining, 0), [expenseRows]);
  const totalVendorOverpaid = useMemo(() => expenseRows.reduce((sum, item) => sum + item.overpaid, 0), [expenseRows]);
  const totalVendorUnlinked = useMemo(
    () => vendorPaymentRows.reduce((sum, item) => sum + (!item.expenseId ? clampMin(item.nominal) : 0), 0),
    [vendorPaymentRows]
  );

  const saldoKasSaatIni = totalPemasukan - totalArusKeluarVendor;
  const proyeksiSaldoAkhir = totalPemasukan - totalTagihan - totalVendorAdmin;
  const iuranMinimalPerSantri = jumlahSantri > 0 ? totalTagihan / jumlahSantri : 0;
  const kekuranganDana = Math.max(totalTagihan + totalVendorAdmin - totalPemasukan, 0);
  const kekuranganPerSantri = jumlahSantri > 0 ? kekuranganDana / jumlahSantri : 0;

  const jumlahLunas = participantRows.filter((item) => item.status === "Lunas").length;
  const jumlahCicilan = participantRows.filter((item) => item.status === "Cicilan").length;
  const jumlahBelumBayar = participantRows.filter((item) => item.status === "Belum Bayar").length;
  const overdueExpenses = expenseRows.filter((item) => item.isOverdue);

  const warnings = useMemo(() => {
    const items = [];
    if (jumlahSantri === 0) items.push("Belum ada data santri. Tambahkan santri agar target iuran dan rekap pembayaran bisa dihitung.");
    if (totalIuranOutstanding > 0) items.push(`Masih ada tunggakan iuran sebesar ${formatRupiah(totalIuranOutstanding)} dari ${jumlahCicilan + jumlahBelumBayar} santri.`);
    if (overdueExpenses.length > 0) items.push(`${overdueExpenses.length} tagihan sudah melewati jatuh tempo tetapi belum lunas.`);
    if (totalVendorUnlinked > 0) items.push(`Ada pembayaran vendor ${formatRupiah(totalVendorUnlinked)} yang belum ditautkan ke tagihan tertentu.`);
    if (totalVendorOverpaid > 0 || totalIuranOverpaid > 0) {
      const extra = totalVendorOverpaid + totalIuranOverpaid;
      items.push(`Terdapat selisih lebih bayar sebesar ${formatRupiah(extra)}. Cek kembali transaksi agar laporan tetap akurat.`);
    }
    if (proyeksiSaldoAkhir < 0) items.push(`Jika semua tagihan dibayar, dana masih kurang ${formatRupiah(Math.abs(proyeksiSaldoAkhir))}.`);
    return items;
  }, [jumlahSantri, totalIuranOutstanding, jumlahCicilan, jumlahBelumBayar, overdueExpenses, totalVendorUnlinked, totalVendorOverpaid, totalIuranOverpaid, proyeksiSaldoAkhir]);

  const financeHealth =
    proyeksiSaldoAkhir < 0
      ? { tone: "rose", title: "Proyeksi defisit", text: `Jika seluruh tagihan dibayar, dana masih kurang ${formatRupiah(Math.abs(proyeksiSaldoAkhir))}.` }
      : totalIuranOutstanding > 0 || totalVendorOutstanding > 0
        ? { tone: "amber", title: "Perlu perhatian", text: `Masih ada tunggakan iuran ${formatRupiah(totalIuranOutstanding)} dan sisa tagihan vendor ${formatRupiah(totalVendorOutstanding)}.` }
        : { tone: "emerald", title: "Posisi keuangan aman", text: "Kas dan tagihan vendor dalam kondisi terkendali." };

  return {
    jumlahSantri,
    jumlahPembimbing,
    jumlahPeserta,
    totalIuranTarget,
    totalIuranMasuk,
    totalIuranOutstanding,
    totalIuranOverpaid,
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
    overdueExpenses,
    warnings,
    financeHealth,
  };
}
