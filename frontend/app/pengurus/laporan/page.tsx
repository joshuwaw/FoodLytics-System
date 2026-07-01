"use client";


import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/lib/auth";
import { Search, FileText, Download, Loader2, History, Archive, Star } from "lucide-react";
import domtoimage from "dom-to-image-more";
import { jsPDF } from "jspdf";
import { LaporanPDFTemplate } from "@/components/LaporanPDFTemplate";

export default function LaporanPage() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState("2026-06"); // Mock default
  const [pdfData, setPdfData] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (searchQuery.length > 2 && user?.id_premis) {
        performSearch(searchQuery);
      } else if (searchQuery.length === 0) {
        setSearchResults([]);
      }
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery, user?.id_premis]);

  const performSearch = async (query: string) => {
    setSearching(true);
    try {
      const res = await fetch(`http://localhost:8000/api/customer/feedback/history/${user?.id_premis}?q=${encodeURIComponent(query)}`);
      if (res.ok) {
        const data = await res.json();
        setSearchResults(data);
        setCurrentPage(1); // Reset to first page on new search
      }
    } catch (error) {
      console.error("Gagal carian:", error);
    } finally {
      setSearching(false);
    }
  };

  const handleGeneratePDF = async () => {
    if (!user?.id_premis) return;
    setGenerating(true);
    try {
      // 1. Fetch JSON data
      const response = await fetch(`http://localhost:8000/api/laporan/generate/${user.id_premis}?bulan=${selectedMonth}`);
      if (!response.ok) throw new Error("Gagal mengambil data laporan");
      const data = await response.json();
      
      // 2. Set data so React renders the hidden component
      setPdfData(data);
      
      // 3. Wait for render
      await new Promise((resolve) => setTimeout(resolve, 500));
      
      if (!printRef.current) throw new Error("Templat PDF gagal dimuatkan");
      
      // 4. Generate PDF using dom-to-image-more dynamically based on true height
      const scale = 2;
      const actualHeight = printRef.current.offsetHeight;
      const actualWidth = 794; // Fixed A4 width
      
      const imgData = await domtoimage.toJpeg(printRef.current, {
        quality: 0.95,
        width: actualWidth * scale,
        height: actualHeight * scale,
        style: {
          transform: `scale(${scale})`,
          transformOrigin: 'top left',
          width: `${actualWidth}px`,
          height: `${actualHeight}px`
        }
      });
      
      // A4 is 210x297mm
      const pdf = new jsPDF("p", "mm", "a4");
      
      // Calculate how many A4 pages the total height takes up.
      // 1 A4 page at 794px wide is ~1123px tall.
      const pageHeightPx = 1123;
      const totalPages = Math.ceil(actualHeight / pageHeightPx);
      
      // Calculate total height in mm to stretch the image
      // If 1123px = 297mm, then actualHeight = (actualHeight / 1123) * 297
      const totalHeightMm = (actualHeight / pageHeightPx) * 297;
      
      for (let i = 0; i < totalPages; i++) {
        if (i > 0) {
          pdf.addPage();
        }
        // Shift the image up by 297mm for each subsequent page
        const yOffset = -(297 * i);
        pdf.addImage(imgData, "JPEG", 0, yOffset, 210, totalHeightMm);
      }
      
      pdf.save(`${selectedMonth}_Enterprise_Report.pdf`);
      
    } catch (error) {
      console.error("Error generating PDF:", error);
      alert("Ralat semasa menjana laporan PDF.");
    } finally {
      setGenerating(false);
      setPdfData(null);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      {/* Header */}
      <div className="border-b border-slate-200/40 pb-5">
        <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2">
          Carian Sejarah & Laporan Digital
          <span className="text-xs font-bold text-blue-500 bg-blue-50 border border-blue-100 px-2.5 py-0.5 rounded-full uppercase tracking-wider">Enterprise</span>
        </h1>
        <p className="text-slate-400 mt-1.5 text-sm leading-relaxed">Tinjau data lampau, cari maklum balas khusus dan jana laporan PDF prestasi premis anda.</p>
      </div>

      {/* Carian Sejarah Section */}
      <div className="glass-light rounded-3xl p-6 md:p-8 border-t-4 border-t-blue-500 shadow-md shadow-blue-500/5">
        <h2 className="text-md font-black text-slate-800 flex items-center gap-2.5 mb-5 tracking-tight">
          <div className="w-8 h-8 bg-blue-50 border border-blue-100 rounded-xl flex items-center justify-center shadow-sm">
            <Search className="w-4 h-4 text-blue-500" />
          </div>
          Carian Maklum Balas Lampau
        </h2>
        
        <div className="relative mb-5">
          <Search className="absolute left-4.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400" />
          <input 
            type="text" 
            placeholder="Cari kata kunci (contoh: 'Nasi Lemak', 'Ayam Goreng', 'Layanan')..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-12 py-3.5 bg-white/60 border border-slate-200/80 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all text-slate-800 font-medium placeholder:text-slate-400/80 text-sm shadow-inner"
          />
          {searching && <Loader2 className="absolute right-4.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-blue-500 animate-spin" />}
        </div>
        
        {searchResults.length > 0 ? (
          <div className="space-y-3 mt-4 mb-5">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Hasil Carian ({searchResults.length})</h3>
            <div className="max-h-[300px] overflow-y-auto space-y-3 pr-2 custom-scrollbar">
              {searchResults.map((item, idx) => {
                const src = (item.sumber_platform || "Sistem").toLowerCase();
                const isGoogle = src.includes("google");
                const isFb = src.includes("facebook");
                const isQR = src.includes("qr") || src.includes("sistem") || src.includes("web") || src.includes("pelanggan");
                
                const sourceBadgeClass = isGoogle 
                  ? "bg-red-50 text-red-600 border-red-200/60" 
                  : isFb 
                    ? "bg-blue-50 text-blue-600 border-blue-200/60" 
                    : isQR
                      ? "bg-emerald-50 text-emerald-600 border-emerald-200/60"
                      : "bg-slate-50 text-slate-600 border-slate-200/60";

                const sourceLabel = isGoogle 
                  ? "Google Review" 
                  : isFb 
                    ? "Facebook" 
                    : isQR 
                      ? "QR Maklum Balas" 
                      : item.sumber_platform || "Portal Sistem";

                const rating = item.bilangan_bintang || 0;
                const borderClass = rating <= 2 
                  ? "border-l-rose-500 shadow-rose-500/5" 
                  : rating === 3 
                    ? "border-l-amber-500 shadow-amber-500/5" 
                    : "border-l-emerald-500 shadow-emerald-500/5";

                return (
                  <div 
                    key={idx} 
                    className={`py-3.5 px-4 bg-white/40 border-l-4 ${borderClass} border-y border-r border-slate-200/50 rounded-2xl shadow-sm hover:bg-white/80 hover:border-blue-200 transition-all duration-200 flex flex-col justify-between group`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-lg border ${sourceBadgeClass}`}>
                            {sourceLabel}
                          </span>
                          <span className="text-[10px] text-slate-400 font-bold font-mono">
                            {new Date(item.tarikh_terima).toLocaleDateString('ms-MY', {day:'numeric', month:'short', year:'numeric'})}
                          </span>
                        </div>
                        <div className="flex items-center gap-0.5 text-amber-400">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`w-3 h-3 ${i < rating ? "fill-current" : "text-slate-200"}`}
                            />
                          ))}
                        </div>
                      </div>
                      <p className="text-sm font-bold text-slate-700 italic pr-2 leading-relaxed">
                        "{item.ulasan_teks}"
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : searchQuery.length > 2 && !searching ? (
          <div className="bg-slate-50 border border-slate-100 rounded-2xl p-6 text-center mb-5">
            <p className="text-sm font-bold text-slate-400 italic">Tiada ulasan dijumpai untuk "{searchQuery}"</p>
          </div>
        ) : null}
        
        <div className="bg-blue-50/50 border border-blue-100 rounded-2xl p-4 flex items-center gap-3 text-blue-700 shadow-inner">
          <History className="w-5 h-5 text-blue-500" />
          <span className="font-bold text-xs tracking-wide uppercase">Carian Aktif • Sejarah Terjamin</span>
        </div>
      </div>

      {/* Penjanaan Laporan Digital Section */}
      <div className="glass-light rounded-3xl p-6 md:p-8 border-t-4 border-t-purple-500 shadow-md shadow-purple-500/5 relative overflow-hidden">
        
        <h2 className="text-md font-black text-slate-800 flex items-center gap-2.5 mb-6 tracking-tight">
          <div className="w-8 h-8 bg-purple-50 border border-purple-100 rounded-xl flex items-center justify-center shadow-sm">
            <FileText className="w-4 h-4 text-purple-500" />
          </div>
          Penjanaan Laporan Digital (Eksklusif Pengurus)
        </h2>
        
        <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
          {/* Left: Generator Form */}
          <div className="space-y-5">
            <div>
              <label className="block text-xs font-black text-slate-500 uppercase tracking-wider mb-2">Julat Tarikh Laporan</label>
              <select 
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="w-full px-4 py-3 bg-white/60 border border-slate-200/80 rounded-2xl focus:ring-4 focus:ring-purple-500/10 focus:border-purple-500 outline-none text-slate-700 font-bold text-sm shadow-sm"
              >
                <option value="2026-06">Bulan Lepas (Jun 2026)</option>
                <option value="2026-05">Mei 2026</option>
                <option value="2026-04">April 2026</option>
              </select>
            </div>
            
            <button 
              onClick={handleGeneratePDF}
              disabled={generating}
              className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white py-3.5 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all duration-200 shadow-md shadow-purple-500/25 active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer"
            >
              {generating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Download className="w-5 h-5" />}
              {generating ? "Menjana Laporan..." : "Jana Laporan PDF"}
            </button>
          </div>
          
          {/* Right: Archived Mock */}
          <div>
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Arkib Laporan</h3>
            <div className="space-y-3">
              {[
                { name: "Mei_2026_Performance_Report.pdf", date: "Jun 5, 2026", size: "2.4 MB" },
                { name: "Apr_2026_Performance_Report.pdf", date: "Mei 2, 2026", size: "2.1 MB" }
              ].map((report, i) => (
                <div key={i} className="flex items-center justify-between p-3.5 rounded-2xl border border-slate-200/60 hover:border-purple-300 hover:bg-white/60 hover:shadow-sm transition-all duration-200 group cursor-pointer bg-slate-50/40">
                  <div className="flex items-center gap-3.5">
                    <div className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-100 text-rose-500 flex items-center justify-center shadow-sm">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-bold text-slate-800 text-sm group-hover:text-purple-600 transition-colors">{report.name}</p>
                      <p className="text-[11px] text-slate-400 font-bold mt-0.5">{report.date} • {report.size}</p>
                    </div>
                  </div>
                  <Download className="w-4 h-4 text-slate-400 group-hover:text-purple-600 transition-colors mr-2" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* HIDDEN TEMPLATE FOR HTML2CANVAS */}
      <LaporanPDFTemplate ref={printRef} data={pdfData} />
      
    </div>
  );
}
