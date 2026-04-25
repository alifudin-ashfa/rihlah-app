import React from "react";
import { Menu, X } from "lucide-react";
import { NavLink } from "react-router-dom";
import { logoAlYaqut, navItems, navClass } from "../lib/rihlahCore";

export default function Navbar({ mobileMenuOpen, setMobileMenuOpen }) {
  return (
    <header className="sticky top-0 z-40 border-b border-sky-700 bg-sky-600 text-white shadow-lg">
      <div className="mx-auto flex max-w-[1440px] items-center justify-between gap-3 px-3 py-3 sm:gap-4 sm:px-4 md:px-6">
        <NavLink to="/" className="flex min-w-0 items-center gap-3 sm:gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white/95 shadow-sm ring-1 ring-sky-200 sm:h-14 sm:w-14">
            <img src={logoAlYaqut} alt="Logo Al Yaqut" className="h-9 w-9 object-contain sm:h-11 sm:w-11" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-xl font-extrabold tracking-tight sm:text-[2rem]">Al Yaqut</p>
            <p className="truncate text-xs text-sky-100 sm:text-sm">Administrasi Keuangan Rihlah</p>
          </div>
        </NavLink>

        <nav className="hidden items-center gap-1 lg:flex xl:gap-2">
          {navItems.map((item) => (
            <NavLink key={item.key} to={item.to} end={item.to === "/"} className={({ isActive }) => navClass(isActive)}>
              {item.label}
            </NavLink>
          ))}
        </nav>

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
          <div className="mx-auto flex max-w-[1440px] flex-col px-4 py-3">
            {navItems.map((item) => (
              <NavLink
                key={item.key}
                to={item.to}
                end={item.to === "/"}
                className={({ isActive }) =>
                  `rounded-md px-3 py-3 text-sm font-medium transition ${isActive ? "bg-slate-700 text-white" : "text-white hover:bg-slate-700"}`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </div>
        </div>
      ) : null}
    </header>
  );
}
