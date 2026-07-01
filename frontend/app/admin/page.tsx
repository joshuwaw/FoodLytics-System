"use client";

import { Store, QrCode, ShieldCheck, ArrowRight, Activity, Users } from "lucide-react";
import Link from "next/link";

export default function AdminDashboard() {
  const stats = [
    { label: "Premis Berdaftar", val: "12", icon: Store, color: "text-teal-500 bg-teal-50 border-teal-100" },
    { label: "Imbasan QR Aktif", val: "1.5k+", icon: QrCode, color: "text-emerald-500 bg-emerald-50 border-emerald-100" },
    { label: "Status Integrasi API", val: "Stabil", icon: Activity, color: "text-indigo-500 bg-indigo-50 border-indigo-100" },
  ];

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200/40 pb-5">
        <div>
          <h2 className="text-3xl lg:text-4xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            Selamat Datang,{" "}
            <span className="bg-gradient-to-r from-teal-500 to-emerald-500 bg-clip-text text-transparent">
              Administrator
            </span>
            <span className="animate-bounce">⚡</span>
          </h2>
          <p className="text-slate-400 mt-1 text-sm font-bold tracking-wider uppercase flex items-center gap-1.5">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            Sistem Hub Kawalan • Portal Utama
          </p>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {stats.map((stat, idx) => (
          <div key={idx} className="glass-light rounded-3xl p-5 border-l-4 border-l-teal-500 shadow-md shadow-teal-500/5 flex flex-col justify-between spring-hover">
            <div className="flex items-center gap-2.5">
              <div className={`w-9 h-9 border rounded-2xl flex items-center justify-center shadow-sm ${stat.color}`}>
                <stat.icon className="w-4 h-4" />
              </div>
              <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold">{stat.label}</p>
            </div>
            <div className="mt-4">
              <p className="text-3xl font-black text-slate-900 mono-accent">{stat.val}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Main Steps */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
        <div className="glass-light rounded-3xl p-6 border border-slate-200/50 shadow-sm relative overflow-hidden spring-hover">
          <div className="absolute top-0 right-0 w-24 h-24 bg-teal-500/5 rounded-full blur-2xl pointer-events-none" />
          <h3 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Store className="w-5 h-5 text-teal-500" />
            Langkah 1: Daftar Premis Baru
          </h3>
          <p className="mt-3 text-sm text-slate-500 leading-relaxed">
            Daftarkan restoran, kafe, atau gerai anda ke dalam sistem. Maklumat ini akan digunakan untuk borang maklum balas.
          </p>
          <div className="mt-6">
            <Link href="/admin/register" className="inline-flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-teal-500 to-emerald-500 text-white rounded-xl text-xs font-bold shadow-md shadow-teal-500/20 hover:shadow-lg transition-all duration-200">
              Daftar Sekarang <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
        
        <div className="glass-light rounded-3xl p-6 border border-slate-200/50 shadow-sm relative overflow-hidden spring-hover">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none" />
          <h3 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
            <QrCode className="w-5 h-5 text-emerald-500" />
            Langkah 2: Jana & Cetak Kod QR
          </h3>
          <p className="mt-3 text-sm text-slate-500 leading-relaxed">
            Jana Kod QR unik untuk setiap premis. Pelanggan boleh mengimbas kod ini untuk memberikan maklum balas secara terus.
          </p>
          <div className="mt-6">
            <Link href="/admin/qr" className="inline-flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-500/20 hover:shadow-lg transition-all duration-200">
              Jana QR Kod <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
