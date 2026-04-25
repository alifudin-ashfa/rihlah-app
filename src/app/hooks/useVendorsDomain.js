import { useMemo, useState } from "react";
import {
  EXPENSE_CATEGORIES,
  INCOME_SOURCES,
  PAYMENT_METHODS,
  clampMin,
  createId,
  getToday,
  normalizeExpense,
  normalizeOtherIncome,
  normalizeVendorPayment,
} from "../../shared/lib/rihlahCore";
import { useVendorPayments } from "./useVendorPayments";

export function useVendorsDomain({ initialExpenses, initialOtherIncomes, initialVendorPayments, showToast, paymentProofInputRef }) {
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
    if (!expenseForm.nama.trim() || !expenseForm.vendor.trim() || clampMin(expenseForm.nominal) <= 0) {
      showToast("Lengkapi nama tagihan, vendor, dan nominal.", "rose");
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

    if (editingExpenseId) {
      setExpenses((prev) => prev.map((item) => (item.id === editingExpenseId ? payload : item)));
    } else {
      setExpenses((prev) => [payload, ...prev]);
    }
    resetExpenseForm();
    showToast(editingExpenseId ? "Tagihan vendor diperbarui." : "Tagihan vendor ditambahkan.", "emerald");
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

  const removeExpense = (item) => {
    if (!window.confirm(`Hapus tagihan ${item.nama}? Pembayaran yang sudah terhubung akan diubah menjadi tidak tertaut.`)) return;
    setExpenses((prev) => prev.filter((expense) => expense.id !== item.id));
    setVendorPayments((prev) => prev.map((payment) => (payment.expenseId === item.id ? { ...payment, expenseId: "", vendorSnapshot: item.vendor || item.nama } : payment)));
    if (editingExpenseId === item.id) resetExpenseForm();
  };

  const addOrUpdateIncome = () => {
    if (!incomeForm.nama.trim() || clampMin(incomeForm.nominal) <= 0) {
      showToast("Lengkapi nama pemasukan lain dan nominalnya.", "rose");
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

    if (editingIncomeId) {
      setOtherIncomes((prev) => prev.map((item) => (item.id === editingIncomeId ? payload : item)));
    } else {
      setOtherIncomes((prev) => [payload, ...prev]);
    }
    resetIncomeForm();
    showToast(editingIncomeId ? "Pemasukan lain diperbarui." : "Pemasukan lain ditambahkan.", "emerald");
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
    if (!window.confirm("Hapus pemasukan lain ini?")) return;
    setOtherIncomes((prev) => prev.filter((item) => item.id !== id));
    if (editingIncomeId === id) resetIncomeForm();
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
