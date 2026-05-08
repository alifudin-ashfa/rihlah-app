import { useMemo, useState } from "react";
import {
  clampMin,
  confirmDestructiveAction,
  createId,
  normalizeParticipant,
} from "../../shared/lib/rihlahCore";
import { deleteParticipantFromSupabase, upsertParticipantToSupabase } from "../../shared/lib/supabasePersistence";
import { useParticipantPayments } from "./useParticipantPayments";

export function useParticipantsDomain({ initialParticipants, defaultTarget, showToast, recordActivity }) {
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
    recordActivity,
  });

  const resetParticipantForm = () => {
    setParticipantForm({ nama: "", kelas: "", kamar: "", targetIuran: "", catatan: "" });
    setEditingParticipantId(null);
  };

  const addOrUpdateParticipant = async () => {
    const targetValue = participantForm.targetIuran === "" ? clampMin(defaultTarget) : clampMin(participantForm.targetIuran);

    if (!participantForm.nama.trim()) {
      showToast("Nama santri wajib diisi.", "rose");
      return;
    }

    if (targetValue <= 0) {
      showToast("Target iuran harus lebih dari 0. Periksa nominal default atau nominal khusus santri.", "rose");
      return;
    }

    const payload = normalizeParticipant(
      {
        id: editingParticipantId || createId(),
        nama: participantForm.nama.trim(),
        kelas: participantForm.kelas.trim(),
        kamar: participantForm.kamar.trim(),
        targetIuran: targetValue,
        catatan: participantForm.catatan.trim(),
        payments: editingParticipantId ? participantLookup[String(editingParticipantId)]?.payments || [] : [],
      },
      defaultTarget
    );

    const isEditing = Boolean(editingParticipantId);

    try {
      await upsertParticipantToSupabase(payload, defaultTarget);

      if (isEditing) {
        setParticipants((prev) => prev.map((item) => (item.id === editingParticipantId ? payload : item)));
      } else {
        setParticipants((prev) => [payload, ...prev]);
      }

      recordActivity?.({
        type: "santri",
        title: isEditing ? "Edit data santri" : "Tambah santri",
        description: `${payload.nama || "Santri"} ${isEditing ? "diperbarui" : "ditambahkan"} dengan target iuran ${payload.targetIuran}.`,
        tone: "info",
      });

      resetParticipantForm();
      showToast(isEditing ? "Data santri diperbarui dan tersimpan ke Supabase." : "Santri baru ditambahkan dan tersimpan ke Supabase.", "emerald");
    } catch (error) {
      showToast(error.message || "Gagal menyimpan data santri ke Supabase.", "rose");
    }
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

  const removeParticipant = async (participantId) => {
    const confirmed = confirmDestructiveAction({
      title: "Hapus data santri",
      message: "Data santri dan seluruh histori pembayaran iurannya akan dihapus. Aksi ini tidak bisa dibatalkan.",
      confirmationText: "HAPUS",
    });
    if (!confirmed) return;

    try {
      await deleteParticipantFromSupabase(participantId);

      const deletedParticipant = participantLookup[String(participantId)];

      setParticipants((prev) => prev.filter((item) => item.id !== participantId));

      recordActivity?.({
        type: "santri",
        title: "Hapus data santri",
        description: `${deletedParticipant?.nama || "Santri"} dan histori pembayaran iurannya dihapus.`,
        tone: "danger",
      });

      if (editingParticipantId === participantId) resetParticipantForm();
      if (paymentDomain.participantPaymentForm.participantId === String(participantId)) {
        paymentDomain.setParticipantPaymentForm((prev) => ({ ...prev, participantId: "" }));
      }

      showToast("Data santri berhasil dihapus.", "emerald");
    } catch (error) {
      showToast(error.message || "Gagal menghapus data santri.", "rose");
    }
  };

  const applyDefaultTargetToAll = () => {
    const confirmed = confirmDestructiveAction({
      title: "Samakan target iuran",
      message: "Target iuran semua santri akan diganti menjadi nominal default saat ini.",
    });
    if (!confirmed) return;
    setParticipants((prev) => prev.map((item) => ({ ...item, targetIuran: clampMin(defaultTarget) })));

    recordActivity?.({
      type: "santri",
      title: "Samakan target iuran",
      description: `Target iuran semua santri diganti menjadi ${clampMin(defaultTarget)}.`,
      tone: "important",
    });
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
