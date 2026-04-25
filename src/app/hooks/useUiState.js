import { useEffect, useRef, useState } from "react";

export function useUiState(pathname) {
  const [toast, setToast] = useState(null);
  const [homeUtilitiesOpen, setHomeUtilitiesOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const importInputRef = useRef(null);
  const paymentProofInputRef = useRef(null);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!toast) return undefined;
    const timer = window.setTimeout(() => setToast(null), 2600);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const showToast = (message, tone = "slate") => setToast({ message, tone, id: Date.now() });

  return {
    toast,
    setToast,
    showToast,
    homeUtilitiesOpen,
    setHomeUtilitiesOpen,
    mobileMenuOpen,
    setMobileMenuOpen,
    importInputRef,
    paymentProofInputRef,
  };
}
