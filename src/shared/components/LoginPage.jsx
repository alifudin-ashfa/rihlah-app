import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { signInAdmin, getCurrentProfile } from "../lib/auth";
import { normalizeFriendlyError } from "../lib/rihlahCore";

export default function LoginPage({ onLogin, onCancel }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();
    setErrorMessage("");

    if (!email.trim() || !password) {
      setErrorMessage("Email dan password wajib diisi.");
      return;
    }

    setIsSubmitting(true);

    try {
      await signInAdmin({ email: email.trim(), password });
      const profile = await getCurrentProfile();
      onLogin(profile);
    } catch (error) {
      setErrorMessage(normalizeFriendlyError(error, "Login gagal. Periksa kembali email dan password."));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 px-4 py-8">
      <section className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-xl sm:p-8">
        <div className="mb-8 text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-sky-600">
            Al Yaqut
          </p>
          <h1 className="mt-3 text-2xl font-bold text-slate-950 sm:text-3xl">
            Login Pengelola
          </h1>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            Masuk sebagai admin atau bendahara untuk mengubah data administrasi rihlah.
          </p>
        </div>

        <form className="space-y-5" onSubmit={handleSubmit} noValidate>
          <label className="block">
            <span className="text-sm font-medium text-slate-700">Email</span>
            <input
              type="email"
              required
              autoComplete="email"
              className="mt-2 h-11 w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm font-medium outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
              placeholder="nama@email.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium text-slate-700">Password</span>
            <div className="mt-2 flex h-11 overflow-hidden rounded-2xl border border-slate-300 bg-white focus-within:border-sky-500 focus-within:ring-2 focus-within:ring-sky-100">
              <input
                type={showPassword ? "text" : "password"}
                required
                autoComplete="current-password"
                className="min-w-0 flex-1 px-4 py-3 text-sm font-medium outline-none"
                placeholder="Masukkan password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="inline-flex w-12 items-center justify-center text-slate-500 hover:bg-slate-50"
                aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </label>

          {errorMessage ? (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium leading-6 text-rose-700">
              {errorMessage}
            </div>
          ) : null}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-2xl bg-sky-600 px-5 py-3 font-semibold text-white shadow-lg transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? "Memeriksa akses..." : "Masuk"}
          </button>

          {onCancel ? (
            <button
              type="button"
              onClick={onCancel}
              className="w-full rounded-2xl border border-slate-300 bg-white px-5 py-3 font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Kembali sebagai pelihat
            </button>
          ) : null}
        </form>
      </section>
    </main>
  );
}
