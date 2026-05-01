import React from "react";
import { Bus, Receipt, Utensils } from "lucide-react";

const logoAlYaqut = "/logo-al-yaqut.png";
const STORAGE_KEY = "rihlah.admin.v3";
const LEGACY_KEYS = {
  jumlahPeserta: "jumlahPeserta",
  biayaPerOrang: "biayaPerOrang",
  expenses: "expenses",
  incomes: "incomes",
  payments: "payments",
  participantPayments: "participantPayments",
};

const EXPENSE_CATEGORIES = [
  "Transport",
  "Akomodasi",
  "Konsumsi",
  "Kegiatan",
  "Perizinan",
  "Perlengkapan",
  "Lainnya",
];
const INCOME_SOURCES = ["Donatur", "Kas Pesantren", "Sponsor", "Wali Santri", "Lainnya"];
const PAYMENT_METHODS = ["Transfer", "Tunai", "QRIS"];
const VENDOR_PAYMENT_TYPES = ["DP", "Cicilan", "Pelunasan", "Refund", "Lainnya"];

const cardBox = "rounded-2xl border border-slate-200 bg-white shadow-sm";
const inputClass =
  "h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none placeholder:text-slate-400 focus:border-slate-400";
const selectClass =
  "h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-slate-400";
const textAreaClass =
  "min-h-[96px] w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none placeholder:text-slate-400 focus:border-slate-400";
const buttonPrimary =
  "inline-flex min-h-11 items-center justify-center rounded-xl bg-slate-800 px-4 py-2 text-sm font-medium text-white hover:bg-slate-900 disabled:cursor-not-allowed disabled:opacity-60";
const buttonOutline =
  "inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60";
const smallButton =
  "inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100";

const formatRupiah = (value) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(Number(value) || 0);

const toNumber = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const clampMin = (value, min = 0) => Math.max(toNumber(value), min);
const getToday = () => new Date().toISOString().slice(0, 10);
const createId = () => `${Date.now()}-${Math.random().toString(16).slice(2)}`;

const normalizeActivityLogTone = (tone = "info") =>
  ["info", "important", "danger", "success"].includes(tone) ? tone : "info";

const createActivityLogEntry = ({
  type = "system",
  title = "Aktivitas",
  description = "",
  tone = "info",
  at = "",
} = {}) => ({
  id: createId(),
  at: at || new Date().toISOString(),
  type,
  title,
  description,
  tone: normalizeActivityLogTone(tone),
});

const normalizeActivityLogEntry = (entry = {}) => ({
  id: entry.id || createId(),
  at: entry.at || entry.createdAt || new Date().toISOString(),
  type: entry.type || "system",
  title: entry.title || "Aktivitas",
  description: entry.description || "",
  tone: normalizeActivityLogTone(entry.tone),
});

const normalizeActivityLogs = (logs = []) =>
  (Array.isArray(logs) ? logs : [])
    .map(normalizeActivityLogEntry)
    .sort((a, b) => String(b.at || "").localeCompare(String(a.at || "")))
    .slice(0, 200);

const confirmDestructiveAction = ({
  title = "Konfirmasi aksi",
  message = "Aksi ini tidak bisa dibatalkan.",
  confirmationText = "",
} = {}) => {
  if (!confirmationText) {
    return window.confirm(`${title}\n\n${message}`);
  }

  const answer = window.prompt(`${title}\n\n${message}\n\nKetik ${confirmationText} untuk melanjutkan:`);
  return answer === confirmationText;
};

const normalizeFriendlyError = (error, fallback = "Terjadi kesalahan. Silakan coba lagi.") => {
  const message = String(error?.message || error || "").toLowerCase();
  if (message.includes("invalid login") || message.includes("invalid credentials")) {
    return "Email atau password belum sesuai.";
  }
  if (message.includes("network") || message.includes("failed to fetch")) {
    return "Koneksi bermasalah. Periksa internet lalu coba lagi.";
  }
  return error?.message || fallback;
};

