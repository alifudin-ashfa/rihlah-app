import { supabase, isSupabaseConfigured } from "./supabaseClient";
import {
  createBlankState,
  emptyConfig,
  normalizeConfig,
  normalizeExpense,
  normalizeOtherIncome,
  normalizeParticipant,
  normalizeParticipantPayment,
  normalizeVendorPayment,
} from "./rihlahCore";

const SETTINGS_ID = "main";

const toDbDate = (value) => value || null;
const fromDbDate = (value) => value || "";
const asStringId = (value) => String(value || "");

const mapConfigFromDb = (row) =>
  normalizeConfig({
    namaKegiatan: row?.nama_kegiatan || emptyConfig.namaKegiatan,
    jumlahPembimbing: row?.jumlah_pembimbing ?? emptyConfig.jumlahPembimbing,
    iuranDefaultSantri: row?.iuran_default_santri ?? emptyConfig.iuranDefaultSantri,
    akunTujuan: row?.akun_tujuan || emptyConfig.akunTujuan,
    rekeningTujuan: row?.rekening_tujuan || "",
    catatanKegiatan: row?.catatan_kegiatan || "",
  });

const mapConfigToDb = (config) => ({
  id: SETTINGS_ID,
  nama_kegiatan: config.namaKegiatan || emptyConfig.namaKegiatan,
  jumlah_pembimbing: Number(config.jumlahPembimbing) || 0,
  iuran_default_santri: Number(config.iuranDefaultSantri) || 0,
  akun_tujuan: config.akunTujuan || "",
  rekening_tujuan: config.rekeningTujuan || "",
  catatan_kegiatan: config.catatanKegiatan || "",
  updated_at: new Date().toISOString(),
});

const mapParticipantFromDb = (row, paymentsByParticipant, defaultTarget) =>
  normalizeParticipant(
    {
      id: asStringId(row.id),
      nama: row.nama || "",
      kelas: row.kelas || "",
      kamar: row.kamar || "",
      targetIuran: Number(row.target_iuran) || 0,
      catatan: row.catatan || "",
      payments: paymentsByParticipant[asStringId(row.id)] || [],
    },
    defaultTarget
  );

const mapParticipantToDb = (item, defaultTarget) => {
  const participant = normalizeParticipant(item, defaultTarget);
  return {
    id: asStringId(participant.id),
    nama: participant.nama || "",
    kelas: participant.kelas || "",
    kamar: participant.kamar || "",
    target_iuran: Number(participant.targetIuran) || 0,
    catatan: participant.catatan || "",
    updated_at: new Date().toISOString(),
  };
};

const mapParticipantPaymentFromDb = (row) =>
  normalizeParticipantPayment({
    id: asStringId(row.id),
    tanggal: fromDbDate(row.tanggal),
    nominal: Number(row.nominal) || 0,
    metode: row.metode || "Transfer",
    akunMasuk: row.akun_masuk || "",
    catatan: row.catatan || "",
    buktiNama: row.bukti_nama || "",
    buktiDataUrl: row.bukti_data_url || "",
  });

const mapParticipantPaymentToDb = (payment, participantId) => {
  const item = normalizeParticipantPayment(payment);
  return {
    id: asStringId(item.id),
    participant_id: asStringId(participantId),
    tanggal: toDbDate(item.tanggal),
    nominal: Number(item.nominal) || 0,
    metode: item.metode || "Transfer",
    akun_masuk: item.akunMasuk || "",
    catatan: item.catatan || "",
    bukti_nama: item.buktiNama || "",
    bukti_data_url: item.buktiDataUrl || "",
    updated_at: new Date().toISOString(),
  };
};

const mapExpenseFromDb = (row) =>
  normalizeExpense({
    id: asStringId(row.id),
    nama: row.nama || "",
    kategori: row.kategori || "Lainnya",
    vendor: row.vendor || "",
    nominal: Number(row.nominal) || 0,
    jatuhTempo: fromDbDate(row.jatuh_tempo),
    catatan: row.catatan || "",
  });

const mapExpenseToDb = (item) => {
  const expense = normalizeExpense(item);
  return {
    id: asStringId(expense.id),
    nama: expense.nama || "",
    kategori: expense.kategori || "Lainnya",
    vendor: expense.vendor || "",
    nominal: Number(expense.nominal) || 0,
    jatuh_tempo: toDbDate(expense.jatuhTempo),
    catatan: expense.catatan || "",
    updated_at: new Date().toISOString(),
  };
};

const mapVendorPaymentFromDb = (row) =>
  normalizeVendorPayment({
    id: asStringId(row.id),
    expenseId: row.expense_id ? asStringId(row.expense_id) : "",
    vendorSnapshot: row.vendor_snapshot || "",
    jenis: row.jenis || "DP",
    tanggal: fromDbDate(row.tanggal),
    metode: row.metode || "Transfer",
    akunTujuan: row.akun_tujuan || "",
    nominal: Number(row.nominal) || 0,
    biayaAdmin: Number(row.biaya_admin) || 0,
    buktiNama: row.bukti_nama || "",
    buktiDataUrl: row.bukti_data_url || "",
    buktiPath: row.bukti_path || "",
    catatan: row.catatan || "",
  });

