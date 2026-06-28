"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { AlertTriangle, TrendingUp, Clock, CheckCircle2, PlayCircle, ClipboardList, ShieldCheck } from "lucide-react";

interface Cadangan {
  id_cadangan: number;
  id_premis: number;
  jenis_tindakan: string;
  analisis_punca: string;
  saranan_strategik: string;
  status_pelaksanaan: string;
  tarikh_lulus: string;
  id_pengurus_lulus: number;
}

export default function ArahanKerjaPage() {
  const { user } = useAuth();
  const [workOrders, setWorkOrders] = useState<Cadangan[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  useEffect(() => {
    if (user?.id_premis) {
      fetchWorkOrders();
    }
  }, [user]);

  const fetchWorkOrders = async () => {
    try {
      const res = await fetch(`http://localhost:8000/api/prescriptive/${user?.id_premis}/work-orders`);
      if (res.ok) {
        const data = await res.json();
        setWorkOrders(data);
      }
    } catch (error) {
      console.error("Failed to fetch work orders:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (id_cadangan: number, newStatus: string) => {
    setActionLoading(id_cadangan);
    try {
      const res = await fetch(`http://localhost:8000/api/prescriptive/work-order/${id_cadangan}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status_pelaksanaan: newStatus }),
      });
      if (res.ok) {
        const updated = await res.json();
        setWorkOrders((prev) =>
          prev.map((wo) => (wo.id_cadangan === id_cadangan ? updated : wo))
        );
      }
    } catch (error) {
      console.error("Failed to update status:", error);
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Calculate stats
  const countBaru = workOrders.filter(w => w.status_pelaksanaan === "Baru").length;
  const countProses = workOrders.filter(w => w.status_pelaksanaan === "Dalam Proses").length;
  const countSelesai = workOrders.filter(w => w.status_pelaksanaan === "Selesai").length;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 p-6 md:p-8 text-white shadow-xl">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none -mt-20 -mr-20" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none -mb-20 -ml-20" />
        
        <div className="relative">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-500/25 text-blue-300 border border-blue-500/30 mb-3 backdrop-blur-xs">
            <ClipboardList className="w-3.5 h-3.5 text-blue-400" />
            SOP & Tindakan Staf
          </span>
          <h1 className="text-3xl md:text-4xl font-black tracking-tight">
            Arahan Kerja <span className="text-slate-400 font-medium text-lg md:text-xl block md:inline md:ml-2">(SOP Pelaksanaan)</span>
          </h1>
          <p className="text-slate-300 mt-2 text-sm max-w-2xl leading-relaxed">
            Senarai tugas rasmi dan arahan pembaikan yang diluluskan oleh Pengurus untuk tindakan pembetulan segera.
          </p>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="glass-light rounded-2xl p-6 border border-blue-100/70 relative overflow-hidden hover:-translate-y-1 hover:shadow-lg transition-all duration-300">
          <div className="absolute top-0 right-0 w-24 h-24 bg-blue-100/30 rounded-full blur-xl pointer-events-none -mt-8 -mr-8" />
          <p className="text-[10px] uppercase tracking-widest text-slate-450 font-extrabold mb-1">Diterima</p>
          <div className="flex items-end justify-between">
            <span className="text-4xl font-black text-slate-800 mono-accent">{countBaru}</span>
            <span className="text-xs font-bold text-blue-600 bg-blue-50 border border-blue-100 rounded-lg px-2 py-1 mb-1">Tugasan Baru</span>
          </div>
        </div>
        <div className="glass-light rounded-2xl p-6 border border-amber-100/70 relative overflow-hidden hover:-translate-y-1 hover:shadow-lg transition-all duration-300">
          <div className="absolute top-0 right-0 w-24 h-24 bg-amber-100/30 rounded-full blur-xl pointer-events-none -mt-8 -mr-8" />
          <p className="text-[10px] uppercase tracking-widest text-slate-450 font-extrabold mb-1">Dalam Proses</p>
          <div className="flex items-end justify-between">
            <span className="text-4xl font-black text-slate-800 mono-accent">{countProses}</span>
            <span className="text-xs font-bold text-amber-600 bg-amber-50 border border-amber-100 rounded-lg px-2 py-1 mb-1">Sedang Berjalan</span>
          </div>
        </div>
        <div className="glass-light rounded-2xl p-6 border border-emerald-100/70 relative overflow-hidden hover:-translate-y-1 hover:shadow-lg transition-all duration-300">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-100/30 rounded-full blur-xl pointer-events-none -mt-8 -mr-8" />
          <p className="text-[10px] uppercase tracking-widest text-slate-450 font-extrabold mb-1">Selesai</p>
          <div className="flex items-end justify-between">
            <span className="text-4xl font-black text-slate-800 mono-accent">{countSelesai}</span>
            <span className="text-xs font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 rounded-lg px-2 py-1 mb-1">Telah Ditutup</span>
          </div>
        </div>
      </div>

      {/* Work Orders List */}
      <div className="space-y-6">
        {workOrders.length === 0 ? (
          <div className="glass-light rounded-3xl p-12 text-center border border-slate-200/50 shadow-xs">
            <CheckCircle2 className="w-12 h-12 text-blue-400 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-slate-800">Tiada arahan kerja buat masa ini</h3>
            <p className="text-slate-500 text-sm mt-1">Sistem anda berada dalam keadaan optimum. Teruskan kecemerlangan!</p>
          </div>
        ) : (
          <div className="grid gap-6">
            {workOrders.map((wo) => {
              const isBaru = wo.status_pelaksanaan === "Baru";
              const isProses = wo.status_pelaksanaan === "Dalam Proses";
              const isSelesai = wo.status_pelaksanaan === "Selesai";
              
              const parts = (wo.analisis_punca || "").split("|||");
              const isuPendek = parts.length > 1 ? parts[0] : "Isu Dikesan";
              const isuPanjang = parts.length > 1 ? parts[1] : wo.analisis_punca;

              return (
                <div key={wo.id_cadangan} className={`group relative bg-white/90 backdrop-blur-md rounded-2xl border border-slate-200/80 shadow-[0_8px_30px_rgb(0,0,0,0.02)] hover:shadow-[0_20px_40px_rgb(0,0,0,0.06)] hover:-translate-y-1 transition-all duration-300 ease-out p-6 mb-4 ${isSelesai ? 'opacity-75' : ''}`}>
                  {isBaru && <div className="absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b from-blue-400 to-blue-500 shadow-[2px_0_10px_rgba(59,130,246,0.25)] rounded-l-2xl" />}
                  {isProses && <div className="absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b from-amber-400 to-amber-500 shadow-[2px_0_10px_rgba(245,158,11,0.25)] rounded-l-2xl" />}
                  {isSelesai && <div className="absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b from-emerald-400 to-emerald-500 shadow-[2px_0_10px_rgba(16,185,129,0.25)] rounded-l-2xl" />}

                  <div>
                    {/* Top Header Row */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
                      <div className="flex items-center gap-3">
                        {/* Icon based on status or type */}
                        <div className={`flex items-center justify-center w-10 h-10 rounded-xl border shadow-inner group-hover:scale-105 transition-transform duration-300
                          ${isBaru ? 'bg-blue-50/70 border-blue-100 text-blue-500' : ''}
                          ${isProses ? 'bg-amber-50/70 border-amber-100 text-amber-500' : ''}
                          ${isSelesai ? 'bg-emerald-50/70 border-emerald-100 text-emerald-500' : ''}
                        `}>
                          {wo.jenis_tindakan === "Isu" ? (
                            <AlertTriangle className="w-5 h-5" />
                          ) : (
                            <TrendingUp className="w-5 h-5" />
                          )}
                        </div>
                        <h3 className="text-lg font-bold text-slate-800 tracking-tight">
                          Isu : <span className={`font-extrabold ${isSelesai ? 'text-slate-500 line-through' : 'text-slate-800'}`}>{isuPendek}</span>
                        </h3>
                      </div>
                      
                      {/* Status Badge */}
                      <div className={`rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider border shadow-xs self-start sm:self-auto
                        ${isBaru ? 'bg-blue-50 border-blue-100 text-blue-700' : ''}
                        ${isProses ? 'bg-amber-50 border-amber-100 text-amber-700' : ''}
                        ${isSelesai ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : ''}
                      `}>
                        Status: {wo.status_pelaksanaan}
                      </div>
                    </div>

                    {/* Content Row (Two Columns) */}
                    <div className="grid md:grid-cols-2 gap-5 mb-5">
                      {/* Left Block: Kenapa/Punca */}
                      <div className="border border-slate-200/60 bg-slate-50/45 rounded-2xl p-5 hover:bg-slate-50/80 transition-colors duration-300 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-slate-100/50 rounded-full blur-xl pointer-events-none -mt-4 -mr-4" />
                        <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                          <AlertTriangle className="w-3.5 h-3.5 text-slate-400" />
                          Punca Sebenar Isu
                        </h4>
                        <p className="text-slate-600 text-sm leading-relaxed">
                          {isuPanjang}
                        </p>
                      </div>

                      {/* Right Block: Tindakan */}
                      <div className="bg-green-50/30 border border-green-100/80 rounded-2xl p-5 hover:bg-green-50/65 transition-colors duration-300 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-green-100/30 rounded-full blur-xl pointer-events-none -mt-4 -mr-4" />
                        <h4 className="text-[10px] font-bold text-green-600 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
                          Tindakan Yang Diperlukan:
                        </h4>
                        <p className="text-green-950 text-sm leading-relaxed font-semibold">
                          Tindakan: {wo.saranan_strategik}
                        </p>
                      </div>
                    </div>

                    {/* Divider */}
                    <div className="border-t border-slate-100/85 mb-4" />

                    {/* Footer Row */}
                    <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4">
                      {/* Data Teknikal / Kelulusan Pengurus */}
                      <div className="flex items-center gap-3 text-xs self-start">
                        <div className="flex items-center gap-2 text-slate-500 bg-slate-50/80 border border-slate-200/50 px-3 py-1.5 rounded-xl shadow-xs">
                          <ShieldCheck className="w-4 h-4 text-blue-500" />
                          <span>Disahkan oleh Pengurus #{wo.id_pengurus_lulus}</span>
                          {wo.tarikh_lulus && (
                            <span className="text-slate-400 flex items-center gap-1 ml-2 border-l border-slate-200 pl-2 font-mono">
                              <Clock className="w-3 h-3" /> {new Date(wo.tarikh_lulus).toLocaleString('ms-MY')}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center justify-end gap-3">
                        {isBaru && (
                          <button
                            onClick={() => handleUpdateStatus(wo.id_cadangan, "Dalam Proses")}
                            disabled={actionLoading === wo.id_cadangan}
                            className="px-5 py-2.5 rounded-xl font-bold text-xs bg-blue-500 text-white hover:bg-blue-600 shadow-md shadow-blue-500/10 hover:shadow-lg hover:shadow-blue-500/20 transition-all duration-200 active:scale-95 flex items-center gap-2 cursor-pointer disabled:opacity-50"
                          >
                            {actionLoading === wo.id_cadangan ? <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <PlayCircle className="w-4 h-4" />}
                            Mula Tugasan Ini
                          </button>
                        )}
                        {isProses && (
                          <button
                            onClick={() => handleUpdateStatus(wo.id_cadangan, "Selesai")}
                            disabled={actionLoading === wo.id_cadangan}
                            className="px-5 py-2.5 rounded-xl font-bold text-xs bg-emerald-500 text-white hover:bg-emerald-600 shadow-md shadow-emerald-500/10 hover:shadow-lg hover:shadow-emerald-500/20 transition-all duration-200 active:scale-95 flex items-center gap-2 cursor-pointer disabled:opacity-50"
                          >
                            {actionLoading === wo.id_cadangan ? <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                            Tandakan Sebagai Selesai
                          </button>
                        )}
                        {isSelesai && (
                          <span className="text-xs font-bold text-slate-400 bg-slate-50 border border-slate-200/50 rounded-xl px-4 py-2 flex items-center gap-1.5 shadow-inner">
                            <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Tugasan Selesai
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