const isSantriIncome = (item) => {
  const source = String(item?.sumber || "").toLowerCase();
  const name = String(item?.nama || "").toLowerCase();
  return source.includes("santri") || name.includes("iuran santri") || name.includes("iuran peserta");
};

const csvEscape = (value) => {
  const text = String(value ?? "");
  return `"${text.replace(/"/g, '""')}"`;
};

const downloadTextFile = (filename, text, type) => {
  const blob = new Blob([text], { type });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
};

const readJsonFromStorage = (key) => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

const readFileAsDataUrl = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("Gagal membaca file."));
    reader.readAsDataURL(file);
  });

const emptyConfig = {
  namaKegiatan: "Rihlah Pesantren Islam Al Yaqut",
  jumlahPembimbing: 9,
  iuranDefaultSantri: 500000,
  akunTujuan: "Bendahara Kegiatan",
  rekeningTujuan: "",
  catatanKegiatan: "",
  finalisasiData: {
    terkunci: false,
    dikunciPada: "",
    dibukaPada: "",
  },
};

const createBlankState = () => ({
  config: { ...emptyConfig },
  expenses: [],
  otherIncomes: [],
  vendorPayments: [],
  participants: [],
  activityLogs: [],
});

const normalizeConfig = (config = {}) => {
  const finalisasiData = config.finalisasiData || {};

  return {
    namaKegiatan: config.namaKegiatan || emptyConfig.namaKegiatan,
    jumlahPembimbing: clampMin(config.jumlahPembimbing ?? emptyConfig.jumlahPembimbing),
    iuranDefaultSantri: clampMin(config.iuranDefaultSantri ?? emptyConfig.iuranDefaultSantri),
    akunTujuan: config.akunTujuan || emptyConfig.akunTujuan,
    rekeningTujuan: config.rekeningTujuan || "",
    catatanKegiatan: config.catatanKegiatan || "",
    finalisasiData: {
      terkunci: Boolean(finalisasiData.terkunci),
      dikunciPada: finalisasiData.dikunciPada || "",
      dibukaPada: finalisasiData.dibukaPada || "",
    },
  };
};

const normalizeParticipantPayment = (payment = {}) => ({
  id: payment.id || createId(),
  tanggal: payment.tanggal || "",
  nominal: clampMin(payment.nominal),
  metode: payment.metode || "Transfer",
  akunMasuk: payment.akunMasuk || "",
  catatan: payment.catatan || "",
  buktiNama: payment.buktiNama || "",
  buktiDataUrl: payment.buktiDataUrl || payment.buktiUrl || "",
});

const normalizeParticipant = (participant = {}, defaultTarget = 0) => {
  const legacyPaid = clampMin(participant.sudahBayar);
  const payments = Array.isArray(participant.payments)
    ? participant.payments.map(normalizeParticipantPayment)
    : legacyPaid > 0
      ? [
          normalizeParticipantPayment({
            nominal: legacyPaid,
            metode: "Migrasi",
            akunMasuk: "Data lama",
            catatan: participant.catatan ? `Migrasi: ${participant.catatan}` : "Migrasi data lama",
          }),
        ]
      : [];

  return {
    id: participant.id || createId(),
    nama: participant.nama || "",
    kelas: participant.kelas || "",
    kamar: participant.kamar || "",
    targetIuran:
      participant.targetIuran === undefined || participant.targetIuran === null || participant.targetIuran === ""
        ? clampMin(defaultTarget)
        : clampMin(participant.targetIuran),
    catatan: participant.catatan || "",
    payments,
  };
};

const normalizeExpense = (expense = {}) => ({
  id: expense.id || createId(),
  nama: expense.nama || "",
  kategori: expense.kategori || "Lainnya",
  vendor: expense.vendor || expense.nama || "",
  nominal: clampMin(expense.nominal ?? expense.biaya),
  jatuhTempo: expense.jatuhTempo || "",
  catatan: expense.catatan || "",
});

