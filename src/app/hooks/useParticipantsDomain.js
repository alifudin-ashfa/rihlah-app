import { useMemo, useState } from "react";
import {
  clampMin,
  createId,
  normalizeParticipant,
} from "../../shared/lib/rihlahCore";
import { useParticipantPayments } from "./useParticipantPayments";

export function useParticipantsDomain({ initialParticipants, defaultTarget, showToast }) {
  const [participants, setParticipants] = useState(initialParticipants);
  const [participantForm, setParticipantForm] = useState({
    nama: "",
    kelas: "",
    kamar: "",
    targetIuran: "",
    catatan: "",
  });
  const [editingParticipantId, setEditingParticipantId] = useState(null);
  const [participantSearch, setParticipantSearch] = useState("");
  const [participantStatusFilter, setParticipantStatusFilter] = useState("Semua");
  const [expandedParticipants, setExpandedParticipants] = useState({});
  const [showParticipantAdvanced, setShowParticipantAdvanced] = useState(false);

  const participantRows = useMemo(() => {
    return participants
      .map((item) => normalizeParticipant(item, defaultTarget))
      .map((item) => {
        const paymentsSorted = [...item.payments].sort((a, b) => (b.tanggal || "").localeCompare(a.tanggal || ""));
        const totalPaid = paymentsSorted.reduce((sum, payment) => sum + clampMin(payment.nominal), 0);
        const remaining = Math.max(item.targetIuran - totalPaid, 0);
        const overpaid = Math.max(totalPaid - item.targetIuran, 0);
        const status = totalPaid <= 0 ? "Belum Bayar" : remaining <= 0 ? "Lunas" : "Cicilan";
        return {
          ...item,
          payments: paymentsSorted,
          totalPaid,
          remaining,
          overpaid,
          status,
          lastPaymentDate: paymentsSorted[0]?.tanggal || "",
        };
      })
      .sort((a, b) => a.nama.localeCompare(b.nama));
  }, [participants, defaultTarget]);

  const participantLookup = useMemo(
    () => Object.fromEntries(participantRows.map((item) => [String(item.id), item])),
    [participantRows]
  );

  const filteredParticipants = useMemo(() => {
    const keyword = participantSearch.trim().toLowerCase();
    return participantRows.filter((item) => {
      const searchable = [item.nama, item.kelas, item.kamar, item.status, item.catatan].join(" ").toLowerCase();
      const matchesKeyword = !keyword || searchable.includes(keyword);
      const matchesStatus = participantStatusFilter === "Semua" || item.status === participantStatusFilter;
      return matchesKeyword && matchesStatus;
    });
  }, [participantRows, participantSearch, participantStatusFilter]);

  const jumlahSantri = participantRows.length;
  const jumlahLunas = participantRows.filter((item) => item.status === "Lunas").length;
  const jumlahCicilan = participantRows.filter((item) => item.status === "Cicilan").length;
  const jumlahBelumBayar = participantRows.filter((item) => item.status === "Belum Bayar").length;

  const paymentDomain = useParticipantPayments({
    participants: participantRows,
    setParticipants,
    participantLookup,
    showToast,
  });

  const resetParticipantForm = () => {
    setParticipantForm({ nama: "", kelas: "", kamar: "", targetIuran: "", catatan: "" });
    setEditingParticipantId(null);
  };

  const addOrUpdateParticipant = () => {
    if (!participantForm.nama.trim()) {
      showToast("Nama santri wajib diisi.", "rose");
      return;
    }

    const payload = normalizeParticipant(
      {
        id: editingParticipantId || createId(),
        nama: participantForm.nama.trim(),
        kelas: participantForm.kelas.trim(),
        kamar: participantForm.kamar.trim(),
        targetIuran: participantForm.targetIuran === "" ? clampMin(defaultTarget) : clampMin(participantForm.targetIuran),
        catatan: participantForm.catatan.trim(),
        payments: editingParticipantId ? participantLookup[String(editingParticipantId)]?.payments || [] : [],
      },
      defaultTarget
    );

    if (editingParticipantId) {
      setParticipants((prev) => prev.map((item) => (item.id === editingParticipantId ? payload : item)));
    } else {
      setParticipants((prev) => [payload, ...prev]);
    }
    resetParticipantForm();
    showToast(editingParticipantId ? "Data santri diperbarui." : "Santri baru ditambahkan.", "emerald");
  };

  const editParticipant = (item) => {
    setEditingParticipantId(item.id);
    setParticipantForm({
      nama: item.nama,
      kelas: item.kelas || "",
      kamar: item.kamar || "",
      targetIuran: String(item.targetIuran ?? ""),
      catatan: item.catatan || "",
    });
  };

  const removeParticipant = (participantId) => {
    if (!window.confirm("Hapus data santri beserta histori pembayarannya?")) return;
    setParticipants((prev) => prev.filter((item) => item.id !== participantId));
    if (editingParticipantId === participantId) resetParticipantForm();
    if (paymentDomain.participantPaymentForm.participantId === String(participantId)) {
      paymentDomain.setParticipantPaymentForm((prev) => ({ ...prev, participantId: "" }));
    }
  };

  const applyDefaultTargetToAll = () => {
    if (!window.confirm("Samakan target iuran semua santri dengan nominal default saat ini?")) return;
    setParticipants((prev) => prev.map((item) => ({ ...item, targetIuran: clampMin(defaultTarget) })));
  };

  return {
    participants,
    setParticipants,
    participantForm,
    setParticipantForm,
    editingParticipantId,
    participantSearch,
    setParticipantSearch,
    participantStatusFilter,
    setParticipantStatusFilter,
    expandedParticipants,
    setExpandedParticipants,
    showParticipantAdvanced,
    setShowParticipantAdvanced,
    participantRows,
    participantLookup,
    filteredParticipants,
    jumlahSantri,
    jumlahLunas,
    jumlahCicilan,
    jumlahBelumBayar,
    resetParticipantForm,
    addOrUpdateParticipant,
    editParticipant,
    removeParticipant,
    applyDefaultTargetToAll,
    ...paymentDomain,
  };
}
