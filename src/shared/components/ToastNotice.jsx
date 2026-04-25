import React from "react";
import { InlineBanner } from "../lib/rihlahCore";

export default function ToastNotice({ toast }) {
  if (!toast) return null;
  return (
    <div className="fixed right-4 top-20 z-50 max-w-sm">
      <InlineBanner
        title={toast.tone === "emerald" ? "Berhasil" : toast.tone === "rose" ? "Perlu diperbaiki" : "Info"}
        text={toast.message}
        tone={toast.tone}
      />
    </div>
  );
}