const normalizeOtherIncome = (income = {}) => ({
  id: income.id || createId(),
  nama: income.nama || "",
  sumber: income.sumber || "Lainnya",
  tanggal: income.tanggal || "",
  metode: income.metode || "Transfer",
  akunMasuk: income.akunMasuk || "",
  nominal: clampMin(income.nominal),
  catatan: income.catatan || "",
});

const normalizeVendorPayment = (payment = {}) => ({
  id: payment.id || createId(),
  expenseId: payment.expenseId || "",
  vendorSnapshot: payment.vendorSnapshot || payment.vendor || "",
  jenis: payment.jenis || "DP",
  tanggal: payment.tanggal || "",
  metode: payment.metode || "Transfer",
  akunTujuan: payment.akunTujuan || "",
  nominal: clampMin(payment.nominal),
  biayaAdmin: clampMin(payment.biayaAdmin),
  buktiNama: payment.buktiNama || "",
  buktiDataUrl: payment.buktiDataUrl || payment.buktiUrl || "",
  buktiPath: payment.buktiPath || "",
  catatan: payment.catatan || "",
});

const normalizeState = (rawState) => {
  const safeState = rawState || createBlankState();
  const config = normalizeConfig(safeState.config);
  return {
    config,
    expenses: Array.isArray(safeState.expenses) ? safeState.expenses.map(normalizeExpense) : [],
    otherIncomes: Array.isArray(safeState.otherIncomes) ? safeState.otherIncomes.map(normalizeOtherIncome) : [],
    vendorPayments: Array.isArray(safeState.vendorPayments) ? safeState.vendorPayments.map(normalizeVendorPayment) : [],
    participants: Array.isArray(safeState.participants)
      ? safeState.participants.map((item) => normalizeParticipant(item, config.iuranDefaultSantri))
      : [],
    activityLogs: normalizeActivityLogs(safeState.activityLogs),
  };
};

const loadLegacyState = () => {
  const legacyExpenses = readJsonFromStorage(LEGACY_KEYS.expenses);
  const legacyIncomes = readJsonFromStorage(LEGACY_KEYS.incomes);
  const legacyPayments = readJsonFromStorage(LEGACY_KEYS.payments);
  const legacyParticipants = readJsonFromStorage(LEGACY_KEYS.participantPayments);
  const legacyJumlahPeserta = readJsonFromStorage(LEGACY_KEYS.jumlahPeserta);
  const legacyBiayaPerOrang = readJsonFromStorage(LEGACY_KEYS.biayaPerOrang);

  const hasLegacyData =
    Array.isArray(legacyExpenses) ||
    Array.isArray(legacyIncomes) ||
    Array.isArray(legacyPayments) ||
    Array.isArray(legacyParticipants) ||
    legacyJumlahPeserta !== null ||
    legacyBiayaPerOrang !== null;

  if (!hasLegacyData) return createBlankState();

  const participantList = Array.isArray(legacyParticipants) ? legacyParticipants : [];
  const jumlahSantri = participantList.length;
  const jumlahPeserta = clampMin(legacyJumlahPeserta);
  const jumlahPembimbing = Math.max(jumlahPeserta - jumlahSantri, 0);
  const iuranDefault = clampMin(legacyBiayaPerOrang || participantList[0]?.targetIuran || 500000);

  const santriIncomes = Array.isArray(legacyIncomes) ? legacyIncomes.filter(isSantriIncome) : [];
  const otherIncomes = Array.isArray(legacyIncomes)
    ? (jumlahSantri > 0 ? legacyIncomes.filter((item) => !isSantriIncome(item)) : legacyIncomes).map(normalizeOtherIncome)
    : [];

  const migratedParticipants =
    participantList.length > 0
      ? participantList.map((item) => normalizeParticipant(item, iuranDefault))
      : santriIncomes.length > 0
        ? [
            normalizeParticipant(
              {
                nama: "Kas Iuran Santri (Migrasi)",
                kelas: "Data lama",
                kamar: "-",
                targetIuran: santriIncomes.reduce((sum, item) => sum + clampMin(item.nominal), 0),
                payments: santriIncomes.map((item) => ({
                  nominal: clampMin(item.nominal),
                  tanggal: item.tanggal || "",
                  metode: item.metode || "Migrasi",
                  akunMasuk: item.sumber || "Data lama",
                  catatan: item.nama || "Migrasi pemasukan iuran lama",
                })),
              },
              iuranDefault
            ),
          ]
        : [];

  return normalizeState({
    config: {
      ...emptyConfig,
      jumlahPembimbing,
      iuranDefaultSantri: iuranDefault,
    },
    expenses: Array.isArray(legacyExpenses) ? legacyExpenses.map(normalizeExpense) : [],
    otherIncomes,
    vendorPayments: Array.isArray(legacyPayments) ? legacyPayments.map(normalizeVendorPayment) : [],
    participants: migratedParticipants,
  });
};