const mapVendorPaymentToDb = (payment) => {
  const item = normalizeVendorPayment(payment);
  return {
    id: asStringId(item.id),
    expense_id: item.expenseId ? asStringId(item.expenseId) : null,
    vendor_snapshot: item.vendorSnapshot || "",
    jenis: item.jenis || "DP",
    tanggal: toDbDate(item.tanggal),
    metode: item.metode || "Transfer",
    akun_tujuan: item.akunTujuan || "",
    nominal: Number(item.nominal) || 0,
    biaya_admin: Number(item.biayaAdmin) || 0,
    bukti_nama: item.buktiNama || "",
    bukti_data_url: item.buktiDataUrl || "",
    bukti_path: item.buktiPath || "",
    catatan: item.catatan || "",
    updated_at: new Date().toISOString(),
  };
};

const mapOtherIncomeFromDb = (row) =>
  normalizeOtherIncome({
    id: asStringId(row.id),
    nama: row.nama || "",
    sumber: row.sumber || "Lainnya",
    tanggal: fromDbDate(row.tanggal),
    metode: row.metode || "Transfer",
    akunMasuk: row.akun_masuk || "",
    nominal: Number(row.nominal) || 0,
    catatan: row.catatan || "",
  });

const mapOtherIncomeToDb = (income) => {
  const item = normalizeOtherIncome(income);
  return {
    id: asStringId(item.id),
    nama: item.nama || "",
    sumber: item.sumber || "Lainnya",
    tanggal: toDbDate(item.tanggal),
    metode: item.metode || "Transfer",
    akun_masuk: item.akunMasuk || "",
    nominal: Number(item.nominal) || 0,
    catatan: item.catatan || "",
    updated_at: new Date().toISOString(),
  };
};

const throwIfError = (label, error) => {
  if (error) throw new Error(`${label}: ${error.message}`);
};

const deleteAll = async (table) => {
  const { error } = await supabase.from(table).delete().neq("id", "__never__");
  throwIfError(`Gagal mengosongkan ${table}`, error);
};

const upsertMany = async (table, rows) => {
  if (!rows.length) return;
  const { error } = await supabase.from(table).upsert(rows, { onConflict: "id" });
  throwIfError(`Gagal menyimpan ${table}`, error);
};


export const deleteParticipantFromSupabase = async (id) => {
  if (!isSupabaseConfigured || !supabase || !id) return;

  const { error: paymentError } = await supabase
    .from("participant_payments")
    .delete()
    .eq("participant_id", String(id));

  throwIfError("Gagal menghapus pembayaran santri terkait", paymentError);

  const { error: participantError } = await supabase
    .from("participants")
    .delete()
    .eq("id", String(id));

  throwIfError("Gagal menghapus data santri", participantError);
};

export const deleteParticipantPaymentFromSupabase = async (id) => {
  if (!isSupabaseConfigured || !supabase || !id) return;

  const { error } = await supabase
    .from("participant_payments")
    .delete()
    .eq("id", String(id));

  throwIfError("Gagal menghapus pembayaran iuran", error);
};

export const upsertParticipantToSupabase = async (participant, defaultTarget = 0) => {
  if (!isSupabaseConfigured || !supabase || !participant) return;

  const { error } = await supabase
    .from("participants")
    .upsert(mapParticipantToDb(participant, defaultTarget), { onConflict: "id" });

  throwIfError("Gagal menyimpan data santri", error);
};

export const upsertParticipantPaymentToSupabase = async (payment, participantId) => {
  if (!isSupabaseConfigured || !supabase || !payment || !participantId) return;

  const { error } = await supabase
    .from("participant_payments")
    .upsert(mapParticipantPaymentToDb(payment, participantId), { onConflict: "id" });

  throwIfError("Gagal menyimpan pembayaran iuran", error);
};

export const deleteExpenseFromSupabase = async (id) => {
  if (!isSupabaseConfigured || !supabase || !id) return;

  // Hapus pembayaran vendor yang terkait dengan tagihan ini dulu
  const { error: paymentError } = await supabase
    .from("vendor_payments")
    .delete()
    .eq("expense_id", String(id));

  throwIfError("Gagal menghapus pembayaran vendor terkait", paymentError);

  // Hapus tagihan vendor
  const { error: expenseError } = await supabase
    .from("expenses")
    .delete()
    .eq("id", String(id));

  throwIfError("Gagal menghapus tagihan vendor", expenseError);
};

export const deleteVendorPaymentFromSupabase = async (id) => {
  if (!isSupabaseConfigured || !supabase || !id) return;

  const { error } = await supabase
    .from("vendor_payments")
    .delete()
    .eq("id", String(id));

  throwIfError("Gagal menghapus pembayaran vendor", error);
};

