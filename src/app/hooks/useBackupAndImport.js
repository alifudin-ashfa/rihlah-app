import {
  LEGACY_KEYS,
  STORAGE_KEY,
  confirmDestructiveAction,
  createBlankState,
  createSampleState,
  csvEscape,
  downloadTextFile,
  normalizeState,
} from "../../shared/lib/rihlahCore";

function formatBackupTimestamp() {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hour = String(date.getHours()).padStart(2, "0");
  const minute = String(date.getMinutes()).padStart(2, "0");

  return `${year}-${month}-${day}-${hour}-${minute}`;
}

function countParticipantPayments(participants = []) {
  return participants.reduce((total, participant) => {
    const payments = Array.isArray(participant.payments)
      ? participant.payments
      : [];

    return total + payments.length;
  }, 0);
}

function buildBackupSummary({ participants, expenses, otherIncomes, vendorPayments }) {
  return {
    createdAt: new Date().toISOString(),
    createdAtLabel: new Date().toLocaleString("id-ID"),
    jumlahSantri: participants.length,
    jumlahTagihanVendor: expenses.length,
    jumlahPemasukanLain: otherIncomes.length,
    jumlahPembayaranIuran: countParticipantPayments(participants),
    jumlahPembayaranVendor: vendorPayments.length,
  };
}

function buildBackupPayload({
  backupType = "regular",
  config,
  participantsDomain,
  vendorsDomain,
}) {
  const participants = participantsDomain.participants;
  const expenses = vendorsDomain.expenses;
  const otherIncomes = vendorsDomain.otherIncomes;
  const vendorPayments = vendorsDomain.vendorPayments;

  return {
    exportedAt: new Date().toISOString(),
    appVersion: 4,
    backupType,
    eventName: config.config.namaKegiatan || "Rihlah Al Yaqut",
    eventDate: "6-7 Mei 2026",
    backupSummary: buildBackupSummary({
      participants,
      expenses,
      otherIncomes,
      vendorPayments,
    }),
    config: config.config,
    expenses,
    otherIncomes,
    vendorPayments,
    participants,
  };
}

function validateBackupPayload(parsed) {
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error("File backup tidak valid. Isi file harus berupa object JSON.");
  }

  if (!parsed.config || typeof parsed.config !== "object" || Array.isArray(parsed.config)) {
    throw new Error("File backup tidak valid. Data konfigurasi tidak ditemukan.");
  }

  const requiredArrayFields = [
    ["participants", "data santri"],
    ["expenses", "data tagihan vendor"],
    ["otherIncomes", "data pemasukan lain"],
    ["vendorPayments", "data pembayaran vendor"],
  ];

  requiredArrayFields.forEach(([field, label]) => {
    if (!Array.isArray(parsed[field])) {
      throw new Error(`File backup tidak valid. ${label} tidak ditemukan atau formatnya salah.`);
    }
  });
}

function buildImportSummary(normalized) {
  const jumlahPembayaranIuran = countParticipantPayments(normalized.participants);

  return {
    jumlahSantri: normalized.participants.length,
    jumlahTagihanVendor: normalized.expenses.length,
    jumlahPemasukanLain: normalized.otherIncomes.length,
    jumlahPembayaranIuran,
    jumlahPembayaranVendor: normalized.vendorPayments.length,
  };
}

