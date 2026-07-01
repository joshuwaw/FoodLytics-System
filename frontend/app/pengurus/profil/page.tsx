"use client";


import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/lib/auth";
import { UserCircle, Store, Save, Loader2, Building, Phone, Mail, User, Camera, ShieldCheck } from "lucide-react";
import Cropper from "react-easy-crop";
import useSWR from "swr";
import { toast } from "sonner";

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

  // SWR Fetcher
  const fetcher = (url: string) => fetch(url).then((res) => res.json());
  
  const { data: profile, isLoading, mutate } = useSWR(
    user?.id_pengguna ? `http://localhost:8000/api/admin/profile/${user.id_pengguna}` : null,
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
      
      const res = await fetch(`http://localhost:8000/api/admin/profile/${user?.id_pengguna}`, {
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
      <div className="bg-white rounded-[2.5rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 overflow-hidden mb-8 relative">
        <div className="h-32 md:h-36 bg-slate-900 w-full relative overflow-hidden">
          {/* Subtle Abstract Pattern/Gradient */}
          <div className="absolute inset-0 opacity-30 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-orange-400 via-slate-900 to-slate-900"></div>
        </div>
        
        <div className="px-8 pb-8 pt-0 md:px-10 md:pb-10 relative flex flex-col md:flex-row justify-between items-center md:items-end gap-6">
          <div className="flex flex-col md:flex-row items-center md:items-end gap-6 text-center md:text-left">
            <div className="relative group cursor-pointer -mt-16 md:-mt-20">
              <label htmlFor="avatar-upload" className="block cursor-pointer">
                <div className="w-32 h-32 md:w-40 md:h-40 bg-white rounded-[2rem] p-2 shadow-2xl rotate-3 hover:rotate-0 transition-transform duration-300">
                  <div className="w-full h-full bg-slate-100 rounded-2xl flex items-center justify-center overflow-hidden relative">
                    {profilePic ? (
                      <img src={profilePic} alt="Profile" className="w-full h-full object-cover" />
                    ) : formData.nama ? (
                      <span className="text-5xl md:text-6xl font-black text-slate-300 uppercase">
                        {formData.nama.charAt(0)}
                      </span>
                    ) : (
                      <UserCircle className="w-16 h-16 text-slate-300" />
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
              <p className="text-slate-500 font-medium flex items-center gap-2 justify-center md:justify-start mt-1">
                <ShieldCheck className="w-4 h-4 text-green-500" />
                {user?.peranan === 'Staf Operasi' ? 'Staf Operasi' : 'Pengurus'} &bull; {formData.nama_premis || "Tiada Cawangan"}
              </p>
            </div>
          </div>
          
          <div className="pb-2 md:pb-6 w-full md:w-auto">
            <button 
              onClick={handleSave}
              disabled={saving}
              className="w-full md:w-auto bg-orange-500 hover:bg-orange-600 text-white px-8 py-3.5 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all disabled:opacity-70 shadow-lg shadow-orange-500/30 hover:shadow-orange-500/50 hover:-translate-y-0.5 active:translate-y-0"
            >
              {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
              {saving ? "Menyimpan..." : "Simpan Perubahan"}
            </button>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Personal Details */}
        <div className="bg-white rounded-[2rem] border border-slate-100 p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/5 rounded-bl-[100px] -z-10" />
          
          <h2 className="text-xl font-black text-slate-800 flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center">
              <UserCircle className="w-5 h-5 text-orange-600" />
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
                className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 outline-none transition-all text-slate-800 font-semibold"
                placeholder="Masukkan nama penuh"
              />
            </div>
            
            <div>
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-2"><Mail className="w-4 h-4" /> E-mel</label>
              <input 
                type="email" 
                value={formData.emel}
                onChange={(e) => setFormData({...formData, emel: e.target.value})}
                className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 outline-none transition-all text-slate-800 font-semibold"
                placeholder="e.g. john@example.com"
              />
            </div>
            
            <div>
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-2"><Phone className="w-4 h-4" /> No. Telefon</label>
              <input 
                type="text" 
                value={formData.no_telefon}
                onChange={(e) => setFormData({...formData, no_telefon: e.target.value})}
                className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 outline-none transition-all text-slate-800 font-semibold"
                placeholder="01X-XXXXXXX"
              />
            </div>
          </div>
        </div>

        {/* Premise Details */}
        <div className="bg-white rounded-[2rem] border border-slate-100 p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-slate-900/5 rounded-bl-[100px] -z-10" />

          <h2 className="text-xl font-black text-slate-800 flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center">
              <Store className="w-5 h-5 text-slate-700" />
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
                className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:ring-4 focus:ring-slate-900/10 focus:border-slate-900 outline-none transition-all text-slate-800 font-semibold"
                placeholder="Nama Restoran/Kafe"
              />
            </div>
            
            <div>
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Alamat Penuh</label>
              <textarea 
                rows={3}
                value={formData.alamat_premis}
                onChange={(e) => setFormData({...formData, alamat_premis: e.target.value})}
                className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:ring-4 focus:ring-slate-900/10 focus:border-slate-900 outline-none transition-all text-slate-800 font-semibold resize-none"
                placeholder="Alamat lengkap..."
              />
            </div>
            
            {profile?.premis?.kod_perniagaan && (
              <div className="mt-4 bg-slate-900 rounded-2xl p-6 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-24 h-24 bg-orange-500 rounded-bl-full opacity-20 group-hover:scale-110 transition-transform duration-500"></div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 relative z-10">Kod Perniagaan</p>
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
