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
import { TrendingUp, MessageSquare, Star, ArrowLeft, HeartPulse, Activity, Flame, Utensils } from "lucide-react";
import Link from "next/link";

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

  // Filter state
  const [visibleSources, setVisibleSources] = useState<string[]>([]);

  useEffect(() => {
    if (!user?.id_premis) return;
    const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);

    Promise.all([
      fetch(`${API_URL}/customer/trend-data/${user.id_premis}`).then(r => r.json()),
      fetch(`${API_URL}/customer/feedback-by-source/${user.id_premis}`).then(r => r.json()),
      fetch(`${API_URL}/customer/sentiment-stats/${user.id_premis}`).then(r => r.json()),
      fetch(`${API_URL}/analytics/topics/${user.id_premis}`).then(r => r.json())
    ])
    .then(([trend, sources, stats, topicsData]) => {
      setTrendData(Array.isArray(trend) ? trend : []);
      setFeedbackBySource(Array.isArray(sources) ? sources : []);
      setTotalFeedback(stats.total || 0);
      setAvgRating(stats.purata_bintang || 0);
      setPertumbuhan(stats.pertumbuhan ?? 0);
      setTopics(topicsData.topics || []);
      
      // Init all available sources as visible
      if (Array.isArray(sources)) {
        setVisibleSources(sources.map(s => s.sumber));
      }
    })
    .catch(console.error)
    .finally(() => setLoading(false));
  }, [user]);

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
      {activeTab === "Umum" && (
        <div className="space-y-6">
          {/* Trending Hashtags */}
          <div className="glass-light rounded-3xl p-6 border border-slate-100/60 shadow-sm">
            <h3 className="text-xl font-black text-slate-800 tracking-tight flex items-center gap-2">
              <span className="text-blue-500">#</span> Hashtag Trending di Kawasan Anda
            </h3>
            <p className="text-xs text-slate-400 font-semibold uppercase tracking-widest mt-1 mb-6">Trend media sosial dan interaksi dalam pasaran F&B tempatan (Data Mock)</p>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                { tag: "#FoodieBangi", count: "1,250", trend: "+15%" },
                { tag: "#ViralMenu", count: "892", trend: "+28%" },
                { tag: "#UKMFoodies", count: "745", trend: "+12%" },
                { tag: "#MakananSedap", count: "623", trend: "+8%" },
                { tag: "#MatchaLover", count: "456", trend: "+45%" },
                { tag: "#CafeHopping", count: "389", trend: "+19%" },
              ].map((item, idx) => (
                <div key={idx} className="p-5 rounded-2xl bg-gradient-to-r from-indigo-50/20 to-white border border-indigo-100/40 spring-hover cursor-pointer flex justify-between items-start">
                  <div>
                    <h4 className="font-black text-indigo-700 text-base">{item.tag}</h4>
                    <p className="text-xs text-slate-400 mt-1 font-semibold">{item.count} sebutan minggu ini</p>
                  </div>
                  <div className="flex items-center gap-1 px-2 py-0.5 rounded-lg border text-[10px] font-black tracking-wider bg-emerald-50 border-emerald-100 text-emerald-600">
                    {item.trend}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Menu Opportunities */}
          <div className="glass-light rounded-3xl p-6 border border-slate-100/60 shadow-sm">
            <h3 className="text-xl font-black text-slate-800 tracking-tight flex items-center gap-2">
              <TrendingUp className="text-emerald-500 w-5 h-5" /> Temui Peluang Menu Baru
            </h3>
            <p className="text-xs text-slate-400 font-semibold uppercase tracking-widest mt-1 mb-6">Berdasarkan perbualan sosial umum dan isyarat permintaan</p>
            
            <div className="space-y-4">
              {[
                { name: "Korean Fried Chicken", desc: "Meningkat pantas dalam kumpulan pelajar", mentions: 89, sentiment: "Sangat Positif", status: "Hot" },
                { name: "Matcha Latte Ais", desc: "Permintaan tinggi pada waktu petang", mentions: 124, sentiment: "Positif", status: "Trending" },
                { name: "Nasi Kandar Banjir", desc: "Tular di TikTok untuk makan malam", mentions: 210, sentiment: "Sangat Positif", status: "Viral" },
              ].map((item, idx) => (
                <div key={idx} className="p-5 rounded-2xl bg-white border border-slate-100/60 flex flex-col sm:flex-row gap-4 sm:items-center justify-between spring-hover">
                  <div className="flex gap-4 items-center">
                    <div className="w-12 h-12 rounded-2xl bg-orange-50 border border-orange-100/50 text-orange-500 flex items-center justify-center shrink-0 shadow-sm">
                      <Utensils className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-black text-slate-800 text-base flex flex-wrap items-center gap-2">
                        {item.name}
                        <span className={`text-[9px] uppercase tracking-widest font-black px-2 py-0.5 rounded-md ${
                          item.status === 'Viral' ? 'bg-rose-50 border border-rose-100 text-rose-600' :
                          item.status === 'Hot' ? 'bg-orange-50 border border-orange-100 text-orange-600' :
                          'bg-blue-50 border border-blue-100 text-blue-600'
                        }`}>
                          {item.status}
                        </span>
                      </h4>
                      <p className="text-xs text-slate-500 mt-1 leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                  <div className="flex sm:flex-col gap-4 sm:gap-1 text-right sm:items-end shrink-0 mt-3 sm:mt-0 pt-3 sm:pt-0 border-t border-slate-100 sm:border-t-0">
                    <p className="text-xs text-slate-400 font-bold mono-accent">{item.mentions} sebutan</p>
                    <p className="text-xs font-black text-emerald-600 bg-emerald-50 border border-emerald-100/60 px-2 py-0.5 rounded-lg w-fit">{item.sentiment}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