const loadInitialState = () => {
  const modernState = readJsonFromStorage(STORAGE_KEY);
  return modernState ? normalizeState(modernState) : loadLegacyState();
};

const createSampleState = () => {
  const config = normalizeConfig({
    namaKegiatan: "Rihlah Pesantren Islam Al Yaqut",
    jumlahPembimbing: 3,
    iuranDefaultSantri: 500000,
    akunTujuan: "Bendahara Rihlah",
    rekeningTujuan: "BSI 123456789 a.n. Panitia Rihlah",
    catatanKegiatan: "Data contoh untuk simulasi penggunaan aplikasi.",
  });

  const expenses = [
    {
      id: createId(),
      nama: "Sewa Bus",
      kategori: "Transport",
      vendor: "PO Al Yaqut Tour",
      nominal: 8000000,
      jatuhTempo: "2026-05-15",
      catatan: "Armada 2 unit.",
    },
    {
      id: createId(),
      nama: "Penginapan",
      kategori: "Akomodasi",
      vendor: "Villa Cibodas",
      nominal: 3000000,
      jatuhTempo: "2026-05-10",
      catatan: "2 malam.",
    },
    {
      id: createId(),
      nama: "Konsumsi 4x",
      kategori: "Konsumsi",
      vendor: "Dapur Umi",
      nominal: 4500000,
      jatuhTempo: "2026-05-12",
      catatan: "Sarapan, makan siang, makan malam, snack.",
    },
    {
      id: createId(),
      nama: "Tiket Body Rafting",
      kategori: "Kegiatan",
      vendor: "Body Rafting Green Valley",
      nominal: 3750000,
      jatuhTempo: "2026-05-14",
      catatan: "Paket 1 kegiatan utama.",
    },
  ].map(normalizeExpense);

  const participants = Array.from({ length: 12 }).map((_, index) => {
    const pattern = index % 4;
    const payments =
      pattern === 0
        ? [
            { tanggal: "2026-04-01", nominal: 500000, metode: "Transfer", akunMasuk: "BSI", catatan: "Lunas" },
          ]
        : pattern === 1
          ? [
              { tanggal: "2026-04-03", nominal: 250000, metode: "Transfer", akunMasuk: "BSI", catatan: "Cicilan 1" },
            ]
          : pattern === 2
            ? []
            : [
                { tanggal: "2026-04-02", nominal: 200000, metode: "Tunai", akunMasuk: "Kas", catatan: "Cicilan 1" },
                { tanggal: "2026-04-10", nominal: 300000, metode: "Transfer", akunMasuk: "BSI", catatan: "Pelunasan" },
              ];

    return normalizeParticipant(
      {
        id: createId(),
        nama: `Santri ${index + 1}`,
        kelas: `Kelas ${7 + (index % 3)}`,
        kamar: `Kamar ${Math.ceil((index + 1) / 4)}`,
        targetIuran: config.iuranDefaultSantri,
        catatan: pattern === 2 ? "Belum setor" : "",
        payments,
      },
      config.iuranDefaultSantri
    );
  });

  const vendorPayments = [
    {
      id: createId(),
      expenseId: expenses[0].id,
      vendorSnapshot: expenses[0].vendor,
      jenis: "DP",
      tanggal: "2026-04-05",
      metode: "Transfer",
      akunTujuan: "BCA PO Al Yaqut Tour",
      nominal: 2500000,
      biayaAdmin: 6500,
      catatan: "DP pemesanan bus",
    },
    {
      id: createId(),
      expenseId: expenses[1].id,
      vendorSnapshot: expenses[1].vendor,
      jenis: "Pelunasan",
      tanggal: "2026-04-08",
      metode: "Transfer",
      akunTujuan: "BRI Villa Cibodas",
      nominal: 3000000,
      biayaAdmin: 6500,
      catatan: "Pelunasan penginapan",
    },
  ].map(normalizeVendorPayment);

  const otherIncomes = [
    {
      id: createId(),
      nama: "Donasi wali santri",
      sumber: "Wali Santri",
      tanggal: "2026-04-04",
      metode: "Transfer",
      akunMasuk: "BSI",
      nominal: 1000000,
      catatan: "Tambahan konsumsi",
    },
  ].map(normalizeOtherIncome);

  return normalizeState({
    config,
    expenses,
    otherIncomes,
    vendorPayments,
    participants,
  });
};

