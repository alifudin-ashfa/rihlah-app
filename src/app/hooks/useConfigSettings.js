import { useState } from "react";
import { clampMin } from "../../shared/lib/rihlahCore";

export function useConfigSettings(initialConfig) {
  const [config, setConfig] = useState(initialConfig);

  const handleConfigChange = (field, value) => {
    setConfig((prev) => ({
      ...prev,
      [field]:
        field === "jumlahPembimbing" || field === "iuranDefaultSantri"
          ? clampMin(value)
          : value,
    }));
  };

  const lockFinalData = () => {
    const confirmed = window.confirm(
      "Kunci Data Final?\n\nSetelah dikunci, tambah/edit/hapus data, import JSON, reset data, dan muat data contoh akan dinonaktifkan. Export, backup, Buku Kas, dan laporan tetap bisa digunakan."
    );

    if (!confirmed) return false;

    setConfig((prev) => ({
      ...prev,
      finalisasiData: {
        ...(prev.finalisasiData || {}),
        terkunci: true,
        dikunciPada: new Date().toISOString(),
        dibukaPada: "",
      },
    }));

    return true;
  };

  const unlockFinalData = () => {
    const answer = window.prompt(
      "Buka Kunci Data Final?\n\nData final bisa berubah setelah kunci dibuka. Ketik BUKA KUNCI untuk melanjutkan:"
    );

    if (answer !== "BUKA KUNCI") return false;

    setConfig((prev) => ({
      ...prev,
      finalisasiData: {
        ...(prev.finalisasiData || {}),
        terkunci: false,
        dibukaPada: new Date().toISOString(),
      },
    }));

    return true;
  };

  return {
    config,
    setConfig,
    handleConfigChange,
    lockFinalData,
    unlockFinalData,
  };
}