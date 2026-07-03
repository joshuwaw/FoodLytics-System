"use client";

import { useAuth } from "@/lib/auth";
import { useRouter } from "next/navigation";
import { ShieldAlert, LogOut, Home } from "lucide-react";

export default function UnauthorizedPage() {
  const { user, logout } = useAuth();
  const router = useRouter();

  const handleBack = () => {
    if (!user) {
      router.replace("/login");
    } else if (user.peranan === "Pengurus") {
      router.replace("/pengurus");
    } else {
      router.replace("/staf");
    }
  };

  return (
    <div className="min-h-screen w-full flex font-sans bg-[#f8fafc] text-slate-800 overflow-hidden relative items-center justify-center p-4">
      {/* Background Aurora Orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-gradient-to-br from-rose-400/10 to-red-500/10 blur-[120px] pointer-events-none z-0 animate-pulse" style={{ animationDuration: "8s" }} />
      <div className="absolute bottom-[-10%] right-[-10%] w-[45vw] h-[45vw] rounded-full bg-gradient-to-br from-amber-400/10 to-orange-500/10 blur-[120px] pointer-events-none z-0 animate-pulse" style={{ animationDuration: "10s" }} />
      
      {/* Decorative Grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#00000005_1px,transparent_1px),linear-gradient(to_bottom,#00000005_1px,transparent_1px)] bg-[size:3rem_3rem] pointer-events-none" />

      {/* Main Glassmorphic Panel */}
      <div className="relative w-full max-w-xl bg-white/45 backdrop-blur-2xl rounded-[32px] border border-slate-200/60 p-8 text-center shadow-2xl shadow-slate-200/50 z-10 animate-in fade-in zoom-in-95 duration-500">
        
        {/* Red Shield Alert Icon Container */}
        <div className="mx-auto w-20 h-20 rounded-3xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-500 mb-6 shadow-inner shadow-rose-500/5">
          <ShieldAlert className="w-10 h-10 animate-bounce" style={{ animationDuration: "2.5s" }} />
        </div>

        {/* Access Denied Header */}
        <h1 className="text-3xl font-black text-slate-900 tracking-tight mb-2">Akses Ditolak (403)</h1>
        <p className="text-xs uppercase tracking-widest text-rose-600 font-extrabold mb-6">Sekatan Kawalan Capaian (RBAC)</p>

        {/* Explanatory Context Box */}
        <div className="bg-slate-50/80 border border-slate-100/80 rounded-2xl p-5 text-sm text-slate-600 leading-relaxed text-left mb-8">
          <p className="font-semibold text-slate-800 mb-2">Mengapa halaman ini disekat?</p>
          Halaman yang anda cuba layari memerlukan kebenaran khas. Sistem Kawalan Capaian Berasaskan Peranan (RBAC) FoodLytics telah menyekat cubaan ini kerana profil anda tidak mempunyai kelayakan yang sah bagi halaman ini.
          
          {user && (
            <div className="mt-4 pt-4 border-t border-slate-200/50 space-y-1 text-xs">
              <div><span className="font-extrabold text-slate-500">Log Masuk Sebagai:</span> <span className="font-bold text-slate-800">{user.nama} ({user.emel})</span></div>
              <div><span className="font-extrabold text-slate-500">Peranan Semasa:</span> <span className="px-2 py-0.5 bg-slate-200 text-slate-700 font-black rounded-md uppercase tracking-wider text-[9px]">{user.peranan}</span></div>
            </div>
          )}
        </div>

        {/* Control Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-center">
          <button
            onClick={handleBack}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-xl font-bold text-sm hover:bg-slate-850 hover:scale-[1.02] active:scale-98 transition-all duration-200 shadow-md shadow-slate-900/10 cursor-pointer"
          >
            <Home className="w-4 h-4" />
            <span>Kembali ke Halaman Utama</span>
          </button>
          
          {user && (
            <button
              onClick={() => {
                logout();
                router.replace("/login");
              }}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-white text-slate-700 border border-slate-200 rounded-xl font-bold text-sm hover:bg-slate-50 hover:text-rose-600 hover:scale-[1.02] active:scale-98 transition-all duration-200 cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span>Log Keluar Akaun</span>
            </button>
          )}
        </div>

      </div>
    </div>
  );
}
