"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import {
  PieChart, Pie, Cell, Tooltip as ReTooltip,
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  ResponsiveContainer, Legend,
} from "recharts";
import {
  QrCode, MapPin, Building2, ArrowRight,
  Star, MessageSquare, TrendingUp, CheckCircle2, BrainCircuit,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface PremisDetail {
  nama_premis: string;
  alamat_premis: string;
  pautan_gmaps: string | null;
  kod_perniagaan: string;
}

import { RefreshCw, Loader2 } from "lucide-react";

interface DataSrc {
  platform: string;
  connected: boolean;
  last_sync: string;
  jumlah_ulasan: number;
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

// ─── Shared axis style ─────────────────────────────────────────────────────
const axisStyle = { fontSize: 11, fontFamily: "var(--font-geist-mono)", fill: "#94a3b8", fontWeight: 600 };
// ───────────────────────────────────────────────────────────────────────────

const SENTIMENT_COLORS: Record<string, string> = {
  Positif: "#10b981",
  Neutral:  "#64748b",
  Negatif:  "#f43f5e",
};

export default function PengurusDashboard() {
  const { user } = useAuth();
  const router = useRouter();
  const [premis, setPremis] = useState<PremisDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [sentimentData, setSentimentData] = useState([
    { name: "Positif", value: 0, color: "#10b981" },
    { name: "Neutral",  value: 0, color: "#64748b" },
    { name: "Negatif",  value: 0, color: "#f43f5e" },
  ]);
  const [totalUlasan, setTotalUlasan] = useState(0);
  const [purataBintang, setPurataBintang] = useState(0);
  const [recentFeedback, setRecentFeedback] = useState<any[]>([]);
  const [weeklyData, setWeeklyData] = useState<any[]>([]);
  const [topTopics, setTopTopics] = useState<any[]>([]);
  const [pecahanRating, setPecahanRating] = useState({ makanan: 0, layanan: 0, suasana: 0 });
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [dataSources, setDataSources] = useState<DataSrc[]>([]);
  const [syncing, setSyncing] = useState(false);
  const [pertumbuhan, setPertumbuhan] = useState<number>(0);
  const [rangeType, setRangeType] = useState<"7d" | "30d" | "90d">("7d");
  const [chartLoading, setChartLoading] = useState(false);

  useEffect(() => {
    if (!user?.id_premis) { setLoading(false); return; }
    const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

    // Fetch premise details
    fetch(`${API_URL}/customer/premises/${user.id_premis}`)
      .then((r) => r.json())
      .then((d) => setPremis(d))
      .catch(() => setPremis(null));

    // Fetch live sentiment stats
    fetch(`${API_URL}/customer/sentiment-stats/${user.id_premis}`)
      .then((r) => r.json())
      .then((d) => {
        setSentimentData(d.sentimen.map((s: any) => ({
          ...s,
          color: SENTIMENT_COLORS[s.name] ?? "#64748b",
        })));
        setTotalUlasan(d.total);
        setPurataBintang(d.purata_bintang);
        if (d.pecahan_rating) setPecahanRating(d.pecahan_rating);
        setPertumbuhan(d.pertumbuhan ?? 0);
      })
      .catch(() => {});

    // Fetch recent feedback
    fetch(`${API_URL}/customer/recent-feedback/${user.id_premis}?limit=5`)
      .then((r) => r.json())
      .then((d) => setRecentFeedback(Array.isArray(d) ? d : []))
      .catch(() => {});

    // Fetch top topics
    fetch(`${API_URL}/analytics/topics/${user.id_premis}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.topics && Array.isArray(d.topics)) {
          setTopTopics(d.topics.slice(0, 6)); // Take top 6
        }
      })
      .catch(() => {});

    // Fetch data sources
    fetch(`${API_URL}/ingestion/sources/${user.id_premis}`)
      .then((r) => r.json())
      .then((d) => setDataSources(Array.isArray(d) ? d : []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user]);

  useEffect(() => {
    if (!user?.id_premis) return;
    const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";
    
    setChartLoading(true);
    fetch(`${API_URL}/customer/weekly-stats/${user.id_premis}?range_type=${rangeType}`)
      .then((r) => r.json())
      .then((d) => setWeeklyData(Array.isArray(d) ? d : []))
      .catch(() => {})
      .finally(() => setChartLoading(false));
  }, [user, rangeType]);

  const handleSync = async () => {
    if (!user?.id_premis) return;
    const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";
    setSyncing(true);
    try {
      await fetch(`${API_URL}/ingestion/fetch/${user.id_premis}`, { method: "POST" });
      // Refresh sources and feedback after a short delay
      setTimeout(() => {
        fetch(`${API_URL}/ingestion/sources/${user.id_premis}`)
          .then((r) => r.json())
          .then((d) => setDataSources(Array.isArray(d) ? d : []));
        fetch(`${API_URL}/customer/recent-feedback/${user.id_premis}?limit=5`)
          .then((r) => r.json())
          .then((d) => setRecentFeedback(Array.isArray(d) ? d : []));
        fetch(`${API_URL}/customer/weekly-stats/${user.id_premis}?range_type=${rangeType}`)
          .then((r) => r.json())
          .then((d) => setWeeklyData(Array.isArray(d) ? d : []));
        fetch(`${API_URL}/customer/sentiment-stats/${user.id_premis}`)
          .then((r) => r.json())
          .then((d) => {
            setTotalUlasan(d.total);
          });
        setSyncing(false);
      }, 2000);
    } catch (e) {
      console.error(e);
      setSyncing(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">

      {/* ── Header ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200/40 pb-5">
        <div>
          <h2 className="text-3xl lg:text-4xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            Selamat datang,{" "}
            <span className="bg-gradient-to-r from-orange-500 to-pink-500 bg-clip-text text-transparent">
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
          <div className="w-2 h-2 rounded-full bg-orange-500 animate-pulse ml-2" />
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest pr-2">Pengurusan Aktif</span>
        </div>
      </div>

      {/* ── Row 1: Stat cards + Premise ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Premise Info */}
        <div className="glass-light rounded-3xl p-5 space-y-4 md:col-span-2 border-l-4 border-l-orange-500 shadow-md shadow-orange-500/5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-lg shadow-orange-500/20">
                <Building2 className="w-5 h-5 text-white" />
              </div>
              <h3 className="font-black text-slate-800 tracking-tight">Info Premis</h3>
            </div>
            {premis?.pautan_gmaps && (
              <a href={premis.pautan_gmaps} target="_blank" rel="noopener noreferrer"
                className="text-xs font-bold text-orange-500 hover:text-pink-500 flex items-center gap-1 px-3 py-1.5 bg-orange-50 rounded-xl transition-all duration-200 shadow-sm border border-orange-100 hover:scale-105 active:scale-95">
                Maps <ArrowRight className="w-3.5 h-3.5" />
              </a>
            )}
          </div>
          {loading ? (
            <div className="space-y-2">
              <div className="h-5 bg-slate-100/60 rounded-full animate-pulse w-2/3" />
              <div className="h-3 bg-slate-100/60 rounded-full animate-pulse w-1/2" />
            </div>
          ) : premis ? (
            <div className="space-y-2">
              <p className="text-xl font-black text-slate-900">{premis.nama_premis}</p>
              <div className="flex items-start gap-2 text-slate-500">
                <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0 text-orange-500" />
                <p className="text-xs leading-relaxed">{premis.alamat_premis}</p>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-200/30 flex items-center justify-between">
                <div>
                  <p className="text-[9px] uppercase tracking-widest text-slate-400 font-bold">Kod Perniagaan</p>
                  <p className="text-sm font-black mono-accent text-slate-800">{premis.kod_perniagaan}</p>
                </div>
                <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 px-2 py-1 rounded-lg">Verified</span>
              </div>
            </div>
          ) : (
            <p className="text-sm text-slate-400 italic">Tiada maklumat premis.</p>
          )}
        </div>

        {/* Rating */}
        <div className="glass-light rounded-3xl p-5 border-l-4 border-l-amber-500 shadow-md shadow-amber-500/5 flex flex-col justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-amber-50 border border-amber-100 rounded-2xl flex items-center justify-center shadow-sm">
              <Star className="w-4 h-4 text-amber-500 fill-current" />
            </div>
            <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold">Purata Rating</p>
          </div>
          <div className="mt-4">
            <p className="text-4xl font-black text-slate-900 mono-accent flex items-baseline gap-1">
              {purataBintang > 0 ? purataBintang : "—"}
              <span className="text-xs font-semibold text-slate-400">/ 5.0</span>
            </p>
            <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-wider">Terima Kasih ⭐ Pelanggan</p>
          </div>
        </div>

        {/* Feedback */}
        <div className="glass-light rounded-3xl p-5 border-l-4 border-l-emerald-500 shadow-md shadow-emerald-500/5 flex flex-col justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-center justify-center shadow-sm">
              <MessageSquare className="w-4 h-4 text-emerald-500" />
            </div>
            <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold">Jumlah Ulasan</p>
          </div>
          <div className="mt-4">
            <p className="text-4xl font-black text-slate-900 mono-accent">{totalUlasan}</p>
            <div className="mt-1 flex items-center gap-1.5">
              <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-lg flex items-center gap-0.5 ${pertumbuhan >= 0 ? 'bg-emerald-50 border border-emerald-100 text-emerald-600' : 'bg-rose-50 border border-rose-100 text-rose-600'}`}>
                <TrendingUp className="w-3 h-3" /> {pertumbuhan >= 0 ? '+' : ''}{pertumbuhan}%
              </span>
              <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">bulan ini</span>
            </div>
          </div>
        </div>

        {/* Breakdown */}
        <div className="glass-light rounded-3xl p-5 md:col-span-2 lg:col-span-4 flex flex-col justify-center border-l-4 border-l-indigo-500 shadow-md shadow-indigo-500/5">
          <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold mb-4 w-full">Pecahan Prestasi Kategori</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full">
            {[
              { label: "Makanan & Minuman", val: pecahanRating.makanan, color: "from-orange-500 to-pink-500", glow: "shadow-orange-500/20" },
              { label: "Layanan & Servis", val: pecahanRating.layanan, color: "from-blue-500 to-indigo-500", glow: "shadow-blue-500/20" },
              { label: "Suasana Premis", val: pecahanRating.suasana, color: "from-indigo-500 to-purple-500", glow: "shadow-indigo-500/20" },
            ].map((item) => (
              <div key={item.label} className="w-full bg-white/30 border border-slate-100/60 p-3.5 rounded-2xl hover:border-indigo-100 transition-all duration-200">
                <div className="flex justify-between items-center text-xs font-black mb-2 w-full">
                  <span className="text-slate-600">{item.label}</span>
                  <span className="text-slate-800 mono-accent bg-slate-50 border border-slate-100 px-2 py-0.5 rounded-lg">{item.val} / 5.0</span>
                </div>
                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden shadow-inner">
                  <div className={`h-full bg-gradient-to-r ${item.color} rounded-full transition-all duration-1000 shadow-md ${item.glow}`} style={{ width: `${(item.val / 5) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Row 2: Donut + Data Sources ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

        {/* ─ Sentiment Donut (Custom Recharts) ─ */}
        <div className="glass-light rounded-3xl p-6 flex flex-col justify-between">
          <div className="flex items-center gap-2 mb-6">
            <TrendingUp className="w-4 h-4 text-emerald-500" />
            <h3 className="font-black text-slate-800 text-sm tracking-tight">Ringkasan Sentimen Pelanggan</h3>
          </div>
          <div className="flex flex-col sm:flex-row items-center gap-8 flex-1 justify-center">
            {/* Donut with SVG defs for glow */}
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
              <PieChart width={170} height={170}>
                <Pie
                  data={sentimentData}
                  innerRadius={54}
                  outerRadius={78}
                  paddingAngle={4}
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
                        filter: i === 0 ? "drop-shadow(0 0 8px rgba(16,185,129,0.35))" : i === 2 ? "drop-shadow(0 0 6px rgba(244,63,94,0.25))" : undefined,
                        cursor: 'pointer',
                        opacity: activeIndex === null || activeIndex === i ? 1 : 0.6,
                        transition: 'all 0.3s ease'
                      }}
                    />
                  ))}
                </Pie>
                <ReTooltip content={<SentimentTooltip />} />
              </PieChart>
              {/* Centre label - hide when hovering to avoid overlap */}
              <div className={`absolute inset-0 flex flex-col items-center justify-center pointer-events-none transition-opacity duration-200 ${activeIndex !== null ? 'opacity-0' : 'opacity-100'}`}>
                <p className="text-3xl font-black mono-accent" style={{ color: "#10b981", textShadow: "0 0 16px rgba(16,185,129,0.3)" }}>
                  {sentimentData[0]?.value ?? 0}%
                </p>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Positif</p>
              </div>
            </div>

            {/* Legend */}
            <div className="space-y-4 flex-1 w-full">
              {sentimentData.map(({ name, value, color }) => (
                <div key={name} className="bg-white/30 border border-slate-100/50 p-2.5 rounded-xl hover:border-slate-200 transition-colors">
                  <div className="flex justify-between items-center mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color, boxShadow: `0 0 8px ${color}` }} />
                      <span className="text-xs font-bold text-slate-500">{name}</span>
                    </div>
                    <span className="text-xs font-black mono-accent text-slate-800">{value}%</span>
                  </div>
                  {/* Progress bar */}
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

        {/* Data Sources */}
        <div className="glass-light rounded-3xl p-6 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-black text-slate-800 text-sm tracking-tight">
              Integrasi Sumber Data Luaran
            </h3>
            <button
              onClick={handleSync}
              disabled={syncing}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 text-slate-600 rounded-xl text-xs font-black spring-hover hover:text-orange-500 hover:border-orange-200 hover:shadow-sm disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} />
              {syncing ? 'Menyegerak...' : 'Segerak Sekarang'}
            </button>
          </div>
          <div className="space-y-3 flex-1 overflow-y-auto max-h-72 custom-scrollbar pr-1">
            {dataSources.length === 0 ? (
              <p className="text-sm text-slate-400 italic">Memuatkan sumber data...</p>
            ) : (
              dataSources.map((src) => {
                let icon = "⊞"; let iconBg = "bg-slate-100 text-slate-600 border-slate-200/50";
                if (src.platform.includes("Google")) { icon = "G"; iconBg = "bg-blue-50 text-blue-600 border-blue-100"; }
                if (src.platform.includes("Social") || src.platform.includes("X") || src.platform.includes("Instagram")) { icon = "◎"; iconBg = "bg-indigo-50 text-indigo-600 border-indigo-100"; }

                return (
                  <div key={src.platform}
                    onClick={() => router.push(`/pengurus/topics?platform=${encodeURIComponent(src.platform)}`)}
                    className="group flex items-center gap-4 p-3.5 bg-white/40 rounded-2xl border border-slate-100/60 spring-hover cursor-pointer hover:bg-white/80 hover:border-orange-200 shadow-sm transition-all duration-200">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm border ${iconBg} shadow-sm`}>
                      {icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-black text-slate-800">{src.platform}</p>
                      <p className="text-[11px] text-slate-400 mono-accent">
                        {src.last_sync === "Live" ? "Sentiasa aktif" : src.last_sync ? `Terakhir: ${new Date(src.last_sync).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}` : "Belum disegerak"} • {src.jumlah_ulasan} rekod
                      </p>
                    </div>
                    {src.connected ? (
                      <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-lg">Connected</span>
                    ) : (
                      <span className="text-[10px] font-bold text-slate-400 bg-slate-50 border border-slate-100 px-2 py-0.5 rounded-lg">Offline</span>
                    )}
                    <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-orange-500 transition-colors flex-shrink-0" />
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* ── Row 3: Area Chart ── */}
      <div className="glass-light rounded-3xl p-6 relative overflow-hidden">
        {chartLoading && (
          <div className="absolute inset-0 bg-white/40 backdrop-blur-[1.5px] z-10 flex items-center justify-center animate-in fade-in duration-200">
            <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
          </div>
        )}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-blue-500" />
              <h3 className="font-black text-slate-800 text-sm tracking-tight">
                Trend Pertumbuhan &amp; Volume Ulasan
              </h3>
            </div>
            
            {/* Timeframe Filter Control */}
            <div className="flex items-center gap-1 bg-slate-100/80 backdrop-blur-md p-1 rounded-xl border border-slate-200/50 self-start">
              {(["7d", "30d", "90d"] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setRangeType(t)}
                  className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                    rangeType === t
                      ? "bg-white text-slate-800 shadow-sm border border-slate-200/30 scale-[1.02]"
                      : "text-slate-500 hover:text-slate-800 hover:bg-white/30"
                  }`}
                >
                  {t === "7d" ? "7 Hari" : t === "30d" ? "30 Hari" : "90 Hari"}
                </button>
              ))}
            </div>
          </div>
          
          <div className="flex items-center gap-5">
            {[{ color: "#3b82f6", label: "Volume Ulasan" }, { color: "#10b981", label: "Skor Sentimen" }].map(({ color, label }) => (
              <div key={label} className="flex items-center gap-1.5">
                <span className="w-3.5 h-1 rounded-full inline-block" style={{ backgroundColor: color }} />
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{label}</span>
              </div>
            ))}
          </div>
        </div>

        <ResponsiveContainer width="100%" height={240}>
          <AreaChart data={weeklyData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
            <defs>
              <linearGradient id="gradVolume" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#3b82f6" stopOpacity={0.15} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="gradSentimen" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#10b981" stopOpacity={0.15} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="4 4" stroke="rgba(148,163,184,0.08)" vertical={false} />

            <XAxis
              dataKey="hari"
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

            <ReTooltip content={<LineTooltip />} cursor={{ stroke: "rgba(148,163,184,0.15)", strokeWidth: 1.5 }} />

            <Area
              type="monotone"
              dataKey="volume"
              name="Volume Ulasan"
              stroke="#3b82f6"
              strokeWidth={3}
              fill="url(#gradVolume)"
              dot={false}
              activeDot={{ r: 6, fill: "#3b82f6", strokeWidth: 0, style: { filter: "drop-shadow(0 0 8px #3b82f6)" } }}
              style={{ filter: "drop-shadow(0 2px 4px rgba(59,130,246,0.25))" }}
            />
            <Area
              type="monotone"
              dataKey="sentimen"
              name="Skor Sentimen"
              stroke="#10b981"
              strokeWidth={3}
              fill="url(#gradSentimen)"
              dot={false}
              activeDot={{ r: 6, fill: "#10b981", strokeWidth: 0, style: { filter: "drop-shadow(0 0 8px #10b981)" } }}
              style={{ filter: "drop-shadow(0 2px 4px rgba(16,185,129,0.25))" }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* ── Row 4: Topic Clusters (Replaced Ulasan Terkini to reduce clutter) ── */}
      <div className="glass-light rounded-3xl p-6">
        <div className="flex items-center justify-between mb-6 border-b border-slate-200/20 pb-4">
          <div className="flex items-center gap-2">
            <BrainCircuit className="w-4 h-4 text-orange-500" />
            <h3 className="font-black text-slate-800 text-sm tracking-tight">
              Kluster Topik Perbincangan Utama Pelanggan
            </h3>
          </div>
          <Link href="/pengurus/topics" className="text-xs font-bold text-orange-500 hover:text-orange-600 flex items-center gap-1">
            Lihat Analisis Penuh <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
        
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {topTopics.length === 0 ? (
            <p className="text-sm text-slate-400 italic">Tiada topik dijumpai.</p>
          ) : (
            topTopics.map((topic, idx) => (
              <div key={idx} className="bg-white/40 border border-slate-100/60 rounded-2xl p-5 spring-hover hover:bg-white/85 hover:border-orange-100 shadow-sm transition-all duration-200 cursor-pointer" onClick={() => router.push(`/pengurus/topics?topic=${encodeURIComponent(topic.label_topik)}`)}>
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

      {/* ── QR Shortcut ── */}
      <Link href="/pengurus/qr"
        className="group relative overflow-hidden bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 rounded-3xl p-6 flex items-center justify-between text-white spring-hover shadow-xl hover:shadow-2xl transition-all duration-300">
        <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative flex items-center gap-4">
          <div className="w-12 h-12 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/20">
            <QrCode className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-black tracking-tight flex items-center gap-2">
              Jana Kod QR Maklum Balas
              <span className="text-xs font-bold text-orange-400 bg-orange-400/20 border border-orange-400/30 px-2 py-0.5 rounded-full uppercase tracking-wider">Quick Link</span>
            </h3>
            <p className="text-slate-400 text-sm mt-0.5">Jana, hias dan muat turun kod QR untuk diletakkan di meja makan premis anda.</p>
          </div>
        </div>
        <div className="relative flex items-center gap-2 text-orange-400 font-bold text-sm group-hover:gap-3.5 transition-all">
          Buka <ArrowRight className="w-4 h-4" />
        </div>
      </Link>

    </div>
  );
}
