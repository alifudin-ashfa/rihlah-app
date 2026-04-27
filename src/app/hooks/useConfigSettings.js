import { useState } from "react";
import { clampMin } from "../../shared/lib/rihlahCore";

export function useConfigSettings(initialConfig) {
  const [config, setConfig] = useState(initialConfig);

  const handleConfigChange = (field, value) => {
    setConfig((prev) => ({
      ...prev,
      [field]: field === "jumlahPembimbing" || field === "iuranDefaultSantri" ? clampMin(value) : value,
    }));
  };

  return {
    config,
    setConfig,
    handleConfigChange,
  };
}
