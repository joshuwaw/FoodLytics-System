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
  Star, MessageSquare, TrendingUp, CheckCircle2,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface PremisDetail {
  nama_premis: string;
  alamat_premis: string;
  pautan_gmaps: string | null;
  kod_perniagaan: string;
}

import { RefreshCw } from "lucide-react";

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
  const [pecahanRating, setPecahanRating] = useState({ makanan: 0, layanan: 0, suasana: 0 });
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [dataSources, setDataSources] = useState<DataSrc[]>([]);
  const [syncing, setSyncing] = useState(false);
  const [pertumbuhan, setPertumbuhan] = useState<number>(0);

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

    // Fetch weekly stats
    fetch(`${API_URL}/customer/weekly-stats/${user.id_premis}`)
      .then((r) => r.json())
      .then((d) => setWeeklyData(Array.isArray(d) ? d : []))
      .catch(() => {});

    // Fetch data sources
    fetch(`${API_URL}/ingestion/sources/${user.id_premis}`)
      .then((r) => r.json())
      .then((d) => setDataSources(Array.isArray(d) ? d : []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user]);

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
        fetch(`${API_URL}/customer/weekly-stats/${user.id_premis}`)
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
    <div className="space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-700">

      {/* ── Header ── */}
      <div>
        <h2 className="text-3xl lg:text-4xl font-black text-slate-900 tracking-tight">
          Selamat datang,{" "}
          <span className="bg-gradient-to-r from-orange-500 to-orange-600 bg-clip-text text-transparent">
            {user?.nama}
          </span>
        </h2>
        <p className="text-slate-400 mt-1.5 text-sm mono-accent">
          {new Date().toLocaleDateString("ms-MY", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
        </p>
      </div>

      {/* ── Row 1: Stat cards + Premise ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Premise Info */}
        <div className="glass-light rounded-3xl p-5 space-y-3 md:col-span-2 glow-orange">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl flex items-center justify-center shadow-md shadow-orange-400/20">
                <Building2 className="w-4 h-4 text-white" />
              </div>
              <h3 className="font-black text-slate-800 tracking-tight">Info Premis</h3>
            </div>
            {premis?.pautan_gmaps && (
              <a href={premis.pautan_gmaps} target="_blank" rel="noopener noreferrer"
                className="text-xs font-bold text-orange-500 flex items-center gap-1 spring-hover">
                Maps <ArrowRight className="w-3 h-3" />
              </a>
            )}
          </div>
          {loading ? (
            <div className="space-y-2">
              <div className="h-5 bg-slate-100/60 rounded-full animate-pulse w-2/3" />
              <div className="h-3 bg-slate-100/60 rounded-full animate-pulse w-1/2" />
            </div>
          ) : premis ? (
            <div>
              <p className="text-xl font-black text-slate-900">{premis.nama_premis}</p>
              <div className="flex items-start gap-1.5 text-slate-400 mt-1">
                <MapPin className="w-3.5 h-3.5 mt-0.5 flex-shrink-0 text-orange-400" />
                <p className="text-xs leading-relaxed">{premis.alamat_premis}</p>
              </div>
              <div className="mt-3 pt-2 border-t border-slate-100/60">
                <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold">Kod Perniagaan</p>
                <p className="text-lg font-black mono-accent text-slate-800">{premis.kod_perniagaan}</p>
              </div>
            </div>
          ) : (
            <p className="text-sm text-slate-400 italic">Tiada maklumat premis.</p>
          )}
        </div>

        {/* Rating */}
        <div className="glass-light rounded-3xl p-5 spring-hover">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 bg-amber-100/80 rounded-xl flex items-center justify-center">
              <Star className="w-4 h-4 text-amber-500" />
            </div>
            <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold">Purata Rating</p>
          </div>
          <p className="text-4xl font-black text-slate-900 mono-accent">{purataBintang > 0 ? purataBintang : "—"}</p>
          <p className="text-xs text-slate-400 mt-1">daripada 5.0 ⭐</p>
        </div>

        {/* Feedback */}
        <div className="glass-light rounded-3xl p-5 spring-hover">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 bg-emerald-100/80 rounded-xl flex items-center justify-center">
              <MessageSquare className="w-4 h-4 text-emerald-500" />
            </div>
            <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold">Jumlah Ulasan</p>
          </div>
          <p className="text-4xl font-black text-slate-900 mono-accent">{totalUlasan}</p>
          <p className={`text-xs font-bold mt-1 flex items-center gap-1 ${pertumbuhan >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
            <TrendingUp className="w-3 h-3" /> {pertumbuhan >= 0 ? '+' : ''}{pertumbuhan}% bulan ini
          </p>
        </div>

        {/* Breakdown */}
        <div className="glass-light rounded-3xl p-6 md:col-span-2 lg:col-span-1 flex flex-col justify-center h-full w-full">
          <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold mb-3 w-full">Pecahan Kategori</p>
          <div className="space-y-3 w-full">
            {[
              { label: "Makanan", val: pecahanRating.makanan, color: "bg-orange-500" },
              { label: "Layanan", val: pecahanRating.layanan, color: "bg-blue-500" },
              { label: "Suasana", val: pecahanRating.suasana, color: "bg-indigo-500" },
            ].map((item) => (
              <div key={item.label} className="w-full">
                <div className="flex justify-between items-center text-[11px] font-bold mb-1.5 w-full">
                  <span className="text-slate-500">{item.label}</span>
                  <span className="text-slate-800">{item.val} / 5.0</span>
                </div>
                <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div className={`h-full ${item.color} rounded-full`} style={{ width: `${(item.val / 5) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Row 2: Donut + Data Sources ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

        {/* ─ Sentiment Donut (Custom Recharts) ─ */}
        <div className="glass-light rounded-3xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-4 h-4 text-emerald-500" />
            <h3 className="font-black text-slate-800 text-sm tracking-tight">Ringkasan Sentimen Pelanggan</h3>
          </div>
          <div className="flex items-center gap-8">
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
              {/* Centre label - hide when hovering to avoid overlap */}
              <div className={`absolute inset-0 flex flex-col items-center justify-center pointer-events-none transition-opacity duration-200 ${activeIndex !== null ? 'opacity-0' : 'opacity-100'}`}>
                <p className="text-2xl font-black mono-accent" style={{ color: "#10b981", textShadow: "0 0 12px rgba(16,185,129,0.4)" }}>
                  {sentimentData[0]?.value ?? 0}%
                </p>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Positif</p>
              </div>
            </div>

            {/* Legend */}
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
                  {/* Progress bar */}
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

        {/* Data Sources */}
        <div className="glass-light rounded-3xl p-6 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-black text-slate-800 text-sm tracking-tight">
              Integrasi Sumber Data Luaran
            </h3>
            <button
              onClick={handleSync}
              disabled={syncing}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 text-slate-600 rounded-xl text-xs font-bold spring-hover hover:text-orange-500 hover:border-orange-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} />
              {syncing ? 'Menyegerak...' : 'Segerak Sekarang'}
            </button>
          </div>
          <div className="space-y-3 flex-1 overflow-y-auto">
            {dataSources.length === 0 ? (
              <p className="text-sm text-slate-400 italic">Memuatkan sumber data...</p>
            ) : (
              dataSources.map((src) => {
                let icon = "⊞"; let iconBg = "bg-slate-100 text-slate-600";
                if (src.platform.includes("Google")) { icon = "G"; iconBg = "bg-blue-100 text-blue-700"; }
                if (src.platform.includes("Social") || src.platform.includes("X") || src.platform.includes("Instagram")) { icon = "◎"; iconBg = "bg-indigo-100 text-indigo-700"; }
                
                return (
                  <div key={src.platform}
                    onClick={() => router.push(`/pengurus/topics?platform=${encodeURIComponent(src.platform)}`)}
                    className="group flex items-center gap-4 p-3.5 bg-white/50 rounded-2xl border border-slate-100/60 spring-hover cursor-pointer hover:border-orange-200">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-sm ${iconBg}`}>
                      {icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-black text-slate-800">{src.platform}</p>
                      <p className="text-xs text-slate-400 mono-accent">
                        {src.last_sync === "Live" ? "Sentiasa aktif" : src.last_sync ? `Terakhir: ${new Date(src.last_sync).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}` : "Belum disegerak"} • {src.jumlah_ulasan} rekod
                      </p>
                    </div>
                    {src.connected ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                    ) : (
                      <div className="w-2 h-2 rounded-full bg-slate-300" />
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
      <div className="glass-light rounded-3xl p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-blue-500" />
            <h3 className="font-black text-slate-800 text-sm tracking-tight">
              Kadar Pertumbuhan &amp; Volume Ulasan Mingguan
            </h3>
          </div>
          <div className="flex items-center gap-5">
            {[{ color: "#3b82f6", label: "Volume Ulasan" }, { color: "#10b981", label: "Skor Sentimen" }].map(({ color, label }) => (
              <div key={label} className="flex items-center gap-1.5">
                <span className="w-3 h-[2px] rounded-full inline-block" style={{ backgroundColor: color }} />
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{label}</span>
              </div>
            ))}
          </div>
        </div>

        <ResponsiveContainer width="100%" height={240}>
          <AreaChart data={weeklyData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
            <defs>
              <linearGradient id="gradVolume" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#3b82f6" stopOpacity={0.18} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="gradSentimen" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#10b981" stopOpacity={0.18} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="4 4" stroke="rgba(148,163,184,0.15)" vertical={false} />

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

            <ReTooltip content={<LineTooltip />} cursor={{ stroke: "rgba(148,163,184,0.2)", strokeWidth: 1 }} />

            <Area
              type="monotone"
              dataKey="volume"
              name="Volume Ulasan"
              stroke="#3b82f6"
              strokeWidth={2.5}
              fill="url(#gradVolume)"
              dot={false}
              activeDot={{ r: 5, fill: "#3b82f6", strokeWidth: 0, style: { filter: "drop-shadow(0 0 6px #3b82f6)" } }}
              style={{ filter: "drop-shadow(0 0 4px rgba(59,130,246,0.4))" }}
            />
            <Area
              type="monotone"
              dataKey="sentimen"
              name="Skor Sentimen"
              stroke="#10b981"
              strokeWidth={2.5}
              fill="url(#gradSentimen)"
              dot={false}
              activeDot={{ r: 5, fill: "#10b981", strokeWidth: 0, style: { filter: "drop-shadow(0 0 6px #10b981)" } }}
              style={{ filter: "drop-shadow(0 0 4px rgba(16,185,129,0.4))" }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* ── Row 4: Recent Feedback ── */}
      <div className="glass-light rounded-3xl p-6">
        <div className="flex items-center gap-2 mb-6">
          <MessageSquare className="w-4 h-4 text-orange-500" />
          <h3 className="font-black text-slate-800 text-sm tracking-tight">
            Ulasan Terkini
          </h3>
        </div>
        <div className="space-y-4">
          {recentFeedback.length === 0 ? (
            <p className="text-sm text-slate-400 italic">Tiada ulasan lagi.</p>
          ) : (
            recentFeedback.map((feedback, idx) => (
              <div key={idx} className="bg-white/50 border border-slate-100/60 rounded-2xl p-4 flex flex-col sm:flex-row gap-4 sm:items-center spring-hover">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="flex items-center text-amber-400">
                      {Array.from({ length: feedback.bilangan_bintang }).map((_, i) => (
                        <Star key={i} className="w-3.5 h-3.5 fill-current" />
                      ))}
                    </div>
                    <span className="text-xs text-slate-400 mono-accent">
                      {new Date(feedback.tarikh_terima).toLocaleDateString("ms-MY", { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-sm font-semibold text-slate-700 italic mb-2">"{feedback.ulasan_teks}"</p>
                  <div className="flex justify-between items-end mt-3">
                    <div className="flex gap-3">
                      {[
                        { l: "F", v: feedback.rating_makanan, c: "text-orange-500" },
                        { l: "S", v: feedback.rating_layanan, c: "text-blue-500" },
                        { l: "A", v: feedback.rating_suasana, c: "text-indigo-500" }
                      ].map((r, i) => (
                        <div key={i} className="flex items-center gap-1">
                          <span className={`text-[10px] font-black ${r.c}`}>{r.l}</span>
                          <div className="flex text-[8px] text-amber-400">
                             {Array.from({ length: r.v }).map((_, j) => <Star key={j} className="w-2 h-2 fill-current" />)}
                          </div>
                        </div>
                      ))}
                    </div>
                    {feedback.sumber_platform && (
                      <div className="text-[9px] font-bold uppercase tracking-widest text-slate-400 bg-slate-100 px-2 py-1 rounded-md">
                        {feedback.sumber_platform}
                      </div>
                    )}
                  </div>
                </div>
                <div className={`px-3 py-1.5 rounded-xl border flex items-center justify-center gap-1.5 text-xs font-bold w-fit sm:w-28
                  ${feedback.sentimen === 'Positif' ? 'bg-emerald-50 border-emerald-100 text-emerald-600' :
                    feedback.sentimen === 'Negatif' ? 'bg-rose-50 border-rose-100 text-rose-600' :
                      'bg-slate-50 border-slate-100 text-slate-600'
                  }`}>
                  {feedback.sentimen === 'Positif' && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />}
                  {feedback.sentimen === 'Negatif' && <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />}
                  {feedback.sentimen === 'Neutral' && <span className="w-1.5 h-1.5 rounded-full bg-slate-500" />}
                  {feedback.sentimen}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* ── QR Shortcut ── */}
      <Link href="/pengurus/qr"
        className="group relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-3xl p-6 flex items-center justify-between text-white spring-hover shadow-2xl shadow-slate-900/20">
        <div className="absolute top-0 right-0 w-48 h-48 bg-orange-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="relative flex items-center gap-4">
          <div className="w-12 h-12 glass rounded-2xl flex items-center justify-center">
            <QrCode className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-black tracking-tight">Jana Kod QR</h3>
            <p className="text-slate-400 text-sm">Jana & muat turun kod QR untuk premis anda.</p>
          </div>
        </div>
        <div className="relative flex items-center gap-2 text-orange-400 font-bold text-sm group-hover:gap-3 transition-all">
          Buka <ArrowRight className="w-4 h-4" />
        </div>
      </Link>

    </div>
  );
}
