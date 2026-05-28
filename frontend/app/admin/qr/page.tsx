"use client";

import { useState, useEffect, useRef } from "react";
import { Card, Button, Divider } from "@tremor/react";
import { QRCodeSVG } from "qrcode.react";

interface Premise {
  id_premis: number;
  nama_premis: string;
}

export default function GenerateQR() {
  const [premises, setPremises] = useState<Premise[]>([]);
  const [selectedId, setSelectedId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const qrRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/premises`)
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
  }, []);

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
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
      <h2 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white mb-6">
        Pengurusan Kod QR
      </h2>

      <Card className="max-w-xl ring-0 shadow-sm border border-gray-200 dark:border-zinc-800 bg-white/50 dark:bg-zinc-900/50 backdrop-blur-xl rounded-2xl">
        {loading ? (
          <p className="text-gray-500">Memuatkan senarai premis...</p>
        ) : premises.length === 0 ? (
          <p className="text-amber-600 bg-amber-50 p-4 rounded-lg border border-amber-200">
            Sila daftar premis baru di bahagian pendaftaran terlebih dahulu.
          </p>
        ) : (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-2">
                Pilih Premis
              </label>
              <select
                className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300"
                value={selectedId}
                onChange={(e) => setSelectedId(e.target.value)}
              >
                {premises.map((p) => (
                  <option key={p.id_premis} value={p.id_premis}>
                    {p.nama_premis}
                  </option>
                ))}
              </select>
            </div>

            {selectedId && (
              <div className="flex flex-col items-center border border-gray-100 dark:border-zinc-800 p-8 rounded-xl bg-gray-50/50 dark:bg-zinc-900">
                <div ref={qrRef} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                  <QRCodeSVG 
                    value={qrUrl} 
                    size={200}
                    level="H"
                    includeMargin={true}
                  />
                </div>
                <p className="text-xs text-gray-400 mt-4 break-all text-center">
                  Pautan dalam QR: {qrUrl}
                </p>

                <Divider />
                
                <Button onClick={downloadQR} className="w-full sm:w-auto bg-slate-900 hover:bg-slate-800 border-none">
                  Muat Turun PNG
                </Button>
              </div>
            )}
          </div>
        )}
      </Card>
    </div>
  );
}
