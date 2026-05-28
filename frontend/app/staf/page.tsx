"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { MapPin, Building2, ArrowRight, Users, ShieldCheck, Clock } from "lucide-react";

interface PremisDetail {
  nama_premis: string;
  alamat_premis: string;
  pautan_gmaps: string | null;
  kod_perniagaan: string;
}

export default function StafDashboard() {
  const { user } = useAuth();
  const [premis, setPremis] = useState<PremisDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id_premis) { setLoading(false); return; }
    const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";
    fetch(`${API_URL}/customer/premises/${user.id_premis}`)
      .then((r) => r.json())
      .then((d) => setPremis(d))
      .catch(() => setPremis(null))
      .finally(() => setLoading(false));
  }, [user]);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header */}
      <div>
        <h2 className="text-3xl lg:text-4xl font-black text-slate-900 tracking-tight">
          Selamat datang, <span className="bg-gradient-to-r from-blue-500 to-blue-600 bg-clip-text text-transparent">{user?.nama}</span>
        </h2>
        <p className="text-slate-400 mt-2 font-medium text-sm">
          <span className="mono-accent text-slate-300">{new Date().toLocaleDateString("ms-MY", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}</span>
        </p>
      </div>

      {/* ========== BENTO GRID ========== */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">

        {/* === Card 1: Premise Info (spans 2 cols) === */}
        <div className="glass-light rounded-3xl p-6 space-y-4 md:col-span-2 glow-blue">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/20">
                <Building2 className="w-5 h-5 text-white" />
              </div>
              <h3 className="font-black text-slate-800 text-lg tracking-tight">Premis Anda</h3>
            </div>
            {premis?.pautan_gmaps && (
              <a href={premis.pautan_gmaps} target="_blank" rel="noopener noreferrer"
                className="text-xs font-bold text-blue-500 hover:text-blue-600 flex items-center gap-1 spring-hover">
                Google Maps <ArrowRight className="w-3 h-3" />
              </a>
            )}
          </div>
          {loading ? (
            <div className="space-y-3">
              <div className="h-5 bg-slate-100/60 rounded-full animate-pulse w-2/3" />
              <div className="h-4 bg-slate-100/60 rounded-full animate-pulse w-1/2" />
            </div>
          ) : premis ? (
            <div className="space-y-3">
              <p className="text-2xl font-black text-slate-900 tracking-tight">{premis.nama_premis}</p>
              <div className="flex items-start gap-2 text-slate-400">
                <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0 text-blue-400" />
                <p className="text-sm leading-relaxed">{premis.alamat_premis}</p>
              </div>
            </div>
          ) : (
            <p className="text-sm text-slate-400 italic">Tiada premis dipautkan. Untuk dipautan, hubungi Pengurus anda.</p>
          )}
        </div>

        {/* === Card 2: Role Card === */}
        <div className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800 rounded-3xl p-6 flex flex-col justify-between text-white shadow-2xl shadow-blue-700/30 min-h-[200px]">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-400/20 rounded-full blur-3xl pointer-events-none" />
          <div className="relative">
            <div className="w-12 h-12 glass rounded-2xl flex items-center justify-center mb-4">
              <ShieldCheck className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-xl font-black tracking-tight mb-1">Staf Operasi</h3>
            <p className="text-blue-200 text-sm leading-relaxed">Anda mempunyai akses hanya kepada maklumat premis yang dipautkan.</p>
          </div>
          <div className="relative mt-4 glass rounded-2xl px-4 py-3">
            <p className="text-[10px] uppercase tracking-widest text-blue-200 font-bold">ID Premis</p>
            <p className="text-2xl font-black mono-accent">#{user?.id_premis ?? "—"}</p>
          </div>
        </div>

        {/* === Card 3: Status === */}
        <div className="glass-light rounded-3xl p-6 spring-hover">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-9 h-9 bg-emerald-100/80 rounded-xl flex items-center justify-center">
              <Users className="w-4 h-4 text-emerald-600" />
            </div>
            <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold">Status Akaun</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse" />
            <p className="text-lg font-black text-slate-800">Aktif</p>
          </div>
          <p className="text-xs text-slate-400 mt-1 font-medium">Sesi berjalan lancar</p>
        </div>

        {/* === Card 4: Session Info === */}
        <div className="glass-light rounded-3xl p-6 spring-hover md:col-span-2">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-9 h-9 bg-violet-100/80 rounded-xl flex items-center justify-center">
              <Clock className="w-4 h-4 text-violet-600" />
            </div>
            <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold">Maklumat Sesi</p>
          </div>
          <div className="grid grid-cols-2 gap-6">
            <div>
              <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold">Nama</p>
              <p className="text-base font-black text-slate-800 mt-0.5">{user?.nama}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold">E-mel</p>
              <p className="text-base font-bold text-slate-600 mt-0.5 mono-accent">{user?.emel}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