export function useBackupAndImport({
  config,
  participantsDomain,
  vendorsDomain,
  metrics,
  showToast,
}) {
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
    const payload = buildBackupPayload({
      backupType: "regular",
      config,
      participantsDomain,
      vendorsDomain,
    });

    const filename = `backup-rihlah-al-yaqut-${formatBackupTimestamp()}.json`;

    downloadTextFile(
      filename,
      JSON.stringify(payload, null, 2),
      "application/json"
    );

    showToast(
      `Backup berhasil dibuat: ${payload.backupSummary.jumlahSantri} santri, ${payload.backupSummary.jumlahTagihanVendor} tagihan vendor, ${payload.backupSummary.jumlahPembayaranIuran} pembayaran iuran.`,
      "emerald"
    );
  };

  const exportFinalBackup = () => {
    const payload = buildBackupPayload({
      backupType: "final-before-event",
      config,
      participantsDomain,
      vendorsDomain,
    });

    const filename = `backup-final-rihlah-al-yaqut-${formatBackupTimestamp()}.json`;

    downloadTextFile(
      filename,
      JSON.stringify(payload, null, 2),
      "application/json"
    );

    showToast(
      `Backup final berhasil dibuat: ${payload.backupSummary.jumlahSantri} santri, ${payload.backupSummary.jumlahTagihanVendor} tagihan vendor, ${payload.backupSummary.jumlahPembayaranVendor} pembayaran vendor.`,
      "emerald"
    );
  };

  const importBackup = async (event) => {
    const file = event.target.files?.[0];

    if (!file) return;

    if (!file.name.toLowerCase().endsWith(".json")) {
      showToast("File backup harus berformat .json.", "rose");
      event.target.value = "";
      return;
    }

    try {
      const text = await file.text();
      const parsed = JSON.parse(text);

      validateBackupPayload(parsed);

      const normalized = normalizeState(parsed);
      const summary = buildImportSummary(normalized);

      const confirmed = confirmDestructiveAction({
        title: "Restore backup",
        message:
          `File ini akan mengganti seluruh data aplikasi saat ini.\n\n` +
          `Ringkasan isi backup:\n` +
          `- ${summary.jumlahSantri} santri\n` +
          `- ${summary.jumlahPembayaranIuran} pembayaran iuran\n` +
          `- ${summary.jumlahTagihanVendor} tagihan vendor\n` +
          `- ${summary.jumlahPembayaranVendor} pembayaran vendor\n` +
          `- ${summary.jumlahPemasukanLain} pemasukan lain\n\n` +
          `Pastikan kamu sudah membuat backup data saat ini sebelum restore.`,
        confirmationText: "RESTORE",
      });

      if (!confirmed) {
        showToast("Restore backup dibatalkan.", "amber");
        return;
      }

      applyState(normalized);
      showToast("Backup berhasil direstore.", "emerald");
    } catch (error) {
      showToast(error.message || "File backup tidak valid.", "rose");
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
      [
        "Nama",
        "Kelas",
        "Kamar",
        "Target Iuran",
        "Sudah Bayar",
        "Sisa Tagihan",
        "Status",
        "Catatan",
      ],
      ...participantsDomain.participantRows.map((item) => [
        item.nama,
        item.kelas,
        item.kamar,
        item.targetIuran,
        item.totalPaid,
        item.remaining,
        item.status,
        item.catatan,
      ]),
      [],
      ["Tagihan Vendor"],
      [
        "Nama Tagihan",
        "Vendor",
        "Kategori",
        "Nominal",
        "Sudah Dibayar",
        "Sisa",
        "Status",
        "Jatuh Tempo",
      ],
      ...vendorsDomain.expenseRows.map((item) => [
        item.nama,
        item.vendor,
        item.kategori,
        item.nominal,
        item.paid,
        item.remaining,
        item.status,
        item.jatuhTempo,
      ]),
      [],
      ["Pemasukan Lain"],
      ["Nama", "Sumber", "Tanggal", "Metode", "Akun Masuk", "Nominal", "Catatan"],
      ...vendorsDomain.otherIncomes.map((item) => [
        item.nama,
        item.sumber,
        item.tanggal,
        item.metode,
        item.akunMasuk,
        item.nominal,
        item.catatan,
      ]),
      [],
      ["Pembayaran Vendor"],
      [
        "Tagihan/Vendor",
        "Tanggal",
        "Jenis",
        "Metode",
        "Nominal",
        "Biaya Admin",
        "Akun Tujuan",
        "Catatan",
      ],
      ...vendorsDomain.vendorPaymentRows.map((item) => [
        vendorsDomain.expenseLookup[String(item.expenseId)]?.nama ||
          item.vendorSnapshot ||
          "Belum ditautkan",
        item.tanggal,
        item.jenis,
        item.metode,
        item.nominal,
        item.biayaAdmin,
        item.akunTujuan,
        item.catatan,
      ]),
    ];

    const csv = rows.map((row) => row.map(csvEscape).join(",")).join("\n");

    downloadTextFile(
      "laporan-rihlah.csv",
      csv,
      "text/csv;charset=utf-8"
    );
  };

  const loadSampleData = () => {
    const confirmed = confirmDestructiveAction({
      title: "Muat data contoh",
      message: "Data saat ini akan diganti dengan data contoh untuk simulasi.",
      confirmationText: "CONTOH",
    });

    if (!confirmed) return;

    applyState(createSampleState());
    showToast("Data contoh berhasil dimuat.", "emerald");
  };

  const resetAllData = () => {
    const confirmed = confirmDestructiveAction({
      title: "Reset semua data",
      message:
        "Semua data aplikasi di perangkat ini akan dihapus dan diganti menjadi kosong. Pastikan sudah export backup terlebih dahulu.",
      confirmationText: "RESET",
    });

    if (!confirmed) return;

    localStorage.removeItem(STORAGE_KEY);
    Object.values(LEGACY_KEYS).forEach((key) => localStorage.removeItem(key));

    applyState(createBlankState());
    showToast("Semua data berhasil direset.", "emerald");
  };

  return {
    applyState,
    exportBackup,
    exportFinalBackup,
    importBackup,
    exportCsvReport,
    loadSampleData,
    resetAllData,
  };
}