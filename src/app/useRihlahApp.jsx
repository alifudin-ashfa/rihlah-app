import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { STORAGE_KEY, loadInitialState } from "../shared/lib/rihlahCore";
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

  const ui = useUiState(location.pathname);
  const participantsDomain = useParticipantsDomain({
    initialParticipants: initialState.participants,
    defaultTarget: configState.config.iuranDefaultSantri,
    showToast: ui.showToast,
  });
  const vendorsDomain = useVendorsDomain({
    initialExpenses: initialState.expenses,
    initialOtherIncomes: initialState.otherIncomes,
    initialVendorPayments: initialState.vendorPayments,
    showToast: ui.showToast,
    paymentProofInputRef: ui.paymentProofInputRef,
  });

  const [laporanView, setLaporanView] = useState("ringkasan");
  const [databaseStatus, setDatabaseStatus] = useState(isSupabaseConfigured ? "Menghubungkan database..." : "Mode lokal");
  const remoteReadyRef = useRef(!isSupabaseConfigured);
  const saveTimerRef = useRef(null);
  const lastSavedPayloadRef = useRef("");

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
  }, [configState.config, vendorsDomain.expenses, vendorsDomain.otherIncomes, vendorsDomain.vendorPayments, participantsDomain.participants, ui]);

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
  });

  return {
    config: configState.config,
    handleConfigChange: configState.handleConfigChange,
    laporanView,
    setLaporanView,
    databaseStatus,
    isSupabaseConfigured,
    ...ui,
    ...participantsDomain,
    ...vendorsDomain,
    ...metrics,
    ...backupAndImport,
  };
}
