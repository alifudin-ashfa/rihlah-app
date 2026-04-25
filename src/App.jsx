import React from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import Navbar from "./shared/components/Navbar";
import ToastNotice from "./shared/components/ToastNotice";
import { useRihlahApp } from "./app/useRihlahApp.jsx";
import HomePage from "./features/home/HomePage";
import KegiatanPage from "./features/kegiatan/KegiatanPage";
import VendorPage from "./features/vendors/VendorPage";
import SantriPage from "./features/participants/SantriPage";
import LaporanPage from "./features/reports/LaporanPage";

export default function App() {
  const app = useRihlahApp();

  return (
    <div className="min-h-screen bg-slate-100">
      <Navbar mobileMenuOpen={app.mobileMenuOpen} setMobileMenuOpen={app.setMobileMenuOpen} />
      <ToastNotice toast={app.toast} />

      <div className="mx-auto max-w-[1440px] px-3 py-4 sm:px-4 sm:py-6 md:px-6 md:py-8">
        <Routes>
          <Route path="/" element={<HomePage app={app} />} />
          <Route path="/kegiatan" element={<KegiatanPage app={app} />} />
          <Route path="/vendor" element={<VendorPage app={app} />} />
          <Route path="/santri" element={<SantriPage app={app} />} />
          <Route path="/laporan" element={<LaporanPage app={app} />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </div>
  );
}
