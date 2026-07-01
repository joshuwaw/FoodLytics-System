"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Mail, Lock, Utensils, ArrowRight, ShieldCheck, Sparkles, Activity } from "lucide-react";
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
    <div className="min-h-screen w-full flex font-sans bg-[#030712] text-slate-100 overflow-hidden relative">
      {/* Global Background Glows */}
      <div className="absolute top-0 left-1/4 w-[800px] h-[800px] bg-orange-500/20 rounded-full blur-[120px] mix-blend-screen pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-indigo-600/20 rounded-full blur-[120px] mix-blend-screen pointer-events-none" />
      
      {/* Decorative Grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff0a_1px,transparent_1px),linear-gradient(to_bottom,#ffffff0a_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none" />

      {/* LEFT PANEL: Enterprise Branding */}
      <div className="hidden lg:flex w-1/2 relative flex-col justify-between pt-16 px-16 pb-10 xl:pt-24 xl:px-24 xl:pb-14 border-r border-white/5 z-10">
        
        {/* Top Header */}
        <div className="relative flex items-center gap-4 group cursor-pointer">
          <div className="p-3 bg-gradient-to-br from-orange-400 to-orange-600 rounded-2xl shadow-[0_0_40px_rgba(249,115,22,0.4)] group-hover:shadow-[0_0_60px_rgba(249,115,22,0.6)] transition-all duration-500">
            <Utensils className="w-8 h-8 text-white" />
          </div>
          <span className="text-3xl font-black tracking-tight text-white drop-shadow-md">
            Food<span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-orange-600">Lytics</span>
          </span>
        </div>

        {/* Content Showcase */}
        <div className="relative space-y-10 max-w-xl my-auto pt-2">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold bg-white/5 text-orange-300 border border-orange-500/30 backdrop-blur-md shadow-[0_0_20px_rgba(249,115,22,0.15)]">
            <Activity className="w-4 h-4 text-orange-400" />
            <span className="tracking-wide uppercase">AI-Powered F&B Operations</span>
          </div>
          
          <div className="space-y-6">
            <h2 className="text-5xl xl:text-6xl font-black leading-[1.1] tracking-tight text-white drop-shadow-lg">
              Tingkatkan <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-amber-300">Prestasi</span><br/> Operasi Anda.
            </h2>
            <p className="text-slate-300 leading-relaxed text-lg font-medium max-w-lg drop-shadow">
              Platform kecerdasan buatan komprehensif untuk memantau sentimen pelanggan dan menjana arahan kerja automatik dalam masa nyata.
            </p>
          </div>

          {/* Bullet Points */}
          <div className="grid grid-cols-2 gap-6 pt-8 border-t border-white/10">
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 p-5 rounded-2xl hover:bg-white/10 transition-colors">
              <ShieldCheck className="w-8 h-8 text-orange-400 mb-4" />
              <h4 className="font-bold text-base text-white mb-2">Sekuriti Gred Enterprise</h4>
              <p className="text-sm text-slate-400 leading-relaxed">Penyulitan data penuh dan kawalan akses berasaskan peranan yang ketat.</p>
            </div>
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 p-5 rounded-2xl hover:bg-white/10 transition-colors">
              <Sparkles className="w-8 h-8 text-orange-400 mb-4" />
              <h4 className="font-bold text-base text-white mb-2">Preskriptif AI Termaju</h4>
              <p className="text-sm text-slate-400 leading-relaxed">Menjana SOP pembaikan terus daripada analisis rungutan pelanggan.</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="relative text-sm text-slate-500 font-semibold tracking-wide">
          © {new Date().getFullYear()} FoodLytics System. Built for Enterprise.
        </div>
      </div>

      {/* RIGHT PANEL: Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 relative z-10">
        <div className="w-full max-w-[440px] space-y-10 relative">
          
          {/* Mobile Header */}
          <div className="text-center space-y-4 lg:hidden">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-orange-400 to-orange-600 rounded-2xl shadow-[0_0_40px_rgba(249,115,22,0.4)] mx-auto">
              <Utensils className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-4xl font-black text-white tracking-tight drop-shadow-md">
              Selamat Kembali
            </h1>
            <p className="text-slate-300 font-medium text-base">
              Akses portal pengurusan pintar anda.
            </p>
          </div>

          <div className="hidden lg:block space-y-3">
             <h1 className="text-4xl font-black text-white tracking-tight drop-shadow-md">
              Log Masuk Akaun
            </h1>
            <p className="text-slate-300 font-medium text-base">
              Sila masukkan kelayakan akses portal operasi anda.
            </p>
          </div>

          {/* Form Card (Glassmorphism) */}
          <div className="bg-white/10 backdrop-blur-2xl border border-white/20 rounded-[2rem] p-8 sm:p-10 shadow-[0_8px_32px_rgba(0,0,0,0.3)] relative overflow-hidden">
            {/* Subtle inner highlight */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent pointer-events-none" />

            <form onSubmit={handleSubmit} className="relative space-y-7 z-10">
              <div className="space-y-2.5">
                <label className="text-xs font-black uppercase tracking-widest text-slate-300 ml-1 drop-shadow-sm">
                  Alamat E-mel
                </label>
                <div className="relative group">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-orange-400 transition-colors" />
                  <input
                    type="email"
                    placeholder="nama@syarikat.com"
                    value={emel}
                    onChange={(e) => setEmel(e.target.value)}
                    required
                    className="w-full pl-12 pr-4 py-4 bg-black/40 border border-white/10 rounded-2xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 focus:bg-black/60 transition-all text-base font-semibold shadow-inner"
                  />
                </div>
              </div>

              <div className="space-y-2.5">
                <div className="flex justify-between items-center px-1">
                  <label className="text-xs font-black uppercase tracking-widest text-slate-300 drop-shadow-sm">
                    Kata Laluan
                  </label>
                  <a href="#" className="text-xs font-bold text-orange-400 hover:text-orange-300 transition-colors">
                    Lupa?
                  </a>
                </div>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-orange-400 transition-colors" />
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={kataLaluan}
                    onChange={(e) => setKataLaluan(e.target.value)}
                    required
                    className="w-full pl-12 pr-4 py-4 bg-black/40 border border-white/10 rounded-2xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 focus:bg-black/60 transition-all text-base font-semibold shadow-inner tracking-widest"
                  />
                </div>
              </div>

              {error && (
                <div className="p-4 rounded-2xl bg-red-500/20 border border-red-500/50 text-red-200 text-sm font-bold text-center animate-in fade-in slide-in-from-top-2 backdrop-blur-md">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-400 hover:to-orange-500 text-white rounded-2xl text-base font-black shadow-[0_0_20px_rgba(249,115,22,0.4)] hover:shadow-[0_0_30px_rgba(249,115,22,0.6)] transition-all active:scale-[0.98] flex items-center justify-center gap-3 cursor-pointer disabled:opacity-50 disabled:active:scale-100"
              >
                {loading ? (
                  <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    Log Masuk Portal <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </form>
          </div>

          <p className="text-center text-base text-slate-400 font-medium">
            Belum ada akaun korporat?{" "}
            <a href="/register" className="text-orange-400 font-black hover:text-orange-300 hover:underline transition-colors drop-shadow">
              Daftar cawangan baru
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
