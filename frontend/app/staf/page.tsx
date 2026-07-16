"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { MapPin, Building2, ShieldCheck, TrendingUp, BrainCircuit, MessageSquare, PieChart as PieChartIcon } from "lucide-react";
import {
  PieChart, Pie, Cell, Tooltip as ReTooltip,
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  ResponsiveContainer,
} from "recharts";

interface PremisDetail {
  nama_premis: string;
  alamat_premis: string;
  pautan_gmaps: string | null;
  kod_perniagaan: string;
}

// ─── Custom Tooltip: glassmorphism style ─────────────────────────────────
function SentimentTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="bg-white border border-slate-200 rounded-xl px-3 py-2 shadow-xl text-xs font-bold text-slate-800">
      <div className="flex items-center gap-1.5">
        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: d.color }} />
        {d.name}: {d.value}%
      </div>
    </div>
  );
}

function LineTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white/90 backdrop-blur-md border border-slate-200/60 rounded-2xl px-4 py-3 shadow-xl shadow-slate-900/10 min-w-[140px]">
      <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold mb-2">{label}</p>
      {payload.map((p: any) => (
        <p key={p.dataKey} className="text-sm font-black mono-accent" style={{ color: p.stroke }}>
          {p.name}: {p.value}
        </p>
      ))}
    </div>
  );
}

const axisStyle = { fontSize: 11, fontFamily: "var(--font-geist-mono)", fill: "#94a3b8", fontWeight: 600 };

const SENTIMENT_COLORS: Record<string, string> = {
  Positif: "#10b981",
  Neutral:  "#64748b",
  Negatif:  "#f43f5e",
};

