"use client";


import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/lib/auth";
import { UserCircle, Store, Save, Loader2, Building, Phone, Mail, User, Camera, ShieldCheck, KeyRound } from "lucide-react";
import Cropper from "react-easy-crop";
import useSWR from "swr";
import { toast } from "sonner";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

export default function PengurusProfilPage() {
  const { user } = useAuth();
  const [saving, setSaving] = useState(false);
  const [profilePic, setProfilePic] = useState<string | null>(null);
  
  // Cropper State
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [imageToCrop, setImageToCrop] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);
  const [formData, setFormData] = useState({
    nama: "",
    emel: "",
    no_telefon: "",
    nama_premis: "",
    alamat_premis: ""
  });

  // Password change states
  const [passwords, setPasswords] = useState({
    kata_laluan_lama: "",
    kata_laluan_baru: "",
    sahkan_kata_laluan: ""
  });
  const [updatingPassword, setUpdatingPassword] = useState(false);

  // Co-manager management states
  const [newManager, setNewManager] = useState({
    nama_penuh: "",
    emel: "",
    no_telefon: "",
    kata_laluan: ""
  });
  const [addingManager, setAddingManager] = useState(false);

  // SWR Fetcher
  const fetcher = (url: string) => fetch(url).then((res) => res.json());

  const { data: profile, isLoading, mutate } = useSWR(
    user?.id_pengguna ? `${API_URL}/admin/profile/${user.id_pengguna}` : null,
    fetcher,
    {
      onSuccess: (data) => {
        setFormData({
          nama: data.nama || "",
          emel: data.emel || "",
          no_telefon: data.no_telefon || "",
          nama_premis: data.premis?.nama_premis || "",
          alamat_premis: data.premis?.alamat_premis || ""
        });
      }
    }
  );

  const { data: managers, mutate: mutateManagers } = useSWR(
    profile?.premis?.id_premis ? `${API_URL}/admin/premises/${profile.premis.id_premis}/managers` : null,
    fetcher
  );

  useEffect(() => {
    if (user?.id_pengguna) {
      const savedPic = localStorage.getItem(`profilePic_${user.id_pengguna}`);
      if (savedPic) {
        setProfilePic(savedPic);
      } else {
        setProfilePic("https://images.unsplash.com/photo-1560250097-0b93528c311a?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80");
      }
    }
  }, [user]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = {
        nama: formData.nama,
        emel: formData.emel,
        no_telefon: formData.no_telefon,
        premis: {
          id_premis: profile?.premis?.id_premis,
          nama_premis: formData.nama_premis,
          alamat_premis: formData.alamat_premis
        }
      };
      
      const res = await fetch(`${API_URL}/admin/profile/${user?.id_pengguna}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      
      if (res.ok) {
        if (profilePic && user?.id_pengguna) {
          localStorage.setItem(`profilePic_${user.id_pengguna}`, profilePic);
        }
        mutate(); // Revalidate SWR data
        toast.success("Profil berjaya dikemas kini!");
      } else {
        toast.error("Gagal mengemas kini profil.");
      }
    } catch (error) {
      console.error("Gagal simpan:", error);
      toast.error("Ralat rangkaian.");
    } finally {
      setSaving(false);
    }
  };

  const handleAddManager = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile?.premis?.id_premis) return;
    
    setAddingManager(true);
    try {
      const res = await fetch(`${API_URL}/admin/premises/add-manager`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id_premis: profile.premis.id_premis,
          ...newManager
        })
      });
      const data = await res.json();
      if (res.ok) {
        toast.success("Rakan pengurus berjaya didaftarkan!");
        setNewManager({ nama_penuh: "", emel: "", no_telefon: "", kata_laluan: "" });
        mutateManagers(); // Refresh managers list
      } else {
        toast.error(data.detail || "Gagal menambah pengurus.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Ralat rangkaian.");
    } finally {
      setAddingManager(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwords.kata_laluan_lama || !passwords.kata_laluan_baru || !passwords.sahkan_kata_laluan) {
      toast.error("Sila isi semua ruangan kata laluan.");
      return;
    }
    if (passwords.kata_laluan_baru !== passwords.sahkan_kata_laluan) {
      toast.error("Sahan kata laluan baharu tidak sepadan.");
      return;
    }
    
    setUpdatingPassword(true);
    try {
      const res = await fetch(`${API_URL}/admin/change-password`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id_pengguna: user?.id_pengguna,
          kata_laluan_lama: passwords.kata_laluan_lama,
          kata_laluan_baru: passwords.kata_laluan_baru
        })
      });
      const data = await res.json();
      if (res.ok) {
        toast.success("Kata laluan berjaya dikemaskini!");
        setPasswords({ kata_laluan_lama: "", kata_laluan_baru: "", sahkan_kata_laluan: "" });
      } else {
        toast.error(data.detail || "Gagal mengemas kini kata laluan.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Ralat rangkaian.");
    } finally {
      setUpdatingPassword(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImageToCrop(reader.result as string);
        setCropModalOpen(true);
      };
      reader.readAsDataURL(file);
    }
    e.target.value = '';
  };

  const handleCropComplete = useCallback((croppedArea: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const getCroppedImg = async (imageSrc: string, pixelCrop: any) => {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = (error) => reject(error);
      img.src = imageSrc;
    });
    
    const canvas = document.createElement('canvas');
    canvas.width = pixelCrop.width;
    canvas.height = pixelCrop.height;
    const ctx = canvas.getContext('2d');
    
    if (ctx) {
      ctx.drawImage(
        image,
        pixelCrop.x,
        pixelCrop.y,
        pixelCrop.width,
        pixelCrop.height,
        0,
        0,
        pixelCrop.width,
        pixelCrop.height
      );
    }
    
    return canvas.toDataURL('image/jpeg');
  };

  const saveCrop = async () => {
    try {
      if (imageToCrop && croppedAreaPixels) {
        const croppedImage = await getCroppedImg(imageToCrop, croppedAreaPixels);
        setProfilePic(croppedImage);
        
        if (user?.id_pengguna) {
          localStorage.setItem(`profilePic_${user.id_pengguna}`, croppedImage);
        }
      }
      setCropModalOpen(false);
    } catch (e) {
      console.error(e);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col gap-8 animate-in fade-in max-w-5xl mx-auto pb-12">
        <div className="h-32 w-full bg-slate-100 animate-pulse rounded-[2.5rem]"></div>
        <div className="grid md:grid-cols-2 gap-8">
          <div className="h-64 bg-slate-100 animate-pulse rounded-[2rem]"></div>
          <div className="h-64 bg-slate-100 animate-pulse rounded-[2rem]"></div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 max-w-5xl mx-auto pb-12">
        
        {/* Enterprise Header (Banner & Avatar) */}
      <div className="glass-light rounded-[2.5rem] border border-white/50 overflow-hidden mb-8 relative shadow-xl shadow-slate-200/5">
        <div className="h-32 md:h-36 bg-gradient-to-r from-slate-950/80 via-slate-900/80 to-slate-950/80 w-full relative overflow-hidden border-b border-white/10 backdrop-blur-md">
          {/* Subtle Abstract Pattern/Gradient */}
          <div className="absolute inset-0 opacity-40 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-orange-500/20 via-transparent to-transparent"></div>
        </div>
        
        <div className="px-8 pb-8 pt-0 md:px-10 md:pb-10 relative flex flex-col md:flex-row justify-between items-center md:items-end gap-6">
          <div className="flex flex-col md:flex-row items-center md:items-end gap-6 text-center md:text-left">
            <div className="relative group cursor-pointer -mt-16 md:-mt-20">
              <label htmlFor="avatar-upload" className="block cursor-pointer">
                <div className="w-32 h-32 md:w-40 md:h-40 bg-white/60 backdrop-blur-md border border-white rounded-[2.2rem] p-2 shadow-2xl rotate-3 hover:rotate-0 transition-transform duration-300">
                  <div className="w-full h-full bg-slate-100/50 backdrop-blur-sm border border-white/20 rounded-[1.8rem] flex items-center justify-center overflow-hidden relative">
                    {profilePic ? (
                      <img src={profilePic} alt="Profile" className="w-full h-full object-cover" />
                    ) : formData.nama ? (
                      <span className="text-5xl md:text-6xl font-black text-slate-400 uppercase">
                        {formData.nama.charAt(0)}
                      </span>
                    ) : (
                      <UserCircle className="w-16 h-16 text-slate-350" />
                    )}
                    {/* Hover Overlay */}
                    <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center backdrop-blur-sm">
                      <Camera className="w-8 h-8 text-white mb-1" />
                      <span className="text-[10px] text-white font-bold uppercase tracking-widest">Tukar Gambar</span>
                    </div>
                  </div>
                </div>
              </label>
              <input 
                id="avatar-upload" 
                type="file" 
                accept="image/*" 
                className="hidden" 
                onChange={handleImageUpload}
              />
            </div>
            
            <div className="pb-2 md:pb-6">
              <h1 className="text-3xl font-black text-slate-900 tracking-tight">{formData.nama || "Profil Saya"}</h1>
              <p className="text-slate-500 font-bold flex items-center gap-2 justify-center md:justify-start mt-1.5 text-sm">
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                {user?.peranan === 'Staf Operasi' ? 'Staf Operasi' : 'Pengurus'} &bull; {formData.nama_premis || "Tiada Cawangan"}
              </p>
            </div>
          </div>
          
          <div className="pb-2 md:pb-6 w-full md:w-auto">
            <button 
              onClick={handleSave}
              disabled={saving}
              className="w-full md:w-auto bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 text-white px-8 py-3.5 rounded-2xl font-black flex items-center justify-center gap-2 transition-all disabled:opacity-70 shadow-lg shadow-orange-500/20 hover:shadow-orange-500/40 hover:-translate-y-0.5 active:scale-98 cursor-pointer"
            >
              {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
              {saving ? "Menyimpan..." : "Simpan Perubahan"}
            </button>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Personal Details */}
        <div className="glass-light rounded-[2.5rem] border border-white/50 p-8 shadow-xl shadow-slate-200/5 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/5 rounded-bl-[100px] -z-10" />
          
          <h2 className="text-xl font-black text-slate-800 flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-orange-50 border border-orange-100/50 flex items-center justify-center shadow-sm">
              <UserCircle className="w-5 h-5 text-orange-500" />
            </div>
            Maklumat Peribadi
          </h2>
          
          <div className="space-y-6">
            <div>
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-2"><User className="w-4 h-4" /> Nama Penuh</label>
              <input 
                type="text" 
                value={formData.nama}
                onChange={(e) => setFormData({...formData, nama: e.target.value})}
                className="w-full px-5 py-4 bg-white/50 border border-slate-200/50 rounded-2xl focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 outline-none transition-all text-slate-800 font-semibold shadow-inner"
                placeholder="Masukkan nama penuh"
              />
            </div>
            
            <div>
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-2"><Mail className="w-4 h-4" /> E-mel</label>
              <input 
                type="email" 
                value={formData.emel}
                onChange={(e) => setFormData({...formData, emel: e.target.value})}
                className="w-full px-5 py-4 bg-white/50 border border-slate-200/50 rounded-2xl focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 outline-none transition-all text-slate-800 font-semibold shadow-inner"
                placeholder="e.g. john@example.com"
              />
            </div>
            
            <div>
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-2"><Phone className="w-4 h-4" /> No. Telefon</label>
              <input 
                type="text" 
                value={formData.no_telefon}
                onChange={(e) => setFormData({...formData, no_telefon: e.target.value})}
                className="w-full px-5 py-4 bg-white/50 border border-slate-200/50 rounded-2xl focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 outline-none transition-all text-slate-800 font-semibold shadow-inner"
                placeholder="01X-XXXXXXX"
              />
            </div>
          </div>
        </div>

        {/* Premise Details */}
        <div className="glass-light rounded-[2.5rem] border border-white/50 p-8 shadow-xl shadow-slate-200/5 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-slate-900/5 rounded-bl-[100px] -z-10" />

          <h2 className="text-xl font-black text-slate-800 flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-200/50 flex items-center justify-center shadow-sm">
              <Store className="w-5 h-5 text-slate-600" />
            </div>
            Maklumat Cawangan
          </h2>
          
          <div className="space-y-6">
            <div>
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-2"><Building className="w-4 h-4" /> Nama Cawangan</label>
              <input 
                type="text" 
                value={formData.nama_premis}
                onChange={(e) => setFormData({...formData, nama_premis: e.target.value})}
                className="w-full px-5 py-4 bg-white/50 border border-slate-200/50 rounded-2xl focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 outline-none transition-all text-slate-800 font-semibold shadow-inner"
                placeholder="Nama Restoran/Kafe"
              />
            </div>
            
            <div>
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Alamat Penuh</label>
              <textarea 
                rows={3}
                value={formData.alamat_premis}
                onChange={(e) => setFormData({...formData, alamat_premis: e.target.value})}
                className="w-full px-5 py-4 bg-white/50 border border-slate-200/50 rounded-2xl focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 outline-none transition-all text-slate-800 font-semibold resize-none shadow-inner"
                placeholder="Alamat lengkap..."
              />
            </div>
            
            {profile?.premis?.kod_perniagaan && (
              <div className="mt-4 bg-gradient-to-r from-slate-950/90 to-slate-900/90 rounded-2xl p-6 relative overflow-hidden group border border-white/5 shadow-lg shadow-slate-950/20">
                <div className="absolute top-0 right-0 w-24 h-24 bg-orange-500 rounded-bl-full opacity-10 group-hover:scale-110 transition-transform duration-500"></div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 relative z-10">Kod Perniagaan</p>
                <div className="flex items-center justify-between relative z-10">
                  <p className="text-2xl font-mono font-black text-white tracking-widest">{profile.premis.kod_perniagaan}</p>
                </div>
                <p className="text-xs text-slate-400 mt-3 font-medium relative z-10 leading-relaxed max-w-[85%]">
                  Berikan kod eksklusif ini kepada staf anda untuk dipautkan ke sistem cawangan.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Change Password Section */}
      <div className="glass-light rounded-[2.5rem] border border-white/50 p-8 shadow-xl shadow-slate-200/5 mt-8 relative overflow-hidden animate-in fade-in duration-500">
        <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/5 rounded-bl-[100px] -z-10" />
        
        <h2 className="text-xl font-black text-slate-800 flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-orange-50 border border-orange-100/50 flex items-center justify-center shadow-sm">
            <KeyRound className="w-5 h-5 text-orange-500" />
          </div>
          Kemas Kini Kata Laluan
        </h2>
        
        <form onSubmit={handleUpdatePassword} className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
          <div>
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">Kata Laluan Semasa</label>
            <input 
              type="password" 
              required
              value={passwords.kata_laluan_lama}
              onChange={(e) => setPasswords({...passwords, kata_laluan_lama: e.target.value})}
              className="w-full px-5 py-4 bg-white/50 border border-slate-200/50 rounded-2xl focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 outline-none transition-all text-slate-800 font-semibold shadow-inner text-sm"
              placeholder="••••••••"
            />
          </div>
          
          <div>
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">Kata Laluan Baharu</label>
            <input 
              type="password" 
              required
              value={passwords.kata_laluan_baru}
              onChange={(e) => setPasswords({...passwords, kata_laluan_baru: e.target.value})}
              className="w-full px-5 py-4 bg-white/50 border border-slate-200/50 rounded-2xl focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 outline-none transition-all text-slate-800 font-semibold shadow-inner text-sm"
              placeholder="Min. 6 aksara"
            />
          </div>
          
          <div>
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">Sahkan Kata Laluan Baharu</label>
            <div className="flex gap-4">
              <input 
                type="password" 
                required
                value={passwords.sahkan_kata_laluan}
                onChange={(e) => setPasswords({...passwords, sahkan_kata_laluan: e.target.value})}
                className="flex-1 px-5 py-4 bg-white/50 border border-slate-200/50 rounded-2xl focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 outline-none transition-all text-slate-800 font-semibold shadow-inner text-sm"
                placeholder="Sahkan kata laluan"
              />
              <button 
                type="submit"
                disabled={updatingPassword}
                className="bg-slate-900 hover:bg-slate-800 text-white px-6 py-4 rounded-2xl font-black text-xs transition-all active:scale-95 disabled:opacity-50 cursor-pointer flex items-center justify-center gap-1.5 shadow-md shadow-slate-900/10 shrink-0"
              >
                {updatingPassword && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                Kemas Kini
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Team / Manager Management Section */}
      {profile?.premis?.id_premis && (
        <div className="glass-light rounded-[2.5rem] border border-white/50 p-8 shadow-xl shadow-slate-200/5 mt-8 animate-in fade-in duration-500 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/5 rounded-bl-[100px] -z-10" />
          
          <h2 className="text-xl font-black text-slate-800 flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-orange-50 border border-orange-100/50 flex items-center justify-center shadow-sm">
              <UserCircle className="w-5 h-5 text-orange-500" />
            </div>
            Pengurusan Rakan Kongsi & Pengurus (Team Management)
          </h2>

          <div className="grid md:grid-cols-2 gap-8">
            {/* List of active managers */}
            <div className="space-y-4">
              <h3 className="text-xs font-black uppercase text-slate-400 tracking-wider mb-4">Pengurus Aktif Cawangan</h3>
              {managers && managers.length > 0 ? (
                <div className="space-y-3 max-h-[350px] overflow-y-auto pr-2 custom-scrollbar">
                  {managers.map((m: any) => (
                    <div key={m.id_pengguna} className="p-5 bg-white/60 backdrop-blur-md border border-slate-200/30 rounded-2xl flex justify-between items-center transition-all hover:border-slate-300/50">
                      <div>
                        <p className="font-extrabold text-slate-800 text-sm">{m.nama}</p>
                        <p className="text-xs text-slate-500 font-semibold">{m.emel}</p>
                        {m.no_telefon && <p className="text-xs text-slate-400 mt-1 font-semibold">{m.no_telefon}</p>}
                      </div>
                      <div className="px-3 py-1 bg-orange-50 text-orange-500 border border-orange-100 rounded-lg text-[9px] font-black uppercase tracking-wider">
                        Pengurus
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center bg-white/30 rounded-2xl border border-slate-100">
                  <p className="text-sm font-semibold text-slate-500">Tiada pengurus lain didaftarkan.</p>
                </div>
              )}
            </div>

            {/* Form to add a new manager */}
            <form onSubmit={handleAddManager} className="space-y-4 bg-white/30 p-6 rounded-3xl border border-slate-200/20 backdrop-blur-sm">
              <h3 className="text-xs font-black uppercase text-slate-400 tracking-wider mb-2">Tambah Pengurus Baharu</h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <input
                  type="text"
                  placeholder="Nama Penuh"
                  required
                  value={newManager.nama_penuh}
                  onChange={(e) => setNewManager({...newManager, nama_penuh: e.target.value})}
                  className="w-full px-5 py-4 bg-white/50 border border-slate-200/50 rounded-2xl focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 outline-none transition-all text-slate-800 text-sm font-semibold shadow-inner"
                />
                
                <input
                  type="email"
                  placeholder="E-mel Rasmi"
                  required
                  value={newManager.emel}
                  onChange={(e) => setNewManager({...newManager, emel: e.target.value})}
                  className="w-full px-5 py-4 bg-white/50 border border-slate-200/50 rounded-2xl focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 outline-none transition-all text-slate-800 text-sm font-semibold shadow-inner"
                />

                <input
                  type="text"
                  placeholder="Nombor Telefon"
                  value={newManager.no_telefon}
                  onChange={(e) => setNewManager({...newManager, no_telefon: e.target.value})}
                  className="w-full px-5 py-4 bg-white/50 border border-slate-200/50 rounded-2xl focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 outline-none transition-all text-slate-800 text-sm font-semibold shadow-inner"
                />

                <input
                  type="password"
                  placeholder="Kata Laluan"
                  required
                  value={newManager.kata_laluan}
                  onChange={(e) => setNewManager({...newManager, kata_laluan: e.target.value})}
                  className="w-full px-5 py-4 bg-white/50 border border-slate-200/50 rounded-2xl focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 outline-none transition-all text-slate-800 text-sm font-semibold shadow-inner"
                />
              </div>

              <button
                type="submit"
                disabled={addingManager}
                className="w-full mt-4 bg-slate-900 hover:bg-slate-800 text-white py-3.5 rounded-xl font-extrabold transition-all shadow-md shadow-slate-900/10 active:scale-98 text-xs flex items-center justify-center gap-2 cursor-pointer disabled:opacity-75"
              >
                {addingManager && <Loader2 className="w-4 h-4 animate-spin" />}
                Tambah Rakan Pengurus
              </button>
            </form>
          </div>
        </div>
      )}
    </div>

      {/* Crop Modal */}
      {cropModalOpen && imageToCrop && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-[2rem] w-full max-w-xl overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h3 className="text-xl font-black text-slate-800">Sunting Gambar Profil</h3>
              <button onClick={() => setCropModalOpen(false)} className="text-slate-400 hover:text-slate-600 font-bold text-sm">Batal</button>
            </div>
            
            <div className="relative h-96 w-full bg-slate-100">
              <Cropper
                image={imageToCrop}
                crop={crop}
                zoom={zoom}
                aspect={1}
                cropShape="round"
                showGrid={false}
                onCropChange={setCrop}
                onCropComplete={handleCropComplete}
                onZoomChange={setZoom}
              />
            </div>
            
            <div className="p-8">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 block">Tahap Zum</label>
              <input
                type="range"
                value={zoom}
                min={1}
                max={3}
                step={0.1}
                onChange={(e) => setZoom(Number(e.target.value))}
                className="w-full accent-orange-500 mb-8"
              />
              <button
                onClick={saveCrop}
                className="w-full bg-orange-500 hover:bg-orange-600 text-white py-4 rounded-2xl font-bold transition-all shadow-lg shadow-orange-500/30 hover:shadow-orange-500/50 hover:-translate-y-0.5 active:translate-y-0 text-lg"
              >
                Gunakan Gambar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
