import { useMemo, useState } from "react";
import {
  PAYMENT_METHODS,
  clampMin,
  createId,
  getToday,
  normalizeParticipantPayment,
} from "../../shared/lib/rihlahCore";

export function useParticipantPayments({ participants, setParticipants, participantLookup, showToast }) {
  const [participantPaymentForm, setParticipantPaymentForm] = useState({
    participantId: "",
    tanggal: getToday(),
    metode: PAYMENT_METHODS[0],
    akunMasuk: "",
    nominal: "",
    catatan: "",
  });
  const [showPaymentAdvanced, setShowPaymentAdvanced] = useState(false);
  const [selectedPaymentParticipant, setSelectedPaymentParticipant] = useState("all");

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
    return rows.filter((row) => selectedPaymentParticipant === "all" || String(row.participantId) === String(selectedPaymentParticipant));
  }, [participants, selectedPaymentParticipant]);

  const resetParticipantPaymentForm = () => {
    setParticipantPaymentForm({
      participantId: "",
      tanggal: getToday(),
      metode: PAYMENT_METHODS[0],
      akunMasuk: "",
      nominal: "",
      catatan: "",
    });
  };

  const addParticipantPayment = () => {
    if (!participantPaymentForm.participantId || !participantPaymentForm.tanggal || clampMin(participantPaymentForm.nominal) <= 0) {
      showToast("Pilih santri, isi tanggal, dan nominal pembayaran iuran.", "rose");
      return;
    }

    const paymentPayload = normalizeParticipantPayment({
      id: createId(),
      tanggal: participantPaymentForm.tanggal,
      nominal: clampMin(participantPaymentForm.nominal),
      metode: participantPaymentForm.metode,
      akunMasuk: participantPaymentForm.akunMasuk.trim(),
      catatan: participantPaymentForm.catatan.trim(),
    });

    setParticipants((prev) =>
      prev.map((item) =>
        String(item.id) === String(participantPaymentForm.participantId)
          ? { ...item, payments: [paymentPayload, ...(Array.isArray(item.payments) ? item.payments : [])] }
          : item
      )
    );

    setParticipantPaymentForm((prev) => ({ ...prev, nominal: "", catatan: "", akunMasuk: "" }));
    showToast("Pembayaran iuran disimpan.", "emerald");
  };

  const focusParticipantPaymentForm = (participantId) => {
    setParticipantPaymentForm((prev) => ({ ...prev, participantId: String(participantId) }));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const removeParticipantPayment = (participantId, paymentId) => {
    if (!window.confirm("Hapus transaksi pembayaran iuran ini?")) return;
    setParticipants((prev) =>
      prev.map((item) =>
        item.id === participantId
          ? { ...item, payments: (item.payments || []).filter((payment) => payment.id !== paymentId) }
          : item
      )
    );
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
