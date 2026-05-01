import { deleteExpenseFromSupabase } from "../../shared/lib/supabasePersistence";
import { useMemo, useState } from "react";
import {
  EXPENSE_CATEGORIES,
  INCOME_SOURCES,
  PAYMENT_METHODS,
  clampMin,
  confirmDestructiveAction,
  createId,
  getToday,
  normalizeExpense,
  normalizeOtherIncome,
  normalizeVendorPayment,
} from "../../shared/lib/rihlahCore";
import { useVendorPayments } from "./useVendorPayments";

export function useVendorsDomain({ initialExpenses, initialOtherIncomes, initialVendorPayments, showToast, paymentProofInputRef, recordActivity }) {
  const [expenses, setExpenses] = useState(initialExpenses);
  const [otherIncomes, setOtherIncomes] = useState(initialOtherIncomes);
  const [vendorPayments, setVendorPayments] = useState(initialVendorPayments);

  const [expenseForm, setExpenseForm] = useState({
    nama: "",
    kategori: EXPENSE_CATEGORIES[0],
    vendor: "",
    nominal: "",
    jatuhTempo: "",
    catatan: "",
  });
  const [editingExpenseId, setEditingExpenseId] = useState(null);

  const [incomeForm, setIncomeForm] = useState({
    nama: "",
    sumber: INCOME_SOURCES[0],
    tanggal: getToday(),
    metode: PAYMENT_METHODS[0],
    akunMasuk: "",
    nominal: "",
    catatan: "",
  });
  const [editingIncomeId, setEditingIncomeId] = useState(null);

  const [vendorStatusFilter, setVendorStatusFilter] = useState("Semua");
  const [vendorView, setVendorView] = useState("tagihan");
  const [showIncomeAdvanced, setShowIncomeAdvanced] = useState(false);
  const [showExpenseAdvanced, setShowExpenseAdvanced] = useState(false);
  const [selectedVendorFilter, setSelectedVendorFilter] = useState("Semua");

  const vendorPaymentRows = useMemo(
    () => [...vendorPayments].map(normalizeVendorPayment).sort((a, b) => (b.tanggal || "").localeCompare(a.tanggal || "")),
    [vendorPayments]
  );

  const expensePaymentTotals = useMemo(() => {
    return vendorPaymentRows.reduce((acc, item) => {
      if (!item.expenseId) return acc;
      acc[item.expenseId] = (acc[item.expenseId] || 0) + clampMin(item.nominal);
      return acc;
    }, {});
  }, [vendorPaymentRows]);

  const expenseRows = useMemo(() => {
    return expenses
      .map(normalizeExpense)
      .map((item) => {
        const paid = expensePaymentTotals[item.id] || 0;
        const remaining = Math.max(item.nominal - paid, 0);
        const overpaid = Math.max(paid - item.nominal, 0);
        const status = paid <= 0 ? "Belum Dibayar" : overpaid > 0 ? "Lebih Bayar" : remaining <= 0 ? "Lunas" : "DP / Cicilan";
        const isOverdue = Boolean(item.jatuhTempo) && item.jatuhTempo < getToday() && remaining > 0;
        return { ...item, paid, remaining, overpaid, status, isOverdue };
      })
      .sort((a, b) => (a.jatuhTempo || "9999-99-99").localeCompare(b.jatuhTempo || "9999-99-99"));
  }, [expenses, expensePaymentTotals]);

  const expenseLookup = useMemo(() => Object.fromEntries(expenseRows.map((item) => [String(item.id), item])), [expenseRows]);

  const filteredExpenseRows = useMemo(
    () => expenseRows.filter((item) => vendorStatusFilter === "Semua" || item.status === vendorStatusFilter),
    [expenseRows, vendorStatusFilter]
  );

  const filteredVendorPayments = useMemo(() => {
    return vendorPaymentRows.filter((item) => {
      const vendorName = expenseLookup[String(item.expenseId)]?.vendor || item.vendorSnapshot || "Tanpa vendor";
      const matchesVendor = selectedVendorFilter === "Semua" || vendorName === selectedVendorFilter;
      return matchesVendor;
    });
  }, [vendorPaymentRows, selectedVendorFilter, expenseLookup]);

  const vendorFilterOptions = useMemo(() => {
    return [
      "Semua",
      ...Array.from(new Set(vendorPaymentRows.map((item) => expenseLookup[String(item.expenseId)]?.vendor || item.vendorSnapshot).filter(Boolean))),
    ];
  }, [vendorPaymentRows, expenseLookup]);

  const paymentDomain = useVendorPayments({
    setVendorPayments,
    expenseLookup,
    showToast,
    paymentProofInputRef,
  });

  const resetExpenseForm = () => {
    setExpenseForm({ nama: "", kategori: EXPENSE_CATEGORIES[0], vendor: "", nominal: "", jatuhTempo: "", catatan: "" });
    setEditingExpenseId(null);
  };

  const resetIncomeForm = () => {
    setIncomeForm({ nama: "", sumber: INCOME_SOURCES[0], tanggal: getToday(), metode: PAYMENT_METHODS[0], akunMasuk: "", nominal: "", catatan: "" });
    setEditingIncomeId(null);
  };

  const addOrUpdateExpense = () => {
    if (!expenseForm.nama.trim()) {
      showToast("Nama tagihan wajib diisi.", "rose");
      return;
    }
    if (!expenseForm.vendor.trim()) {
      showToast("Nama vendor wajib diisi.", "rose");
      return;
    }
    if (clampMin(expenseForm.nominal) <= 0) {
      showToast("Nominal tagihan vendor harus lebih dari 0.", "rose");
      return;
    }

    const payload = normalizeExpense({
      id: editingExpenseId || createId(),
      nama: expenseForm.nama.trim(),
      kategori: expenseForm.kategori,
      vendor: expenseForm.vendor.trim(),
      nominal: clampMin(expenseForm.nominal),
      jatuhTempo: expenseForm.jatuhTempo,
      catatan: expenseForm.catatan.trim(),
    });

    const isEditing = Boolean(editingExpenseId);

    if (isEditing) {
      setExpenses((prev) => prev.map((item) => (item.id === editingExpenseId ? payload : item)));
    } else {
      setExpenses((prev) => [payload, ...prev]);
    }

    recordActivity?.({
      type: "vendor",
      title: isEditing ? "Edit tagihan vendor" : "Tambah tagihan vendor",
      description: `${payload.nama || "Tagihan vendor"} untuk ${payload.vendor || "vendor"} ${isEditing ? "diperbarui" : "ditambahkan"} dengan nominal ${payload.nominal}.`,
      tone: "info",
    });

    resetExpenseForm();
    showToast(isEditing ? "Tagihan vendor diperbarui." : "Tagihan vendor ditambahkan.", "emerald");
  };

  const editExpense = (item) => {
    setEditingExpenseId(item.id);
    setExpenseForm({
      nama: item.nama,
      kategori: item.kategori,
      vendor: item.vendor,
      nominal: String(item.nominal),
      jatuhTempo: item.jatuhTempo || "",
      catatan: item.catatan || "",
    });
  };

  const removeExpense = async (item) => {
  const confirmed = confirmDestructiveAction({
    title: "Hapus tagihan vendor",
    message: `Tagihan ${item.nama} dan pembayaran yang tertaut akan dihapus. Aksi ini tidak bisa dibatalkan.`,
    confirmationText: "HAPUS",
  });
  if (!confirmed) return;

  try {
    await deleteExpenseFromSupabase(item.id);

    setExpenses((prev) => prev.filter((expense) => expense.id !== item.id));
    setVendorPayments((prev) => prev.filter((payment) => payment.expenseId !== item.id));

    recordActivity?.({
      type: "vendor",
      title: "Hapus tagihan vendor",
      description: `${item.nama || "Tagihan vendor"} untuk ${item.vendor || "vendor"} dihapus beserta pembayaran tertautnya.`,
      tone: "danger",
    });

    if (editingExpenseId === item.id) resetExpenseForm();
    showToast("Tagihan vendor berhasil dihapus dari Supabase.", "emerald");
  } catch (error) {
    showToast(error.message || "Gagal menghapus tagihan vendor dari Supabase.", "rose");
  }
};

  const addOrUpdateIncome = () => {
    if (!incomeForm.nama.trim()) {
      showToast("Nama pemasukan lain wajib diisi.", "rose");
      return;
    }
    if (!incomeForm.tanggal) {
      showToast("Tanggal pemasukan lain wajib diisi.", "rose");
      return;
    }
    if (clampMin(incomeForm.nominal) <= 0) {
      showToast("Nominal pemasukan lain harus lebih dari 0.", "rose");
      return;
    }

    const payload = normalizeOtherIncome({
      id: editingIncomeId || createId(),
      nama: incomeForm.nama.trim(),
      sumber: incomeForm.sumber,
      tanggal: incomeForm.tanggal,
      metode: incomeForm.metode,
      akunMasuk: incomeForm.akunMasuk.trim(),
      nominal: clampMin(incomeForm.nominal),
      catatan: incomeForm.catatan.trim(),
    });

    const isEditing = Boolean(editingIncomeId);

    if (isEditing) {
      setOtherIncomes((prev) => prev.map((item) => (item.id === editingIncomeId ? payload : item)));
    } else {
      setOtherIncomes((prev) => [payload, ...prev]);
    }

    recordActivity?.({
      type: "pemasukan",
      title: isEditing ? "Edit pemasukan lain" : "Tambah pemasukan lain",
      description: `${payload.nama || "Pemasukan lain"} ${isEditing ? "diperbarui" : "ditambahkan"} dengan nominal ${payload.nominal}.`,
      tone: "info",
    });

    resetIncomeForm();
    showToast(isEditing ? "Pemasukan lain diperbarui." : "Pemasukan lain ditambahkan.", "emerald");
  };

  const editIncome = (item) => {
    setEditingIncomeId(item.id);
    setIncomeForm({
      nama: item.nama,
      sumber: item.sumber,
      tanggal: item.tanggal || getToday(),
      metode: item.metode || PAYMENT_METHODS[0],
      akunMasuk: item.akunMasuk || "",
      nominal: String(item.nominal),
      catatan: item.catatan || "",
    });
  };

  const removeIncome = (id) => {
    const confirmed = confirmDestructiveAction({
      title: "Hapus pemasukan lain",
      message: "Transaksi pemasukan lain ini akan dihapus.",
    });
    if (!confirmed) return;
    const deletedIncome = otherIncomes.find((item) => item.id === id);

    setOtherIncomes((prev) => prev.filter((item) => item.id !== id));

    recordActivity?.({
      type: "pemasukan",
      title: "Hapus pemasukan lain",
      description: `${deletedIncome?.nama || "Pemasukan lain"} dihapus dari data.`,
      tone: "danger",
    });

    if (editingIncomeId === id) resetIncomeForm();
    showToast("Pemasukan lain berhasil dihapus.", "emerald");
  };

  return {
    expenses,
    setExpenses,
    otherIncomes,
    setOtherIncomes,
    vendorPayments,
    setVendorPayments,
    expenseForm,
    setExpenseForm,
    editingExpenseId,
    incomeForm,
    setIncomeForm,
    editingIncomeId,
    vendorStatusFilter,
    setVendorStatusFilter,
    vendorView,
    setVendorView,
    showIncomeAdvanced,
    setShowIncomeAdvanced,
    showExpenseAdvanced,
    setShowExpenseAdvanced,
    selectedVendorFilter,
    setSelectedVendorFilter,
    vendorPaymentRows,
    expensePaymentTotals,
    expenseRows,
    expenseLookup,
    filteredExpenseRows,
    filteredVendorPayments,
    vendorFilterOptions,
    resetExpenseForm,
    resetIncomeForm,
    addOrUpdateExpense,
    editExpense,
    removeExpense,
    addOrUpdateIncome,
    editIncome,
    removeIncome,
    ...paymentDomain,
  };
}
