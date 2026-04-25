import {
  LEGACY_KEYS,
  STORAGE_KEY,
  createBlankState,
  createSampleState,
  csvEscape,
  downloadTextFile,
  normalizeState,
} from "../../shared/lib/rihlahCore";

export function useBackupAndImport({ config, participantsDomain, vendorsDomain, metrics, showToast }) {
  const applyState = (nextState) => {
    const normalized = normalizeState(nextState);
    config.setConfig(normalized.config);
    vendorsDomain.setExpenses(normalized.expenses);
    vendorsDomain.setOtherIncomes(normalized.otherIncomes);
    vendorsDomain.setVendorPayments(normalized.vendorPayments);
    participantsDomain.setParticipants(normalized.participants);
    vendorsDomain.resetExpenseForm();
    vendorsDomain.resetIncomeForm();
    vendorsDomain.resetVendorPaymentForm();
    participantsDomain.resetParticipantForm();
    participantsDomain.resetParticipantPaymentForm();
    participantsDomain.setParticipantSearch("");
  };

  const exportBackup = () => {
    const payload = {
      exportedAt: new Date().toISOString(),
      appVersion: 3,
      config: config.config,
      expenses: vendorsDomain.expenses,
      otherIncomes: vendorsDomain.otherIncomes,
      vendorPayments: vendorsDomain.vendorPayments,
      participants: participantsDomain.participants,
    };
    downloadTextFile("rihlah-backup.json", JSON.stringify(payload, null, 2), "application/json");
  };

  const importBackup = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      applyState(parsed);
      showToast("Backup berhasil diimpor.", "emerald");
    } catch {
      showToast("File backup tidak valid.", "rose");
    } finally {
      event.target.value = "";
    }
  };

  const exportCsvReport = () => {
    const rows = [
      ["Laporan Administrasi Keuangan Rihlah"],
      ["Nama Kegiatan", config.config.namaKegiatan],
      ["Tanggal Export", new Date().toLocaleString("id-ID")],
      [],
      ["Ringkasan"],
      ["Jumlah Santri", metrics.jumlahSantri],
      ["Jumlah Pembimbing", metrics.jumlahPembimbing],
      ["Total Target Iuran", metrics.totalIuranTarget],
      ["Total Iuran Masuk", metrics.totalIuranMasuk],
      ["Total Pemasukan Lain", metrics.totalOtherIncome],
      ["Total Pemasukan", metrics.totalPemasukan],
      ["Total Tagihan Vendor", metrics.totalTagihan],
      ["Total Pembayaran Vendor", metrics.totalVendorPaid],
      ["Total Biaya Admin", metrics.totalVendorAdmin],
      ["Saldo Kas Saat Ini", metrics.saldoKasSaatIni],
      ["Proyeksi Saldo Akhir", metrics.proyeksiSaldoAkhir],
      [],
      ["Rekap Santri"],
      ["Nama", "Kelas", "Kamar", "Target Iuran", "Sudah Bayar", "Sisa Tagihan", "Status", "Catatan"],
      ...participantsDomain.participantRows.map((item) => [item.nama, item.kelas, item.kamar, item.targetIuran, item.totalPaid, item.remaining, item.status, item.catatan]),
      [],
      ["Tagihan Vendor"],
      ["Nama Tagihan", "Vendor", "Kategori", "Nominal", "Sudah Dibayar", "Sisa", "Status", "Jatuh Tempo"],
      ...vendorsDomain.expenseRows.map((item) => [item.nama, item.vendor, item.kategori, item.nominal, item.paid, item.remaining, item.status, item.jatuhTempo]),
      [],
      ["Pemasukan Lain"],
      ["Nama", "Sumber", "Tanggal", "Metode", "Akun Masuk", "Nominal", "Catatan"],
      ...vendorsDomain.otherIncomes.map((item) => [item.nama, item.sumber, item.tanggal, item.metode, item.akunMasuk, item.nominal, item.catatan]),
      [],
      ["Pembayaran Vendor"],
      ["Tagihan/Vendor", "Tanggal", "Jenis", "Metode", "Nominal", "Biaya Admin", "Akun Tujuan", "Catatan"],
      ...vendorsDomain.vendorPaymentRows.map((item) => [vendorsDomain.expenseLookup[String(item.expenseId)]?.nama || item.vendorSnapshot || "Belum ditautkan", item.tanggal, item.jenis, item.metode, item.nominal, item.biayaAdmin, item.akunTujuan, item.catatan]),
    ];

    const csv = rows.map((row) => row.map(csvEscape).join(",")).join("\n");
    downloadTextFile("laporan-rihlah.csv", csv, "text/csv;charset=utf-8");
  };

  const loadSampleData = () => {
    if (!window.confirm("Muat data contoh? Data saat ini akan diganti.")) return;
    applyState(createSampleState());
    showToast("Data contoh berhasil dimuat.", "emerald");
  };

  const resetAllData = () => {
    if (!window.confirm("Yakin ingin menghapus semua data aplikasi?")) return;
    localStorage.removeItem(STORAGE_KEY);
    Object.values(LEGACY_KEYS).forEach((key) => localStorage.removeItem(key));
    applyState(createBlankState());
    showToast("Semua data berhasil direset.", "emerald");
  };

  return {
    applyState,
    exportBackup,
    importBackup,
    exportCsvReport,
    loadSampleData,
    resetAllData,
  };
}
