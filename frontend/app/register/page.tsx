"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { User, Mail, MapPin, Map, Share2, Lock, Plus, Search, Building2, X, ArrowRight, Phone, Sparkles, ShieldCheck, Utensils, Activity, Eye, EyeOff } from "lucide-react";

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
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
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
      if (!res.ok) throw new Error(data.detail || "Gagal mendaftar. Sila cuba lagi.");

      if (peranan === "Staf Operasi") {
        setMessage({ 
          type: "success", 
          text: "Pendaftaran berjaya! Akaun anda telah didaftarkan dalam status 'Menunggu Kelulusan'. Sila hubungi pengurus cawangan anda untuk mengaktifkan akaun sebelum log masuk." 
        });
        setTimeout(() => router.push("/login"), 5000);
      } else {
        setMessage({ type: "success", text: "Pendaftaran berjaya! Mengalihkan ke log masuk..." });
        setTimeout(() => router.push("/login"), 1500);
      }
    } catch (err: any) {
      setMessage({ type: "error", text: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex font-sans bg-[#030712] text-slate-100 overflow-hidden relative">
      {/* Global Background Glows */}
      <div className="absolute top-0 left-1/4 w-[800px] h-[800px] bg-orange-500/20 rounded-full blur-[120px] mix-blend-screen pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-indigo-600/20 rounded-full blur-[120px] mix-blend-screen pointer-events-none" />
      
      {/* Decorative Grid */}
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay pointer-events-none" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff0a_1px,transparent_1px),linear-gradient(to_bottom,#ffffff0a_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none" />

      {/* LEFT PANEL: Enterprise Branding */}
      <div className="hidden lg:flex w-[40%] relative flex-col justify-between pt-16 px-16 pb-10 xl:pt-20 xl:px-20 xl:pb-12 border-r border-white/5 z-10">
        
        {/* Top Header */}
        <div className="relative flex items-center gap-4 group cursor-pointer">
          <div className="p-3 bg-gradient-to-br from-orange-400 to-orange-600 rounded-2xl shadow-[0_0_40px_rgba(249,115,22,0.4)] group-hover:shadow-[0_0_60px_rgba(249,115,22,0.6)] transition-all duration-500">
            <Utensils className="w-8 h-8 text-white" />
          </div>
          <span className="text-3xl font-black tracking-tight text-white drop-shadow-md">
            Food<span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-orange-600">Lytics</span>
          </span>
        </div>

        {/* Content Showcase */}
        <div className="relative space-y-10 max-w-xl my-auto pt-2">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold bg-white/5 text-orange-300 border border-orange-500/30 backdrop-blur-md shadow-[0_0_20px_rgba(249,115,22,0.15)]">
            <Sparkles className="w-4 h-4 text-orange-400" />
            <span className="tracking-wide uppercase">Join The Network</span>
          </div>
          
          <div className="space-y-6">
            <h2 className="text-5xl xl:text-6xl font-black leading-[1.1] tracking-tight text-white drop-shadow-lg">
              Mulakan <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-amber-300">Evolusi</span><br/> Operasi Premis.
            </h2>
            <p className="text-slate-300 leading-relaxed text-lg font-medium max-w-lg drop-shadow">
              Daftar kafe atau cawangan anda, tambah staf operasi, dan pautkan sistem maklum balas pintar ini ke dalam aliran kerja harian anda secara nyata.
            </p>
          </div>

          {/* Bullet Points */}
          <div className="grid grid-cols-2 gap-6 pt-8 border-t border-white/10">
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 p-5 rounded-2xl hover:bg-white/10 transition-colors">
              <ShieldCheck className="w-8 h-8 text-orange-400 mb-4" />
              <h4 className="font-bold text-base text-white mb-2">SOP Automatik Pintar</h4>
              <p className="text-sm text-slate-400 leading-relaxed">Janji kelulusan tindakan pantas pengurus ke staf.</p>
            </div>
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 p-5 rounded-2xl hover:bg-white/10 transition-colors">
              <Activity className="w-8 h-8 text-orange-400 mb-4" />
              <h4 className="font-bold text-base text-white mb-2">Analitik Sentimen Proaktif</h4>
              <p className="text-sm text-slate-400 leading-relaxed">Pantau Google Review, media sosial & kod QR dari satu hab berpusat.</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="relative text-sm text-slate-500 font-semibold tracking-wide">
          © {new Date().getFullYear()} FoodLytics System. Built for Enterprise.
        </div>
      </div>

      {/* RIGHT PANEL: Registration Form */}
      <div className="w-full lg:w-[60%] flex items-center justify-center p-6 sm:p-12 relative z-10 overflow-y-auto">
        <div className="w-full max-w-xl space-y-10 relative">
          
          {/* Mobile Header */}
          <div className="text-center space-y-4 lg:hidden">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-orange-400 to-orange-600 rounded-2xl shadow-[0_0_40px_rgba(249,115,22,0.4)] mx-auto">
              <Utensils className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-4xl font-black text-white tracking-tight drop-shadow-md">
              Akaun Baru
            </h1>
            <p className="text-slate-300 font-medium text-base">
              Lengkapkan pendaftaran korporat anda.
            </p>
          </div>

          <div className="hidden lg:block space-y-3">
             <h1 className="text-4xl font-black text-white tracking-tight drop-shadow-md">
              Pendaftaran Akaun
            </h1>
            <p className="text-slate-300 font-medium text-base">
              Sila pilih peranan dan isikan butiran untuk mula mengakses ekosistem.
            </p>
          </div>

          {/* Form Card */}
          <div className="bg-white/10 backdrop-blur-2xl border border-white/20 rounded-[2rem] p-6 sm:p-10 shadow-[0_8px_32px_rgba(0,0,0,0.3)] relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent pointer-events-none" />

            <form onSubmit={handleSubmit} className="relative space-y-8 z-10">
              
              {/* Role Switcher */}
              <div className="space-y-3">
                <label className="text-xs font-black uppercase tracking-widest text-slate-300 ml-1 drop-shadow-sm">Pilih Peranan</label>
                <div className="grid grid-cols-2 gap-3 p-2 bg-black/40 border border-white/10 rounded-[1.5rem]">
                  <button
                    type="button"
                    onClick={() => setPeranan("Pengurus")}
                    className={`py-4 rounded-xl transition-all duration-300 font-bold text-sm ${peranan === "Pengurus" ? "bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-[0_0_15px_rgba(249,115,22,0.4)] scale-[1.02]" : "text-slate-400 hover:text-white hover:bg-white/5"}`}
                  >
                    Pengurus Premis
                  </button>
                  <button
                    type="button"
                    onClick={() => setPeranan("Staf Operasi")}
                    className={`py-4 rounded-xl transition-all duration-300 font-bold text-sm ${peranan === "Staf Operasi" ? "bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-[0_0_15px_rgba(249,115,22,0.4)] scale-[1.02]" : "text-slate-400 hover:text-white hover:bg-white/5"}`}
                  >
                    Staf Operasi
                  </button>
                </div>
              </div>

              {/* Basic Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="space-y-2.5">
                  <label className="text-xs font-black uppercase tracking-widest text-slate-300 ml-1 drop-shadow-sm">Nama Penuh</label>
                  <div className="relative group">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-orange-400 transition-colors" />
                    <input
                      type="text"
                      placeholder="Joshua Frankie"
                      value={namaPenuh}
                      onChange={(e) => setNamaPenuh(e.target.value)}
                      required
                      className="w-full pl-12 pr-4 py-3.5 bg-black/40 border border-white/10 rounded-2xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 focus:bg-black/60 transition-all text-sm font-semibold shadow-inner"
                    />
                  </div>
                </div>

                <div className="space-y-2.5">
                  <label className="text-xs font-black uppercase tracking-widest text-slate-300 ml-1 drop-shadow-sm">E-mel Peribadi</label>
                  <div className="relative group">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-orange-400 transition-colors" />
                    <input
                      type="email"
                      placeholder="nama@syarikat.com"
                      value={emel}
                      onChange={(e) => setEmel(e.target.value)}
                      required
                      className="w-full pl-12 pr-4 py-3.5 bg-black/40 border border-white/10 rounded-2xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 focus:bg-black/60 transition-all text-sm font-semibold shadow-inner"
                    />
                  </div>
                </div>

                <div className="space-y-2.5 sm:col-span-2">
                  <label className="text-xs font-black uppercase tracking-widest text-slate-300 ml-1 drop-shadow-sm">Nombor Telefon</label>
                  <div className="relative group">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-orange-400 transition-colors" />
                    <input
                      type="text"
                      placeholder="0123456789"
                      value={noTelefon}
                      onChange={(e) => setNoTelefon(e.target.value)}
                      required
                      className="w-full pl-12 pr-4 py-3.5 bg-black/40 border border-white/10 rounded-2xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 focus:bg-black/60 transition-all text-sm font-semibold shadow-inner"
                    />
                  </div>
                </div>
              </div>

              {/* Contextual Section */}
              {peranan === "Staf Operasi" ? (
                <div className="p-6 rounded-2xl bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-[0_0_30px_rgba(249,115,22,0.3)] animate-in fade-in zoom-in-95 duration-500 relative overflow-hidden">
                  <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay" />
                  <div className="flex items-center gap-5 relative z-10">
                    <div className="p-4 bg-white/20 rounded-xl backdrop-blur-md">
                      <Building2 className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <label className="block text-[11px] font-black uppercase tracking-wider opacity-90 mb-1.5 drop-shadow-md">Kod Akses Perniagaan</label>
                      <input
                        className="bg-transparent border-b-2 border-white/30 focus:border-white outline-none w-full py-2 font-black text-xl tracking-widest placeholder:text-white/50 transition-colors drop-shadow"
                        placeholder="e.g. UKM-001"
                        value={kodPerniagaan}
                        onChange={(e) => setKodPerniagaan(e.target.value)}
                        required={peranan === "Staf Operasi"}
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-5 bg-black/20 p-6 rounded-[2rem] border border-white/10 animate-in fade-in duration-500">
                  <h3 className="text-xs font-black text-orange-400 uppercase tracking-widest flex items-center gap-2 drop-shadow-sm">
                    <ArrowRight className="w-4 h-4" /> Info Premis & Perniagaan
                  </h3>

                  <div className="space-y-4">
                    <div className="relative group">
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-orange-400 transition-colors" />
                      <input
                        type="text"
                        placeholder="Nama Kafe / Restoran"
                        value={namaPremis}
                        onChange={(e) => setNamaPremis(e.target.value)}
                        required={peranan === "Pengurus"}
                        className="w-full pl-12 pr-4 py-3.5 bg-black/40 border border-white/10 rounded-2xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 transition-all text-sm font-semibold shadow-inner"
                      />
                    </div>

                    <div className="relative group">
                      <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-orange-400 transition-colors" />
                      <input
                        type="text"
                        placeholder="Alamat Lokasi Kafe"
                        value={alamatPremis}
                        onChange={(e) => setAlamatPremis(e.target.value)}
                        required={peranan === "Pengurus"}
                        className="w-full pl-12 pr-4 py-3.5 bg-black/40 border border-white/10 rounded-2xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 transition-all text-sm font-semibold shadow-inner"
                      />
                    </div>

                    <div className="relative group">
                      <Map className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-orange-400 transition-colors" />
                      <input
                        type="text"
                        placeholder="Pautan Google Maps"
                        value={pautanGmaps}
                        onChange={(e) => setPautanGmaps(e.target.value)}
                        className="w-full pl-12 pr-4 py-3.5 bg-black/40 border border-white/10 rounded-2xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 transition-all text-sm font-semibold shadow-inner"
                      />
                    </div>

                    <div className="pt-4 border-t border-white/10">
                      <div className="flex justify-between items-center mb-4">
                        <span className="text-xs font-black uppercase text-slate-300 tracking-widest drop-shadow-sm">Integrasi Media Sosial</span>
                        <button
                          type="button"
                          onClick={handleAddMedsos}
                          className="px-3 py-1.5 bg-white/5 border border-white/10 text-orange-400 rounded-xl hover:bg-white/10 hover:border-orange-500/50 transition-all font-bold text-xs flex items-center gap-1.5 shadow-sm"
                        >
                          <Plus className="w-3.5 h-3.5" /> Tambah Pautan
                        </button>
                      </div>

                      {medsos.map((item, i) => (
                        <div key={i} className="flex gap-3 mb-3 animate-in fade-in slide-in-from-right-2">
                          <input
                            type="text"
                            placeholder="IG / FB"
                            value={item.platform}
                            onChange={(e) => handleUpdateMedsos(i, 'platform', e.target.value)}
                            className="w-24 px-4 py-3 bg-black/40 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-500/50 text-sm font-bold shadow-inner text-center"
                          />
                          <div className="relative flex-1 group">
                            <Share2 className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-orange-400 transition-colors" />
                            <input
                              type="text"
                              placeholder="Pautan URL Rasmi"
                              value={item.url}
                              onChange={(e) => handleUpdateMedsos(i, 'url', e.target.value)}
                              className="w-full pl-11 pr-4 py-3 bg-black/40 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-500/50 text-sm font-semibold shadow-inner"
                            />
                          </div>
                          {medsos.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveMedsos(i)}
                              className="p-3 bg-white/5 border border-white/10 rounded-xl text-slate-400 hover:bg-red-500/20 hover:text-red-400 hover:border-red-500/50 transition-all shrink-0 shadow-sm"
                            >
                              <X className="w-5 h-5" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Password Section */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-2">
                <div className="space-y-2.5">
                  <label className="text-xs font-black uppercase tracking-widest text-slate-300 ml-1 drop-shadow-sm">Kata Laluan</label>
                  <div className="relative group">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-orange-400 transition-colors" />
                    <input
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={kataLaluan}
                      onChange={(e) => setKataLaluan(e.target.value)}
                      required
                      className="w-full pl-12 pr-12 py-3.5 bg-black/40 border border-white/10 rounded-2xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 focus:bg-black/60 transition-all text-base font-semibold shadow-inner tracking-widest"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors cursor-pointer focus:outline-none"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-2.5">
                  <label className="text-xs font-black uppercase tracking-widest text-slate-300 ml-1 drop-shadow-sm">Sahkan Laluan</label>
                  <div className="relative group">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-orange-400 transition-colors" />
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={sahkanKataLaluan}
                      onChange={(e) => setSahkanKataLaluan(e.target.value)}
                      required
                      className="w-full pl-12 pr-12 py-3.5 bg-black/40 border border-white/10 rounded-2xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 focus:bg-black/60 transition-all text-base font-semibold shadow-inner tracking-widest"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors cursor-pointer focus:outline-none"
                    >
                      {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>
              </div>

              {message && (
                <div className={`p-4 rounded-2xl text-sm font-bold text-center border backdrop-blur-md animate-in fade-in slide-in-from-top-2 ${message.type === 'success' ? 'bg-emerald-500/20 text-emerald-200 border-emerald-500/50' : 'bg-red-500/20 text-red-200 border-red-500/50'}`}>
                  {message.text}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-400 hover:to-orange-500 text-white rounded-2xl text-base font-black shadow-[0_0_20px_rgba(249,115,22,0.4)] hover:shadow-[0_0_30px_rgba(249,115,22,0.6)] transition-all active:scale-[0.98] flex items-center justify-center gap-3 cursor-pointer disabled:opacity-50 disabled:active:scale-100 mt-4"
              >
                {loading ? (
                  <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    Daftar Akaun Baru <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </form>
          </div>

          <p className="text-center text-base text-slate-400 font-medium">
            Dah ada akaun?{" "}
            <a href="/login" className="text-orange-400 font-black hover:text-orange-300 hover:underline transition-colors drop-shadow">
              Log masuk di sini
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
