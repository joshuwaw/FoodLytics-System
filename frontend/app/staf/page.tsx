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
      <div>
        <h2 className="text-3xl lg:text-4xl font-black text-slate-900 tracking-tight">
          Selamat datang, <span className="bg-gradient-to-r from-blue-500 to-blue-600 bg-clip-text text-transparent">{user?.nama}</span>
        </h2>
        <p className="text-slate-400 mt-2 font-medium text-sm">
          <span className="mono-accent text-slate-300">{new Date().toLocaleDateString("ms-MY", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}</span>
        </p>
      </div>

      {/* ========== TOP CARDS ========== */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Premise Info (spans 2 cols) */}
        <div className="glass-light rounded-3xl p-6 space-y-4 md:col-span-2 glow-blue">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/20">
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
              <div className="flex items-start gap-2 text-slate-400">
                <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0 text-blue-400" />
                <p className="text-sm leading-relaxed">{premis.alamat_premis}</p>
              </div>
            </div>
          ) : (
            <p className="text-sm text-slate-400 italic">Tiada premis dipautkan.</p>
          )}
        </div>

        {/* Role Card */}
        <div className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800 rounded-3xl p-6 flex flex-col justify-between text-white shadow-2xl shadow-blue-700/30">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-400/20 rounded-full blur-3xl pointer-events-none" />
          <div className="relative">
            <div className="w-12 h-12 glass rounded-2xl flex items-center justify-center mb-4">
              <ShieldCheck className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-xl font-black tracking-tight mb-1">Staf Operasi</h3>
            <p className="text-blue-200 text-sm leading-relaxed">Papan pemuka eksklusif untuk operasi harian.</p>
          </div>
        </div>
      </div>

      {/* ========== CHARTS ROW ========== */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Sentiment Donut */}
        <div className="glass-light rounded-3xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <PieChartIcon className="w-4 h-4 text-blue-500" />
            <h3 className="font-black text-slate-800 text-sm tracking-tight">Ringkasan Sentimen Pelanggan</h3>
          </div>
          <div className="flex items-center gap-8">
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
                        filter: i === 0 ? "drop-shadow(0 0 6px rgba(16,185,129,0.4))" : i === 2 ? "drop-shadow(0 0 4px rgba(244,63,94,0.3))" : undefined,
                        cursor: 'pointer',
                        opacity: activeIndex === null || activeIndex === i ? 1 : 0.6,
                        transition: 'opacity 0.2s ease'
                      }}
                    />
                  ))}
                </Pie>
                <ReTooltip content={<SentimentTooltip />} />
              </PieChart>
              <div className={`absolute inset-0 flex flex-col items-center justify-center pointer-events-none transition-opacity duration-200 ${activeIndex !== null ? 'opacity-0' : 'opacity-100'}`}>
                <p className="text-2xl font-black mono-accent" style={{ color: "#10b981", textShadow: "0 0 12px rgba(16,185,129,0.4)" }}>
                  {sentimentData[0]?.value ?? 0}%
                </p>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Positif</p>
              </div>
            </div>

            <div className="space-y-4 flex-1">
              {sentimentData.map(({ name, value, color }) => (
                <div key={name}>
                  <div className="flex justify-between items-center mb-1">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: color, boxShadow: `0 0 6px ${color}` }} />
                      <span className="text-xs font-semibold text-slate-500">{name}</span>
                    </div>
                    <span className="text-sm font-black mono-accent text-slate-800">{value}%</span>
                  </div>
                  <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{ width: `${value}%`, backgroundColor: color, boxShadow: `0 0 6px ${color}80` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Weekly Trend Area Chart */}
        <div className="glass-light rounded-3xl p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-blue-500" />
              <h3 className="font-black text-slate-800 text-sm tracking-tight">Kadar & Vol. Ulasan Mingguan</h3>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={160}>
            <AreaChart data={weeklyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="gradVolumeBlue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#3b82f6" stopOpacity={0.18} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="4 4" stroke="rgba(148,163,184,0.15)" vertical={false} />
              <XAxis dataKey="hari" tick={axisStyle} axisLine={false} tickLine={false} dy={10} />
              <YAxis tick={axisStyle} axisLine={false} tickLine={false} dx={-4} />
              <ReTooltip content={<LineTooltip />} cursor={{ stroke: "rgba(148,163,184,0.2)", strokeWidth: 1 }} />
              <Area
                type="monotone" dataKey="volume" name="Volume" stroke="#3b82f6" strokeWidth={2.5}
                fill="url(#gradVolumeBlue)" dot={false}
                activeDot={{ r: 5, fill: "#3b82f6", strokeWidth: 0, style: { filter: "drop-shadow(0 0 6px #3b82f6)" } }}
                style={{ filter: "drop-shadow(0 0 4px rgba(59,130,246,0.4))" }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ========== TOPICS ========== */}
      <div className="glass-light rounded-3xl p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <BrainCircuit className="w-4 h-4 text-blue-500" />
            <h3 className="font-black text-slate-800 text-sm tracking-tight">
              Topik-Topik Perbincangan Utama
            </h3>
          </div>
        </div>
        
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {topTopics.length === 0 ? (
            <p className="text-sm text-slate-400 italic">Tiada topik dijumpai.</p>
          ) : (
            topTopics.map((topic, idx) => (
              <div key={idx} className="bg-white/60 border border-slate-100 rounded-2xl p-5 spring-hover">
                <div className="flex justify-between items-start mb-3">
                  <h4 className="font-black text-slate-800 text-sm">{topic.label_topik}</h4>
                  <span className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${
                    topic.sentimen_dominan === "Positif" ? "bg-emerald-100 text-emerald-700" :
                    topic.sentimen_dominan === "Negatif" ? "bg-rose-100 text-rose-700" :
                    "bg-slate-200 text-slate-700"
                  }`}>
                    {topic.sentimen_dominan}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
                  <MessageSquare className="w-3.5 h-3.5" /> {topic.kekerapan} sebutan
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
