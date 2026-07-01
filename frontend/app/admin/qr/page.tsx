"use client";

import { useState, useEffect, useRef } from "react";
import { QRCodeSVG } from "qrcode.react";
import { QrCode, Download, ExternalLink, HelpCircle } from "lucide-react";

interface Premise {
  id_premis: number;
  nama_premis: string;
}

export default function GenerateQR() {
  const [premises, setPremises] = useState<Premise[]>([]);
  const [selectedId, setSelectedId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const qrRef = useRef<HTMLDivElement>(null);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

  useEffect(() => {
    fetch(`${API_URL}/admin/premises`)
      .then((res) => {
        if (!res.ok) {
           throw new Error("Failed to fetch");
        }
        return res.json();
      })
      .then((data) => {
        if (Array.isArray(data)) {
          setPremises(data);
          if (data.length > 0) setSelectedId(data[0].id_premis.toString());
        } else {
          setPremises([]);
        }
      })
      .catch((err) => {
         console.error(err);
         setPremises([]);
       })
      .finally(() => setLoading(false));
  }, [API_URL]);

  const downloadQR = () => {
    const svg = qrRef.current?.querySelector("svg");
    if (!svg) return;
    
    // Create a canvas to convert SVG to PNG
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();
    
    img.onload = () => {
      // Set canvas size matching the qr code bounding box to ensure high res
      canvas.width = img.width;
      canvas.height = img.height;
      
      if (ctx) {
          ctx.fillStyle = "white"; // Background
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 0, 0);
      }
      
      const pngFile = canvas.toDataURL("image/png");
      const downloadLink = document.createElement("a");
      downloadLink.download = `QR_Premis_${selectedId}.png`;
      downloadLink.href = `${pngFile}`;
      downloadLink.click();
    };
    img.src = "data:image/svg+xml;base64," + btoa(svgData);
  };

  // Build the frontend URL where the QR code points to
  const frontendUrl = typeof window !== "undefined" ? window.location.origin : "";
  const qrUrl = selectedId ? `${frontendUrl}/feedback/${selectedId}` : "";

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header */}
      <div className="border-b border-slate-200/40 pb-5">
        <h2 className="text-3xl lg:text-4xl font-black text-slate-900 tracking-tight flex items-center gap-2">
          Penjana Kod QR Premis
          <span className="text-xs font-bold text-teal-600 bg-teal-50 border border-teal-100 px-2.5 py-0.5 rounded-full uppercase tracking-wider">Portal Admin</span>
        </h2>
        <p className="text-slate-400 mt-1.5 text-sm leading-relaxed">
          Pilih mana-mana premis berdaftar di bawah untuk menjana kod QR maklum balas pelanggan secara langsung.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        {/* Main Generator Card */}
        <div className="glass-light rounded-3xl p-6 md:p-8 md:col-span-3 border-t-4 border-t-teal-500 shadow-md shadow-teal-500/5">
          {loading ? (
            <p className="text-slate-500 font-bold text-sm italic">Memuatkan senarai premis...</p>
          ) : premises.length === 0 ? (
            <p className="text-amber-600 bg-amber-50 p-4 rounded-2xl border border-amber-200 font-bold text-sm">
              Sila daftar premis baru di bahagian pendaftaran terlebih dahulu.
            </p>
          ) : (
            <div className="space-y-6">
              <div>
                <label className="block text-xs font-black text-slate-500 uppercase tracking-wider mb-2">
                  Pilih Premis Berdaftar
                </label>
                <select
                  className="w-full px-4 py-3 bg-white/60 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-teal-500/10 focus:border-teal-500 outline-none text-slate-700 font-bold text-sm shadow-sm"
                  value={selectedId}
                  onChange={(e) => setSelectedId(e.target.value)}
                >
                  {premises.map((p) => (
                    <option key={p.id_premis} value={p.id_premis}>
                      {p.nama_premis} (ID: #{p.id_premis})
                    </option>
                  ))}
                </select>
              </div>

              {selectedId && (
                <div className="flex flex-col items-center bg-white/30 border border-slate-100/50 rounded-2xl p-6 shadow-inner">
                  <div ref={qrRef} className="bg-white p-5 rounded-2xl shadow-lg shadow-slate-900/5 border border-slate-100">
                    <QRCodeSVG 
                      value={qrUrl} 
                      size={200}
                      level="H"
                      includeMargin={true}
                    />
                  </div>
                  <div className="w-full mt-5 pt-4 border-t border-slate-200/40 flex flex-col items-center">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5 mb-1.5">
                      <ExternalLink className="w-3.5 h-3.5" />
                      Pautan Dalam QR
                    </p>
                    <p className="text-[11px] font-bold mono-accent text-slate-500 break-all text-center max-w-full bg-slate-50 border border-slate-100 px-3 py-1.5 rounded-lg shadow-inner">
                      {qrUrl}
                    </p>
                  </div>
                  
                  <div className="w-full mt-6">
                    <button
                      onClick={downloadQR}
                      className="w-full h-12 bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 text-white rounded-2xl font-black shadow-lg shadow-teal-500/20 spring-hover flex items-center justify-center gap-2 cursor-pointer active:scale-98"
                    >
                      <Download className="w-5 h-5" />
                      Muat Turun PNG
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Info Column */}
        <div className="md:col-span-2 space-y-5">
          <div className="glass-light rounded-3xl p-6 spring-hover">
            <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-teal-500" />
              Info Penggunaan
            </h3>
            <p className="text-slate-500 text-xs leading-relaxed">
              Kod QR ini dijana dengan format keselamatan <strong className="text-slate-700">Error Correction Level H</strong> (Kapasiti Tinggi). Ini bermaksud kod QR masih boleh diimbas walaupun terdapat kecacatan cetakan atau kekotoran pada permukaan kertas fizikal sehingga 30%.
            </p>
          </div>
          
          <div className="glass-light rounded-3xl p-6 spring-hover">
            <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-3">Tindakan Seterusnya</h3>
            <ul className="space-y-3.5 text-xs font-bold text-slate-500">
              <li className="flex items-center gap-3">
                <span className="w-6 h-6 bg-teal-50 border border-teal-100 rounded-lg text-[10px] font-black text-teal-600 flex items-center justify-center flex-shrink-0">1</span>
                Muat turun fail PNG kod QR.
              </li>
              <li className="flex items-center gap-3">
                <span className="w-6 h-6 bg-teal-50 border border-teal-100 rounded-lg text-[10px] font-black text-teal-600 flex items-center justify-center flex-shrink-0">2</span>
                Edar kod QR kepada pengurus premis.
              </li>
              <li className="flex items-center gap-3">
                <span className="w-6 h-6 bg-teal-50 border border-teal-100 rounded-lg text-[10px] font-black text-teal-600 flex items-center justify-center flex-shrink-0">3</span>
                Pantau jumlah imbasan pada Dashboard.
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