export const deleteOtherIncomeFromSupabase = async (id) => {
  if (!isSupabaseConfigured || !supabase || !id) return;

  const { error } = await supabase
    .from("other_incomes")
    .delete()
    .eq("id", String(id));

  throwIfError("Gagal menghapus pemasukan lain", error);
};

export const upsertExpenseToSupabase = async (item) => {
  if (!isSupabaseConfigured || !supabase || !item) return;

  const { error } = await supabase
    .from("expenses")
    .upsert(mapExpenseToDb(item), { onConflict: "id" });

  throwIfError("Gagal menyimpan tagihan vendor", error);
};

export const upsertOtherIncomeToSupabase = async (income) => {
  if (!isSupabaseConfigured || !supabase || !income) return;

  const { error } = await supabase
    .from("other_incomes")
    .upsert(mapOtherIncomeToDb(income), { onConflict: "id" });

  throwIfError("Gagal menyimpan pemasukan lain", error);
};

export const upsertVendorPaymentToSupabase = async (payment) => {
  if (!isSupabaseConfigured || !supabase || !payment) return;

  const { error } = await supabase
    .from("vendor_payments")
    .upsert(mapVendorPaymentToDb(payment), { onConflict: "id" });

  throwIfError("Gagal menyimpan pembayaran vendor", error);
};

export async function loadStateFromSupabase() {
  if (!isSupabaseConfigured || !supabase) return null;

  const [settingsRes, participantsRes, participantPaymentsRes, expensesRes, vendorPaymentsRes, otherIncomesRes] = await Promise.all([
    supabase.from("settings_kegiatan").select("*").eq("id", SETTINGS_ID).maybeSingle(),
    supabase.from("participants").select("*").order("created_at", { ascending: true }),
    supabase.from("participant_payments").select("*").order("created_at", { ascending: true }),
    supabase.from("expenses").select("*").order("created_at", { ascending: true }),
    supabase.from("vendor_payments").select("*").order("created_at", { ascending: true }),
    supabase.from("other_incomes").select("*").order("created_at", { ascending: true }),
  ]);

  [
    ["settings_kegiatan", settingsRes.error],
    ["participants", participantsRes.error],
    ["participant_payments", participantPaymentsRes.error],
    ["expenses", expensesRes.error],
    ["vendor_payments", vendorPaymentsRes.error],
    ["other_incomes", otherIncomesRes.error],
  ].forEach(([label, error]) => throwIfError(`Gagal mengambil ${label}`, error));

  const hasRemoteData =
    Boolean(settingsRes.data) ||
    (participantsRes.data || []).length > 0 ||
    (participantPaymentsRes.data || []).length > 0 ||
    (expensesRes.data || []).length > 0 ||
    (vendorPaymentsRes.data || []).length > 0 ||
    (otherIncomesRes.data || []).length > 0;

  if (!hasRemoteData) return null;

  const config = settingsRes.data ? mapConfigFromDb(settingsRes.data) : createBlankState().config;
  const paymentsByParticipant = (participantPaymentsRes.data || []).reduce((acc, row) => {
    const participantId = asStringId(row.participant_id);
    acc[participantId] = acc[participantId] || [];
    acc[participantId].push(mapParticipantPaymentFromDb(row));
    return acc;
  }, {});

  return {
    config,
    participants: (participantsRes.data || []).map((row) => mapParticipantFromDb(row, paymentsByParticipant, config.iuranDefaultSantri)),
    expenses: (expensesRes.data || []).map(mapExpenseFromDb),
    vendorPayments: (vendorPaymentsRes.data || []).map(mapVendorPaymentFromDb),
    otherIncomes: (otherIncomesRes.data || []).map(mapOtherIncomeFromDb),
  };
}

export async function saveStateToSupabase(state) {
  if (!isSupabaseConfigured || !supabase) return;
  const config = normalizeConfig(state.config);

  const { error: settingsError } = await supabase
    .from("settings_kegiatan")
    .upsert(mapConfigToDb(config), { onConflict: "id" });
  throwIfError("Gagal menyimpan settings_kegiatan", settingsError);

  // await deleteAll("participant_payments");
  // await deleteAll("vendor_payments");
  // await deleteAll("other_incomes");
  // await deleteAll("expenses");
  // await deleteAll("participants");

  const participantRows = (state.participants || []).map((item) => mapParticipantToDb(item, config.iuranDefaultSantri));
  const participantPaymentRows = (state.participants || []).flatMap((participant) =>
    (participant.payments || []).map((payment) => mapParticipantPaymentToDb(payment, participant.id))
  );
  const expenseRows = (state.expenses || []).map(mapExpenseToDb);
  const vendorPaymentRows = (state.vendorPayments || []).map(mapVendorPaymentToDb);
  const otherIncomeRows = (state.otherIncomes || []).map(mapOtherIncomeToDb);

  await upsertMany("participants", participantRows);
  await upsertMany("participant_payments", participantPaymentRows);
  await upsertMany("expenses", expenseRows);
  await upsertMany("vendor_payments", vendorPaymentRows);
  await upsertMany("other_incomes", otherIncomeRows);
}
