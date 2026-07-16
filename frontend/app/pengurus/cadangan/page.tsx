"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { AlertTriangle, TrendingUp, CheckCircle, XCircle, Send, Loader2, Sparkles, Star, BrainCircuit, Clock, RefreshCw } from "lucide-react";

// formatIsu and other helpers remain unchanged ...

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
  status_pelaksanaan?: string;
}

const formatIsu = (text: string) => {
  const trimmed = text.trim();
  if (trimmed.startsWith('{') || trimmed.startsWith("'{") || trimmed.startsWith("\"{") || trimmed.startsWith("[{") || trimmed.startsWith("'[{")) {
    try {
      const jsonLike = trimmed.replace(/'/g, '"');
      const parsedData = JSON.parse(jsonLike);
      
      if (Array.isArray(parsedData)) {
        return (
          <div className="space-y-3 text-xs md:text-sm">
            {parsedData.map((item, index) => (
              <div key={index} className="space-y-1 pl-2.5 border-l border-slate-200">
                {typeof item === 'object' && item !== null ? (
                  Object.keys(item).map((key) => (
                    <p key={key} className="leading-relaxed text-slate-600 font-medium">
                      <span className="font-extrabold text-slate-800">{key}:</span> {String(item[key])}
                    </p>
                  ))
                ) : (
                  <p className="leading-relaxed text-slate-600 font-medium">{String(item)}</p>
                )}
              </div>
            ))}
          </div>
        );
      }

      return (
        <div className="space-y-2 text-xs md:text-sm">
          {Object.keys(parsedData).map((key, i) => (
            <p key={i} className="leading-relaxed text-slate-600 font-medium">
              <span className="font-extrabold text-slate-800">{key}:</span> {String(parsedData[key])}
            </p>
          ))}
        </div>
      );
    } catch (e) {
      // Fallback
    }
  }

  const lines = text.split(/\r?\n|(?=\d\.\s*(?:Mengapa|Kenapa|Bagaimana|Siapa|Bila|Apa))/g);
  const filteredLines = lines.filter(line => line.trim()).slice(0, 5);
  return (
    <div className="space-y-2.5 text-xs md:text-sm">
      {filteredLines.map((line, i) => {
        const trimmedLine = line.trim();
        
        if (trimmedLine.startsWith('-') || trimmedLine.startsWith('•') || trimmedLine.startsWith('*') || trimmedLine.startsWith('')) {
          const content = trimmedLine.replace(/^[-•*]\s*/, "");
          return (
            <div key={i} className="flex items-start gap-2 leading-relaxed">
              <span className="w-1.5 h-1.5 rounded-full bg-slate-400 mt-1.5 shrink-0 animate-pulse" />
              <span className="text-slate-600 font-semibold">{content}</span>
            </div>
          );
        }
        
        const qMarkIndex = trimmedLine.indexOf('?');
        if (qMarkIndex !== -1) {
          const question = trimmedLine.substring(0, qMarkIndex + 1);
          const answer = trimmedLine.substring(qMarkIndex + 1);
          return (
            <p key={i} className="leading-relaxed">
              <span className="font-extrabold text-slate-800">{question}</span>
              <span className="text-slate-600 font-medium">{answer}</span>
            </p>
          );
        }
        
        return <p key={i} className="leading-relaxed text-slate-600 font-medium">{trimmedLine}</p>;
      })}
    </div>
  );
};

const formatSaranan = (sarananStr: string) => {
  const renderFieldVal = (val: any) => {
    if (Array.isArray(val)) {
      return (
        <ul className="list-disc list-inside space-y-1 ml-2 mt-1">
          {val.map((item, idx) => (
            <li key={idx} className="text-slate-700 font-medium">{item}</li>
          ))}
        </ul>
      );
    }
    return val;
  };

  try {
    const trimmed = sarananStr.trim();
    if (trimmed.startsWith('{')) {
      const parsed = JSON.parse(trimmed);
      const normalizedParsed: Record<string, any> = {};
      Object.keys(parsed).forEach(key => {
        const normKey = key.toLowerCase().replace(/[\s_-]/g, "");
        normalizedParsed[normKey] = parsed[key];
      });


      const tindakanStaf = normalizedParsed["tindakanstaf"] || normalizedParsed["tindakanpenyelesaian"] || normalizedParsed["tindakan"] || normalizedParsed["saranan"] || "";
      const tindakanPengurus = normalizedParsed["tindakanpengurus"] || "";
      const kpi = normalizedParsed["kpi"] || "";
      const pantauan = normalizedParsed["kaedahpantauan"] || normalizedParsed["pantauan"] || normalizedParsed["pemantauan"] || "";
      
      return (
        <div className="space-y-2.5 text-xs md:text-sm leading-relaxed">
          {tindakanStaf && (
            <div>
              <span className="font-extrabold text-emerald-800">Tindakan Staf Operasi:</span> <span className="text-emerald-950 font-semibold">{renderFieldVal(tindakanStaf)}</span>
            </div>
          )}
          {tindakanPengurus && (
            <div>
              <span className="font-extrabold text-emerald-800">Tindakan Pengurus:</span> <span className="text-emerald-950 font-semibold">{renderFieldVal(tindakanPengurus)}</span>
            </div>
          )}
          {kpi && (
            <div>
              <span className="font-extrabold text-emerald-800">KPI:</span> <span className="text-emerald-900 font-medium">{renderFieldVal(kpi)}</span>
            </div>
          )}
          {pantauan && (
            <div>
              <span className="font-extrabold text-emerald-800">Pantauan:</span> <span className="text-emerald-900 font-medium">{renderFieldVal(pantauan)}</span>
            </div>
          )}
        </div>
      );
    }
  } catch (e) {
    // Fallback
  }
  const cleanStr = sarananStr.startsWith("Tindakan:") ? sarananStr.substring(9).trim() : sarananStr;
  return <p className="text-emerald-950 text-xs md:text-sm leading-relaxed font-semibold">{cleanStr}</p>;
};

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

export default function CadanganPage() {
  const { user } = useAuth();
  const [drafts, setDrafts] = useState<Cadangan[]>([]);
  const [activeTab, setActiveTab] = useState<string>("Draf");
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    if (user?.id_premis) {
      fetchDrafts();

      const checkRunningStatus = async () => {
        try {
          const res = await fetch(`${API_URL}/analytics/status/${user.id_premis}`);
          if (res.ok) {
            const data = await res.json();
            if (data.status === "running") {
              setGenerating(true);
              const interval = setInterval(async () => {
                try {
                  const statusRes = await fetch(`${API_URL}/analytics/status/${user.id_premis}`);
                  if (statusRes.ok) {
                    const statusData = await statusRes.json();
                    if (statusData.status === "idle") {
                      clearInterval(interval);
                      
                      // Fetch updated drafts
                      const draftsRes = await fetch(`${API_URL}/prescriptive/${user.id_premis}/drafts`);
                      if (draftsRes.ok) {
                        const draftsData = await draftsRes.json();
                        setDrafts(draftsData);
                      }
                      setGenerating(false);
                    }
                  }
                } catch (e) {
                  clearInterval(interval);
                  setGenerating(false);
                }
              }, 2000);
            }
          }
        } catch (e) {
          console.error("Error checking initial drafts AI status:", e);
        }
      };

      checkRunningStatus();
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
      const res = await fetch(`${API_URL}/analytics/topics/run/${user.id_premis}`, {
        method: "POST"
      });
      if (res.ok) {
        let attempts = 0;
        const maxAttempts = 30; // Max 60 seconds (30 * 2s)
        const interval = setInterval(async () => {
          attempts++;
          try {
            const statusRes = await fetch(`${API_URL}/analytics/status/${user.id_premis}`);
            if (statusRes.ok) {
              const statusData = await statusRes.json();
              if (statusData.status === "idle") {
                clearInterval(interval);
                
                // Fetch the updated drafts
                const draftsRes = await fetch(`${API_URL}/prescriptive/${user.id_premis}/drafts`);
                if (draftsRes.ok) {
                  const data = await draftsRes.json();
                  setDrafts(data);
                }
                setGenerating(false);
                return;
              }
            }
          } catch (e) {
            console.error("Polling drafts status error:", e);
          }

          if (attempts >= maxAttempts) {
            clearInterval(interval);
            // Fallback fetch
            const draftsRes = await fetch(`${API_URL}/prescriptive/${user.id_premis}/drafts`);
            if (draftsRes.ok) {
              const data = await draftsRes.json();
              setDrafts(data);
            }
            setGenerating(false);
          }
        }, 2000);
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
        // Update status in local state instead of deleting
        const newStatus = action === "approve" ? "Lulus" : action === "reject" ? "Tolak" : "Simpan";
        setDrafts(drafts.map((d) => d.id_cadangan === id_cadangan ? { ...d, status_kelulusan: newStatus } : d));
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

  const filteredDrafts = drafts.filter((d) => d.status_kelulusan === activeTab);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 p-6 md:p-8 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500/10 rounded-full blur-3xl pointer-events-none -mt-20 -mr-20" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none -mb-20 -ml-20" />
        
        <div className="relative">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-orange-500/25 text-orange-300 border border-orange-500/30 mb-3 backdrop-blur-xs">
            <Sparkles className="w-3.5 h-3.5 text-orange-400 animate-pulse" />
            Cadangan Maklum Balas AI
          </span>
          <h1 className="text-3xl md:text-4xl font-black tracking-tight">
            Idea &amp; Cadangan AI
          </h1>
          <p className="text-slate-300 mt-2 text-sm max-w-2xl leading-relaxed">
            Idea penyelesaian pantas untuk membantu staff anda menyelesaikan masalah harian pelanggan.
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

      {generating && (
        <div className="glass-light rounded-3xl p-5 border border-orange-200/50 bg-gradient-to-r from-orange-50/40 to-orange-100/20 shadow-sm flex items-center gap-4 animate-in fade-in slide-in-from-top-4 duration-300">
          <Loader2 className="w-5 h-5 animate-spin text-orange-500 shrink-0" />
          <div>
            <h4 className="font-extrabold text-slate-800 text-sm">Penjanaan Cadangan AI...</h4>
            <p className="text-xs text-slate-500 mt-0.5">Sila tunggu sebentar sementara AI merumuskan strategi baru.</p>
          </div>
        </div>
      )}

      {/* Tab Filter Navigation and Refresh Status Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-wrap gap-2.5 p-1.5 bg-slate-100/80 border border-slate-200/60 rounded-2xl max-w-2xl backdrop-blur-xs flex-1">
          {[
            { id: "Draf", label: "Semakan Baru", count: drafts.filter(d => d.status_kelulusan === "Draf").length, color: "text-amber-600 bg-amber-50/80 border-amber-200/50", icon: Clock },
            { id: "Simpan", label: "Disimpan", count: drafts.filter(d => d.status_kelulusan === "Simpan").length, color: "text-blue-600 bg-blue-50/80 border-blue-200/50", icon: Star },
            { id: "Lulus", label: "Diluluskan", count: drafts.filter(d => d.status_kelulusan === "Lulus").length, color: "text-emerald-600 bg-emerald-50/80 border-emerald-200/50", icon: Send },
            { id: "Tolak", label: "Ditolak", count: drafts.filter(d => d.status_kelulusan === "Tolak").length, color: "text-rose-600 bg-rose-50/80 border-rose-200/50", icon: XCircle },
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs md:text-sm transition-all duration-300 cursor-pointer border ${
                  isActive 
                    ? "bg-slate-900 text-white border-slate-900 shadow-md shadow-slate-900/10 scale-[1.02]" 
                    : "bg-white text-slate-600 hover:text-slate-900 border-slate-200 hover:bg-slate-50/50"
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? "text-orange-400" : ""}`} />
                <span>{tab.label}</span>
                <span className={`px-2 py-0.5 rounded-md text-[10px] font-black border ${
                  isActive ? "bg-slate-800 text-slate-300 border-slate-700" : tab.color
                }`}>
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        <button
          onClick={fetchDrafts}
          className="flex items-center justify-center gap-2 px-5 py-3 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-2xl font-bold text-xs md:text-sm transition-all duration-200 shadow-xs cursor-pointer active:scale-95 shrink-0 self-start sm:self-auto"
        >
          <RefreshCw className="w-4 h-4 text-slate-500" />
          <span>Kemaskini Status</span>
        </button>
      </div>

      {/* Drafts Section */}
      <div className="space-y-6">
        <div className="flex items-center justify-between border-b border-slate-200/60 pb-3">
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            {activeTab === "Draf" && "Tugasan Baru"}
            {activeTab === "Simpan" && "Cadangan Disimpan"}
            {activeTab === "Lulus" && "Cadangan Diluluskan"}
            {activeTab === "Tolak" && "Cadangan Ditolak"}
            
            {activeTab === "Draf" && (
              <span className="bg-orange-50 border border-orange-100 text-orange-600 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold tracking-wider uppercase ml-2 animate-pulse">
                Perlu Semakan
              </span>
            )}
            {activeTab === "Simpan" && (
              <span className="bg-blue-50 border border-blue-100 text-blue-600 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold tracking-wider uppercase ml-2">
                Simpan
              </span>
            )}
            {activeTab === "Lulus" && (
              <span className="bg-emerald-50 border border-emerald-100 text-emerald-600 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold tracking-wider uppercase ml-2">
                Aktif
              </span>
            )}
            {activeTab === "Tolak" && (
              <span className="bg-rose-50 border border-rose-100 text-rose-600 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold tracking-wider uppercase ml-2">
                Ditolak
              </span>
            )}
          </h2>
        </div>

        {filteredDrafts.length === 0 ? (
          <div className="glass-light rounded-3xl p-12 text-center border border-slate-200/50 shadow-xs">
            <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-slate-800">
              {activeTab === "Draf" && "Tiada tugasan tertunggak"}
              {activeTab === "Simpan" && "Tiada cadangan disimpan"}
              {activeTab === "Lulus" && "Tiada cadangan diluluskan"}
              {activeTab === "Tolak" && "Tiada cadangan ditolak"}
            </h3>
            <p className="text-slate-500 text-sm mt-1">
              {activeTab === "Draf" && "Semua cadangan AI telah disemak dengan jayanya."}
              {activeTab === "Simpan" && "Klik butang 'Simpan' pada cadangan baru untuk menyimpannya di sini."}
              {activeTab === "Lulus" && "Hantar cadangan untuk menugaskannya kepada staf operasi kafe."}
              {activeTab === "Tolak" && "Senarai cadangan yang telah ditolak akan dipaparkan di sini."}
            </p>
          </div>
        ) : (
          <div className="grid gap-6">
            {filteredDrafts.map((draft) => {
              const parts = draft.analisis_punca.split("|||");
              const rawIsuPendek = parts.length > 1 ? parts[0] : "Isu Dikesan";
              const isuPanjang = parts.length > 1 ? parts[1] : draft.analisis_punca;

              const deptMatch = rawIsuPendek.match(/\[+([^\]]+)\]+/);
              const department = deptMatch ? deptMatch[1].trim() : "";
              const isuPendek = rawIsuPendek.replace(/\[+[^\]]+\]+/, "").trim();

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
                      <h3 className="text-lg font-bold text-slate-800 tracking-tight flex items-center flex-wrap gap-2">
                        Isu: <span className="text-rose-600 font-extrabold">{isuPendek}</span>
                        {department && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200 shadow-2xs">
                            {department}
                          </span>
                        )}
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
                        Bukti & Pemerhatian
                      </h4>
                      {formatIsu(isuPanjang)}
                    </div>

                    {/* Right Block: Tindakan */}
                    <div className="bg-emerald-50/30 border border-emerald-100/80 rounded-2xl p-5 hover:bg-emerald-50/65 transition-colors duration-300 relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-100/30 rounded-full blur-xl pointer-events-none -mt-4 -mr-4" />
                      <h4 className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                        <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                        Cadangan Tindakan
                      </h4>
                      {formatSaranan(draft.saranan_strategik)}
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

                    {/* Actions and Status Badges */}
                    <div className="flex items-center justify-end gap-3 flex-wrap">
                      {draft.status_pelaksanaan === "Selesai" ? (
                        <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-black bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 shadow-sm shadow-emerald-500/5 animate-in fade-in duration-300">
                          <CheckCircle className="w-4 h-4 text-emerald-500 animate-bounce" />
                          Tindakan Selesai oleh Staf
                        </span>
                      ) : (
                        <>
                          {draft.status_kelulusan === "Lulus" && (
                            <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-amber-500/10 text-amber-600 border border-amber-500/20 mr-2">
                              <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-500" />
                              Dalam Pelaksanaan Staf
                            </span>
                          )}

                          {draft.status_kelulusan !== "Tolak" && (
                            <button
                              onClick={() => handleAction(draft.id_cadangan, "reject")}
                              disabled={actionLoading === draft.id_cadangan}
                              className="px-4 py-2.5 rounded-xl font-bold text-xs text-red-600 bg-red-50 hover:bg-red-100 border border-red-100 hover:border-red-200 flex items-center gap-2 shadow-xs transition-all duration-200 active:scale-95 cursor-pointer disabled:opacity-50"
                            >
                              {actionLoading === draft.id_cadangan ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <XCircle className="w-3.5 h-3.5" />}
                              Tolak
                            </button>
                          )}

                          {draft.status_kelulusan !== "Simpan" && (
                            <button
                              onClick={() => handleAction(draft.id_cadangan, "save")}
                              disabled={actionLoading === draft.id_cadangan}
                              className="px-4 py-2.5 rounded-xl font-bold text-xs text-blue-600 bg-blue-50 hover:bg-blue-100 border border-blue-100 hover:border-blue-200 flex items-center gap-2 shadow-xs transition-all duration-200 active:scale-95 cursor-pointer disabled:opacity-50"
                            >
                              {actionLoading === draft.id_cadangan ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Star className="w-3.5 h-3.5" />}
                              Simpan
                            </button>
                          )}

                          {draft.status_kelulusan !== "Lulus" && (
                            <button
                              onClick={() => handleAction(draft.id_cadangan, "approve")}
                              disabled={actionLoading === draft.id_cadangan}
                              className="px-5 py-2.5 rounded-xl font-bold text-xs bg-rose-900 text-white hover:bg-rose-950 border border-rose-950 shadow-md shadow-rose-900/10 hover:shadow-lg hover:shadow-rose-900/20 flex items-center gap-2 transition-all duration-200 active:scale-95 cursor-pointer disabled:opacity-50"
                            >
                              {actionLoading === draft.id_cadangan ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle className="w-3.5 h-3.5" />}
                              Hantar ke Staf
                            </button>
                          )}
                        </>
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
