"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { MessageSquareQuote, ArrowLeft, Star, Clock, Utensils, DollarSign, Sparkles, AlertCircle, XCircle, Search, BrainCircuit } from "lucide-react";
import Link from "next/link";

interface TopicInfo {
  label_topik: string;
  kekerapan: number;
  purata_skor: number;
  sentimen_dominan: string;
  sentimen_breakdown: {
    Positif: number;
    Neutral: number;
    Negatif: number;
  };
  platform_breakdown?: Record<string, number>;
}

interface DrilldownItem {
  id_maklum_balas: number;
  ulasan_teks: string;
  bilangan_bintang: number;
  rating_makanan: number;
  rating_layanan: number;
  rating_suasana: number;
  tarikh_terima: string;
  label_sentimen: string;
  skor_sentimen: number;
  skor_topik: number;
  sumber_platform?: string;
}

function TopicsAnalysisContent() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  
  const initialPlatform = searchParams.get("platform");

  const [topics, setTopics] = useState<TopicInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  const [selectedPlatform, setSelectedPlatform] = useState<string | null>(initialPlatform);
  const [drilldown, setDrilldown] = useState<DrilldownItem[]>([]);
  const [loadingDrilldown, setLoadingDrilldown] = useState(false);
  const [showAllTopics, setShowAllTopics] = useState(false);
  const [activeFilter, setActiveFilter] = useState<"Semua" | "Negatif" | "Positif">("Semua");
  const [searchQuery, setSearchQuery] = useState("");
  const [visibleCount, setVisibleCount] = useState(5);

  // Fetch Topics
  const fetchTopics = async () => {
    if (!user?.id_premis) {
      setLoading(false);
      return;
    }

    const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";
    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/analytics/topics/${user.id_premis}`);
      if (!res.ok) throw new Error("Failed to fetch topics");

      const data = await res.json();
      const fetchedTopics = data.topics || [];
      setTopics(fetchedTopics);

      // Auto-select first topic if none selected
      if (fetchedTopics.length > 0 && !selectedTopic) {
        let topicToSelect = fetchedTopics[0].label_topik;
        if (initialPlatform) {
          const matchingTopic = fetchedTopics.find(t => t.platform_breakdown && t.platform_breakdown[initialPlatform] > 0);
          if (matchingTopic) {
            topicToSelect = matchingTopic.label_topik;
          }
        }
        fetchDrilldown(topicToSelect);
      }
    } catch (e) {
      console.error("Topic Fetch Error:", e);
      setTopics([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTopics();
  }, [user]);

  // Fetch Drilldown
  const fetchDrilldown = async (topicLabel: string) => {
    if (!user?.id_premis) return;
    const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";
    setSelectedTopic(topicLabel);
    setLoadingDrilldown(true);
    setSearchQuery("");
    setVisibleCount(5);
    try {
      const res = await fetch(
        `${API_URL}/analytics/topics/drilldown/${user.id_premis}?topic=${encodeURIComponent(topicLabel)}`
      );
      const data = await res.json();
      setDrilldown(data.ulasan || []);
    } catch (e) {
      console.error("Drilldown Error:", e);
    } finally {
      setLoadingDrilldown(false);
    }
  };

  const getTopicIcon = (label: string) => {
    const l = label.toLowerCase();
    if (l.includes("servis") || l.includes("lambat") || l.includes("layanan")) return <Clock className="w-5 h-5 text-amber-500" />;
    if (l.includes("makanan") || l.includes("sedap") || l.includes("rasa")) return <Utensils className="w-5 h-5 text-emerald-500" />;
    if (l.includes("harga") || l.includes("mahal") || l.includes("murah")) return <DollarSign className="w-5 h-5 text-blue-500" />;
    if (l.includes("kebersihan") || l.includes("kotor") || l.includes("suasana")) return <Sparkles className="w-5 h-5 text-indigo-500" />;
    return <AlertCircle className="w-5 h-5 text-slate-500" />;
  };

  const getInitials = (text: string) => {
    const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const i1 = text.length % 26;
    const i2 = (text.length * 2) % 26;
    return `${letters[i1]}${letters[i2]}`;
  };

  const getPlatformIcon = (platform: string) => {
    if (platform.includes("Google")) return "G";
    if (platform.includes("Social") || platform.includes("X") || platform.includes("Instagram")) return "◎";
    return "⊞"; // Portal QR or others
  };

  const getPlatformColor = (platform: string) => {
    if (platform.includes("Google")) return "bg-blue-100 text-blue-700 border-blue-200 hover:bg-blue-200";
    if (platform.includes("Social") || platform.includes("X") || platform.includes("Instagram")) return "bg-indigo-100 text-indigo-700 border-indigo-200 hover:bg-indigo-200";
    return "bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200";
  };

  const todayStr = new Date().toLocaleDateString("ms-MY", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

  return (
    <div className="space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-10">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <Link href="/staf" className="text-blue-500 hover:text-blue-600 font-bold text-xs uppercase tracking-widest flex items-center gap-2 mb-4 spring-hover">
            <ArrowLeft size={14} /> Kembali ke Dashboard
          </Link>
          <h2 className="text-3xl lg:text-4xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            <BrainCircuit className="w-8 h-8 text-blue-500" />
            Analisis <span className="bg-gradient-to-r from-blue-500 to-blue-600 bg-clip-text text-transparent">Topik</span>
          </h2>
          <p className="text-slate-400 mt-1.5 text-sm mono-accent">
            Data dikemaskini sehingga {todayStr}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="flex glass-light rounded-2xl p-1 shadow-sm border border-slate-100">
            <button
              onClick={() => { setActiveFilter("Semua"); setShowAllTopics(false); }}
              className={`px-4 py-1.5 text-xs uppercase tracking-widest font-black rounded-xl transition-all ${activeFilter === "Semua" ? "bg-slate-800 text-white shadow-sm" : "text-slate-400 hover:text-slate-700"}`}
            >
              Semua
            </button>
            <button
              onClick={() => { setActiveFilter("Negatif"); setShowAllTopics(false); }}
              className={`px-4 py-1.5 text-xs uppercase tracking-widest font-black rounded-xl transition-all flex items-center gap-1.5 ${activeFilter === "Negatif" ? "bg-rose-500 text-white shadow-sm shadow-rose-500/20" : "text-rose-400 hover:text-rose-600"}`}
            >
              <AlertCircle className="w-3.5 h-3.5" /> Isu Kritikal
            </button>
            <button
              onClick={() => { setActiveFilter("Positif"); setShowAllTopics(false); }}
              className={`px-4 py-1.5 text-xs uppercase tracking-widest font-black rounded-xl transition-all flex items-center gap-1.5 ${activeFilter === "Positif" ? "bg-emerald-500 text-white shadow-sm shadow-emerald-500/20" : "text-emerald-400 hover:text-emerald-600"}`}
            >
              <Sparkles className="w-3.5 h-3.5" /> Kekuatan
            </button>
          </div>
        </div>
      </div>

      {/* Horizontal Topic Cards */}
      {loading ? (
        <div className="flex gap-4 overflow-hidden py-2">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="min-w-[280px] h-[140px] glass-light rounded-3xl animate-pulse"></div>
          ))}
        </div>
      ) : topics.length === 0 ? (
        <div className="glass-light rounded-3xl p-10 text-center text-slate-500 font-medium">
          Tiada topik dikesan. Sila tunggu sehingga terdapat ulasan baru.
        </div>
      ) : (
        <div className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {(() => {
              const filteredTopics = topics.filter(t => {
                if (activeFilter === "Semua") return true;
                return t.sentimen_breakdown[activeFilter] > 0;
              }).sort((a, b) => {
                if (activeFilter === "Semua") return b.kekerapan - a.kekerapan;
                return b.sentimen_breakdown[activeFilter] - a.sentimen_breakdown[activeFilter];
              });
              const displayTopics = showAllTopics ? filteredTopics : filteredTopics.slice(0, 4);

              if (filteredTopics.length === 0) {
                return (
                  <div className="col-span-full glass-light rounded-3xl p-8 text-center text-slate-400 italic font-medium">
                    Tiada topik dikesan untuk kategori ini.
                  </div>
                );
              }

              return displayTopics.map((t) => {
                const isSelected = selectedTopic === t.label_topik;
                const displayCount = activeFilter === "Semua" ? t.kekerapan : t.sentimen_breakdown[activeFilter];
                const displaySentiment = activeFilter === "Semua" ? t.sentimen_dominan : activeFilter;
                const percent = Math.round((displayCount / t.kekerapan) * 100) || 0;

                return (
                  <div
                    key={t.label_topik}
                    onClick={() => fetchDrilldown(t.label_topik)}
                    className={`p-5 rounded-3xl cursor-pointer spring-hover flex flex-col justify-between
                      ${isSelected
                        ? "bg-white border-2 border-blue-500 shadow-xl shadow-blue-500/10 scale-[1.02]"
                        : "glass-light border border-transparent hover:border-blue-200"
                      }`}
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shadow-sm 
                        ${isSelected ? "bg-blue-50 border border-blue-100" : "bg-white border border-slate-100"}`}>
                        {getTopicIcon(t.label_topik)}
                      </div>

                      <div className={`px-2.5 py-1 rounded-xl border flex items-center gap-1 text-[10px] uppercase font-black tracking-widest
                        ${displaySentiment === 'Positif' ? 'bg-emerald-50 border-emerald-100 text-emerald-600' :
                          displaySentiment === 'Negatif' ? 'bg-rose-50 border-rose-100 text-rose-600' :
                            'bg-slate-50 border-slate-100 text-slate-600'}`}>
                        {displaySentiment === 'Negatif' ? "↓" : "↑"} {percent}%
                      </div>
                    </div>

                    <div className="flex-1">
                      <h3 className="text-xl font-black text-slate-900 tracking-tight">{t.label_topik}</h3>
                      <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">
                        {displayCount} Ulasan Dikesan
                      </p>
                      
                      {/* Platform Pills */}
                      {t.platform_breakdown && Object.keys(t.platform_breakdown).length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-3">
                          {Object.entries(t.platform_breakdown).map(([platform, count]) => (
                            <button
                              key={platform}
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedPlatform(platform);
                                fetchDrilldown(t.label_topik);
                              }}
                              className={`flex items-center gap-1.5 px-2 py-0.5 rounded-lg border text-[10px] font-black transition-all ${getPlatformColor(platform)} ${selectedPlatform === platform && isSelected ? 'ring-2 ring-blue-400 ring-offset-1' : ''}`}
                            >
                              <span>{getPlatformIcon(platform)}</span>
                              <span>{count}</span>
                            </button>
                          ))}
                        </div>
                      )}
                      
                      {/* Sentiment Distribution Mini-Bar */}
                      {t.kekerapan > 0 && (
                        <div className="mt-3 space-y-1">
                          <div className="flex h-1.5 rounded-full overflow-hidden bg-slate-100">
                            {t.sentimen_breakdown.Positif > 0 && (
                              <div 
                                className="bg-emerald-500 transition-all duration-500" 
                                style={{ width: `${(t.sentimen_breakdown.Positif / t.kekerapan) * 100}%` }}
                                title={`Positif: ${t.sentimen_breakdown.Positif}`}
                              />
                            )}
                            {t.sentimen_breakdown.Neutral > 0 && (
                              <div 
                                className="bg-slate-400 transition-all duration-500" 
                                style={{ width: `${(t.sentimen_breakdown.Neutral / t.kekerapan) * 100}%` }}
                                title={`Neutral: ${t.sentimen_breakdown.Neutral}`}
                              />
                            )}
                            {t.sentimen_breakdown.Negatif > 0 && (
                              <div 
                                className="bg-rose-500 transition-all duration-500" 
                                style={{ width: `${(t.sentimen_breakdown.Negatif / t.kekerapan) * 100}%` }}
                                title={`Negatif: ${t.sentimen_breakdown.Negatif}`}
                              />
                            )}
                          </div>
                          <div className="flex justify-between text-[8px] font-bold tracking-wider">
                            <span className="text-emerald-600">{t.sentimen_breakdown.Positif}P</span>
                            <span className="text-slate-400">{t.sentimen_breakdown.Neutral}N</span>
                            <span className="text-rose-500">{t.sentimen_breakdown.Negatif}A</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              });
            })()}
          </div>

          {(() => {
            const filteredCount = topics.filter(t => activeFilter === "Semua" ? true : t.sentimen_breakdown[activeFilter] > 0).length;
            if (filteredCount > 4) {
              return (
                <div className="flex justify-center mt-2">
                  <button
                    onClick={() => setShowAllTopics(!showAllTopics)}
                    className="text-xs uppercase tracking-widest font-bold text-slate-400 hover:text-blue-500 transition-colors py-2"
                  >
                    {showAllTopics ? "Tutup Senarai Penuh" : `Lihat Semua Topik (${filteredCount})`}
                  </button>
                </div>
              );
            }
            return null;
          })()}
        </div>
      )}

      {/* Drilldown Full-width List */}
      <div className="mt-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
          <h3 className="font-black text-slate-800 text-sm tracking-tight flex items-center gap-2">
            <MessageSquareQuote className="w-4 h-4 text-blue-500" />
            Maklum Balas Terperinci: <span className="text-blue-500">{selectedTopic || "..."}</span>
          </h3>
          
          <div className="flex items-center gap-2 flex-wrap">
            {selectedPlatform && (
              <button
                onClick={() => setSelectedPlatform(null)}
                className="flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-blue-600 rounded-xl text-xs font-bold border border-blue-200 hover:bg-blue-100 transition-colors"
              >
                Ditapis: {selectedPlatform} <XCircle className="w-3.5 h-3.5" />
              </button>
            )}
            
            {/* Search Box */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Cari dalam ulasan..."
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setVisibleCount(5); }}
                className="pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-white/80 focus:outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100 w-48 font-medium text-slate-700 placeholder:text-slate-400"
              />
            </div>
          </div>
        </div>

        {loadingDrilldown ? (
          <div className="glass-light rounded-3xl p-12 flex justify-center">
            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : drilldown.length > 0 ? (
          (() => {
            const filteredDrilldown = drilldown.filter(d => 
              (activeFilter === "Semua" || d.label_sentimen === activeFilter) &&
              (!selectedPlatform || d.sumber_platform === selectedPlatform) &&
              (!searchQuery || d.ulasan_teks.toLowerCase().includes(searchQuery.toLowerCase()))
            );
            const totalFiltered = filteredDrilldown.length;
            const displayDrilldown = filteredDrilldown.slice(0, visibleCount);
            
            if (totalFiltered === 0) {
              return (
                <div className="glass-light rounded-3xl p-12 text-center">
                  <MessageSquareQuote className="w-10 h-10 text-blue-200 mx-auto mb-3" />
                  <h3 className="text-sm font-black text-slate-700 tracking-tight mb-1">
                    {searchQuery ? "Tiada Ulasan Sepadan" : `Tiada Ulasan ${activeFilter}`}
                  </h3>
                  <p className="text-xs text-slate-400 uppercase tracking-widest font-bold">
                    {searchQuery ? "Cuba kata kunci lain." : "Ulasan dalam topik ini mempunyai sentimen yang berbeza."}
                  </p>
                </div>
              );
            }
            return (
              <div className="space-y-3">
                {/* Results Count Badge */}
                <div className="flex items-center justify-between">
                  <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">
                    Menunjukkan {Math.min(visibleCount, totalFiltered)} daripada {totalFiltered} ulasan
                  </p>
                </div>
                
                {displayDrilldown.map((feedback, idx) => (
                  <div
                    key={feedback.id_maklum_balas}
                    className="glass-light border border-slate-100/60 rounded-3xl p-5 flex flex-col sm:flex-row gap-4 sm:items-start spring-hover"
                  >
                    {/* Avatar */}
                    <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 text-white flex items-center justify-center font-black text-sm shrink-0 shadow-md">
                      {getInitials(feedback.ulasan_teks)}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1.5">
                        <div className="flex items-center text-amber-400">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star key={i} className={`w-3.5 h-3.5 ${i < feedback.bilangan_bintang ? "fill-current" : "text-slate-200"}`} />
                          ))}
                        </div>
                        <span className="text-xs text-slate-400 mono-accent">
                          {new Date(feedback.tarikh_terima).toLocaleDateString("ms-MY", { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-sm font-semibold text-slate-800 italic mb-3 leading-relaxed">"{feedback.ulasan_teks}"</p>

                      {/* Granular Ratings */}
                      <div className="flex justify-between items-end">
                        <div className="flex gap-4">
                          {[
                            { l: "Makanan", v: feedback.rating_makanan, c: "text-orange-500" },
                            { l: "Layanan", v: feedback.rating_layanan, c: "text-blue-500" },
                            { l: "Suasana", v: feedback.rating_suasana, c: "text-indigo-500" }
                          ].map((r, i) => (
                            <div key={i} className="flex items-center gap-1.5">
                              <span className={`text-[10px] font-black uppercase tracking-widest ${r.c}`}>{r.l}</span>
                              <div className="flex text-[8px] text-amber-400">
                                {Array.from({ length: r.v }).map((_, j) => <Star key={j} className="w-2.5 h-2.5 fill-current" />)}
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

                    {/* Sentiment Badge */}
                    <div className={`px-3 py-1.5 rounded-xl border flex items-center justify-center gap-1.5 text-[10px] uppercase font-black tracking-widest w-fit sm:w-28 shrink-0 mt-2 sm:mt-0
                  ${feedback.label_sentimen === 'Positif' ? 'bg-emerald-50 border-emerald-100 text-emerald-600' :
                        feedback.label_sentimen === 'Negatif' ? 'bg-rose-50 border-rose-100 text-rose-600' :
                          'bg-slate-50 border-slate-100 text-slate-600'
                      }`}>
                      {feedback.label_sentimen === 'Positif' && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />}
                      {feedback.label_sentimen === 'Negatif' && <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />}
                      {feedback.label_sentimen === 'Neutral' && <span className="w-1.5 h-1.5 rounded-full bg-slate-500" />}
                      {feedback.label_sentimen}
                    </div>
                  </div>
                ))}
                
                {/* Load More Button */}
                {visibleCount < totalFiltered && (
                  <div className="flex justify-center pt-2">
                    <button
                      onClick={() => setVisibleCount(prev => prev + 5)}
                      className="text-xs uppercase tracking-widest font-bold text-slate-400 hover:text-blue-500 transition-colors py-2 px-4 rounded-xl border border-slate-200 hover:border-blue-200 bg-white/50"
                    >
                      Lihat Lagi ({totalFiltered - visibleCount} ulasan lagi)
                    </button>
                  </div>
                )}
              </div>
            );
          })()
        ) : selectedTopic ? (
          <div className="glass-light rounded-3xl p-12 text-center">
            <MessageSquareQuote className="w-10 h-10 text-blue-200 mx-auto mb-3" />
            <h3 className="text-sm font-black text-slate-700 tracking-tight mb-1">Tiada Ulasan Dijumpai</h3>
            <p className="text-xs text-slate-400 uppercase tracking-widest font-bold">Pilih topik lain untuk melihat ulasan.</p>
          </div>
        ) : null}
      </div>
    </div>
  );
}

export default function TopicsAnalysisPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <TopicsAnalysisContent />
    </Suspense>
  );
}