const getExpenseTone = (status) => {
  if (status === "Lunas") return "emerald";
  if (status === "Lebih Bayar") return "amber";
  if (status === "DP / Cicilan") return "sky";
  return "rose";
};

const getParticipantTone = (status) => {
  if (status === "Lunas") return "emerald";
  if (status === "Cicilan") return "amber";
  return "rose";
};

const getExpenseIcon = (kategori) => {
  const lower = String(kategori || "").toLowerCase();
  if (lower.includes("transport")) return <Bus className="h-5 w-5" />;
  if (lower.includes("konsumsi")) return <Utensils className="h-5 w-5" />;
  return <Receipt className="h-5 w-5" />;
};

function Section({ title, subtitle, children, className = "", id }) {
  return (
    <div id={id} className={`${cardBox} scroll-mt-24 overflow-hidden ${className}`}>
      <div className="border-b px-4 py-4 sm:px-6">
        <h2 className="text-base font-semibold text-slate-900 sm:text-lg">{title}</h2>
        {subtitle ? <p className="mt-1 text-sm leading-6 text-slate-500">{subtitle}</p> : null}
      </div>
      <div className="p-4 sm:p-6">{children}</div>
    </div>
  );
}

function StatCard({ icon, label, value, tone, helper }) {
  return (
    <div className={`${cardBox} h-full`}>
      <div className="p-4 sm:p-5">
        <div className="flex items-start gap-4">
          <div className={`mt-1 flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl ${tone}`}>{icon}</div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold leading-5 text-slate-500">{label}</p>
            <p className="mt-2 text-[clamp(1.25rem,1.35vw,1.75rem)] font-bold leading-tight tracking-tight text-slate-900 tabular-nums">{value}</p>
            {helper ? <p className="mt-2 text-sm leading-6 text-slate-500">{helper}</p> : null}
          </div>
        </div>
      </div>
    </div>
  );
}

function Pill({ children, tone = "slate" }) {
  const map = {
    slate: "bg-slate-100 text-slate-700",
    emerald: "bg-emerald-100 text-emerald-700",
    amber: "bg-amber-100 text-amber-700",
    rose: "bg-rose-100 text-rose-700",
    sky: "bg-sky-100 text-sky-700",
  };
  return <span className={`inline-flex min-h-11 items-center justify-center rounded-xl px-4 py-2 text-sm font-medium leading-none ${map[tone]}`}>{children}</span>;
}

