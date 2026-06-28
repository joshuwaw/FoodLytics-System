"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { MessageSquare, Star, ArrowLeft, Activity } from "lucide-react";
import Link from "next/link";

export default function TrendStafPage() {
  const { user } = useAuth();
  
  // Data State
  const [loading, setLoading] = useState(true);
  const [totalFeedback, setTotalFeedback] = useState(0);
  const [avgRating, setAvgRating] = useState(0);
  const [pertumbuhan, setPertumbuhan] = useState<number>(0);
  const [topics, setTopics] = useState<any[]>([]);

  useEffect(() => {
    if (!user?.id_premis) return;
    const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";
    setLoading(true);

    Promise.all([
      fetch(`${API_URL}/customer/sentiment-stats/${user.id_premis}`).then(r => r.json()),
      fetch(`${API_URL}/analytics/topics/${user.id_premis}`).then(r => r.json())
    ])
    .then(([stats, topicsData]) => {
      setTotalFeedback(stats.total || 0);
      setAvgRating(stats.purata_bintang || 0);
      setPertumbuhan(stats.pertumbuhan ?? 0);
      setTopics(topicsData.topics || []);
    })
    .catch(console.error)
    .finally(() => setLoading(false));
  }, [user]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-10">
      {/* Header Section */}
      <div>
        <Link href="/staf" className="text-blue-500 hover:text-blue-600 font-bold text-xs uppercase tracking-widest flex items-center gap-2 mb-4 spring-hover">
          <ArrowLeft size={14} /> Kembali ke Dashboard
        </Link>
        <h2 className="text-3xl lg:text-4xl font-black text-slate-900 tracking-tight flex items-center gap-3">
          <Activity className="w-8 h-8 text-blue-500" />
          Prestasi Jenama Saya
        </h2>
        <p className="text-slate-400 mt-1.5 text-sm mono-accent">
          Analisis mendalam mengenai wawasan khusus jenama untuk operasi.
        </p>
      </div>

      <div className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Main Stats Card */}
          <div className="lg:col-span-2 glass-light rounded-3xl p-6 border border-slate-100/60 shadow-sm relative overflow-hidden group hover:shadow-md transition-all duration-300">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-blue-600" />
            
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

        </div>
      </div>
    </div>
  );
}
