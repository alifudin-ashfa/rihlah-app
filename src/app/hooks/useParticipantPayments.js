import { useMemo, useState } from "react";
import {
  PAYMENT_METHODS,
  clampMin,
  confirmDestructiveAction,
  createId,
  getToday,
  normalizeParticipantPayment,
} from "../../shared/lib/rihlahCore";
import { deleteParticipantPaymentFromSupabase } from "../../shared/lib/supabasePersistence";

export function useParticipantPayments({
  participants,
  setParticipants,
  participantLookup,
  showToast,
}) {
  const [participantPaymentForm, setParticipantPaymentForm] = useState({
    participantId: "",
    tanggal: getToday(),
    metode: PAYMENT_METHODS[0],
    akunMasuk: "",
    nominal: "",
    catatan: "",
    buktiNama: "",
    buktiDataUrl: "",
  });

  const [showPaymentAdvanced, setShowPaymentAdvanced] = useState(false);
  const [selectedPaymentParticipant, setSelectedPaymentParticipant] =
    useState("all");

  const participantPaymentHistory = useMemo(() => {
    const rows = participants.flatMap((item) =>
      (item.payments || []).map((payment) => ({
        ...payment,
        participantId: item.id,
        participantName: item.nama,
        participantClass: item.kelas,
      }))
    );

    rows.sort((a, b) => (b.tanggal || "").localeCompare(a.tanggal || ""));

    return rows.filter(
      (row) =>
        selectedPaymentParticipant === "all" ||
        String(row.participantId) === String(selectedPaymentParticipant)
    );
  }, [participants, selectedPaymentParticipant]);

  const resetParticipantPaymentForm = () => {
    setParticipantPaymentForm({
      participantId: "",
      tanggal: getToday(),
      nominal: "",
      metode: "Transfer",
      akunMasuk: "",
      catatan: "",
      buktiNama: "",
      buktiDataUrl: "",
    });
  };

  const addParticipantPayment = () => {
    if (!participantPaymentForm.participantId) {
      showToast("Pilih santri yang membayar iuran.", "rose");
      return;
    }

    if (!participantPaymentForm.tanggal) {
      showToast("Tanggal pembayaran iuran wajib diisi.", "rose");
      return;
    }

    if (clampMin(participantPaymentForm.nominal) <= 0) {
      showToast("Nominal pembayaran iuran harus lebih dari 0.", "rose");
      return;
    }

    const paymentPayload = normalizeParticipantPayment({
      id: createId(),
      tanggal: participantPaymentForm.tanggal,
      nominal: clampMin(participantPaymentForm.nominal),
      metode: participantPaymentForm.metode,
      akunMasuk: participantPaymentForm.akunMasuk.trim(),
      catatan: participantPaymentForm.catatan.trim(),
      buktiNama: participantPaymentForm.buktiNama || "",
      buktiDataUrl: participantPaymentForm.buktiDataUrl || "",
    });

    setParticipants((prev) =>
      prev.map((item) =>
        String(item.id) === String(participantPaymentForm.participantId)
          ? {
              ...item,
              payments: [
                paymentPayload,
                ...(Array.isArray(item.payments) ? item.payments : []),
              ],
            }
          : item
      )
    );

    setParticipantPaymentForm((prev) => ({
      ...prev,
      nominal: "",
      catatan: "",
      akunMasuk: "",
      buktiNama: "",
      buktiDataUrl: "",
    }));

    showToast("Pembayaran iuran disimpan.", "emerald");
  };

  const focusParticipantPaymentForm = (participantId) => {
    setParticipantPaymentForm((prev) => ({
      ...prev,
      participantId: String(participantId),
    }));

    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const removeParticipantPayment = async (participantId, paymentId) => {
    const confirmed = confirmDestructiveAction({
      title: "Hapus pembayaran iuran",
      message: "Transaksi pembayaran iuran ini akan dihapus dari histori santri.",
    });

    if (!confirmed) return;

    try {
      await deleteParticipantPaymentFromSupabase(paymentId);

      setParticipants((prev) =>
        prev.map((item) =>
          item.id === participantId
            ? {
                ...item,
                payments: (item.payments || []).filter(
                  (payment) => payment.id !== paymentId
                ),
              }
            : item
        )
      );

      showToast("Pembayaran iuran berhasil dihapus.", "emerald");
    } catch (error) {
      showToast(error.message || "Gagal menghapus pembayaran iuran.", "rose");
    }
  };

  const selectedParticipantForPayment = participantPaymentForm.participantId
    ? participantLookup[String(participantPaymentForm.participantId)]
    : null;

  return {
    participantPaymentForm,
    setParticipantPaymentForm,
    showPaymentAdvanced,
    setShowPaymentAdvanced,
    selectedPaymentParticipant,
    setSelectedPaymentParticipant,
    participantPaymentHistory,
    resetParticipantPaymentForm,
    addParticipantPayment,
    focusParticipantPaymentForm,
    removeParticipantPayment,
    selectedParticipantForPayment,
  };
}