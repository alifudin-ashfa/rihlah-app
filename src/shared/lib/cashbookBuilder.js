export function parseDateValue(value) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date;
}

export function isWithinDateRange(dateValue, startDate, endDate) {
  const date = parseDateValue(dateValue);
  if (!date) return true;

  const start = startDate ? parseDateValue(startDate) : null;
  const end = endDate ? parseDateValue(endDate) : null;

  if (start) start.setHours(0, 0, 0, 0);
  if (end) end.setHours(23, 59, 59, 999);

  if (start && date < start) return false;
  if (end && date > end) return false;

  return true;
}

export function buildCashbookRows({
  participants = [],
  expenses = [],
  vendorPayments = [],
  otherIncomes = [],
  filters = {},
}) {
  const expenseById = new Map(expenses.map((expense) => [expense.id, expense]));

  const participantPaymentRows = participants.flatMap((participant) => {
    const payments = Array.isArray(participant.payments)
      ? participant.payments
      : [];

    return payments.map((payment) => ({
      id: `participant-payment-${participant.id}-${payment.id}`,
      source: "participant_payment",
      date: payment.tanggal || "",
      type: "income",
      category: "Iuran Santri",
      description: `Pembayaran iuran ${participant.nama || "santri"}`,
      relatedName: participant.nama || "-",
      income: Number(payment.nominal || 0),
      expense: 0,
      amount: Number(payment.nominal || 0),
      note: payment.catatan || "",
      method: payment.metode || "",
      proofUrl: payment.buktiDataUrl || payment.buktiUrl || "",
    }));
  });

  const otherIncomeRows = otherIncomes.map((income) => ({
    id: `other-income-${income.id}`,
    source: "other_income",
    date: income.tanggal || "",
    type: "income",
    category: "Pemasukan Lain",
    description: income.nama || "Pemasukan lain",
    relatedName: income.sumber || "-",
    income: Number(income.nominal || 0),
    expense: 0,
    amount: Number(income.nominal || 0),
    note: income.catatan || "",
    method: income.metode || "",
    proofUrl: income.buktiDataUrl || income.buktiUrl || "",
  }));

  const vendorPaymentRows = vendorPayments.map((payment) => {
    const expense = expenseById.get(payment.expenseId);
    const vendorName =
      payment.vendorSnapshot ||
      expense?.vendor ||
      expense?.nama ||
      "Vendor";

    const totalExpense =
      Number(payment.nominal || 0) + Number(payment.biayaAdmin || 0);

    return {
      id: `vendor-payment-${payment.id}`,
      source: "vendor_payment",
      date: payment.tanggal || "",
      type: "expense",
      category: "Pembayaran Vendor",
      description: `Pembayaran ${vendorName}`,
      relatedName: vendorName,
      income: 0,
      expense: totalExpense,
      amount: totalExpense * -1,
      note: payment.catatan || "",
      method: payment.metode || "",
      proofUrl: payment.buktiDataUrl || payment.buktiUrl || "",
    };
  });

  const allRows = [
    ...participantPaymentRows,
    ...otherIncomeRows,
    ...vendorPaymentRows,
  ];

  const filteredRows = allRows.filter((row) => {
    const matchesDate = isWithinDateRange(
      row.date,
      filters.startDate,
      filters.endDate
    );

    const matchesType =
      !filters.type || filters.type === "all" || row.type === filters.type;

    const keyword = String(filters.search || "").toLowerCase().trim();

    const matchesSearch =
      !keyword ||
      row.description.toLowerCase().includes(keyword) ||
      row.relatedName.toLowerCase().includes(keyword) ||
      row.category.toLowerCase().includes(keyword) ||
      row.note.toLowerCase().includes(keyword) ||
      row.method.toLowerCase().includes(keyword);

    return matchesDate && matchesType && matchesSearch;
  });

  const sortedRows = filteredRows.sort((a, b) => {
    const dateA = parseDateValue(a.date)?.getTime() || 0;
    const dateB = parseDateValue(b.date)?.getTime() || 0;

    if (dateA !== dateB) return dateA - dateB;

    return String(a.id).localeCompare(String(b.id));
  });

  let runningBalance = 0;

  const rowsWithBalance = sortedRows.map((row) => {
    runningBalance += Number(row.income || 0) - Number(row.expense || 0);

    return {
      ...row,
      runningBalance,
    };
  });

  return rowsWithBalance.reverse();
}

export function buildCashbookSummary(rows = []) {
  const totalIncome = rows.reduce(
    (sum, row) => sum + Number(row.income || 0),
    0
  );

  const totalExpense = rows.reduce(
    (sum, row) => sum + Number(row.expense || 0),
    0
  );

  return {
    totalIncome,
    totalExpense,
    balance: totalIncome - totalExpense,
    transactionCount: rows.length,
  };
}