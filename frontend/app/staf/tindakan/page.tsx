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

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

const formatStaffSaranan = (sarananStr: string) => {
  try {
    const trimmed = sarananStr.trim();
    if (trimmed.startsWith('{')) {
      const parsed = JSON.parse(trimmed);
      const normalizedParsed: Record<string, string> = {};
      Object.keys(parsed).forEach(key => {
        const normKey = key.toLowerCase().replace(/[\s_-]/g, "");
        normalizedParsed[normKey] = parsed[key];
      });
      // Extract ONLY tindakan staf
      const tindakanStaf = normalizedParsed["tindakanstaf"] || normalizedParsed["tindakanpenyelesaian"] || normalizedParsed["tindakan"] || normalizedParsed["saranan"] || "";
      if (tindakanStaf) {
        return tindakanStaf;
      }
    }
  } catch (e) {
    // Fallback
  }
  const cleanStr = sarananStr.startsWith("Tindakan:") ? sarananStr.substring(9).trim() : sarananStr;
  return cleanStr;
};

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
      const res = await fetch(`${API_URL}/prescriptive/${user?.id_premis}/work-orders`);
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
      const res = await fetch(`${API_URL}/prescriptive/work-order/${id_cadangan}/status`, {
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

      {/* Kanban Board */}
      <div className="mt-6">
        {workOrders.length === 0 ? (
          <div className="glass-light rounded-3xl p-12 text-center border border-slate-200/50 shadow-xs">
            <CheckCircle2 className="w-12 h-12 text-blue-400 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-slate-800">Tiada arahan kerja buat masa ini</h3>
            <p className="text-slate-500 text-sm mt-1">Sistem anda berada dalam keadaan optimum. Teruskan kecemerlangan!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
            {["Baru", "Dalam Proses", "Selesai"].map((status) => {
              const columnOrders = workOrders.filter(w => w.status_pelaksanaan === status);
              const isBaruCol = status === "Baru";
              const isProsesCol = status === "Dalam Proses";
              const isSelesaiCol = status === "Selesai";
              const count = columnOrders.length;
              
              return (
                <div key={status} className="flex flex-col gap-4 bg-slate-50/50 p-4 rounded-3xl border border-slate-200 shadow-sm min-h-[500px]">
                  <h2 className="font-black text-slate-800 text-lg flex items-center justify-between mb-2">
                    {status} 
                    <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold
                      ${isBaruCol ? 'bg-blue-100 text-blue-700' : ''}
                      ${isProsesCol ? 'bg-amber-100 text-amber-700' : ''}
                      ${isSelesaiCol ? 'bg-emerald-100 text-emerald-700' : ''}
                    `}>
                      {count}
                    </span>
                  </h2>
                  
                  {columnOrders.length === 0 ? (
                    <div className="text-center p-6 border border-dashed border-slate-300 rounded-2xl text-slate-400 text-sm font-medium">
                      Kosong
                    </div>
                  ) : (
                    columnOrders.map((wo) => {
                      const isBaru = wo.status_pelaksanaan === "Baru";
                      const isProses = wo.status_pelaksanaan === "Dalam Proses";
                      const isSelesai = wo.status_pelaksanaan === "Selesai";
                      
                      const parts = (wo.analisis_punca || "").split("|||");
                      const isuPendek = parts.length > 1 ? parts[0] : "Isu Dikesan";
                      const isuPanjang = parts.length > 1 ? parts[1] : wo.analisis_punca;

                      return (
                        <div
                          key={wo.id_cadangan}
                          className={`group relative rounded-2xl border transition-all duration-300 p-5 flex flex-col justify-between min-h-[240px]
                            ${isBaru ? 'bg-gradient-to-br from-white via-white to-blue-50/30 border-blue-100/80 shadow-[0_8px_24px_rgba(59,130,246,0.02)] hover:border-blue-300 hover:shadow-[0_12px_28px_rgba(59,130,246,0.06)]' : ''}
                            ${isProses ? 'bg-gradient-to-br from-white via-white to-amber-50/30 border-amber-100/80 shadow-[0_8px_24px_rgba(245,158,11,0.02)] hover:border-amber-300 hover:shadow-[0_12px_28px_rgba(245,158,11,0.06)]' : ''}
                            ${isSelesai ? 'bg-gradient-to-br from-white via-white to-emerald-50/15 border-emerald-100/50 shadow-xs opacity-75 grayscale-[0.1] hover:border-emerald-250' : ''}
                          `}
                        >
                          {isBaru && <div className="absolute top-0 left-0 w-1.5 h-full bg-blue-500 rounded-l-2xl" />}
                          {isProses && <div className="absolute top-0 left-0 w-1.5 h-full bg-amber-500 rounded-l-2xl" />}
                          {isSelesai && <div className="absolute top-0 left-0 w-1.5 h-full bg-emerald-500 rounded-l-2xl" />}
                          
                          {/* Compact Card Content */}
                          <div className="mb-3 flex justify-between items-start pl-2">
                            <h3 className={`font-black text-base leading-snug ${isSelesai ? 'line-through text-slate-500 font-bold' : 'text-slate-900'}`}>
                              {isuPendek}
                            </h3>
                            {wo.jenis_tindakan === "Isu" ? (
                              <AlertTriangle className={`w-5 h-5 shrink-0 ml-2 ${isBaru ? 'text-blue-500' : isProses ? 'text-amber-500' : 'text-slate-400'}`} />
                            ) : (
                              <TrendingUp className={`w-5 h-5 shrink-0 ml-2 ${isBaru ? 'text-blue-500' : isProses ? 'text-amber-500' : 'text-slate-400'}`} />
                            )}
                          </div>
                          
                          <div className="mb-4 pl-2 flex-1">
                            <p className="text-sm text-slate-600 mb-4 leading-relaxed">{isuPanjang}</p>
                            
                            <div className={`rounded-xl p-3.5 border transition-colors duration-300
                              ${isBaru ? 'bg-blue-50/60 border-blue-100/50 text-blue-950' : ''}
                              ${isProses ? 'bg-amber-50/60 border-amber-100/50 text-amber-950' : ''}
                              ${isSelesai ? 'bg-emerald-50/30 border-emerald-100/20 text-emerald-950' : ''}
                            `}>
                              <span className={`text-[11px] uppercase font-black block mb-1.5 tracking-wider
                                ${isBaru ? 'text-blue-600' : ''}
                                ${isProses ? 'text-amber-700' : ''}
                                ${isSelesai ? 'text-emerald-700' : ''}
                              `}>Tindakan:</span>
                              <p className="text-sm font-semibold leading-relaxed">{formatStaffSaranan(wo.saranan_strategik)}</p>
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="mt-auto pt-3.5 border-t border-slate-100 flex justify-between items-center pl-2">
                            <span className="text-xs text-slate-400 font-mono">#{wo.id_cadangan}</span>
                            
                            {isBaru && (
                              <button
                                onClick={() => handleUpdateStatus(wo.id_cadangan, "Dalam Proses")}
                                disabled={actionLoading === wo.id_cadangan}
                                className="px-4 py-2 rounded-xl font-bold text-xs bg-blue-500 text-white hover:bg-blue-600 shadow-md shadow-blue-500/10 hover:shadow-lg hover:shadow-blue-500/20 transition-all duration-200 active:scale-95 disabled:opacity-50 flex items-center gap-1.5"
                              >
                                {actionLoading === wo.id_cadangan ? <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <PlayCircle className="w-4 h-4" />}
                                Mula Tugasan
                              </button>
                            )}
                            {isProses && (
                              <button
                                onClick={() => handleUpdateStatus(wo.id_cadangan, "Selesai")}
                                disabled={actionLoading === wo.id_cadangan}
                                className="px-4 py-2 rounded-xl font-bold text-xs bg-emerald-500 text-white hover:bg-emerald-600 shadow-md shadow-emerald-500/10 hover:shadow-lg hover:shadow-emerald-500/20 transition-all duration-200 active:scale-95 disabled:opacity-50 flex items-center gap-1.5"
                              >
                                {actionLoading === wo.id_cadangan ? <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                                Selesai
                              </button>
                            )}
                            {isSelesai && (
                              <span className="text-xs font-bold text-emerald-500 flex items-center gap-1 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-100">
                                <CheckCircle2 className="w-4 h-4" /> Ditutup
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
