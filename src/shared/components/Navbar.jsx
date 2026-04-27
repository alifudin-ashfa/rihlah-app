import React from "react";
import { Database, LogIn, LogOut, Menu, X } from "lucide-react";
import { NavLink } from "react-router-dom";
import { logoAlYaqut, navItems, navClass } from "../lib/rihlahCore";

const roleBadgeClass = (role) => {
  if (role === "admin") return "bg-violet-100 text-violet-700";
  if (role === "bendahara") return "bg-emerald-100 text-emerald-700";
  return "bg-slate-100 text-slate-700";
};

export default function Navbar({
  mobileMenuOpen,
  setMobileMenuOpen,
  authProfile,
  onLoginClick,
  onLogout,
  databaseStatus,
}) {
  const roleLabel = authProfile?.role === "admin" ? "Admin" : authProfile?.role === "bendahara" ? "Bendahara" : "Pelihat";

  const handleLogout = async () => {
    if (typeof onLogout === "function") {
      await onLogout();
    }
  };

  return (
    <header className="sticky top-0 z-40 border-b border-sky-700 bg-sky-600 text-white shadow-lg">
      <div className="mx-auto flex max-w-[1440px] items-center justify-between gap-3 px-3 py-3 sm:gap-4 sm:px-4 md:px-6">
        <NavLink to="/" className="flex min-w-0 items-center gap-3 sm:gap-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/95 shadow-sm ring-1 ring-sky-200 sm:h-12 sm:w-12">
            <img
              src={logoAlYaqut}
              alt="Logo Al Yaqut"
              className="h-8 w-8 object-contain sm:h-10 sm:w-10"
            />
          </div>

          <div className="min-w-0 leading-tight">
            <p className="truncate text-lg font-bold tracking-tight sm:text-2xl lg:text-3xl">
              Rihlah Al Yaqut
            </p>
            <p className="hidden truncate text-xs text-sky-100 sm:block">Administrasi kegiatan rihlah</p>
          </div>
        </NavLink>

        <div className="hidden items-center gap-3 lg:flex">
          <nav className="flex items-center gap-1 xl:gap-2">
            {navItems.map((item) => (
              <NavLink
                key={item.key}
                to={item.to}
                end={item.to === "/"}
                className={({ isActive }) => navClass(isActive)}
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="hidden max-w-[220px] items-center gap-2 rounded-2xl bg-white/10 px-3 py-2 text-xs font-medium text-white xl:flex" title={databaseStatus || "Status penyimpanan"}>
            <Database className="h-4 w-4 shrink-0" />
            <span className="truncate">{databaseStatus || "Status data"}</span>
          </div>

          <div className={`rounded-2xl px-3 py-2 text-xs font-semibold uppercase tracking-wide ${roleBadgeClass(authProfile?.role)}`}>
            {roleLabel}
          </div>

          {authProfile ? (
            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex items-center gap-2 rounded-2xl bg-white px-4 py-2 text-sm font-semibold text-sky-700 shadow-sm transition hover:bg-sky-50"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </button>
          ) : (
            <button
              type="button"
              onClick={onLoginClick}
              className="inline-flex items-center gap-2 rounded-2xl bg-white px-4 py-2 text-sm font-semibold text-sky-700 shadow-sm transition hover:bg-sky-50"
            >
              <LogIn className="h-4 w-4" />
              Login
            </button>
          )}
        </div>

        <button
          type="button"
          onClick={() => setMobileMenuOpen((prev) => !prev)}
          className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-sky-500 lg:hidden"
          aria-label="Buka menu"
        >
          {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {mobileMenuOpen ? (
        <div className="border-t border-sky-500 bg-slate-800 lg:hidden">
          <div className="mx-auto flex max-w-[1440px] flex-col gap-2 px-4 py-3">
            <div className="rounded-xl bg-slate-700 px-3 py-3 text-sm font-semibold text-white">
              Login sebagai: {roleLabel}
              <span className="mt-1 block text-xs font-normal text-slate-300">{databaseStatus || "Status data belum tersedia"}</span>
            </div>

            {navItems.map((item) => (
              <NavLink
                key={item.key}
                to={item.to}
                end={item.to === "/"}
                onClick={() => setMobileMenuOpen(false)}
                className={({ isActive }) =>
                  `rounded-xl px-3 py-3 text-sm font-medium transition ${
                    isActive
                      ? "bg-slate-700 text-white"
                      : "text-white hover:bg-slate-700"
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}

            {authProfile ? (
              <button
                type="button"
                onClick={async () => {
                  setMobileMenuOpen(false);
                  await handleLogout();
                }}
                className="mt-2 inline-flex items-center gap-2 rounded-xl bg-white px-3 py-3 text-left text-sm font-semibold text-sky-700"
              >
                <LogOut className="h-4 w-4" />
                Logout
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  onLoginClick();
                }}
                className="mt-2 inline-flex items-center gap-2 rounded-xl bg-white px-3 py-3 text-left text-sm font-semibold text-sky-700"
              >
                <LogIn className="h-4 w-4" />
                Login pengelola
              </button>
            )}
          </div>
        </div>
      ) : null}
    </header>
  );
}
