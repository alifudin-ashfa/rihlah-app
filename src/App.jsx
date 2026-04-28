import React, { useEffect, useState } from "react";
import { Navigate, Route, Routes } from "react-router-dom";

import LoginPage from "./shared/components/LoginPage";
import { getCurrentProfile, signOutAdmin } from "./shared/lib/auth";

import Navbar from "./shared/components/Navbar";
import ToastNotice from "./shared/components/ToastNotice";
import { useRihlahApp } from "./app/useRihlahApp.jsx";

import HomePage from "./features/home/HomePage";
import KegiatanPage from "./features/kegiatan/KegiatanPage";
import VendorPage from "./features/vendors/VendorPage";
import SantriPage from "./features/participants/SantriPage";
import LaporanPage from "./features/reports/LaporanPage";
import BukuKasPage from "./features/cashbook/BukuKasPage";

export default function App() {
  const app = useRihlahApp();

  const [authProfile, setAuthProfile] = useState(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [showLoginPage, setShowLoginPage] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const checkAuth = async () => {
      try {
        const profile = await getCurrentProfile();

        if (isMounted) {
          setAuthProfile(profile);
        }
      } catch {
        if (isMounted) {
          setAuthProfile(null);
        }
      } finally {
        if (isMounted) {
          setIsCheckingAuth(false);
        }
      }
    };

    checkAuth();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleLogout = async () => {
    await signOutAdmin();
    setAuthProfile(null);
    setShowLoginPage(false);
  };

  const handleLoginSuccess = (profile) => {
    setAuthProfile(profile);
    setShowLoginPage(false);
  };

  const canEdit = ["admin", "bendahara"].includes(authProfile?.role);

  const showViewerBlockedToast = () => {
    if (typeof app.showToast === "function") {
      app.showToast(
        "Mode pelihat hanya dapat melihat data. Silakan login sebagai admin/bendahara untuk mengubah data.",
        "amber"
      );
    } else {
      window.alert(
        "Mode pelihat hanya dapat melihat data. Silakan login sebagai admin/bendahara untuk mengubah data."
      );
    }
  };

  const viewerBlockedAction = () => {
    showViewerBlockedToast();
  };

  const viewerBlockedAsyncAction = async () => {
    showViewerBlockedToast();
  };

  const appWithAuth = {
    ...app,
    authProfile,
    canEdit,
    isViewerMode: !canEdit,
    ...(canEdit
      ? {}
      : {
          handleConfigChange: viewerBlockedAction,
          addOrUpdateExpense: viewerBlockedAction,
          editExpense: viewerBlockedAction,
          removeExpense: viewerBlockedAction,
          addOrUpdateIncome: viewerBlockedAction,
          editIncome: viewerBlockedAction,
          removeIncome: viewerBlockedAction,
          handleVendorProofUpload: viewerBlockedAsyncAction,
          addVendorPayment: viewerBlockedAsyncAction,
          removeVendorPayment: viewerBlockedAsyncAction,
          addOrUpdateParticipant: viewerBlockedAction,
          editParticipant: viewerBlockedAction,
          removeParticipant: viewerBlockedAction,
          addParticipantPayment: viewerBlockedAction,
          focusParticipantPaymentForm: viewerBlockedAction,
          removeParticipantPayment: viewerBlockedAction,
          applyDefaultTargetToAll: viewerBlockedAction,
          importBackup: viewerBlockedAction,
          loadSampleData: viewerBlockedAction,
          resetAllData: viewerBlockedAction,
          resetExpenseForm: viewerBlockedAction,
          resetIncomeForm: viewerBlockedAction,
          resetVendorPaymentForm: viewerBlockedAction,
        }),
  };

  if (isCheckingAuth) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-100">
        <div className="rounded-3xl bg-white px-8 py-6 text-sm font-semibold text-slate-700 shadow-xl">
          Memeriksa akses...
        </div>
      </main>
    );
  }

  if (showLoginPage && !authProfile) {
    return (
      <LoginPage
        onLogin={handleLoginSuccess}
        onCancel={() => setShowLoginPage(false)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-100">
      <Navbar
        mobileMenuOpen={app.mobileMenuOpen}
        setMobileMenuOpen={app.setMobileMenuOpen}
        authProfile={authProfile}
        canEdit={canEdit}
        onLoginClick={() => setShowLoginPage(true)}
        onLogout={handleLogout}
        databaseStatus={app.databaseStatus}
      />

      <ToastNotice toast={app.toast} />

      <div className="w-full max-w-none px-4 py-4 sm:px-6 sm:py-6 lg:px-8 lg:py-8 2xl:px-12">
        <Routes>
          <Route path="/" element={<HomePage app={appWithAuth} />} />
          <Route
            path="/kegiatan"
            element={<KegiatanPage app={appWithAuth} />}
          />
          <Route path="/vendor" element={<VendorPage app={appWithAuth} />} />
          <Route path="/santri" element={<SantriPage app={appWithAuth} />} />
          <Route path="/buku-kas" element={<BukuKasPage app={appWithAuth} />} />
          <Route path="/laporan" element={<LaporanPage app={appWithAuth} />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </div>
  );
}