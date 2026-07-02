"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { AlertTriangle, TrendingUp, CheckCircle, XCircle, Send, Loader2, Sparkles, Star, BrainCircuit } from "lucide-react";

interface Cadangan {
  id_cadangan: number;
  id_topik: number;
  id_log_proses: number;
  jenis_tindakan: string;
  analisis_punca: string;
  saranan_strategik: string;
  skor_keyakinan: number;
  status_kelulusan: string;
  tarikh_jana: string;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

export default function CadanganPage() {
  const { user } = useAuth();
  const [drafts, setDrafts] = useState<Cadangan[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    if (user?.id_premis) {
      fetchDrafts();
    }
  }, [user]);

  const fetchDrafts = async () => {
    try {
      const res = await fetch(`${API_URL}/prescriptive/${user?.id_premis}/drafts`);
      if (res.ok) {
        const data = await res.json();
        setDrafts(data);
      }
    } catch (error) {
      console.error("Failed to fetch drafts:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async () => {
    if (!user?.id_premis) return;
    setGenerating(true);
    try {
      // Calls the topic generator which cascades into the prescriptive generator in the background
      const res = await fetch(`${API_URL}/analytics/topics/run/${user.id_premis}`, {
        method: "POST"
      });
      if (res.ok) {
        // Poll every 5 seconds for up to 60 seconds to wait for background task
        let attempts = 0;
        const interval = setInterval(async () => {
          attempts++;
          try {
            const draftsRes = await fetch(`${API_URL}/prescriptive/${user.id_premis}/drafts`);
            if (draftsRes.ok) {
              const data = await draftsRes.json();
              if (data.length > 0 || attempts >= 12) {
                clearInterval(interval);
                setDrafts(data);
                setGenerating(false);
              }
            }
          } catch (e) {
            console.error(e);
          }
          if (attempts >= 12) {
            clearInterval(interval);
            setGenerating(false);
          }
        }, 5000);
      } else {
        setGenerating(false);
      }
    } catch (error) {
      console.error("Failed to trigger generation:", error);
      setGenerating(false);
    }
  };

  const handleAction = async (id_cadangan: number, action: "approve" | "reject" | "save") => {
    setActionLoading(id_cadangan);
    try {
      const res = await fetch(`${API_URL}/prescriptive/${action}/${id_cadangan}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id_pengurus_lulus: user?.id_pengguna }),
      });
      if (res.ok) {
        // Remove from list
        setDrafts(drafts.filter((d) => d.id_cadangan !== id_cadangan));
      }
    } catch (error) {
      console.error(`Failed to ${action} draft:`, error);
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 p-6 md:p-8 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500/10 rounded-full blur-3xl pointer-events-none -mt-20 -mr-20" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none -mb-20 -ml-20" />
        
        <div className="relative">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-orange-500/25 text-orange-300 border border-orange-500/30 mb-3 backdrop-blur-xs">
            <Sparkles className="w-3.5 h-3.5 text-orange-400 animate-pulse" />
            Sistem Preskriptif AI
          </span>
          <h1 className="text-3xl md:text-4xl font-black tracking-tight">
            Cadangan Strategik <span className="text-slate-400 font-medium text-lg md:text-xl block md:inline md:ml-2">(Berasaskan AI)</span>
          </h1>
          <p className="text-slate-300 mt-2 text-sm max-w-2xl leading-relaxed">
            Platform pintar yang menukarkan corak maklum balas kepada tindakan pelaksanaan demi peningkatan kualiti perkhidmatan.
          </p>
        </div>
        
        <button 
          onClick={handleGenerate}
          disabled={generating}
          className="relative shrink-0 flex items-center gap-2 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-400 hover:to-orange-500 text-white px-5 py-3 rounded-2xl font-bold shadow-lg shadow-orange-500/20 transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-70 disabled:hover:scale-100"
        >
          {generating ? <Loader2 className="w-5 h-5 animate-spin" /> : <BrainCircuit className="w-5 h-5" />}
          {generating ? "Menjana..." : "Jana Cadangan AI"}
        </button>
      </div>

      {/* Drafts Section */}
      <div className="space-y-6">
        <div className="flex items-center justify-between border-b border-slate-200/60 pb-3">
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            Tugasan Baru 
            <span className="bg-orange-50 border border-orange-100 text-orange-600 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold tracking-wider uppercase ml-2 animate-pulse">
              Perlu Semakan
            </span>
          </h2>
        </div>

        {drafts.length === 0 ? (
          <div className="glass-light rounded-3xl p-12 text-center border border-slate-200/50 shadow-xs">
            <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-slate-800">Tiada tugasan tertunggak</h3>
            <p className="text-slate-500 text-sm mt-1">Semua cadangan AI telah disemak dengan jayanya.</p>
          </div>
        ) : (
          <div className="grid gap-6">
            {drafts.map((draft) => {
              const parts = draft.analisis_punca.split("|||");
              const isuPendek = parts.length > 1 ? parts[0] : "Isu Dikesan";
              const isuPanjang = parts.length > 1 ? parts[1] : draft.analisis_punca;

              return (
              <div key={draft.id_cadangan} className="group relative bg-white/90 backdrop-blur-md rounded-2xl border border-slate-200/80 shadow-[0_8px_30px_rgb(0,0,0,0.02)] hover:shadow-[0_20px_40px_rgb(0,0,0,0.06)] hover:-translate-y-1 transition-all duration-300 ease-out p-6 mb-4">
                {/* Golden/Amber Left Border - Modernized as a glowing gradient border */}
                <div className="absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b from-amber-400 to-amber-500 shadow-[2px_0_10px_rgba(245,158,11,0.25)] rounded-l-2xl" />
                
                <div>
                  {/* Top Header Row */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
                    <div className="flex items-center gap-3">
                      {/* Red Alert Circle Icon - Modernized rounded square with shadow */}
                      <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-rose-50 border border-rose-100 text-rose-500 shadow-inner group-hover:scale-105 transition-transform duration-300">
                        <AlertTriangle className="w-5 h-5 animate-pulse" style={{ animationDuration: '3s' }} />
                      </div>
                      <h3 className="text-lg font-bold text-slate-800 tracking-tight">
                        Isu : <span className="text-rose-600 font-extrabold">{isuPendek}</span>
                      </h3>
                    </div>
                    
                    {/* Keyakinan AI Badge */}
                    <div className="flex items-center gap-1.5 self-start sm:self-auto bg-blue-50/80 border border-blue-100 text-blue-700 rounded-full px-3 py-1 text-xs font-bold shadow-xs">
                      <BrainCircuit className="w-3.5 h-3.5" />
                      Keyakinan AI: <span className="font-extrabold text-blue-800">{draft.skor_keyakinan}%</span>
                    </div>
                  </div>

                  {/* Content Row (Two Columns) */}
                  <div className="grid md:grid-cols-2 gap-5 mb-5">
                    {/* Left Block: Kenapa */}
                    <div className="border border-slate-200/60 bg-slate-50/45 rounded-2xl p-5 hover:bg-slate-50/80 transition-colors duration-300 relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-24 h-24 bg-slate-100/50 rounded-full blur-xl pointer-events-none -mt-4 -mr-4" />
                      <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                        <TrendingUp className="w-3.5 h-3.5 text-slate-400" />
                        Kenapa Isu Ini Dikesan?
                      </h4>
                      <p className="text-slate-600 text-sm leading-relaxed">
                        {isuPanjang}
                      </p>
                    </div>

                    {/* Right Block: Tindakan */}
                    <div className="bg-emerald-50/30 border border-emerald-100/80 rounded-2xl p-5 hover:bg-emerald-50/65 transition-colors duration-300 relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-100/30 rounded-full blur-xl pointer-events-none -mt-4 -mr-4" />
                      <h4 className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                        <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                        Tindakan Yang Dicadangkan:
                      </h4>
                      <p className="text-emerald-950 text-sm leading-relaxed font-semibold">
                        Tindakan: {draft.saranan_strategik}
                      </p>
                    </div>
                  </div>

                  {/* Divider */}
                  <div className="border-t border-slate-100/85 mb-4" />

                  {/* Footer Row */}
                  <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4">
                    {/* Data Teknikal */}
                    <div className="flex items-center gap-2 text-slate-400 hover:text-slate-600 text-[10px] font-mono bg-slate-50/80 hover:bg-slate-100 border border-slate-200/50 rounded-lg px-2.5 py-1.5 transition-all duration-200 cursor-pointer self-start">
                      <span>⚡ Log ID: LOG_{draft.id_log_proses}</span>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-end gap-3">
                      <button
                        onClick={() => handleAction(draft.id_cadangan, "reject")}
                        disabled={actionLoading === draft.id_cadangan}
                        className="px-4 py-2.5 rounded-xl font-bold text-xs text-red-600 bg-red-50 hover:bg-red-100 border border-red-100 hover:border-red-200 flex items-center gap-2 shadow-xs transition-all duration-200 active:scale-95 cursor-pointer disabled:opacity-50"
                      >
                        {actionLoading === draft.id_cadangan ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <XCircle className="w-3.5 h-3.5" />}
                        Tolak
                      </button>

                      <button
                        onClick={() => handleAction(draft.id_cadangan, "save")}
                        disabled={actionLoading === draft.id_cadangan}
                        className="px-4 py-2.5 rounded-xl font-bold text-xs text-blue-600 bg-blue-50 hover:bg-blue-100 border border-blue-100 hover:border-blue-200 flex items-center gap-2 shadow-xs transition-all duration-200 active:scale-95 cursor-pointer disabled:opacity-50"
                      >
                        {actionLoading === draft.id_cadangan ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Star className="w-3.5 h-3.5" />}
                        Simpan
                      </button>

                      <button
                        onClick={() => handleAction(draft.id_cadangan, "approve")}
                        disabled={actionLoading === draft.id_cadangan}
                        className="px-5 py-2.5 rounded-xl font-bold text-xs bg-rose-900 text-white hover:bg-rose-950 border border-rose-950 shadow-md shadow-rose-900/10 hover:shadow-lg hover:shadow-rose-900/20 flex items-center gap-2 transition-all duration-200 active:scale-95 cursor-pointer disabled:opacity-50"
                      >
                        {actionLoading === draft.id_cadangan ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle className="w-3.5 h-3.5" />}
                        Luluskan & Hantar ke Staf
                      </button>
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
