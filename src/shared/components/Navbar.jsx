import React from "react";
import { LogOut, Menu, X } from "lucide-react";
import { NavLink } from "react-router-dom";
import { logoAlYaqut, navItems, navClass } from "../lib/rihlahCore";

export default function Navbar({
  mobileMenuOpen,
  setMobileMenuOpen,
  authProfile,
  onLogout,
}) {
  const roleLabel = authProfile?.role === "admin" ? "Admin" : "Bendahara";

  const handleLogout = async () => {
    if (typeof onLogout === "function") {
      await onLogout();
    }
  };

  return (
    <header className="sticky top-0 z-40 border-b border-sky-700 bg-sky-600 text-white shadow-lg">
      <div className="mx-auto flex max-w-[1440px] items-center justify-between gap-3 px-3 py-3 sm:gap-4 sm:px-4 md:px-6">
        <NavLink to="/" className="flex min-w-0 items-center gap-3 sm:gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white/95 shadow-sm ring-1 ring-sky-200 sm:h-14 sm:w-14">
            <img
              src={logoAlYaqut}
              alt="Logo Al Yaqut"
              className="h-9 w-9 object-contain sm:h-11 sm:w-11"
            />
          </div>
          <div className="min-w-0">
            <p className="truncate text-xl font-extrabold tracking-tight sm:text-[2rem]">
              Al Yaqut
            </p>
            <p className="truncate text-xs text-sky-100 sm:text-sm">
              Administrasi Keuangan Rihlah
            </p>
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

          {authProfile ? (
            <div className="rounded-2xl bg-white/10 px-3 py-2 text-xs font-black uppercase tracking-wide text-white">
              {roleLabel}
            </div>
          ) : null}

          <button
            type="button"
            onClick={handleLogout}
            className="inline-flex items-center gap-2 rounded-2xl bg-white px-4 py-2 text-sm font-black text-sky-700 shadow-sm transition hover:bg-sky-50"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </button>
        </div>

        <button
          type="button"
          onClick={() => setMobileMenuOpen((prev) => !prev)}
          className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-sky-500 lg:hidden"
          aria-label="Buka menu"
        >
          {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {mobileMenuOpen ? (
        <div className="border-t border-sky-500 bg-slate-800 lg:hidden">
          <div className="mx-auto flex max-w-[1440px] flex-col gap-2 px-4 py-3">
            {authProfile ? (
              <div className="rounded-md bg-slate-700 px-3 py-3 text-sm font-black text-white">
                Login sebagai: {roleLabel}
              </div>
            ) : null}

            {navItems.map((item) => (
              <NavLink
                key={item.key}
                to={item.to}
                end={item.to === "/"}
                onClick={() => setMobileMenuOpen(false)}
                className={({ isActive }) =>
                  `rounded-md px-3 py-3 text-sm font-medium transition ${
                    isActive
                      ? "bg-slate-700 text-white"
                      : "text-white hover:bg-slate-700"
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}

            <button
              type="button"
              onClick={async () => {
                setMobileMenuOpen(false);
                await handleLogout();
              }}
              className="mt-2 inline-flex items-center gap-2 rounded-md bg-white px-3 py-3 text-left text-sm font-black text-sky-700"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </button>
          </div>
        </div>
      ) : null}
    </header>
  );
}