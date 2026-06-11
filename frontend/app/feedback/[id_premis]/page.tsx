"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Card, Button, Divider } from "@tremor/react";
import { Star } from "lucide-react";

export default function FeedbackPortal() {
  const params = useParams();
  const id_premis = params?.id_premis as string;

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

  const [cafeName, setCafeName] = useState<string>("Memuatkan...");
  const [ratings, setRatings] = useState<{ [key: string]: number }>({
    makanan: 5,
    layanan: 5,
    suasana: 5,
  });
  const [hoveredRatings, setHoveredRatings] = useState<{ [key: string]: number }>({
    makanan: 0,
    layanan: 0,
    suasana: 0,
  });
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const categories = [
    { key: "makanan", label: "Kualiti Makanan" },
    { key: "layanan", label: "Layanan Staf" },
    { key: "suasana", label: "Suasana Premis" },
  ];

  useEffect(() => {
    if (!id_premis) return;
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

    fetch(`${API_URL}/customer/premises/${id_premis}`, { signal: controller.signal })
      .then((res) => {
        clearTimeout(timeoutId);
        if (res.status === 404) throw new Error("Premis tidak dijumpai");
        if (!res.ok) throw new Error("Ralat pelayan");
        return res.json();
      })
      .then((data) => setCafeName(data.nama_premis))
      .catch((err) => {
        if (err.name === 'AbortError' || err.message === 'Failed to fetch') {
          setCafeName("Ralat Rangkaian (Pelayan Tidak Boleh Diakses)");
        } else if (err.message === "Premis tidak dijumpai") {
          setCafeName("Premis Tidak Dikenali");
        } else {
          setCafeName("Ralat: " + err.message);
        }
      });
      
    return () => clearTimeout(timeoutId);
  }, [id_premis, API_URL]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim()) {
      setStatus("error");
      setErrorMsg("Sila layangkan sedikit ulasan teks.");
      return;
    }

    setLoading(true);
    setStatus("idle");

    // Calculate overall rating for the backend (average of 3 categories)
    const overallRating = Math.round(
      Object.values(ratings).reduce((a, b) => a + b, 0) / categories.length
    );

    try {
      const res = await fetch(`${API_URL}/customer/feedback`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id_premis: parseInt(id_premis),
          bilangan_bintang: overallRating,
          rating_makanan: ratings.makanan,
          rating_layanan: ratings.layanan,
          rating_suasana: ratings.suasana,
          ulasan_teks: comment,
          sumber_platform: "Portal QR"
        }),
      });

      if (!res.ok) throw new Error("Gagal menghantar maklum balas.");
      setStatus("success");
    } catch (err: any) {
      setStatus("error");
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (status === "success") {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50 dark:bg-zinc-950">
        <Card className="max-w-md w-full text-center space-y-4 ring-0 border border-emerald-100 dark:border-emerald-900/50 bg-emerald-50/50 dark:bg-emerald-950/20 backdrop-blur-xl animate-in zoom-in-95 duration-500">
          <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-4">
            <Star className="w-8 h-8 fill-current" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Terima Kasih!</h2>
          <p className="text-gray-600 dark:text-zinc-400">
            Maklum balas anda untuk <strong>{cafeName}</strong> telah berjaya direkodkan. Penghargaan atas masa yang diluangkan.
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50 dark:bg-zinc-950 relative overflow-hidden">
      {/* Decorative blobs */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-teal-200 dark:bg-teal-900/30 rounded-full blur-3xl opacity-50 mix-blend-multiply" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-200 dark:bg-blue-900/30 rounded-full blur-3xl opacity-50 mix-blend-multiply" />

      <Card className="max-w-md w-full relative z-10 p-8 ring-0 shadow-xl border border-white/40 dark:border-zinc-800 bg-white/70 dark:bg-zinc-900/80 backdrop-blur-2xl rounded-3xl animate-in slide-in-from-bottom-8 duration-700">
        <div className="text-center mb-8">
          <span className="inline-block px-3 py-1 bg-teal-100 dark:bg-teal-900/50 text-teal-700 dark:text-teal-400 text-xs font-semibold rounded-full mb-3 uppercase tracking-wider">
            Portal Maklum Balas
          </span>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">
            {cafeName}
          </h1>
          <p className="text-sm text-gray-500 dark:text-zinc-400 mt-2">
            Sila kongsikan pengalaman anda untuk membantu kami bertambah baik.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-6">
            {categories.map((cat) => (
              <div key={cat.key} className="flex flex-col items-center">
                <label className="text-sm font-bold text-gray-700 dark:text-zinc-300 mb-3 uppercase tracking-wide">
                  {cat.label}
                </label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onMouseEnter={() => setHoveredRatings({ ...hoveredRatings, [cat.key]: star })}
                      onMouseLeave={() => setHoveredRatings({ ...hoveredRatings, [cat.key]: 0 })}
                      onClick={() => setRatings({ ...ratings, [cat.key]: star })}
                      className="transition-transform hover:scale-110 focus:outline-none"
                    >
                      <Star
                        className={`w-10 h-10 ${
                          star <= (hoveredRatings[cat.key] || ratings[cat.key])
                            ? "fill-amber-400 text-amber-500 hover:fill-amber-300"
                            : "text-gray-300 dark:text-zinc-700 hover:text-gray-400"
                        } transition-colors duration-200`}
                      />
                    </button>
                  ))}
                </div>
                <div className="text-[10px] font-bold text-amber-500 mt-2 uppercase tracking-widest opacity-80">
                  { (hoveredRatings[cat.key] || ratings[cat.key]) === 1 && "Sangat Mengecewakan" }
                  { (hoveredRatings[cat.key] || ratings[cat.key]) === 2 && "Kurang Memuaskan" }
                  { (hoveredRatings[cat.key] || ratings[cat.key]) === 3 && "Sederhana" }
                  { (hoveredRatings[cat.key] || ratings[cat.key]) === 4 && "Memuaskan" }
                  { (hoveredRatings[cat.key] || ratings[cat.key]) === 5 && "Sangat Hebat" }
                </div>
              </div>
            ))}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-2">
              Ulasan atau Cadangan
            </label>
            <textarea
              className="w-full rounded-xl border border-gray-200 bg-gray-50/50 px-4 py-3 text-sm focus:border-teal-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 dark:border-zinc-800 dark:bg-zinc-950/50 dark:text-zinc-300 dark:focus:bg-zinc-900 transition-all duration-200 resize-none shadow-inner"
              placeholder="Contoh: Makanan sangat sedap, tetapi layanan boleh dipercepatkan..."
              rows={4}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
            />
          </div>

          {status === "error" && (
            <div className="p-3 text-sm text-red-600 bg-red-50 dark:bg-red-950/50 dark:text-red-400 rounded-lg border border-red-100 dark:border-red-900">
              {errorMsg}
            </div>
          )}

          <Divider />

          <Button 
            type="submit" 
            loading={loading} 
            className="w-full bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 border-none rounded-xl py-3 shadow-lg shadow-teal-500/25 transition-all active:scale-[0.98]"
          >
            Hantar Maklum Balas
          </Button>
        </form>
      </Card>
    </div>
  );
}