function MiniStat({ label, value, helper, tone = "slate" }) {
  const map = {
    slate: "bg-slate-50",
    emerald: "bg-emerald-50",
    amber: "bg-amber-50",
    rose: "bg-rose-50",
    sky: "bg-sky-50",
    violet: "bg-violet-50",
  };
  return (
    <div className={`rounded-2xl border p-4 ${map[tone]}`}>
      <p className="text-sm leading-5 text-slate-500">{label}</p>
      <p className="mt-2 max-w-full text-[clamp(1rem,1vw,1.3rem)] font-bold leading-snug tracking-tight text-slate-900 tabular-nums">{value}</p>
      {helper ? <p className="mt-1 text-xs text-slate-500">{helper}</p> : null}
    </div>
  );
}

function EmptyState({ text }) {
  return <div className="rounded-2xl border border-dashed bg-slate-50 p-4 text-sm leading-6 text-slate-500 sm:p-6">{text}</div>;
}

function InlineBanner({ title, text, tone = "slate" }) {
  const map = {
    slate: "border-slate-200 bg-slate-50 text-slate-700",
    emerald: "border-emerald-200 bg-emerald-50 text-emerald-700",
    amber: "border-amber-200 bg-amber-50 text-amber-700",
    rose: "border-rose-200 bg-rose-50 text-rose-700",
    sky: "border-sky-200 bg-sky-50 text-sky-700",
  };
  return (
    <div className={`rounded-2xl border p-4 ${map[tone] || map.slate}`}>
      <p className="text-sm font-semibold leading-5">{title}</p>
      <p className="mt-1 text-sm leading-6 opacity-90">{text}</p>
    </div>
  );
}

function ProgressBar({ value, max }) {
  const safeMax = Math.max(Number(max) || 0, 1);
  const pct = Math.max(0, Math.min(100, Math.round(((Number(value) || 0) / safeMax) * 100)));
  return (
    <div className="h-2 overflow-hidden rounded-full bg-slate-200">
      <div className="h-full rounded-full bg-sky-500 transition-all" style={{ width: `${pct}%` }} />
    </div>
  );
}


const navItems = [
  { key: "home", label: "Home", to: "/" },
  { key: "kegiatan", label: "Kegiatan", to: "/kegiatan" },
  { key: "vendor", label: "Vendor", to: "/vendor" },
  { key: "santri", label: "Santri", to: "/santri" },
  { key: "buku-kas", label: "Buku Kas", to: "/buku-kas" },
  { key: "laporan", label: "Laporan", to: "/laporan" },
];

const navClass = (isActive) =>
  `rounded-xl px-3 py-2 text-sm font-medium transition lg:px-4 xl:px-5 ${isActive ? "bg-white text-sky-700 shadow-sm" : "text-white/90 hover:bg-white/10"}`;

const tabClass = (active) =>
  `rounded-xl px-4 py-2 text-sm font-medium transition ${active ? "bg-slate-900 text-white" : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"}`;

export {
  logoAlYaqut,
  STORAGE_KEY,
  LEGACY_KEYS,
  EXPENSE_CATEGORIES,
  INCOME_SOURCES,
  PAYMENT_METHODS,
  VENDOR_PAYMENT_TYPES,
  cardBox,
  inputClass,
  selectClass,
  textAreaClass,
  buttonPrimary,
  buttonOutline,
  smallButton,
  formatRupiah,
  toNumber,
  clampMin,
  getToday,
  createId,
  createActivityLogEntry,
  normalizeActivityLogEntry,
  normalizeActivityLogs,
  confirmDestructiveAction,
  normalizeFriendlyError,
  isSantriIncome,
  csvEscape,
  downloadTextFile,
  readJsonFromStorage,
  readFileAsDataUrl,
  emptyConfig,
  createBlankState,
  normalizeConfig,
  normalizeParticipantPayment,
  normalizeParticipant,
  normalizeExpense,
  normalizeOtherIncome,
  normalizeVendorPayment,
  normalizeState,
  loadLegacyState,
  createSampleState,
  loadInitialState,
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
  navItems,
  navClass,
  tabClass,
};
