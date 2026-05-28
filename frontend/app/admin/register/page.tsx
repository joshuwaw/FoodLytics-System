"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, TextInput, Button } from "@tremor/react";
import { User, Mail, MapPin, Map, Share2, Lock, Plus, Search, Building2, X, ArrowRight, Phone } from "lucide-react";
export default function RegisterPremise() {
  const router = useRouter();
  const [peranan, setPeranan] = useState("Pengurus");
  const [namaPenuh, setNamaPenuh] = useState("");
  const [emel, setEmel] = useState("");
  const [noTelefon, setNoTelefon] = useState("");
  const [namaPremis, setNamaPremis] = useState("");
  const [alamatPremis, setAlamatPremis] = useState("");
  const [pautanGmaps, setPautanGmaps] = useState("");
  const [medsos, setMedsos] = useState([{ platform: "", url: "" }]);
  const [kodPerniagaan, setKodPerniagaan] = useState("");
  const [kataLaluan, setKataLaluan] = useState("");
  const [sahkanKataLaluan, setSahkanKataLaluan] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const handleAddMedsos = () => setMedsos([...medsos, { platform: "", url: "" }]);

  const handleRemoveMedsos = (index: number) => {
    const newMedsos = medsos.filter((_, i) => i !== index);
    setMedsos(newMedsos.length ? newMedsos : [{ platform: "", url: "" }]);
  };

  const handleUpdateMedsos = (index: number, field: "platform" | "url", value: string) => {
    const newMedsos = [...medsos];
    newMedsos[index][field] = value;
    setMedsos(newMedsos);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    if (kataLaluan !== sahkanKataLaluan) {
      setMessage({ type: "error", text: "Kata laluan tidak sepadan." });
      setLoading(false);
      return;
    }

    try {
      const payload = {
        peranan,
        nama_penuh: namaPenuh,
        emel,
        no_telefon: noTelefon,
        kata_laluan: kataLaluan,
        nama_premis: peranan === "Pengurus" ? namaPremis : undefined,
        alamat_premis: peranan === "Pengurus" ? alamatPremis : undefined,
        pautan_gmaps: peranan === "Pengurus" ? pautanGmaps : undefined,
        pautan_medsos: peranan === "Pengurus" ? medsos.filter(m => m.platform && m.url) : undefined,
        kod_perniagaan: peranan === "Staf Operasi" ? kodPerniagaan : undefined,
      };

      const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";
      const res = await fetch(`${API_URL}/admin/premises`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.detail || "Gagal mendaftar. Sila cuba lagi.");
      }

      setMessage({ type: "success", text: "Pendaftaran berjaya! Mengalihkan ke log masuk..." });
      setTimeout(() => router.push("/login"), 1500);
    } catch (err: any) {
      setMessage({ type: "error", text: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col justify-center items-center font-sans text-slate-900 bg-transparent relative overflow-hidden py-12 px-4 sm:px-6 lg:px-8">
      {/* Background Decor */}
      <div className="absolute -top-40 -right-40 w-96 h-96 bg-orange-100/50 blur-[100px] rounded-full pointer-events-none mix-blend-multiply" />
      <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-blue-50/50 blur-[100px] rounded-full pointer-events-none mix-blend-multiply" />

      <div className="max-w-2xl w-full relative z-10">
        {/* Header Section */}
        <div className="space-y-3 mb-10 text-center">
          <div className="inline-flex items-center justify-center p-3 bg-orange-100/80 rounded-2xl mb-2 shadow-sm border border-orange-200/50">
            <Building2 className="w-6 h-6 text-orange-600" />
          </div>
          <h1 className="text-3xl lg:text-4xl font-black tracking-tight text-slate-900">
            Mula bersama <span className="text-orange-600">FoodLytics</span>
          </h1>
          <p className="text-slate-500 font-medium max-w-sm mx-auto">
            Urus premis dan analisa data pelanggan dengan satu platform pintar.
          </p>
        </div>

        <div className="bg-white/80 backdrop-blur-xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 rounded-[2.5rem] relative overflow-hidden p-8 sm:p-10">
          <form onSubmit={handleSubmit} className="relative space-y-10">
            {/* Role Switcher */}
            <div className="space-y-4">
              <label className="text-[11px] font-black uppercase tracking-[0.2em] text-orange-600 ml-1">
                Pilih Peranan Pengguna
              </label>
              <div className="grid grid-cols-2 gap-3 p-1.5 bg-slate-100/80 rounded-[1.5rem]">
                <button
                  type="button"
                  onClick={() => setPeranan("Pengurus")}
                  className={`py-4 rounded-[1.2rem] transition-all duration-300 font-bold text-sm flex flex-col items-center gap-1 ${peranan === "Pengurus" ? "bg-white text-orange-600 shadow-md scale-[1.02]" : "text-slate-500 hover:bg-white/50"}`}
                >
                  Pengurus
                </button>
                <button
                  type="button"
                  onClick={() => setPeranan("Staf Operasi")}
                  className={`py-4 rounded-[1.2rem] transition-all duration-300 font-bold text-sm flex flex-col items-center gap-1 ${peranan === "Staf Operasi" ? "bg-white text-orange-600 shadow-md scale-[1.02]" : "text-slate-500 hover:bg-white/50"}`}
                >
                  Staf Operasi
                </button>
              </div>
            </div>

            {/* Form Sections */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 ml-1">Nama Penuh</label>
                <TextInput
                  icon={User}
                  placeholder="Joshua Frankie"
                  value={namaPenuh}
                  onChange={(e) => setNamaPenuh(e.target.value)}
                  className="rounded-2xl border-none bg-slate-100/50 hover:bg-slate-100 focus:bg-white transition-all h-12 shadow-sm"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 ml-1">E-mel Peribadi</label>
                <TextInput
                  icon={Mail}
                  placeholder="joshua@ukm.edu.my"
                  value={emel}
                  onChange={(e) => setEmel(e.target.value)}
                  className="rounded-2xl border-none bg-slate-100/50 hover:bg-slate-100 focus:bg-white transition-all h-12 shadow-sm"
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-bold text-slate-700 ml-1">Nombor Telefon</label>
                <TextInput
                  icon={Phone}
                  placeholder="0123456789"
                  value={noTelefon}
                  onChange={(e) => setNoTelefon(e.target.value)}
                  className="rounded-2xl border-none bg-slate-100/50 hover:bg-slate-100 focus:bg-white transition-all h-12 shadow-sm"
                />
              </div>
            </div>

            {/* Contextual Section */}
            {peranan === "Staf Operasi" ? (
              <div className="p-6 rounded-[2rem] bg-orange-600 text-white shadow-xl shadow-orange-200 animate-in fade-in zoom-in-95 duration-500">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-white/20 rounded-2xl">
                    <Building2 className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <label className="block text-xs font-bold uppercase tracking-wider opacity-80 mb-1">Kod Akses Perniagaan</label>
                    <input
                      className="bg-transparent border-b-2 border-white/30 focus:border-white outline-none w-full py-2 font-bold text-lg placeholder:text-white/50 transition-colors"
                      placeholder="Masukkan Kod (e.g. UKM-001)"
                      value={kodPerniagaan}
                      onChange={(e) => setKodPerniagaan(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-6 bg-slate-50 p-6 rounded-[2rem] border border-slate-100 animate-in fade-in slide-in-from-bottom-4 duration-500 hover:shadow-md transition-shadow">
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <ArrowRight className="w-3 h-3" /> Info Premis & Perniagaan
                </h3>

                <div className="space-y-4">
                  <TextInput
                    icon={Search}
                    placeholder="Nama Kafe / Restoran"
                    value={namaPremis}
                    onChange={(e) => setNamaPremis(e.target.value)}
                    className="rounded-2xl border-none bg-white h-12 shadow-sm"
                  />
                  <TextInput
                    icon={MapPin}
                    placeholder="Alamat Lokasi"
                    value={alamatPremis}
                    onChange={(e) => setAlamatPremis(e.target.value)}
                    className="rounded-2xl border-none bg-white h-12 shadow-sm"
                  />
                  <TextInput
                    icon={Map}
                    placeholder="Pautan Google Maps"
                    value={pautanGmaps}
                    onChange={(e) => setPautanGmaps(e.target.value)}
                    className="rounded-2xl border-none bg-white h-12 shadow-sm"
                  />

                  <div className="pt-2">
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-sm font-bold text-slate-700">Pautan Media Sosial</span>
                      <button type="button" onClick={handleAddMedsos} className="p-2 bg-orange-100 text-orange-600 rounded-xl hover:bg-orange-200 transition-colors">
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                    {medsos.map((item, i) => (
                      <div key={i} className="flex gap-2 mb-2 animate-in fade-in slide-in-from-right-2">
                        <TextInput
                          placeholder="IG"
                          value={item.platform}
                          onChange={(e) => handleUpdateMedsos(i, 'platform', e.target.value)}
                          className="w-24 rounded-xl border-none bg-white shadow-sm"
                        />
                        <TextInput
                          icon={Share2}
                          placeholder="URL"
                          value={item.url}
                          onChange={(e) => handleUpdateMedsos(i, 'url', e.target.value)}
                          className="flex-1 rounded-xl border-none bg-white shadow-sm"
                        />
                        {medsos.length > 1 && (
                          <button type="button" onClick={() => handleRemoveMedsos(i)} className="p-2 text-slate-300 hover:text-red-500 transition-colors">
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Security Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 ml-1">Kata Laluan</label>
                <TextInput
                  icon={Lock}
                  type="password"
                  placeholder="••••••••"
                  value={kataLaluan}
                  onChange={(e) => setKataLaluan(e.target.value)}
                  className="rounded-2xl border-none bg-slate-100/50 hover:bg-slate-100 focus:bg-white transition-all h-12 shadow-sm"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 ml-1">Sahkan</label>
                <TextInput
                  icon={Lock}
                  type="password"
                  placeholder="••••••••"
                  value={sahkanKataLaluan}
                  onChange={(e) => setSahkanKataLaluan(e.target.value)}
                  className="rounded-2xl border-none bg-slate-100/50 hover:bg-slate-100 focus:bg-white transition-all h-12 shadow-sm"
                />
              </div>
            </div>

            {/* Submit */}
            <div className="pt-6">
              <Button
                type="submit"
                loading={loading}
                className="w-full h-16 bg-slate-900 hover:bg-black text-white border-none rounded-[1.5rem] text-lg font-black shadow-xl shadow-slate-900/20 transition-all hover:scale-[1.01] active:scale-[0.98]"
              >
                Daftar Sekarang
              </Button>
              {message && (
                <div className={`mt-4 p-4 rounded-2xl text-sm font-bold text-center border overflow-hidden relative animate-in fade-in slide-in-from-top-2 ${message.type === 'success' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
                  {message.text}
                </div>
              )}
            </div>
          </form>
        </div>

        <p className="mt-8 text-center text-slate-500 font-medium">
          Dah ada akaun? <a href="#" className="text-slate-900 font-bold hover:underline">Log masuk di sini</a>
        </p>
      </div>
    </div>
  );
}