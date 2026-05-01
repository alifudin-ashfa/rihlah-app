import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { STORAGE_KEY, createActivityLogEntry, loadInitialState, normalizeActivityLogs } from "../shared/lib/rihlahCore";
import { isSupabaseConfigured } from "../shared/lib/supabaseClient";
import { loadStateFromSupabase, saveStateToSupabase } from "../shared/lib/supabasePersistence";
import { useUiState } from "./hooks/useUiState";
import { useParticipantsDomain } from "./hooks/useParticipantsDomain";
import { useVendorsDomain } from "./hooks/useVendorsDomain";
import { useFinanceMetrics } from "./hooks/useFinanceMetrics";
import { useConfigSettings } from "./hooks/useConfigSettings";
import { useBackupAndImport } from "./hooks/useBackupAndImport";

export function useRihlahApp() {
  const location = useLocation();
  const initialState = useMemo(() => loadInitialState(), []);
  const configState = useConfigSettings(initialState.config);
  const [activityLogs, setActivityLogs] = useState(
    normalizeActivityLogs(initialState.activityLogs)
  );

  const recordActivity = (activity) => {
    const entry = createActivityLogEntry(activity);

    setActivityLogs((prev) =>
      [entry, ...(Array.isArray(prev) ? prev : [])].slice(0, 200)
    );

    return entry;
  };

  const ui = useUiState(location.pathname);
  const participantsDomain = useParticipantsDomain({
    initialParticipants: initialState.participants,
    defaultTarget: configState.config.iuranDefaultSantri,
    showToast: ui.showToast,
    recordActivity,
  });
  const vendorsDomain = useVendorsDomain({
    initialExpenses: initialState.expenses,
    initialOtherIncomes: initialState.otherIncomes,
    initialVendorPayments: initialState.vendorPayments,
    showToast: ui.showToast,
    paymentProofInputRef: ui.paymentProofInputRef,
    recordActivity,
  });

  const [laporanView, setLaporanView] = useState("ringkasan");
  const [databaseStatus, setDatabaseStatus] = useState(isSupabaseConfigured ? "Menghubungkan database..." : "Mode lokal");
  const remoteReadyRef = useRef(!isSupabaseConfigured);
  const saveTimerRef = useRef(null);
  const lastSavedPayloadRef = useRef("");
  const isFinalLocked = Boolean(configState.config?.finalisasiData?.terkunci);
  const canManageData = Boolean(ui.canEdit && !isFinalLocked);

  const guardFinalLock = (actionName, action) => (...args) => {
    if (isFinalLocked) {
      ui.showToast(
        `Data final sedang dikunci. Buka kunci terlebih dahulu untuk ${actionName}.`,
        "amber"
      );
      return undefined;
    }

    return action?.(...args);
  };

  const lockFinalData = () => {
    const locked = configState.lockFinalData();

    if (locked) {
      recordActivity({
        type: "final-lock",
        title: "Kunci data final",
        description: "Mode Final Aktif. Data utama dikunci untuk mencegah perubahan tidak sengaja.",
        tone: "important",
      });
      ui.showToast("Mode Final Aktif. Data utama berhasil dikunci.", "emerald");
    }
  };

  const unlockFinalData = () => {
    const unlocked = configState.unlockFinalData();

    if (unlocked) {
      recordActivity({
        type: "final-lock",
        title: "Buka kunci data final",
        description: "Mode Final dibuka. Data utama bisa diedit kembali.",
        tone: "danger",
      });
      ui.showToast("Kunci data final dibuka. Data bisa diedit kembali.", "amber");
    }
  };

  useEffect(() => {
    let cancelled = false;

    const hydrateFromSupabase = async () => {
      if (!isSupabaseConfigured) return;
      try {
        const remoteState = await loadStateFromSupabase();
        if (cancelled) return;

        if (remoteState) {
          configState.setConfig(remoteState.config);
          participantsDomain.setParticipants(remoteState.participants);
          vendorsDomain.setExpenses(remoteState.expenses);
          vendorsDomain.setOtherIncomes(remoteState.otherIncomes);
          vendorsDomain.setVendorPayments(remoteState.vendorPayments);
          setActivityLogs(normalizeActivityLogs(remoteState.activityLogs));
          setDatabaseStatus("Terhubung ke Supabase");
          ui.showToast("Data berhasil dimuat dari Supabase.", "emerald");
        } else {
          setDatabaseStatus("Supabase siap. Data lokal akan disinkronkan.");
          ui.showToast("Database kosong. Data lokal akan disinkronkan ke Supabase.", "sky");
        }
      } catch (error) {
        console.error(error);
        setDatabaseStatus("Gagal terhubung ke Supabase. Mode lokal aktif.");
        ui.showToast(error.message || "Gagal terhubung ke Supabase. Mode lokal aktif.", "rose");
      } finally {
        if (!cancelled) remoteReadyRef.current = true;
      }
    };

    hydrateFromSupabase();

    return () => {
      cancelled = true;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const payload = {
      config: configState.config,
      expenses: vendorsDomain.expenses,
      otherIncomes: vendorsDomain.otherIncomes,
      vendorPayments: vendorsDomain.vendorPayments,
      participants: participantsDomain.participants,
      activityLogs,
    };
    const serialized = JSON.stringify(payload);
    localStorage.setItem(STORAGE_KEY, serialized);

    if (!isSupabaseConfigured || !remoteReadyRef.current) return;
    if (serialized === lastSavedPayloadRef.current) return;

    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = window.setTimeout(async () => {
      try {
        await saveStateToSupabase(payload);
        lastSavedPayloadRef.current = serialized;
        setDatabaseStatus("Tersimpan di Supabase");
      } catch (error) {
        console.error(error);
        setDatabaseStatus("Gagal menyimpan ke Supabase");
        ui.showToast(error.message || "Gagal menyimpan data ke Supabase.", "rose");
      }
    }, 900);

    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, [configState.config, vendorsDomain.expenses, vendorsDomain.otherIncomes, vendorsDomain.vendorPayments, participantsDomain.participants, activityLogs, ui]);

  const metrics = useFinanceMetrics({
    config: configState.config,
    participantRows: participantsDomain.participantRows,
    otherIncomes: vendorsDomain.otherIncomes,
    expenseRows: vendorsDomain.expenseRows,
    vendorPaymentRows: vendorsDomain.vendorPaymentRows,
  });

  const backupAndImport = useBackupAndImport({
    config: configState,
    participantsDomain,
    vendorsDomain,
    metrics,
    showToast: ui.showToast,
    activityLogs,
    setActivityLogs,
    recordActivity,
  });

  const withActivityLog = (action, activityFactory) => (...args) => {
    const result = action?.(...args);

    const writeLog = () => {
      const activity =
        typeof activityFactory === "function" ? activityFactory(...args) : activityFactory;

      if (activity) recordActivity(activity);
    };

    if (result && typeof result.then === "function") {
      return result.then((value) => {
        writeLog();
        return value;
      });
    }

    writeLog();
    return result;
  };

  return {
    config: configState.config,
    handleConfigChange: guardFinalLock("mengubah pengaturan kegiatan", configState.handleConfigChange),
    laporanView,
    setLaporanView,
    databaseStatus,
    isSupabaseConfigured,
    isFinalLocked,
    canManageData,
    activityLogs,
    setActivityLogs,
    recordActivity,
    lockFinalData,
    unlockFinalData,
    ...ui,
    canEdit: ui.canEdit,
    ...participantsDomain,
    addOrUpdateParticipant: guardFinalLock("menyimpan data santri", participantsDomain.addOrUpdateParticipant),
    editParticipant: guardFinalLock("mengedit data santri", participantsDomain.editParticipant),
    removeParticipant: guardFinalLock("menghapus data santri", participantsDomain.removeParticipant),
    resetParticipantForm: guardFinalLock("membatalkan edit santri", participantsDomain.resetParticipantForm),
    addParticipantPayment: guardFinalLock(
      "mencatat pembayaran santri",
      withActivityLog(participantsDomain.addParticipantPayment, () => ({
        type: "iuran",
        title: "Tambah pembayaran iuran",
        description: "Pembayaran iuran santri dicatat.",
        tone: "important",
      }))
    ),
    focusParticipantPaymentForm: guardFinalLock("mencatat pembayaran santri", participantsDomain.focusParticipantPaymentForm),
    removeParticipantPayment: guardFinalLock(
      "menghapus pembayaran santri",
      withActivityLog(participantsDomain.removeParticipantPayment, () => ({
        type: "iuran",
        title: "Hapus pembayaran iuran",
        description: "Pembayaran iuran santri dihapus.",
        tone: "danger",
      }))
    ),
    applyDefaultTargetToAll: guardFinalLock("menerapkan target iuran", participantsDomain.applyDefaultTargetToAll),
    ...vendorsDomain,
    addOrUpdateExpense: guardFinalLock("menyimpan tagihan vendor", vendorsDomain.addOrUpdateExpense),
    editExpense: guardFinalLock("mengedit tagihan vendor", vendorsDomain.editExpense),
    removeExpense: guardFinalLock("menghapus tagihan vendor", vendorsDomain.removeExpense),
    addOrUpdateIncome: guardFinalLock("menyimpan pemasukan lain", vendorsDomain.addOrUpdateIncome),
    editIncome: guardFinalLock("mengedit pemasukan lain", vendorsDomain.editIncome),
    removeIncome: guardFinalLock("menghapus pemasukan lain", vendorsDomain.removeIncome),
    handleVendorProofUpload: guardFinalLock("mengunggah bukti vendor", vendorsDomain.handleVendorProofUpload),
    addVendorPayment: guardFinalLock(
      "mencatat pembayaran vendor",
      withActivityLog(vendorsDomain.addVendorPayment, () => ({
        type: "vendor-payment",
        title: "Tambah pembayaran vendor",
        description: "Pembayaran vendor dicatat.",
        tone: "important",
      }))
    ),
    removeVendorPayment: guardFinalLock(
      "menghapus pembayaran vendor",
      withActivityLog(vendorsDomain.removeVendorPayment, () => ({
        type: "vendor-payment",
        title: "Hapus pembayaran vendor",
        description: "Pembayaran vendor dihapus.",
        tone: "danger",
      }))
    ),
    resetExpenseForm: guardFinalLock("membatalkan edit tagihan vendor", vendorsDomain.resetExpenseForm),
    resetIncomeForm: guardFinalLock("membatalkan edit pemasukan lain", vendorsDomain.resetIncomeForm),
    resetVendorPaymentForm: guardFinalLock("membatalkan form pembayaran vendor", vendorsDomain.resetVendorPaymentForm),
    ...metrics,
    ...backupAndImport,
    importBackup: guardFinalLock("mengimpor data", backupAndImport.importBackup),
    loadSampleData: guardFinalLock("memuat data contoh", backupAndImport.loadSampleData),
    resetAllData: guardFinalLock("mereset data", backupAndImport.resetAllData),
  };
}
