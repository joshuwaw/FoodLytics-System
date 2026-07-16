import React, { forwardRef } from "react";
import { Utensils, TrendingUp, Star, MessageSquare } from "lucide-react";

interface PDFData {
  premis: any;
  bulan: string;
  stats: any;
  source_stats: any;
  recent: any[];
}

export const LaporanPDFTemplate = forwardRef<HTMLDivElement, { data: PDFData | null }>(
  ({ data }, ref) => {
    if (!data) return null;

    const { premis, bulan, stats, source_stats, recent } = data;

    // Helper to color sentiment
    const getSentimentColor = (s: string) => {
      if (s === "Positif") return "bg-green-100 text-green-700 border-green-200";
      if (s === "Neutral") return "bg-yellow-100 text-yellow-700 border-yellow-200";
      return "bg-red-100 text-red-700 border-red-200";
    };

    // Helper to chunk arrays to prevent page overflow and slicing
    const chunkArray = (arr: any[], size: number) => {
      const result = [];
      for(let i = 0; i < arr.length; i += size) {
        result.push(arr.slice(i, i + size));
      }
      return result;
    };

    // Safely chunk the recent logs (max 10 rows per A4 page to leave safe margins)
    const recentChunks = chunkArray(recent || [], 10);

    return (
      <div ref={ref} className="w-[794px] h-fit bg-slate-50 text-slate-800 font-sans absolute -left-[9999px] top-0">
        
        {/* --- PAGE 1: COVER & EXECUTIVE SUMMARY (FORMAL REPORT STYLE) --- */}
        <div className="w-[794px] h-[1123px] bg-white relative flex flex-col">
          
          {/* Top Edge Brand Bar */}
          <div className="h-4 bg-slate-900 w-full" />
          
          <div className="flex-1 p-16 flex flex-col">
            {/* Header Identifier */}
            <div className="flex justify-between items-start mb-24">
              <div>
                <h1 className="text-[10px] font-bold tracking-[0.3em] text-slate-400 uppercase">
                  FoodLytics Enterprise Analytics
                </h1>
                <div className="w-12 h-1 bg-orange-500 mt-4" />
              </div>
              <div className="text-right">
                <p className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">Tarikh Janaan</p>
                <p className="text-sm font-bold text-slate-800 mt-1">{new Date().toLocaleDateString('ms-MY')}</p>
              </div>
            </div>

            {/* Main Title Block */}
            <div className="mb-24">
              <h2 className="text-xs font-bold text-orange-500 uppercase tracking-widest mb-4">Laporan Prestasi Pintar Cawangan</h2>
              <h1 className="text-6xl font-black text-slate-900 leading-tight mb-6">
                {premis?.nama_premis || "Cawangan Restoran"}
              </h1>
              <p className="text-lg text-slate-500 max-w-xl leading-relaxed font-medium">
                {premis?.alamat_premis || "Alamat tidak ditetapkan"}
              </p>
            </div>

            {/* Executive Summary Grid (Formal) */}
            <div className="mt-auto">
              <h3 className="text-2xl font-bold text-slate-900 mb-8 flex items-center gap-3">
                Ringkasan Eksekutif <span className="text-slate-300 font-normal">/ {bulan}</span>
              </h3>
              
              <div className="grid grid-cols-3 border-t-2 border-b-2 border-slate-900 py-10 mb-12">
                <div className="pr-8 border-r border-slate-200">
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Jumlah Ulasan</p>
                  <p className="text-6xl font-black text-slate-900 tracking-tighter">{stats?.total || 0}</p>
                </div>
                <div className="px-8 border-r border-slate-200">
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Purata Penilaian</p>
                  <div className="flex items-baseline gap-2">
                    <p className="text-6xl font-black text-slate-900 tracking-tighter">{stats?.purata_bintang || 0}</p>
                    <p className="text-xl font-bold text-slate-400">/ 5.0</p>
                  </div>
                </div>
                <div className="pl-8">
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Pertumbuhan 30 Hari</p>
                  {(() => {
                    // Extract numerical value, handles if already formatted as string
                    const rawPert = stats?.pertumbuhan;
                    const pert = typeof rawPert === "string" ? parseFloat(rawPert) : (rawPert || 0);
                    const isPositive = pert > 0;
                    const isNegative = pert < 0;
                    const colorClass = isPositive ? "text-emerald-600" : isNegative ? "text-rose-600" : "text-slate-500";
                    const sign = isPositive ? "+" : "";
                    return (
                      <p className={`text-6xl font-black ${colorClass} tracking-tighter`}>
                        {sign}{pert}%
                      </p>
                    );
                  })()}
                </div>
              </div>

              {/* Aspect Breakdown (Progress Bars) */}
              <div>
                <p className="text-xs font-bold text-slate-900 uppercase tracking-widest mb-6">Pecahan Aspek Penilaian</p>
                <div className="grid grid-cols-3 gap-12">
                  {[
                    { label: "Kualiti Makanan", score: stats?.pecahan_rating?.makanan || 0 },
                    { label: "Layanan Pekerja", score: stats?.pecahan_rating?.layanan || 0 },
                    { label: "Suasana Kedai", score: stats?.pecahan_rating?.suasana || 0 }
                  ].map((aspect, i) => (
                    <div key={i}>
                      <div className="flex justify-between items-end mb-3">
                        <span className="text-sm font-bold text-slate-500">{aspect.label}</span>
                        <span className="text-lg font-black text-slate-900">{aspect.score}</span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-100 rounded-none overflow-hidden">
                        <div 
                          className="h-full bg-slate-900" 
                          style={{ width: `${(aspect.score / 5) * 100}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Footer Page 1 */}
            <div className="mt-16 pt-6 flex justify-between items-center text-xs text-slate-400 font-bold uppercase tracking-wider">
              <p>FoodLytics Enterprise Analytics Engine</p>
              <p>Mukasurat 1</p>
            </div>
          </div>
        </div>


        {/* --- PAGE 2: VISUAL ANALITIK --- */}
        <div className="w-[794px] h-[1123px] bg-white p-12 flex flex-col border-t-8 border-slate-50">
          <div className="border-b border-slate-200 pb-6 mb-8 flex justify-between items-end">
            <div>
              <h3 className="text-2xl font-black text-slate-800">Visual Analitik</h3>
              <p className="text-slate-500 mt-1">Data interaktif dari enjin AI dan maklum balas pelanggan.</p>
            </div>
            <div className="text-slate-400 font-bold text-sm">
              {bulan}
            </div>
          </div>

          <div className="space-y-10">
            {/* Sentiment Stacked Bar (Replaces Donut) */}
            <div className="bg-slate-50 rounded-3xl p-8 border border-slate-200">
              <h4 className="text-lg font-bold text-slate-700 mb-6">Taburan Sentimen Pelanggan</h4>
              
              <div className="space-y-4">
                {/* Stacked Bar */}
                <div className="h-12 w-full rounded-full overflow-hidden flex shadow-inner bg-slate-200">
                  {stats?.sentimen?.map((s: any, idx: number) => {
                    const width = s.value > 0 ? `${s.value}%` : "0%";
                    let color = "bg-slate-300";
                    if (s.name === "Positif") color = "bg-green-500";
                    if (s.name === "Neutral") color = "bg-yellow-400";
                    if (s.name === "Negatif") color = "bg-red-500";
                    
                    return (
                      <div 
                        key={idx} 
                        style={{ width }} 
                        className={`h-full ${color} transition-all duration-500 flex items-center justify-center border-r border-white/20 last:border-0`}
                      >
                        {s.value > 5 && <span className="text-white font-bold text-xs">{s.value}%</span>}
                      </div>
                    );
                  })}
                </div>
                
                {/* Legend */}
                <div className="flex items-center justify-center gap-8 pt-4">
                  {stats?.sentimen?.map((s: any, idx: number) => {
                    let dotColor = "bg-slate-300";
                    let textColor = "text-slate-500";
                    if (s.name === "Positif") { dotColor = "bg-green-500"; textColor = "text-green-700"; }
                    if (s.name === "Neutral") { dotColor = "bg-yellow-400"; textColor = "text-yellow-700"; }
                    if (s.name === "Negatif") { dotColor = "bg-red-500"; textColor = "text-red-700"; }
                    
                    return (
                      <div key={idx} className="flex items-center gap-2">
                        <span className={`w-3 h-3 rounded-full ${dotColor}`}></span>
                        <span className={`text-sm font-bold ${textColor}`}>{s.name} ({s.value}%)</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Source Bar Chart (Native Tailwind) */}
            <div className="bg-slate-50 rounded-3xl p-8 border border-slate-200">
              <h4 className="text-lg font-bold text-slate-700 mb-6">Sumber Platform Maklum Balas</h4>
              
              <div className="space-y-5">
                {source_stats && source_stats.length > 0 ? source_stats.map((src: any, idx: number) => {
                  // Calculate max for relative width
                  const maxVal = Math.max(...source_stats.map((s: any) => s.jumlah));
                  const percent = Math.round((src.jumlah / maxVal) * 100);
                  
                  return (
                    <div key={idx} className="flex items-center gap-4">
                      <div className="w-32 text-right font-bold text-sm text-slate-600 truncate">
                        {src.sumber}
                      </div>
                      <div className="flex-1 h-8 bg-slate-200 rounded-r-full overflow-hidden flex items-center">
                        <div 
                          style={{ width: `${percent}%` }} 
                          className="h-full bg-blue-500 flex items-center justify-end px-3 rounded-r-full"
                        >
                          <span className="text-white font-bold text-xs">{src.jumlah}</span>
                        </div>
                      </div>
                    </div>
                  );
                }) : (
                  <p className="text-slate-500 text-center py-8">Tiada data sumber platform.</p>
                )}
              </div>
            </div>
          </div>

          <div className="mt-auto pt-12 flex justify-between items-center text-xs text-slate-400 font-bold">
            <p>FoodLytics Enterprise Analytics Engine</p>
            <p>Mukasurat 2</p>
          </div>
        </div>


        {/* --- PAGE 3+: DETAILED LOGS (Chunked to prevent cutoffs) --- */}
        {recentChunks.length > 0 ? recentChunks.map((chunk, chunkIdx) => (
          <div key={`page-${chunkIdx + 3}`} className="w-[794px] h-[1123px] bg-white p-8 flex flex-col border-t-8 border-slate-50">
            {chunkIdx === 0 && (
              <div className="border-b border-slate-200 pb-4 mb-6 flex justify-between items-end">
                <div>
                  <h3 className="text-2xl font-black text-slate-800">Log Maklum Balas AI</h3>
                  <p className="text-slate-500 mt-1">Senarai maklum balas terkini yang dianalisis oleh enjin AI.</p>
                </div>
                <div className="text-slate-400 font-bold text-sm">
                  {bulan}
                </div>
              </div>
            )}
            
            {chunkIdx > 0 && (
              <div className="border-b border-slate-200 pb-4 mb-6 flex justify-between items-end">
                <h3 className="text-xl font-bold text-slate-500">Log Maklum Balas AI (Sambungan)</h3>
                <div className="text-slate-400 font-bold text-sm">{bulan}</div>
              </div>
            )}

            {/* Table */}
            <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-900 text-white">
                    <th className="py-3 px-4 text-sm font-bold w-24">Tarikh</th>
                    <th className="py-3 px-4 text-sm font-bold w-16">Skor</th>
                    <th className="py-3 px-4 text-sm font-bold w-28">Sentimen</th>
                    <th className="py-3 px-4 text-sm font-bold">Ulasan Pelanggan</th>
                  </tr>
                </thead>
                <tbody>
                  {chunk.map((item: any, idx: number) => (
                    <tr key={idx} className={`border-b border-slate-100 ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}`}>
                      <td className="py-3 px-4 text-xs text-slate-500 font-semibold align-top whitespace-nowrap">
                        {item.tarikh_terima ? item.tarikh_terima.split("T")[0] : "N/A"}
                      </td>
                      <td className="py-3 px-4 align-top">
                        <span className="bg-slate-200 text-slate-700 font-bold px-2 py-1 rounded-md text-xs flex items-center gap-1 w-min">
                          {item.bilangan_bintang || "-"} <Star className="w-3 h-3" />
                        </span>
                      </td>
                      <td className="py-3 px-4 align-top">
                        <span className={`px-2 py-1 rounded-lg text-[10px] uppercase tracking-wider font-bold border ${getSentimentColor(item.sentimen)}`}>
                          {item.sentimen || "Neutral"}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-xs text-slate-700 align-top font-medium pr-6 leading-relaxed">
                        <div className="line-clamp-3">"{item.ulasan_teks}"</div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            <div className="mt-auto pt-6 border-t border-transparent flex justify-between items-center text-xs text-slate-400 font-bold">
              <p>FoodLytics Enterprise Analytics Engine</p>
              <p>Mukasurat {chunkIdx + 3}</p>
            </div>
          </div>
        )) : (
          <div className="w-[794px] h-[1123px] bg-white p-12 flex flex-col border-t-8 border-slate-50">
            <div className="border-b border-slate-200 pb-6 mb-8 flex justify-between items-end">
              <div>
                <h3 className="text-2xl font-black text-slate-800">Log Maklum Balas AI</h3>
                <p className="text-slate-500 mt-1">Senarai maklum balas terkini.</p>
              </div>
            </div>
            <p className="py-12 text-center text-slate-500">Tiada rekod maklum balas dijumpai untuk bulan ini.</p>
            <div className="mt-auto pt-12 border-t border-transparent flex justify-between items-center text-xs text-slate-400 font-bold">
              <p>FoodLytics Enterprise Analytics Engine</p>
              <p>Mukasurat 3</p>
            </div>
          </div>
        )}

      </div>
    );
  }
);

LaporanPDFTemplate.displayName = "LaporanPDFTemplate";
