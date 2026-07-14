"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as ReTooltip,
  ResponsiveContainer
} from "recharts";
import { TrendingUp, MessageSquare, Star, ArrowLeft, HeartPulse, Activity, Flame, Utensils, Trash2, RefreshCw, Settings, Building2, Plus, X } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

interface TrendData {
  Minggu: string;
  "Google Reviews"?: number;
  "Portal QR"?: number;
  "X (Twitter)"?: number;
  "Instagram"?: number;
}

interface FeedbackBySource {
  sumber: string;
  jumlah: number;
}

// ─── Shared axis style ─────────────────────────────────────────────────────
const axisStyle = { fontSize: 11, fontFamily: "var(--font-geist-mono)", fill: "#94a3b8", fontWeight: 600 };

const getSourceColorHex = (src: string) => {
  const map: Record<string, string> = {
    "Google Reviews": "#3b82f6",
    "Portal QR": "#64748b",
    "X (Twitter)": "#6366f1",
    "Instagram": "#ec4899"
  };
  return map[src] || "#10b981";
};

interface TooltipPayload {
  dataKey?: string | number;
  name?: string;
  value?: number;
  color?: string;
  fill?: string;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: TooltipPayload[];
  label?: string;
}

// ─── Custom Tooltip: glassmorphism style ─────────────────────────────────
function TrendTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white/90 backdrop-blur-md border border-slate-200/60 rounded-2xl px-4 py-3 shadow-xl shadow-slate-900/10 min-w-[150px]">
      <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold mb-2">{label}</p>
      <div className="space-y-1.5">
        {payload.map((p) => (
          <div key={p.dataKey} className="flex justify-between items-center gap-4 text-xs font-semibold">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color || p.fill }} />
              <span className="text-slate-500">{p.name}</span>
            </div>
            <span className="font-black mono-accent text-slate-800">{p.value} ulasan</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function TrendIndustriPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<"Khusus" | "Umum">("Khusus");
  
  // Data State
  const [loading, setLoading] = useState(true);
  const [trendData, setTrendData] = useState<TrendData[]>([]);
  const [feedbackBySource, setFeedbackBySource] = useState<FeedbackBySource[]>([]);
  const [totalFeedback, setTotalFeedback] = useState(0);
  const [avgRating, setAvgRating] = useState(0);
  const [pertumbuhan, setPertumbuhan] = useState<number>(0);
  const [topics, setTopics] = useState<any[]>([]);

  // Competitor States
  const [competitorTrends, setCompetitorTrends] = useState<any[]>([]);
  const [competitors, setCompetitors] = useState<any[]>([]);
  const [scraping, setScraping] = useState(false);
  const [showManageCompetitors, setShowManageCompetitors] = useState(false);
  const [newCompetitor, setNewCompetitor] = useState({ nama_pesaing: "", pautan_gmaps: "" });
  const [addingCompetitor, setAddingCompetitor] = useState(false);

  // Filter state
  const [visibleSources, setVisibleSources] = useState<string[]>([]);

  const fetchAllData = () => {
    if (!user?.id_premis) return;
    const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";
    setLoading(true);

    Promise.all([
      fetch(`${API_URL}/customer/trend-data/${user.id_premis}`).then(r => r.json()),
      fetch(`${API_URL}/customer/feedback-by-source/${user.id_premis}`).then(r => r.json()),
      fetch(`${API_URL}/customer/sentiment-stats/${user.id_premis}`).then(r => r.json()),
      fetch(`${API_URL}/analytics/topics/${user.id_premis}`).then(r => r.json()),
      fetch(`${API_URL}/analytics/competitors/${user.id_premis}`).then(r => r.json()),
      fetch(`${API_URL}/analytics/pesaing/${user.id_premis}`).then(r => r.json())
    ])
    .then(([trend, sources, stats, topicsData, compTrends, compList]) => {
      setTrendData(Array.isArray(trend) ? trend : []);
      setFeedbackBySource(Array.isArray(sources) ? sources : []);
      setTotalFeedback(stats.total || 0);
      setAvgRating(stats.purata_bintang || 0);
      setPertumbuhan(stats.pertumbuhan ?? 0);
      setTopics(topicsData.topics || []);
      setCompetitorTrends(Array.isArray(compTrends) ? compTrends : []);
      setCompetitors(Array.isArray(compList) ? compList : []);
      
      if (Array.isArray(sources)) {
        setVisibleSources(sources.map(s => s.sumber));
      }
    })
    .catch(console.error)
    .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchAllData();
  }, [user]);

  const handleAddCompetitor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id_premis) return;
    setAddingCompetitor(true);
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";
      const res = await fetch(`${API_URL}/analytics/pesaing`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id_premis: user.id_premis, ...newCompetitor })
      });
      if (res.ok) {
        toast.success("Pesaing berjaya ditambah!");
        setNewCompetitor({ nama_pesaing: "", pautan_gmaps: "" });
        // Refresh
        const compList = await fetch(`${API_URL}/analytics/pesaing/${user.id_premis}`).then(r => r.json());
        setCompetitors(compList);
      } else {
        toast.error("Gagal menambah pesaing.");
      }
    } catch (err) {
      toast.error("Ralat rangkaian.");
    } finally {
      setAddingCompetitor(false);
    }
  };

  const handleDeleteCompetitor = async (id: number) => {
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";
      const res = await fetch(`${API_URL}/analytics/pesaing/${id}`, {
        method: "DELETE"
      });
      if (res.ok) {
        toast.success("Pesaing berjaya dipadam.");
        setCompetitors(prev => prev.filter(c => c.id_pesaing !== id));
      } else {
        toast.error("Gagal memadam pesaing.");
      }
    } catch (err) {
      toast.error("Ralat rangkaian.");
    }
  };

  const handleTriggerScrape = async () => {
    if (!user?.id_premis) return;
    setScraping(true);
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";
      const res = await fetch(`${API_URL}/analytics/competitors/scrape/${user.id_premis}`, {
        method: "POST"
      });
      if (res.ok) {
        toast.success("Analisis pesaing berjaya dikemas kini!");
        const compTrends = await fetch(`${API_URL}/analytics/competitors/${user.id_premis}`).then(r => r.json());
        setCompetitorTrends(compTrends);
      } else {
        toast.error("Gagal menganalisis pesaing.");
      }
    } catch (err) {
      toast.error("Ralat rangkaian.");
    } finally {
      setScraping(false);
    }
  };

  const toggleSource = (src: string) => {
    setVisibleSources(prev => 
      prev.includes(src) ? prev.filter(s => s !== src) : [...prev, src]
    );
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-10">
      {/* Header Section */}
      <div>
        <Link href="/pengurus" className="text-orange-500 hover:text-orange-600 font-bold text-xs uppercase tracking-widest flex items-center gap-2 mb-4 spring-hover">
          <ArrowLeft size={14} /> Kembali ke Dashboard
        </Link>
        <h2 className="text-3xl lg:text-4xl font-black text-slate-900 tracking-tight">
          Hab <span className="bg-gradient-to-r from-orange-500 to-orange-600 bg-clip-text text-transparent">Analitik</span>
        </h2>
        <p className="text-slate-400 mt-1.5 text-sm mono-accent">
          Analisis mendalam mengenai wawasan khusus jenama dan pasaran luas
        </p>
      </div>

      {/* Tabs */}
      <div className="flex bg-white/50 border border-slate-200/60 p-1.5 rounded-2xl w-fit shadow-sm">
        <button
          onClick={() => setActiveTab("Khusus")}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${
            activeTab === "Khusus" 
            ? "bg-slate-800 text-white shadow-md scale-[1.02]" 
            : "text-slate-500 hover:text-slate-800 hover:bg-slate-100/50"
          }`}
        >
          <Activity size={16} /> Prestasi Jenama Saya (Khusus)
        </button>
        <button
          onClick={() => setActiveTab("Umum")}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${
            activeTab === "Umum" 
            ? "bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-md shadow-indigo-500/20 scale-[1.02]" 
            : "text-slate-500 hover:text-slate-800 hover:bg-slate-100/50"
          }`}
        >
          <Flame size={16} /> Trend Pasaran (Umum)
        </button>
      </div>

      {/* TAB CONTENT: PRESTASI JENAMA SAYA */}
      {activeTab === "Khusus" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Main Stats Card */}
            <div className="lg:col-span-2 glass-light rounded-3xl p-6 border border-slate-100/60 shadow-sm relative overflow-hidden group hover:shadow-md transition-all duration-300">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-orange-500 to-orange-600" />
              
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-bold text-slate-400 text-xs uppercase tracking-widest flex items-center gap-2">
                    <MessageSquare size={14} className="text-blue-500"/> Maklum Balas Dalaman
                  </p>
                  <div className="mt-4 flex items-baseline gap-3">
                    <p className="text-4xl font-black text-slate-900 mono-accent flex items-center">
                      <Star className="w-6 h-6 text-amber-500 mr-1.5 fill-current" />
                      {avgRating > 0 ? avgRating : "—"} <span className="text-lg text-slate-400 font-semibold ml-1">/5.0</span>
                    </p>
                  </div>
                  <p className="text-xs text-slate-400 mt-1.5 font-medium">Purata Rating ({totalFeedback} ulasan)</p>
                </div>
                
                <div className={`flex items-center gap-1 px-2.5 py-1 rounded-xl border text-[10px] uppercase font-black tracking-widest ${
                  pertumbuhan >= 0 
                    ? 'bg-emerald-50 border-emerald-100 text-emerald-600' 
                    : 'bg-rose-50 border-rose-100 text-rose-600'
                }`}>
                  <span className={`w-1 h-1 rounded-full ${pertumbuhan >= 0 ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                  {pertumbuhan >= 0 ? '+' : ''}{pertumbuhan}%
                </div>
              </div>
              
              <div className="mt-6 pt-5 border-t border-slate-100/60 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <p className="font-bold text-slate-800 mb-2.5 text-xs uppercase tracking-wider">Pujian Utama</p>
                  {topics.filter(t => t.sentimen_dominan === 'Positif').length === 0 ? (
                    <p className="text-xs text-slate-400 italic">Tiada data pujian setakat ini.</p>
                  ) : (
                    <ul className="text-xs text-slate-500 space-y-1.5 list-disc list-inside">
                      {topics.filter(t => t.sentimen_dominan === 'Positif').slice(0, 3).map((t, i) => (
                        <li key={i}><span className="text-emerald-600 font-semibold">{t.label_topik}</span> (disebut {t.kekerapan} kali)</li>
                      ))}
                    </ul>
                  )}
                </div>
                <div>
                  <p className="font-bold text-slate-800 mb-2.5 text-xs uppercase tracking-wider">Aduan Utama</p>
                  {topics.filter(t => t.sentimen_dominan === 'Negatif').length === 0 ? (
                    <p className="text-xs text-slate-400 italic">Tiada aduan kritikal setakat ini.</p>
                  ) : (
                    <ul className="text-xs text-slate-500 space-y-1.5 list-disc list-inside">
                      {topics.filter(t => t.sentimen_dominan === 'Negatif').slice(0, 3).map((t, i) => (
                        <li key={i}><span className="text-rose-600 font-semibold">{t.label_topik}</span> (disebut {t.kekerapan} kali)</li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </div>

            {/* Social Media Mentions Card */}
            <div className="glass-light rounded-3xl p-6 border border-slate-100/60 shadow-sm relative overflow-hidden group hover:shadow-md transition-all duration-300 bg-gradient-to-br from-white to-fuchsia-50/20">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-fuchsia-500 to-pink-600" />
              
              <div className="flex justify-between items-start">
                <p className="font-bold text-slate-400 text-xs uppercase tracking-widest flex items-center gap-2">
                  <HeartPulse size={14} className="text-fuchsia-500"/> Sebutan Media Sosial
                </p>
                {(() => {
                  const externalCount = feedbackBySource.filter(s => s.sumber.includes("X") || s.sumber.includes("Instagram") || s.sumber.includes("Google")).reduce((a, b) => a + b.jumlah, 0);
                  const hasData = externalCount > 0;
                  return hasData ? (
                    <div className="flex items-center gap-1 px-2.5 py-1 rounded-xl border text-[10px] uppercase font-black tracking-widest bg-emerald-50 border-emerald-100 text-emerald-600">
                      <span className="w-1 h-1 rounded-full bg-emerald-500" />
                      Aktif
                    </div>
                  ) : (
                    <div className="flex items-center gap-1 px-2.5 py-1 rounded-xl border text-[10px] uppercase font-black tracking-widest bg-slate-50 border-slate-100 text-slate-500">
                      <span className="w-1 h-1 rounded-full bg-slate-400" />
                      Belum Aktif
                    </div>
                  );
                })()}
              </div>
              
              <div className="mt-4">
                <p className="text-4xl font-black text-slate-900 mono-accent">
                  {feedbackBySource.filter(s => s.sumber.includes("X") || s.sumber.includes("Instagram") || s.sumber.includes("Google")).reduce((a, b) => a + b.jumlah, 0)}
                </p>
                <p className="text-xs text-slate-400 mt-1.5 font-medium">Jumlah Sebutan Jenama (Bulan Ini)</p>
                <div className="text-[10px] font-bold uppercase tracking-widest text-fuchsia-500 bg-fuchsia-50/80 border border-fuchsia-100 px-2.5 py-1 rounded-lg w-fit mt-3">
                  Volume rendah - peluang untuk pertumbuhan
                </div>
              </div>

              <div className="mt-6 pt-5 border-t border-slate-100/60">
                <p className="font-bold text-slate-800 mb-2.5 text-xs uppercase tracking-wider">Pecahan Platform</p>
                <div className="space-y-2">
                  {feedbackBySource.map(s => (
                    <div key={s.sumber} className="flex justify-between items-center text-xs">
                      <span className="text-slate-500 font-medium">{s.sumber}</span>
                      <span className="font-bold text-slate-800 mono-accent">{s.jumlah} sebutan</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Cross Platform Chart */}
          <div className="glass-light rounded-3xl p-6 border border-slate-100/60 shadow-sm">
            <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h3 className="text-xl font-black text-slate-800 tracking-tight">Interaksi Merentasi Platform</h3>
                <p className="text-xs text-slate-400 font-semibold uppercase tracking-widest mt-1">Volume maklum balas mengikut sumber sepanjang masa</p>
              </div>
              <div className="flex flex-wrap gap-2 bg-slate-100/50 p-1.5 rounded-2xl w-fit">
                {feedbackBySource.map(src => (
                  <button
                    key={src.sumber}
                    onClick={() => toggleSource(src.sumber)}
                    className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-2 ${
                      visibleSources.includes(src.sumber) 
                      ? "bg-white shadow-sm text-slate-800" 
                      : "text-slate-400 opacity-50 hover:opacity-80"
                    }`}
                  >
                    <span className="inline-block w-2.5 h-2.5 rounded-full" style={{ backgroundColor: getSourceColorHex(src.sumber) }} />
                    {src.sumber}
                  </button>
                ))}
              </div>
            </div>
            
            {loading ? (
              <div className="h-72 w-full animate-pulse bg-slate-100/60 rounded-2xl"></div>
            ) : (
              <div className="w-full">
                <ResponsiveContainer width="100%" height={288}>
                  <BarChart data={trendData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }} barGap={6}>
                    <CartesianGrid strokeDasharray="4 4" stroke="rgba(148,163,184,0.15)" vertical={false} />
                    <XAxis
                      dataKey="Minggu"
                      tick={axisStyle}
                      axisLine={false}
                      tickLine={false}
                      dy={10}
                    />
                    <YAxis
                      tick={axisStyle}
                      axisLine={false}
                      tickLine={false}
                      dx={-4}
                    />
                    <ReTooltip content={<TrendTooltip />} cursor={{ fill: "rgba(148,163,184,0.06)" }} />
                    {visibleSources.map((source) => (
                      <Bar
                        key={source}
                        dataKey={source}
                        name={source}
                        fill={getSourceColorHex(source)}
                        radius={[6, 6, 0, 0]}
                        maxBarSize={32}
                      />
                    ))}
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB CONTENT: TREND PASARAN */}
      {activeTab === "Umum" && (() => {
        // Group competitorTrends by clean keyword name
        const groupedTrendsMap: Record<string, {
          kata_kunci: string;
          bilangan_sebutan: number;
          peratus_pertumbuhan: number;
          tanda_pagar_popular: string[];
        }> = {};

        competitorTrends.forEach((item: any) => {
          // Strip competitor suffix in parentheses, e.g., "Matcha Latte (maybematcha Bangi)" -> "Matcha Latte"
          const cleanName = item.kata_kunci.replace(/\s*\(di\s+[^)]+\)/g, "").replace(/\s*\([^)]+\)/g, "").trim();
          
          if (!groupedTrendsMap[cleanName]) {
            groupedTrendsMap[cleanName] = {
              kata_kunci: cleanName,
              bilangan_sebutan: 0,
              peratus_pertumbuhan: 0,
              tanda_pagar_popular: []
            };
          }
          
          groupedTrendsMap[cleanName].bilangan_sebutan += item.bilangan_sebutan || 0;
          if (item.peratus_pertumbuhan > groupedTrendsMap[cleanName].peratus_pertumbuhan) {
            groupedTrendsMap[cleanName].peratus_pertumbuhan = item.peratus_pertumbuhan;
          }
          
          if (item.tanda_pagar_popular) {
            const tags = item.tanda_pagar_popular.split(",").map((t: string) => t.trim());
            groupedTrendsMap[cleanName].tanda_pagar_popular = [
              ...groupedTrendsMap[cleanName].tanda_pagar_popular,
              ...tags
            ];
          }
        });

        const aggregatedTrends = Object.values(groupedTrendsMap).map((item: any) => {
          item.tanda_pagar_popular = item.tanda_pagar_popular.filter((v: any, i: any, a: any) => a.indexOf(v) === i);
          return item;
        });

        return (
          <div className="space-y-6">
            {/* Header Controls */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white/40 border border-slate-200/50 p-6 rounded-3xl backdrop-blur-md shadow-sm">
              <div>
                <h3 className="text-lg font-black text-slate-800 tracking-tight">Inspirasi Menu Sekitar</h3>
                <p className="text-xs text-slate-500 font-semibold mt-1">
                  Melihat produk popular daripada {competitors.length} kafe rujukan pilihan anda.
                </p>
              </div>
              <div className="flex gap-2 w-full sm:w-auto">
                <button
                  onClick={() => setShowManageCompetitors(!showManageCompetitors)}
                  className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 active:scale-98 transition-all cursor-pointer"
                >
                  <Settings size={14} />
                  <span>Pilih Kafe Rujukan</span>
                </button>
                <button
                  onClick={handleTriggerScrape}
                  disabled={scraping || competitors.length === 0}
                  className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 active:scale-98 transition-all disabled:opacity-50 cursor-pointer"
                >
                  {scraping ? <RefreshCw size={14} className="animate-spin" /> : <RefreshCw size={14} />}
                  <span>{scraping ? "Menganalisis..." : "Jalankan Analisis"}</span>
                </button>
              </div>
            </div>

            {/* Manage Competitors Panel */}
            {showManageCompetitors && (
              <div className="p-6 bg-black/5 border border-slate-200/40 rounded-3xl animate-in fade-in slide-in-from-top-4 duration-300 space-y-6">
                <div className="flex justify-between items-center pb-4 border-b border-slate-200/40">
                  <h4 className="text-xs font-black uppercase text-slate-400 tracking-wider">Senarai Kafe Rujukan</h4>
                  <button onClick={() => setShowManageCompetitors(false)} className="text-slate-400 hover:text-slate-650 transition-colors">
                    <X size={16} />
                  </button>
                </div>

                <div className="grid md:grid-cols-2 gap-8">
                  {/* List */}
                  <div className="space-y-3">
                    {competitors.length > 0 ? (
                      <div className="space-y-2.5 max-h-[220px] overflow-y-auto pr-2 custom-scrollbar">
                        {competitors.map((c) => (
                          <div key={c.id_pesaing} className="p-4 bg-white border border-slate-200/40 rounded-2xl flex justify-between items-center shadow-inner">
                            <div className="truncate flex-1 pr-4">
                              <p className="font-extrabold text-slate-800 text-sm truncate">{c.nama_pesaing}</p>
                              <a href={c.pautan_gmaps} target="_blank" rel="noreferrer" className="text-[10px] text-blue-500 font-bold hover:underline truncate block max-w-full">
                                Pautan Google Maps
                              </a>
                            </div>
                            <button
                              onClick={() => handleDeleteCompetitor(c.id_pesaing)}
                              className="p-2 bg-rose-50 hover:bg-rose-100 text-rose-500 rounded-xl transition-all border border-rose-100/50"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-8 text-center bg-white/60 border border-slate-200/30 rounded-2xl">
                        <p className="text-xs font-semibold text-slate-400">Tiada kafe rujukan didaftarkan. Sila tambah di sebelah kanan.</p>
                      </div>
                    )}
                  </div>

                  {/* Form */}
                  <form onSubmit={handleAddCompetitor} className="space-y-4 bg-white/40 p-5 rounded-2xl border border-slate-200/30">
                    <h5 className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Tambah Kafe Rujukan</h5>
                    <div className="space-y-3">
                      <input
                        type="text"
                        placeholder="Nama Kafe (e.g. Kopi & Seni)"
                        required
                        value={newCompetitor.nama_pesaing}
                        onChange={(e) => setNewCompetitor({...newCompetitor, nama_pesaing: e.target.value})}
                        className="w-full px-4 py-2.5 bg-white/80 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-slate-400 shadow-inner"
                      />
                      <input
                        type="text"
                        placeholder="Pautan Google Maps Cawangan"
                        required
                        value={newCompetitor.pautan_gmaps}
                        onChange={(e) => setNewCompetitor({...newCompetitor, pautan_gmaps: e.target.value})}
                        className="w-full px-4 py-2.5 bg-white/80 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-slate-400 shadow-inner"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={addingCompetitor}
                      className="w-full bg-slate-900 hover:bg-slate-800 text-white py-2.5 rounded-xl font-extrabold text-[10px] uppercase tracking-wider transition-all disabled:opacity-50 cursor-pointer shadow-md shadow-slate-900/5 flex items-center justify-center gap-1.5"
                    >
                      {addingCompetitor && <RefreshCw size={12} className="animate-spin" />}
                      <span>Simpan Kafe</span>
                    </button>
                  </form>
                </div>
              </div>
            )}

            {/* Trending Hashtags */}
            <div className="glass-light rounded-3xl p-6 border border-slate-100/60 shadow-sm">
              <h3 className="text-xl font-black text-slate-800 tracking-tight flex items-center gap-2">
                <span className="text-blue-500">#</span> Hashtag Trending di Kawasan Anda
              </h3>
              <p className="text-xs text-slate-400 font-semibold uppercase tracking-widest mt-1 mb-6">Trend media sosial dan interaksi dalam pasaran F&B tempatan (Data Dinamik)</p>
              
              {competitorTrends.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {competitorTrends.flatMap((item: any) => {
                    if (!item.tanda_pagar_popular) return [];
                    return item.tanda_pagar_popular.split(",").map((s: string) => s.trim());
                  })
                  .filter((v, i, a) => a.indexOf(v) === i) // Unique tags
                  .slice(0, 6)
                  .map((tag, idx) => {
                    const related = competitorTrends.filter((item: any) => item.tanda_pagar_popular?.includes(tag));
                    const totalCount = related.reduce((sum, item) => sum + (item.bilangan_sebutan || 0), 0);
                    const rawGrowth = related[0]?.peratus_pertumbuhan;
                    const growth = rawGrowth !== undefined ? `+${rawGrowth}%` : "+10%";
                    return (
                      <div key={idx} className="p-5 rounded-2xl bg-gradient-to-r from-indigo-50/20 to-white border border-indigo-100/40 spring-hover cursor-pointer flex justify-between items-start">
                        <div>
                          <h4 className="font-black text-indigo-700 text-base">{tag}</h4>
                          <p className="text-xs text-slate-400 mt-1 font-semibold">{totalCount} sebutan minggu ini</p>
                        </div>
                        <div className="flex items-center gap-1 px-2 py-0.5 rounded-lg border text-[10px] font-black tracking-wider bg-emerald-50 border-emerald-100 text-emerald-600">
                          {growth}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="p-8 text-center bg-white/30 rounded-2xl border border-slate-100">
                  <p className="text-sm font-semibold text-slate-500">Tiada hashtag dikesan. Sila jalankan analisis pesaing di atas.</p>
                </div>
              )}
            </div>

            {/* Menu Opportunities */}
            <div className="glass-light rounded-3xl p-6 border border-slate-100/60 shadow-sm">
              <h3 className="text-xl font-black text-slate-800 tracking-tight flex items-center gap-2">
                <TrendingUp className="text-emerald-500 w-5 h-5" /> Temui Peluang Menu Baru
              </h3>
              <p className="text-xs text-slate-400 font-semibold uppercase tracking-widest mt-1 mb-6">Berdasarkan perbualan sosial umum dan isyarat permintaan</p>
              
              {aggregatedTrends.length > 0 ? (
                <div className="space-y-4">
                  {aggregatedTrends.map((item, idx) => {
                    const growthNum = item.peratus_pertumbuhan;
                    const status = growthNum > 30 ? "Permintaan Tinggi" : "Sedang Meningkat";
                    const sentiment = growthNum > 20 ? "Sangat Positif" : "Positif";
                    return (
                      <div key={idx} className="p-5 rounded-2xl bg-white border border-slate-100/60 flex flex-col sm:flex-row gap-4 sm:items-center justify-between spring-hover">
                        <div className="flex gap-4 items-center">
                          <div className="w-12 h-12 rounded-2xl bg-orange-50 border border-orange-100/50 text-orange-500 flex items-center justify-center shrink-0 shadow-sm">
                            <Utensils className="w-5 h-5" />
                          </div>
                          <div>
                            <h4 className="font-black text-slate-800 text-base flex flex-wrap items-center gap-2">
                              {item.kata_kunci}
                              <span className={`text-[9px] uppercase tracking-widest font-black px-2 py-0.5 rounded-md ${
                                status === 'Permintaan Tinggi' ? 'bg-rose-50 border border-rose-100 text-rose-600' :
                                'bg-blue-50 border border-blue-100 text-blue-600'
                              }`}>
                                {status}
                              </span>
                            </h4>
                          </div>
                        </div>
                        <div className="flex sm:flex-col gap-4 sm:gap-1 text-right sm:items-end shrink-0 mt-3 sm:mt-0 pt-3 sm:pt-0 border-t border-slate-100 sm:border-t-0">
                          <p className="text-xs text-slate-400 font-bold mono-accent">{item.bilangan_sebutan} sebutan keseluruhan</p>
                          <p className="text-xs font-black text-emerald-600 bg-emerald-50 border border-emerald-100/60 px-2 py-0.5 rounded-lg w-fit">{sentiment}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="p-8 text-center bg-white/30 rounded-2xl border border-slate-100">
                  <p className="text-sm font-semibold text-slate-500">Tiada peluang menu dikesan. Sila tambah pesaing di panel urus pesaing terlebih dahulu.</p>
                </div>
              )}
            </div>
          </div>
        );
      })()}
    </div>
  );
}
