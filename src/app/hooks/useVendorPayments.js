import { deleteVendorPaymentFromSupabase, upsertVendorPaymentToSupabase } from "../../shared/lib/supabasePersistence";
import { useMemo, useState } from "react";
import {
  PAYMENT_METHODS,
  VENDOR_PAYMENT_TYPES,
  clampMin,
  confirmDestructiveAction,
  createId,
  getToday,
  normalizeVendorPayment,
  readFileAsDataUrl,
} from "../../shared/lib/rihlahCore";
import {
  createVendorPaymentProofSignedUrl,
  deleteVendorPaymentProof,
  uploadVendorPaymentProof,
} from "../../shared/lib/supabaseStorage";

export function useVendorPayments({ setVendorPayments, expenseLookup, showToast, paymentProofInputRef, recordActivity }) {
  const [vendorPaymentForm, setVendorPaymentForm] = useState({
    expenseId: "",
    vendorManual: "",
    jenis: VENDOR_PAYMENT_TYPES[0],
    tanggal: getToday(),
    metode: PAYMENT_METHODS[0],
    akunTujuan: "",
    nominal: "",
    biayaAdmin: "",
    catatan: "",
    buktiNama: "",
    buktiDataUrl: "",
    buktiPath: "",
    buktiFile: null,
  });
  const [editingVendorPaymentId, setEditingVendorPaymentId] = useState(null);
  const [showVendorPaymentAdvanced, setShowVendorPaymentAdvanced] = useState(false);
  const [isUploadingProof, setIsUploadingProof] = useState(false);

  const resetVendorPaymentForm = () => {
    setEditingVendorPaymentId(null);
    setVendorPaymentForm({
      expenseId: "",
      vendorManual: "",
      jenis: VENDOR_PAYMENT_TYPES[0],
      tanggal: getToday(),
      metode: PAYMENT_METHODS[0],
      akunTujuan: "",
      nominal: "",
      biayaAdmin: "",
      catatan: "",
      buktiNama: "",
      buktiDataUrl: "",
      buktiPath: "",
      buktiFile: null,
    });
    if (paymentProofInputRef.current) paymentProofInputRef.current.value = "";
  };

  const handleVendorProofUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (file.size > 5_000_000) {
      showToast("Ukuran file maksimal 5 MB untuk bukti transfer.", "rose");
      event.target.value = "";
      return;
    }
    try {
      const dataUrl = await readFileAsDataUrl(file);
      setVendorPaymentForm((prev) => ({ ...prev, buktiNama: file.name, buktiDataUrl: dataUrl, buktiFile: file }));
      showToast("File bukti siap diunggah ke Supabase Storage saat pembayaran disimpan.", "sky");
    } catch {
      showToast("Gagal membaca file bukti transfer.", "rose");
      event.target.value = "";
    }
  };

  const addVendorPayment = async () => {
    const nominal = clampMin(vendorPaymentForm.nominal);
    const biayaAdmin = clampMin(vendorPaymentForm.biayaAdmin);
    const isEditing = Boolean(editingVendorPaymentId);
    const selectedExpense = vendorPaymentForm.expenseId
      ? expenseLookup[String(vendorPaymentForm.expenseId)]
      : null;
    const vendorName = selectedExpense
      ? selectedExpense.vendor || selectedExpense.nama
      : vendorPaymentForm.vendorManual.trim();

    if (!vendorName) {
      showToast("Pilih tagihan vendor atau isi nama vendor manual.", "rose");
      return;
    }
    if (!vendorPaymentForm.tanggal) {
      showToast("Tanggal pembayaran vendor wajib diisi.", "rose");
      return;
    }
    if (nominal <= 0) {
      showToast("Nominal pembayaran vendor harus lebih dari 0.", "rose");
      return;
    }

    const paymentId = editingVendorPaymentId || createId();

    let proofUrl = vendorPaymentForm.buktiDataUrl;
    let proofPath = vendorPaymentForm.buktiPath;
    let proofName = vendorPaymentForm.buktiNama;

    if (vendorPaymentForm.buktiFile) {
      setIsUploadingProof(true);
      try {
        const uploaded = await uploadVendorPaymentProof({
          paymentId,
          file: vendorPaymentForm.buktiFile,
        });
        proofUrl = uploaded.publicUrl || proofUrl;
        proofPath = uploaded.path || "";
        proofName = uploaded.fileName || proofName;
      } catch (error) {
        showToast(error.message || "Gagal upload bukti transfer ke Storage.", "rose");
        setIsUploadingProof(false);
        return;
      } finally {
        setIsUploadingProof(false);
      }
    }

    const payload = normalizeVendorPayment({
      id: paymentId,
      expenseId: selectedExpense?.id || "",
      vendorSnapshot: vendorName,
      jenis: vendorPaymentForm.jenis,
      tanggal: vendorPaymentForm.tanggal,
      metode: vendorPaymentForm.metode,
      akunTujuan: vendorPaymentForm.akunTujuan.trim(),
      nominal,
      biayaAdmin,
      buktiNama: proofName,
      buktiDataUrl: proofUrl,
      buktiPath: proofPath,
      catatan: vendorPaymentForm.catatan.trim(),
    });

    try {
      await upsertVendorPaymentToSupabase(payload);

      if (isEditing) {
        setVendorPayments((prev) =>
          prev.map((item) => (String(item.id) === String(paymentId) ? payload : item))
        );
      } else {
        setVendorPayments((prev) => [payload, ...prev]);
      }

      recordActivity?.({
        type: "vendor-payment",
        title: isEditing ? "Edit pembayaran vendor" : "Tambah pembayaran vendor",
        description: `${vendorName} ${isEditing ? "diperbarui" : "dicatat"} dengan nominal ${nominal}.`,
        tone: isEditing ? "info" : "important",
      });

      resetVendorPaymentForm();
      showToast(
        isEditing
          ? "Pembayaran vendor diperbarui dan tersimpan ke Supabase."
          : vendorPaymentForm.buktiFile
            ? "Pembayaran vendor disimpan dan bukti transfer diunggah ke Storage."
            : "Pembayaran vendor disimpan dan tersimpan ke Supabase.",
        "emerald"
      );
    } catch (error) {
      showToast(error.message || "Gagal menyimpan pembayaran vendor ke Supabase.", "rose");
    }
  };

  const editVendorPayment = (payment) => {
    const item = normalizeVendorPayment(payment);
    const linkedExpense = item.expenseId ? expenseLookup[String(item.expenseId)] : null;

    setEditingVendorPaymentId(item.id);
    setVendorPaymentForm({
      expenseId: item.expenseId || "",
      vendorManual: linkedExpense ? "" : item.vendorSnapshot || "",
      jenis: item.jenis || VENDOR_PAYMENT_TYPES[0],
      tanggal: item.tanggal || getToday(),
      metode: item.metode || PAYMENT_METHODS[0],
      akunTujuan: item.akunTujuan || "",
      nominal: String(item.nominal || ""),
      biayaAdmin: item.biayaAdmin ? String(item.biayaAdmin) : "",
      catatan: item.catatan || "",
      buktiNama: item.buktiNama || "",
      buktiDataUrl: item.buktiDataUrl || "",
      buktiPath: item.buktiPath || "",
      buktiFile: null,
    });
    setShowVendorPaymentAdvanced(true);

    if (paymentProofInputRef.current) paymentProofInputRef.current.value = "";
  };

  const removeVendorPayment = async (itemOrId) => {
    const id = typeof itemOrId === "string" ? itemOrId : itemOrId?.id;
    const target = typeof itemOrId === "object" ? itemOrId : null;
    const confirmed = confirmDestructiveAction({
      title: "Hapus pembayaran vendor",
      message: "Transaksi pembayaran vendor dan bukti transfer yang tertaut akan dihapus bila ada.",
    });
    if (!confirmed) return;
    try {
      if (target?.buktiPath) await deleteVendorPaymentProof(target.buktiPath);
    } catch (error) {
      showToast(error.message || "Bukti transfer gagal dihapus dari Storage.", "amber");
    }
    try {
      await deleteVendorPaymentFromSupabase(id);
    } catch (error) {
      showToast(error.message || "Gagal menghapus pembayaran vendor dari Supabase.", "amber");
    }
    setVendorPayments((prev) => prev.filter((item) => item.id !== id));
    showToast("Pembayaran vendor berhasil dihapus.", "emerald");
  };

  const selectedExpenseForForm = vendorPaymentForm.expenseId ? expenseLookup[String(vendorPaymentForm.expenseId)] : null;
  const proofStatusText = useMemo(() => {
    if (isUploadingProof) return "Sedang mengunggah bukti transfer ke Supabase Storage...";
    if (vendorPaymentForm.buktiFile) return `File siap diunggah: ${vendorPaymentForm.buktiNama}`;
    if (vendorPaymentForm.buktiNama) return `File tersimpan: ${vendorPaymentForm.buktiNama}`;
    return "";
  }, [isUploadingProof, vendorPaymentForm.buktiFile, vendorPaymentForm.buktiNama]);

  const refreshVendorProofUrl = async (payment) => {
  if (!payment?.buktiPath) return "";

  try {
    return await createVendorPaymentProofSignedUrl(payment.buktiPath);
  } catch (error) {
    showToast(error.message || "Gagal membuka bukti pembayaran.", "rose");
    return "";
  }
  };

  return {
  vendorPaymentForm,
  setVendorPaymentForm,
  editingVendorPaymentId,
  showVendorPaymentAdvanced,
  setShowVendorPaymentAdvanced,
  resetVendorPaymentForm,
  handleVendorProofUpload,
  addVendorPayment,
  editVendorPayment,
  removeVendorPayment,
  refreshVendorProofUrl,
  selectedExpenseForForm,
  isUploadingProof,
  proofStatusText,
  };
}
