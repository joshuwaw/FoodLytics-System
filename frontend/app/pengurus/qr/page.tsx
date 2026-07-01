"use client";

import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/lib/auth";
import { QRCodeSVG } from "qrcode.react";
import { QrCode, Download, ExternalLink } from "lucide-react";

export default function PengurusQR() {
  const { user } = useAuth();
  const qrRef = useRef<HTMLDivElement>(null);
  const [qrUrl, setQrUrl] = useState("");

  useEffect(() => {
    if (user?.id_premis && typeof window !== "undefined") {
      setQrUrl(`${window.location.origin}/feedback/${user.id_premis}`);
    }
  }, [user]);

  const downloadQR = () => {
    const svg = qrRef.current?.querySelector("svg");
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();

    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      if (ctx) {
        ctx.fillStyle = "white";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);
      }
      const pngFile = canvas.toDataURL("image/png");
      const a = document.createElement("a");
      a.download = `QR_Premis_${user?.id_premis}.png`;
      a.href = pngFile;
      a.click();
    };
    img.src = "data:image/svg+xml;base64," + btoa(svgData);
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header */}
      <div className="border-b border-slate-200/40 pb-5">
        <h2 className="text-3xl lg:text-4xl font-black text-slate-900 tracking-tight flex items-center gap-2">
          Jana Kod QR Maklum Balas
          <span className="text-xs font-bold text-orange-500 bg-orange-50 border border-orange-100 px-2.5 py-0.5 rounded-full uppercase tracking-wider">Premis</span>
        </h2>
        <p className="text-slate-400 mt-1.5 text-sm leading-relaxed">
          Jana dan muat turun kod QR unik untuk premis anda. Pelanggan boleh mengimbas kod ini untuk menghantar ulasan.
        </p>
      </div>

      {/* Bento Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
        {/* QR Display Card (spans 3) */}
        <div className="glass-light rounded-3xl p-6 md:p-8 lg:col-span-3 border-t-4 border-t-orange-500 shadow-md shadow-orange-500/5">
          {!user?.id_premis ? (
            <div className="p-6 bg-amber-50/60 text-amber-700 rounded-2xl border border-amber-200/40 text-sm font-semibold">
              Tiada premis dipautkan ke akaun anda.
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-lg shadow-orange-500/20">
                  <QrCode className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold">Kod QR untuk</p>
                  <p className="font-black text-slate-900 text-lg tracking-tight">Premis #{user.id_premis}</p>
                </div>
              </div>

              <div className="flex flex-col items-center bg-white/30 border border-slate-100/50 rounded-2xl p-8 shadow-inner">
                <div ref={qrRef} className="bg-white p-5 rounded-2xl shadow-lg shadow-slate-900/5 border border-slate-100">
                  {qrUrl && (
                    <QRCodeSVG
                      value={qrUrl}
                      size={220}
                      level="H"
                      includeMargin={true}
                    />
                  )}
                </div>
              </div>

              <button
                onClick={downloadQR}
                className="w-full h-14 bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 text-white border-none rounded-2xl font-black shadow-lg shadow-orange-500/20 spring-hover flex items-center justify-center gap-2 cursor-pointer active:scale-98"
              >
                <Download className="w-5 h-5" />
                Muat Turun PNG
              </button>
            </div>
          )}
        </div>

        {/* Info Panel (spans 2) */}
        <div className="lg:col-span-2 space-y-5">
          {/* URL Info */}
          <div className="glass-light rounded-3xl p-6 spring-hover">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 bg-blue-50 border border-blue-100 rounded-xl flex items-center justify-center shadow-sm">
                <ExternalLink className="w-4 h-4 text-blue-600" />
              </div>
              <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold">Pautan Imbasan QR</p>
            </div>
            <p className="text-xs font-bold mono-accent text-slate-500 break-all bg-slate-50/60 p-3.5 rounded-xl border border-slate-100/40 shadow-inner">{qrUrl || "—"}</p>
          </div>

          {/* Instructions */}
          <div className="glass-light rounded-3xl p-6 spring-hover">
            <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold mb-4">Langkah Penggunaan</p>
            <ol className="space-y-3.5 text-xs font-bold text-slate-500">
              <li className="flex items-center gap-3">
                <span className="w-6 h-6 bg-orange-50 border border-orange-100 rounded-lg text-[10px] font-black text-orange-500 flex items-center justify-center flex-shrink-0">1</span>
                Muat turun gambar QR di atas.
              </li>
              <li className="flex items-center gap-3">
                <span className="w-6 h-6 bg-orange-50 border border-orange-100 rounded-lg text-[10px] font-black text-orange-500 flex items-center justify-center flex-shrink-0">2</span>
                Cetak dan pamerkan di meja makan premis.
              </li>
              <li className="flex items-center gap-3">
                <span className="w-6 h-6 bg-orange-50 border border-orange-100 rounded-lg text-[10px] font-black text-orange-500 flex items-center justify-center flex-shrink-0">3</span>
                Pelanggan imbas dan beri ulasan ulasan.
              </li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}
