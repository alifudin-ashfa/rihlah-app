import { useMemo, useState } from "react";
import {
  PAYMENT_METHODS,
  VENDOR_PAYMENT_TYPES,
  clampMin,
  createId,
  getToday,
  normalizeVendorPayment,
  readFileAsDataUrl,
} from "../../shared/lib/rihlahCore";
import { deleteVendorPaymentProof, uploadVendorPaymentProof } from "../../shared/lib/supabaseStorage";

export function useVendorPayments({ setVendorPayments, expenseLookup, showToast, paymentProofInputRef }) {
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
  const [showVendorPaymentAdvanced, setShowVendorPaymentAdvanced] = useState(false);
  const [isUploadingProof, setIsUploadingProof] = useState(false);

  const resetVendorPaymentForm = () => {
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
    const selectedExpense = vendorPaymentForm.expenseId ? expenseLookup[String(vendorPaymentForm.expenseId)] : null;
    const vendorName = selectedExpense ? selectedExpense.vendor || selectedExpense.nama : vendorPaymentForm.vendorManual.trim();

    if (!vendorPaymentForm.tanggal || nominal <= 0 || !vendorName) {
      showToast("Lengkapi tanggal, nominal, dan pilih tagihan atau isi nama vendor terlebih dahulu.", "rose");
      return;
    }

    const paymentId = createId();

    let proofUrl = vendorPaymentForm.buktiDataUrl;
    let proofPath = vendorPaymentForm.buktiPath;
    let proofName = vendorPaymentForm.buktiNama;

    if (vendorPaymentForm.buktiFile) {
      setIsUploadingProof(true);
      try {
        const uploaded = await uploadVendorPaymentProof({ paymentId, file: vendorPaymentForm.buktiFile });
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

    setVendorPayments((prev) => [payload, ...prev]);
    resetVendorPaymentForm();
    showToast(vendorPaymentForm.buktiFile ? "Pembayaran vendor disimpan dan bukti transfer diunggah ke Storage." : "Pembayaran vendor disimpan.", "emerald");
  };

  const removeVendorPayment = async (itemOrId) => {
    const id = typeof itemOrId === "string" ? itemOrId : itemOrId?.id;
    const target = typeof itemOrId === "object" ? itemOrId : null;
    if (!window.confirm("Hapus pembayaran vendor ini?")) return;
    try {
      if (target?.buktiPath) await deleteVendorPaymentProof(target.buktiPath);
    } catch (error) {
      showToast(error.message || "Bukti transfer gagal dihapus dari Storage.", "amber");
    }
    setVendorPayments((prev) => prev.filter((item) => item.id !== id));
  };

  const selectedExpenseForForm = vendorPaymentForm.expenseId ? expenseLookup[String(vendorPaymentForm.expenseId)] : null;
  const proofStatusText = useMemo(() => {
    if (isUploadingProof) return "Sedang mengunggah bukti transfer ke Supabase Storage...";
    if (vendorPaymentForm.buktiFile) return `File siap diunggah: ${vendorPaymentForm.buktiNama}`;
    if (vendorPaymentForm.buktiNama) return `File tersimpan: ${vendorPaymentForm.buktiNama}`;
    return "";
  }, [isUploadingProof, vendorPaymentForm.buktiFile, vendorPaymentForm.buktiNama]);

  return {
    vendorPaymentForm,
    setVendorPaymentForm,
    showVendorPaymentAdvanced,
    setShowVendorPaymentAdvanced,
    resetVendorPaymentForm,
    handleVendorProofUpload,
    addVendorPayment,
    removeVendorPayment,
    selectedExpenseForForm,
    isUploadingProof,
    proofStatusText,
  };
}
