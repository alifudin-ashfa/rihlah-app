import { useState } from "react";
import { signInAdmin, getCurrentProfile } from "../lib/auth";

export default function LoginPage({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();
    setErrorMessage("");
    setIsSubmitting(true);

    try {
      await signInAdmin({ email, password });
      const profile = await getCurrentProfile();
      onLogin(profile);
    } catch (error) {
      setErrorMessage(error.message || "Login gagal.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-100 flex items-center justify-center px-4">
      <section className="w-full max-w-md rounded-3xl bg-white p-8 shadow-xl border border-slate-200">
        <div className="mb-8 text-center">
          <p className="text-sm font-black uppercase tracking-[0.25em] text-sky-600">
            Al Yaqut
          </p>
          <h1 className="mt-3 text-3xl font-black text-slate-950">
            Login Admin
          </h1>
          <p className="mt-2 text-sm font-semibold text-slate-500">
            Khusus admin dan bendahara rihlah.
          </p>
        </div>

        <form className="space-y-5" onSubmit={handleSubmit}>
          <label className="block">
            <span className="text-sm font-bold text-slate-700">Email</span>
            <input
              type="email"
              required
              className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3 font-semibold outline-none focus:border-sky-500"
              placeholder="Masukkan email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </label>

          <label className="block">
            <span className="text-sm font-bold text-slate-700">Password</span>
            <input
              type="password"
              required
              className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3 font-semibold outline-none focus:border-sky-500"
              placeholder="Masukkan password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </label>

          {errorMessage ? (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700">
              {errorMessage}
            </div>
          ) : null}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-2xl bg-sky-600 px-5 py-3 font-black text-white shadow-lg hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? "Memeriksa..." : "Masuk"}
          </button>
        </form>
      </section>
    </main>
  );
}