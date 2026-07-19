"use client";

import { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { useAuth } from "@/lib/auth";
import { UserCircle, Store, Save, Loader2, Building, Phone, Mail, User, Camera, ShieldCheck, KeyRound, Users, Briefcase, ToggleLeft, ToggleRight, Lock, Eye, EyeOff } from "lucide-react";
import Cropper from "react-easy-crop";
import useSWR from "swr";
import { toast } from "sonner";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

export default function PengurusProfilPage() {
  const { user } = useAuth();
  const [saving, setSaving] = useState(false);
  const [profilePic, setProfilePic] = useState<string | null>(null);

  // SSR hydration mounted check
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);
  
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
  const [showAddManager, setShowAddManager] = useState(false);
  const [showNewManagerPassword, setShowNewManagerPassword] = useState(false);

  // Manager statuses state
  const [managerStatuses, setManagerStatuses] = useState<Record<number, string>>({});
  
  useEffect(() => {
    if (managers) {
      const statuses: Record<number, string> = {};
      managers.forEach((m: any) => {
        const saved = localStorage.getItem(`manager_status_${m.id_pengguna}`) || "Aktif";
        statuses[m.id_pengguna] = saved;
      });
      setManagerStatuses(statuses);
    }
  }, [managers]);

  const handleToggleManagerStatus = (managerId: number) => {
    const current = managerStatuses[managerId] || "Aktif";
    const next = current === "Aktif" ? "Tidak Aktif" : "Aktif";
    localStorage.setItem(`manager_status_${managerId}`, next);
    setManagerStatuses(prev => ({ ...prev, [managerId]: next }));
    toast.success("Status pengurus cawangan berjaya dikemas kini!");
  };

  // Staff status toggle state
  const [updatingStaffId, setUpdatingStaffId] = useState<number | null>(null);

  // Staff Password Reset State
  const [showResetModal, setShowResetModal] = useState(false);
  const [resettingStaff, setResettingStaff] = useState<any>(null);
  const [staffNewPassword, setStaffNewPassword] = useState("");
  const [resettingLoading, setResettingLoading] = useState(false);

  const handleResetStaffPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resettingStaff) return;
    setResettingLoading(true);
    try {
      const res = await fetch(`${API_URL}/admin/staff/${resettingStaff.id_pengguna}/reset-password`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ new_password: staffNewPassword }),
      });
      if (res.ok) {
        toast.success(`Kata laluan untuk ${resettingStaff.nama} berjaya diset semula!`);
        setShowResetModal(false);
        setStaffNewPassword("");
        setResettingStaff(null);
      } else {
        const errData = await res.json();
        toast.error(errData.detail || "Gagal menetapkan semula kata laluan.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Ralat rangkaian.");
    } finally {
      setResettingLoading(false);
    }
  };

  // Active Sub Tab State: "kakitangan" (Staff & manager status), "pasukan" (Add co-manager), "katalaluan" (Change password)
  const [activeSubTab, setActiveSubTab] = useState<"kakitangan" | "pasukan" | "katalaluan">("kakitangan");

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

  // Fetch managers list
  const { data: managers, mutate: mutateManagers } = useSWR(
    profile?.premis?.id_premis ? `${API_URL}/admin/premises/${profile.premis.id_premis}/managers` : null,
    fetcher
  );

  // Fetch staff list
  const { data: staff, mutate: mutateStaff } = useSWR(
    profile?.premis?.id_premis ? `${API_URL}/admin/premises/${profile.premis.id_premis}/staff` : null,
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
        setShowAddManager(false);
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
      toast.error("Sahkan kata laluan baharu tidak sepadan.");
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

  const handleToggleStaffStatus = async (staffId: number, currentStatus: string) => {
    const nextStatus = currentStatus === "Aktif" ? "Tidak Aktif" : "Aktif";
    
    setUpdatingStaffId(staffId);
    try {
      const res = await fetch(`${API_URL}/admin/staff/${staffId}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status_bekerja: nextStatus })
      });
      if (res.ok) {
        toast.success("Status kakitangan berjaya dikemas kini!");
        mutateStaff(); // Refresh staff list
      } else {
        toast.error("Gagal mengemas kini status kakitangan.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Ralat rangkaian.");
    } finally {
      setUpdatingStaffId(null);
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

        {/* Display Maklumat Peribadi and Maklumat Cawangan SIDE-BY-SIDE */}
        <div className="grid md:grid-cols-2 gap-8 mb-8">
          {/* Card 1: Personal Details */}
          <div id="peribadi" className="glass-light rounded-[2.5rem] border border-white/50 p-8 shadow-xl shadow-slate-200/5 relative overflow-hidden">
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

          {/* Card 2: Premise Details */}
          <div id="cawangan" className="glass-light rounded-[2.5rem] border border-white/50 p-8 shadow-xl shadow-slate-200/5 relative overflow-hidden">
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

        {/* Low-Profile Menu Switcher for Secondary Actions */}
        <div className="border-b border-slate-200/60 mb-6 flex gap-6">
          <button
            onClick={() => setActiveSubTab("kakitangan")}
            className={`pb-3 text-xs font-black uppercase tracking-wider transition-all relative cursor-pointer ${
              activeSubTab === "kakitangan"
                ? "text-orange-500 border-b-2 border-orange-500"
                : "text-slate-450 hover:text-slate-700"
            }`}
          >
            Senarai Kakitangan
          </button>
          <button
            onClick={() => setActiveSubTab("katalaluan")}
            className={`pb-3 text-xs font-black uppercase tracking-wider transition-all relative cursor-pointer ${
              activeSubTab === "katalaluan"
                ? "text-orange-500 border-b-2 border-orange-500"
                : "text-slate-450 hover:text-slate-700"
            }`}
          >
            Kemas Kini Kata Laluan
          </button>
        </div>

        {/* Active Sub-Tab Panel */}
        <div className="animate-in fade-in duration-300">
          
          {/* Tab 1: Staff and Manager List with working status */}
          {activeSubTab === "kakitangan" && (
            <div className="glass-light rounded-[2.5rem] border border-white/50 p-8 shadow-xl shadow-slate-200/5 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/5 rounded-bl-[100px] -z-10" />
              
              <h2 className="text-xl font-black text-slate-800 flex items-center gap-3 mb-8">
                <div className="w-10 h-10 rounded-xl bg-orange-50 border border-orange-100/50 flex items-center justify-center shadow-sm">
                  <Users className="w-5 h-5 text-orange-500" />
                </div>
                Senarai Kakitangan Cawangan
              </h2>

              <div className="space-y-6">
                {/* Managers Section */}
                <div>
                  <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-2">
                    <h3 className="text-xs font-black uppercase text-slate-400 tracking-wider">Pengurus</h3>
                    <button
                      onClick={() => setShowAddManager(!showAddManager)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer shadow-sm active:scale-95"
                    >
                      {showAddManager ? "Tutup" : "Tambah Pengurus +"}
                    </button>
                  </div>

                  {showAddManager && (
                    <form onSubmit={handleAddManager} className="mb-6 p-6 bg-slate-50/80 border border-slate-200/50 rounded-2xl space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-black uppercase text-slate-500">Tambah Rakan Pengurus Baharu</h4>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <input
                          type="text"
                          placeholder="Nama Penuh"
                          required
                          value={newManager.nama_penuh}
                          onChange={(e) => setNewManager({...newManager, nama_penuh: e.target.value})}
                          className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-800 text-sm font-semibold outline-none focus:ring-2 focus:ring-orange-500/20"
                        />
                        <input
                          type="email"
                          placeholder="E-mel Rasmi"
                          required
                          value={newManager.emel}
                          onChange={(e) => setNewManager({...newManager, emel: e.target.value})}
                          className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-800 text-sm font-semibold outline-none focus:ring-2 focus:ring-orange-500/20"
                        />
                        <input
                          type="text"
                          placeholder="Nombor Telefon"
                          value={newManager.no_telefon}
                          onChange={(e) => setNewManager({...newManager, no_telefon: e.target.value})}
                          className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-800 text-sm font-semibold outline-none focus:ring-2 focus:ring-orange-500/20"
                        />
                        <div className="relative group">
                          <input
                            type={showNewManagerPassword ? "text" : "password"}
                            placeholder="Kata Laluan"
                            required
                            value={newManager.kata_laluan}
                            onChange={(e) => setNewManager({...newManager, kata_laluan: e.target.value})}
                            className="w-full pl-4 pr-10 py-3 bg-white border border-slate-200 rounded-xl text-slate-800 text-sm font-semibold outline-none focus:ring-2 focus:ring-orange-500/20"
                          />
                          <button
                            type="button"
                            onClick={() => setShowNewManagerPassword(!showNewManagerPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-650 transition-colors cursor-pointer focus:outline-none"
                          >
                            {showNewManagerPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>
                      <div className="flex justify-end">
                        <button
                          type="submit"
                          disabled={addingManager}
                          className="flex items-center gap-1.5 px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-black transition-all cursor-pointer shadow-sm active:scale-95 disabled:opacity-75"
                        >
                          {addingManager && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                          Daftar Rakan Pengurus
                        </button>
                      </div>
                    </form>
                  )}
                  {managers && managers.length > 0 ? (
                    <div className="grid gap-3 sm:grid-cols-2">
                      {managers.map((m: any) => (
                        <div key={m.id_pengguna} className="p-5 bg-white/60 backdrop-blur-md border border-slate-200/30 rounded-2xl flex justify-between items-center transition-all hover:border-slate-350/50 shadow-sm">
                          <div>
                            <p className="font-extrabold text-slate-800 text-sm flex items-center gap-1.5">
                              {m.nama} 
                              {m.id_pengguna === user?.id_pengguna && (
                                <span className="text-[9px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-black">Saya</span>
                              )}
                            </p>
                            <p className="text-xs text-slate-500 font-semibold">{m.emel}</p>
                            {m.no_telefon && <p className="text-xs text-slate-400 mt-1 font-semibold">{m.no_telefon}</p>}
                          </div>
                          <div className="flex flex-col items-end gap-1.5">
                            <span className="px-2.5 py-0.5 bg-orange-50 text-orange-500 border border-orange-100 rounded-lg text-[9px] font-black uppercase tracking-wider">
                              Pengurus
                            </span>
                            {m.id_pengguna === profile?.premis?.id_pengurus ? (
                              <span className="px-2.5 py-0.5 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-lg text-[9px] font-black uppercase tracking-wider">
                                Aktif
                              </span>
                            ) : (
                              <button
                                onClick={() => handleToggleManagerStatus(m.id_pengguna)}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[9px] font-black uppercase transition-all border cursor-pointer active:scale-95 ${
                                  (managerStatuses[m.id_pengguna] || "Aktif") === "Aktif"
                                    ? "bg-emerald-50 text-emerald-600 border-emerald-200/60 hover:bg-emerald-100/50"
                                    : "bg-rose-50 text-rose-600 border-rose-200/60 hover:bg-rose-100/50"
                                }`}
                              >
                                {(managerStatuses[m.id_pengguna] || "Aktif") === "Aktif" ? (
                                  <ToggleRight className="w-4 h-4" />
                                ) : (
                                  <ToggleLeft className="w-4 h-4" />
                                )}
                                {managerStatuses[m.id_pengguna] || "Aktif"}
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-450 italic pl-1">Tiada pengurus lain.</p>
                  )}
                </div>

                {/* Staff Section */}
                <div className="pt-4 border-t border-slate-200/60">
                  <h3 className="text-xs font-black uppercase text-slate-400 tracking-wider mb-3">Staf Operasi</h3>
                  {staff && staff.length > 0 ? (
                    <div className="grid gap-3 sm:grid-cols-2">
                      {staff.map((s: any) => (
                        <div key={s.id_pengguna} className="p-5 bg-white/60 backdrop-blur-md border border-slate-200/30 rounded-2xl flex justify-between items-center transition-all hover:border-slate-350/50 shadow-sm">
                          <div>
                            <p className="font-extrabold text-slate-800 text-sm">{s.nama}</p>
                            <p className="text-xs text-slate-500 font-semibold">{s.emel}</p>
                            {s.no_telefon && <p className="text-xs text-slate-400 mt-1 font-semibold">{s.no_telefon}</p>}
                          </div>
                          
                          <div className="flex flex-col items-end gap-2">
                            <span className="px-2.5 py-0.5 bg-blue-50 text-blue-600 border border-blue-100 rounded-lg text-[9px] font-black uppercase tracking-wider">
                              Staf
                            </span>
                            
                            {/* Actions Container */}
                            <div className="flex items-center gap-2">
                              {/* Staff Work Status Toggle Button */}
                              <button
                                onClick={() => handleToggleStaffStatus(s.id_pengguna, s.status_bekerja)}
                                disabled={updatingStaffId === s.id_pengguna}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-black transition-all border cursor-pointer active:scale-95 ${
                                  s.status_bekerja === "Aktif"
                                    ? "bg-emerald-50 text-emerald-600 border-emerald-200/60 hover:bg-emerald-100/50"
                                    : s.status_bekerja === "Menunggu Kelulusan"
                                    ? "bg-amber-50 text-amber-600 border-amber-200/60 hover:bg-amber-100/50 animate-pulse"
                                    : "bg-rose-50 text-rose-600 border-rose-200/60 hover:bg-rose-100/50"
                                }`}
                              >
                                {updatingStaffId === s.id_pengguna ? (
                                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                ) : s.status_bekerja === "Aktif" ? (
                                  <ToggleRight className="w-4 h-4" />
                                ) : s.status_bekerja === "Menunggu Kelulusan" ? (
                                  <ShieldCheck className="w-4 h-4 text-amber-500" />
                                ) : (
                                  <ToggleLeft className="w-4 h-4" />
                                )}
                                {s.status_bekerja === "Aktif" 
                                  ? "Aktif" 
                                  : s.status_bekerja === "Menunggu Kelulusan" 
                                  ? "Sahkan Kelulusan" 
                                  : "Tidak Aktif"
                                }
                              </button>

                              {/* Reset Password Button */}
                              {s.status_bekerja !== "Menunggu Kelulusan" && (
                                <button
                                  onClick={() => {
                                    setResettingStaff(s);
                                    setShowResetModal(true);
                                  }}
                                  className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200/80 border border-slate-200 text-slate-700 rounded-xl text-[10px] font-black transition-all cursor-pointer active:scale-95"
                                >
                                  <Lock className="w-3 h-3 text-slate-500" />
                                  Kata Laluan
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-450 italic pl-1">Tiada staf berdaftar di bawah cawangan ini.</p>
                  )}
                </div>
              </div>
            </div>
          )}



          {/* Tab 3: Change Password Section */}
          {activeSubTab === "katalaluan" && (
            <div className="glass-light rounded-[2.5rem] border border-white/50 p-8 shadow-xl shadow-slate-200/5 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/5 rounded-bl-[100px] -z-10" />
              
              <h2 className="text-xl font-black text-slate-800 flex items-center gap-3 mb-8">
                <div className="w-10 h-10 rounded-xl bg-orange-50 border border-orange-100/50 flex items-center justify-center shadow-sm">
                  <KeyRound className="w-5 h-5 text-orange-500" />
                </div>
                Kemas Kini Kata Laluan
              </h2>
              
              <form onSubmit={handleUpdatePassword} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
                    <input 
                      type="password" 
                      required
                      value={passwords.sahkan_kata_laluan}
                      onChange={(e) => setPasswords({...passwords, sahkan_kata_laluan: e.target.value})}
                      className="w-full px-5 py-4 bg-white/50 border border-slate-200/50 rounded-2xl focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 outline-none transition-all text-slate-800 font-semibold shadow-inner text-sm"
                      placeholder="Sahkan kata laluan"
                    />
                  </div>
                </div>
                
                <div className="flex justify-end">
                  <button 
                    type="submit"
                    disabled={updatingPassword}
                    className="bg-slate-900 hover:bg-slate-800 text-white px-8 py-3.5 rounded-2xl font-black text-xs transition-all active:scale-95 disabled:opacity-50 cursor-pointer flex items-center justify-center gap-1.5 shadow-md shadow-slate-900/10"
                  >
                    {updatingPassword && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    Kemas Kini Kata Laluan
                  </button>
                </div>
              </form>
            </div>
          )}
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
      {/* Manager Reset Staff Password Modal (React Portal) */}
      {mounted && showResetModal && resettingStaff && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-md">
          <div className="bg-white border border-slate-100 rounded-[2rem] p-8 sm:p-10 shadow-2xl w-full max-w-[420px] relative overflow-hidden text-slate-800 animate-in zoom-in-95 duration-200 ease-out">
            <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/5 rounded-bl-[100px] -z-10" />
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-black text-slate-800 tracking-tight flex items-center gap-2.5">
                  <Lock className="w-5 h-5 text-orange-500" />
                  Set Semula Kata Laluan
                </h3>
                <button
                  onClick={() => {
                    setShowResetModal(false);
                    setStaffNewPassword("");
                    setResettingStaff(null);
                  }}
                  className="text-slate-400 hover:text-slate-600 text-xs font-bold cursor-pointer"
                >
                  Tutup
                </button>
              </div>

              <div className="p-4 bg-orange-50 border border-orange-100 rounded-2xl text-xs text-orange-800 leading-relaxed">
                Anda sedang menukar kata laluan untuk staf: <strong>{resettingStaff.nama}</strong> ({resettingStaff.emel}).
              </div>

              <form onSubmit={handleResetStaffPassword} className="space-y-5">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Kata Laluan Baru Staf</label>
                  <input
                    type="password"
                    placeholder="Masukkan kata laluan baru"
                    value={staffNewPassword}
                    onChange={(e) => setStaffNewPassword(e.target.value)}
                    required
                    minLength={6}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500/40 text-sm font-semibold"
                  />
                </div>

                <button
                  type="submit"
                  disabled={resettingLoading}
                  className="w-full py-3.5 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-400 hover:to-orange-500 text-white rounded-xl text-sm font-black shadow-lg cursor-pointer transition-all active:scale-95 disabled:opacity-50"
                >
                  {resettingLoading ? "Mengemaskini..." : "Simpan Kata Laluan Baru"}
                </button>
              </form>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
