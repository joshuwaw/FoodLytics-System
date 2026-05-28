"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { TextInput, Button } from "@tremor/react";
import { Mail, Lock, Utensils } from "lucide-react";
import { useAuth } from "@/lib/auth";

export default function LoginPage() {
  const { login, user, isLoading } = useAuth();
  const router = useRouter();
  const [emel, setEmel] = useState("");
  const [kataLaluan, setKataLaluan] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Redirect if already logged in
  useEffect(() => {
    if (!isLoading && user) {
      if (user.peranan === "Pengurus") router.replace("/pengurus");
      else router.replace("/staf");
    }
  }, [user, isLoading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";
      const res = await fetch(`${API_URL}/admin/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emel, kata_laluan: kataLaluan }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Log masuk gagal.");

      login(data);

      if (data.peranan === "Pengurus") router.push("/pengurus");
      else router.push("/staf");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (isLoading) return null;

  return (
    <div className="min-h-screen w-full flex flex-col justify-center items-center font-sans text-slate-900 bg-gradient-to-br from-orange-50/60 via-white to-blue-50/40 relative overflow-hidden px-4">
      {/* Background Decor */}
      <div className="absolute -top-40 -right-40 w-[500px] h-[500px] bg-orange-100/60 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute -bottom-40 -left-40 w-[500px] h-[500px] bg-blue-100/50 blur-[120px] rounded-full pointer-events-none" />

      <div className="max-w-md w-full relative z-10">
        {/* Header */}
        <div className="text-center mb-10 space-y-3">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-orange-100 rounded-2xl mb-2 shadow-sm border border-orange-200/60">
            <Utensils className="w-8 h-8 text-orange-600" />
          </div>
          <h1 className="text-4xl font-black tracking-tight">
            Food<span className="text-orange-600">Lytics</span>
          </h1>
          <p className="text-slate-500 font-medium">Log masuk ke akaun anda.</p>
        </div>

        {/* Card */}
        <div className="bg-white/80 backdrop-blur-xl shadow-[0_8px_40px_rgb(0,0,0,0.06)] border border-slate-100 rounded-[2.5rem] p-8 sm:p-10">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 ml-1">E-mel</label>
              <TextInput
                id="emel"
                icon={Mail}
                placeholder="contoh@email.com"
                value={emel}
                onChange={(e) => setEmel(e.target.value)}
                required
                className="rounded-2xl border-none bg-slate-100/60 hover:bg-slate-100 focus:bg-white transition-all h-12 shadow-sm"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 ml-1">Kata Laluan</label>
              <TextInput
                id="kata_laluan"
                icon={Lock}
                type="password"
                placeholder="••••••••"
                value={kataLaluan}
                onChange={(e) => setKataLaluan(e.target.value)}
                required
                className="rounded-2xl border-none bg-slate-100/60 hover:bg-slate-100 focus:bg-white transition-all h-12 shadow-sm"
              />
            </div>

            {error && (
              <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-sm font-semibold text-center animate-in fade-in slide-in-from-top-2">
                {error}
              </div>
            )}

            <div className="pt-2">
              <Button
                id="btn-login"
                type="submit"
                loading={loading}
                className="w-full h-14 bg-slate-900 hover:bg-black text-white border-none rounded-[1.5rem] text-base font-black shadow-xl shadow-slate-900/20 transition-all hover:scale-[1.01] active:scale-[0.98]"
              >
                Log Masuk
              </Button>
            </div>
          </form>
        </div>

        <p className="mt-8 text-center text-slate-500 font-medium">
          Belum ada akaun?{" "}
          <a href="/register" className="text-orange-600 font-bold hover:underline">
            Daftar di sini
          </a>
        </p>
      </div>
    </div>
  );
}