export default function StafDashboard() {
  const { user } = useAuth();
  const [premis, setPremis] = useState<PremisDetail | null>(null);
  const [loading, setLoading] = useState(true);
  
  const [sentimentData, setSentimentData] = useState([
    { name: "Positif", value: 0, color: "#10b981" },
    { name: "Neutral",  value: 0, color: "#64748b" },
    { name: "Negatif",  value: 0, color: "#f43f5e" },
  ]);
  const [weeklyData, setWeeklyData] = useState<any[]>([]);
  const [topTopics, setTopTopics] = useState<any[]>([]);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  useEffect(() => {
    if (!user?.id_premis) { setLoading(false); return; }
    const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

    // 1. Fetch Premise
    fetch(`${API_URL}/customer/premises/${user.id_premis}`)
      .then((r) => r.json())
      .then((d) => setPremis(d))
      .catch(() => setPremis(null));

    // 2. Fetch Sentiment Stats
    fetch(`${API_URL}/customer/sentiment-stats/${user.id_premis}`)
      .then((r) => r.json())
      .then((d) => {
        setSentimentData(d.sentimen.map((s: any) => ({
          ...s,
          color: SENTIMENT_COLORS[s.name] ?? "#64748b",
        })));
      })
      .catch(() => {});

    // 3. Fetch Weekly Stats
    fetch(`${API_URL}/customer/weekly-stats/${user.id_premis}`)
      .then((r) => r.json())
      .then((d) => setWeeklyData(Array.isArray(d) ? d : []))
      .catch(() => {});

    // 4. Fetch Top Topics
    fetch(`${API_URL}/analytics/topics/${user.id_premis}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.topics && Array.isArray(d.topics)) {
          setTopTopics(d.topics.slice(0, 5)); // Take top 5
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user]);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200/40 pb-5">
        <div>
          <h2 className="text-3xl lg:text-4xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            Selamat datang,{" "}
            <span className="bg-gradient-to-r from-blue-500 to-indigo-500 bg-clip-text text-transparent">
              {user?.nama}
            </span>
            <span className="animate-bounce">👋</span>
          </h2>
          <p className="text-slate-400 mt-1 text-sm font-bold tracking-wider uppercase flex items-center gap-1.5">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            Live Dashboard • {new Date().toLocaleDateString("ms-MY", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
          </p>
        </div>
        <div className="flex items-center gap-2 bg-white/60 border border-slate-200/50 rounded-2xl p-1.5 shadow-sm">
          <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse ml-2" />
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest pr-2">Sesi Staf Aktif</span>
        </div>
      </div>

      {/* ========== TOP CARDS ========== */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Premise Info (spans 2 cols) */}
        <div className="glass-light rounded-3xl p-6 space-y-4 md:col-span-2 border-l-4 border-l-blue-500 shadow-md shadow-blue-500/5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/20">
              <Building2 className="w-5 h-5 text-white" />
            </div>
            <h3 className="font-black text-slate-800 text-lg tracking-tight">Premis Anda</h3>
          </div>
          {loading ? (
            <div className="space-y-3">
              <div className="h-5 bg-slate-100/60 rounded-full animate-pulse w-2/3" />
              <div className="h-4 bg-slate-100/60 rounded-full animate-pulse w-1/2" />
            </div>
          ) : premis ? (
            <div className="space-y-3">
              <p className="text-2xl font-black text-slate-900 tracking-tight">{premis.nama_premis}</p>
              <div className="flex items-start gap-2 text-slate-500">
                <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0 text-blue-500" />
                <p className="text-sm leading-relaxed">{premis.alamat_premis}</p>
              </div>
            </div>
          ) : (
            <p className="text-sm text-slate-400 italic">Tiada premis dipautkan.</p>
          )}
        </div>

        {/* Role Card */}
        <div className="relative overflow-hidden bg-gradient-to-r from-blue-500 via-blue-600 to-indigo-700 rounded-3xl p-6 flex flex-col justify-between text-white shadow-lg shadow-blue-500/20 spring-hover">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl pointer-events-none" />
          <div className="relative">
            <div className="w-11 h-11 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center mb-4 border border-white/20">
              <ShieldCheck className="w-5.5 h-5.5 text-white" />
            </div>
            <h3 className="text-lg font-black tracking-tight mb-1">Staf Operasi</h3>
            <p className="text-blue-100 text-xs leading-relaxed">Akses pantas bagi tugasan staf, prestasi harian dan feedback pelanggan.</p>
          </div>
        </div>
      </div>

      {/* ========== CHARTS ROW ========== */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Sentiment Donut */}
        <div className="glass-light rounded-3xl p-6 flex flex-col justify-between">
          <div className="flex items-center gap-2 mb-4">
            <PieChartIcon className="w-4 h-4 text-blue-500" />
            <h3 className="font-black text-slate-800 text-sm tracking-tight">Ringkasan Sentimen Pelanggan</h3>
          </div>
          <div className="flex flex-col sm:flex-row items-center gap-8 flex-1 justify-center">
            <div className="relative flex-shrink-0">
              <svg width="0" height="0">
                <defs>
                  <filter id="glow-green">
                    <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                    <feMerge><feMergeNode in="coloredBlur" /><feMergeNode in="SourceGraphic" /></feMerge>
                  </filter>
                  <filter id="glow-rose">
                    <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                    <feMerge><feMergeNode in="coloredBlur" /><feMergeNode in="SourceGraphic" /></feMerge>
                  </filter>
                </defs>
              </svg>
              <PieChart width={160} height={160}>
                <Pie
                  data={sentimentData}
                  innerRadius={50}
                  outerRadius={72}
                  paddingAngle={3}
                  dataKey="value"
                  startAngle={90}
                  endAngle={-270}
                  strokeWidth={0}
                  onMouseEnter={(_, index) => setActiveIndex(index)}
                  onMouseLeave={() => setActiveIndex(null)}
                >
                  {sentimentData.map((entry, i) => (
                    <Cell
                      key={i}
                      fill={entry.color}
                      style={{
                        filter: i === 0 ? "drop-shadow(0 0 6px rgba(16,185,129,0.35))" : i === 2 ? "drop-shadow(0 0 4px rgba(244,63,94,0.25))" : undefined,
                        cursor: 'pointer',
                        opacity: activeIndex === null || activeIndex === i ? 1 : 0.6,
                        transition: 'all 0.2s ease'
                      }}
                    />
                  ))}
                </Pie>
                <ReTooltip content={<SentimentTooltip />} />
              </PieChart>
              <div className={`absolute inset-0 flex flex-col items-center justify-center pointer-events-none transition-opacity duration-200 ${activeIndex !== null ? 'opacity-0' : 'opacity-100'}`}>
                <p className="text-2xl font-black mono-accent" style={{ color: "#10b981", textShadow: "0 0 12px rgba(16,185,129,0.3)" }}>
                  {sentimentData[0]?.value ?? 0}%
                </p>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Positif</p>
              </div>
            </div>

            <div className="space-y-3.5 flex-1 w-full">
              {sentimentData.map(({ name, value, color }) => (
                <div key={name} className="bg-white/30 border border-slate-100/50 p-2 rounded-xl transition-colors">
                  <div className="flex justify-between items-center mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color, boxShadow: `0 0 8px ${color}` }} />
                      <span className="text-xs font-bold text-slate-500">{name}</span>
                    </div>
                    <span className="text-xs font-black mono-accent text-slate-800">{value}%</span>
                  </div>
                  <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{ width: `${value}%`, backgroundColor: color, boxShadow: `0 0 6px ${color}60` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Weekly Trend Area Chart */}
        <div className="glass-light rounded-3xl p-6 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-blue-500" />
              <h3 className="font-black text-slate-800 text-sm tracking-tight">Kadar & Vol. Ulasan Mingguan</h3>
            </div>
          </div>
          <div className="flex-1 flex items-center justify-center">
            <ResponsiveContainer width="100%" height={160}>
              <AreaChart data={weeklyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="gradVolumeBlue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#3b82f6" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="4 4" stroke="rgba(148,163,184,0.08)" vertical={false} />
                <XAxis dataKey="hari" tick={axisStyle} axisLine={false} tickLine={false} dy={10} />
                <YAxis tick={axisStyle} axisLine={false} tickLine={false} dx={-4} />
                <ReTooltip content={<LineTooltip />} cursor={{ stroke: "rgba(148,163,184,0.15)", strokeWidth: 1 }} />
                <Area
                  type="monotone" dataKey="volume" name="Volume" stroke="#3b82f6" strokeWidth={3}
                  fill="url(#gradVolumeBlue)" dot={false}
                  activeDot={{ r: 5, fill: "#3b82f6", strokeWidth: 0, style: { filter: "drop-shadow(0 0 6px #3b82f6)" } }}
                  style={{ filter: "drop-shadow(0 2px 4px rgba(59,130,246,0.2))" }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* ========== TOPICS ========== */}
      <div className="glass-light rounded-3xl p-6">
        <div className="flex items-center justify-between mb-6 border-b border-slate-200/20 pb-4">
          <div className="flex items-center gap-2">
            <BrainCircuit className="w-4 h-4 text-blue-500" />
            <h3 className="font-black text-slate-800 text-sm tracking-tight">
              Topik-Topik Perbincangan Utama Pelanggan
            </h3>
          </div>
        </div>
        
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {topTopics.length === 0 ? (
            <p className="text-sm text-slate-400 italic">Tiada topik dijumpai.</p>
          ) : (
            topTopics.map((topic, idx) => (
              <div key={idx} className="bg-white/40 border border-slate-100/60 rounded-2xl p-5 spring-hover hover:bg-white/80 hover:border-blue-100 shadow-sm transition-all duration-200">
                <div className="flex justify-between items-start mb-3.5">
                  <h4 className="font-black text-slate-800 text-sm tracking-tight">{topic.label_topik}</h4>
                  <span className={`px-2 py-0.5 border rounded-lg text-[9px] font-black uppercase tracking-widest ${
                    topic.sentimen_dominan === "Positif" ? "bg-emerald-50 border-emerald-100 text-emerald-600" :
                    topic.sentimen_dominan === "Negatif" ? "bg-rose-50 border-rose-100 text-rose-600" :
                    "bg-slate-50 border-slate-100 text-slate-600"
                  }`}>
                    {topic.sentimen_dominan}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400">
                  <MessageSquare className="w-3.5 h-3.5 text-slate-300" />
                  <span className="text-slate-700 mono-accent bg-slate-50 border border-slate-100 px-1.5 py-0.5 rounded-md text-[10px]">{topic.kekerapan}</span>
                  <span>sebutan ulasan</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
