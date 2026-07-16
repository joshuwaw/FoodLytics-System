"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth";
import Link from "next/link";
import { QrCode, LayoutDashboard, LogOut, Utensils, BrainCircuit, TrendingUp, Lightbulb, FileText, UserCircle, ChevronLeft, ChevronRight } from "lucide-react";

export default function PengurusLayout({ children }: { children: React.ReactNode }) {
  const { user, logout, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);

  useEffect(() => {
    if (!isLoading) {
      if (!user) router.replace("/login");
      else if (user.peranan !== "Pengurus") router.replace("/unauthorized");
    }
  }, [user, isLoading, router]);

  if (isLoading || !user || user.peranan !== "Pengurus") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  const navItems = [
    { href: "/pengurus", label: "Papan Pemuka", icon: LayoutDashboard },
    { href: "/pengurus/trend", label: "Prestasi & Trend", icon: TrendingUp },
    { href: "/pengurus/topics", label: "Analisis Topik", icon: BrainCircuit },
    { href: "/pengurus/cadangan", label: "Cadangan & Tindakan", icon: Lightbulb },
    { href: "/pengurus/qr", label: "Jana Kod QR", icon: QrCode },
    { href: "/pengurus/laporan", label: "Carian & Laporan", icon: FileText },
    { href: "/pengurus/profil", label: "Profil Saya", icon: UserCircle },
  ];


  return (
    <div className="flex h-screen font-sans mesh-dots bg-[#f1f5f9] p-4 gap-4 overflow-hidden relative">
      {/* Background Aurora Orbs */}
      <div className="absolute top-[-20%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-gradient-to-br from-orange-400/15 to-pink-500/15 blur-[150px] pointer-events-none z-0 animate-aurora-1" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[45vw] h-[45vw] rounded-full bg-gradient-to-br from-blue-400/15 to-indigo-500/15 blur-[150px] pointer-events-none z-0 animate-aurora-2" />

      {/* Floating Glass Sidebar */}
      <aside className={`glass-sidebar flex flex-col transition-all duration-300 relative rounded-3xl h-full shadow-lg z-10 ${isCollapsed ? "w-20" : "w-72"}`}>
        {/* Toggle Button */}
        <button 
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="absolute -right-3 top-8 bg-white/90 backdrop-blur-md border border-slate-200/80 text-slate-500 hover:text-slate-900 rounded-full p-1.5 shadow-md hover:shadow-lg transition-all duration-300 z-50 cursor-pointer"
        >
          {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>

        {/* Brand */}
        <div className={`p-6 border-b border-slate-200/30 flex items-center ${isCollapsed ? "justify-center px-0" : "gap-3"}`}>
          <div className="w-10 h-10 min-w-[40px] bg-gradient-to-br from-orange-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-lg shadow-orange-500/20 animate-pulse">
            <Utensils className="w-5 h-5 text-white" />
          </div>
          {!isCollapsed && (
            <div>
              <h1 className="text-lg font-black text-slate-900 tracking-tight">FoodLytics</h1>
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] bg-gradient-to-r from-orange-500 to-pink-500 bg-clip-text text-transparent">Pengurus</span>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 space-y-2 mt-6 overflow-y-auto overflow-x-hidden scrollbar-hide custom-scrollbar">
          {navItems.map(({ href, label, icon: Icon }) => {
            const isActive = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                title={isCollapsed ? label : undefined}
                className={`flex items-center ${isCollapsed ? "justify-center" : "gap-3"} px-4 py-3 rounded-2xl font-bold text-sm spring-hover border transition-all duration-300 ${
                  isActive
                    ? "bg-gradient-to-r from-orange-500 to-pink-500 text-white shadow-md shadow-orange-500/25 border-transparent"
                    : "text-slate-600 border-transparent hover:bg-white/60 hover:text-slate-950"
                }`}
              >
                <Icon size={18} className="min-w-[18px]" />
                {!isCollapsed && <span className="truncate">{label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* User Info (Moved to bottom) */}
        <div className="p-4 border-t border-slate-200/30 space-y-1">
          <Link href="/pengurus/profil" className={`flex items-center gap-3 p-2.5 rounded-2xl hover:bg-white/60 transition-all duration-200 cursor-pointer ${isCollapsed ? "justify-center" : ""}`}>
            <div className="w-9 h-9 min-w-[36px] rounded-xl bg-orange-100/80 flex items-center justify-center overflow-hidden border border-orange-200/50">
              <UserCircle className="w-5 h-5 text-orange-500" />
            </div>
            {!isCollapsed && (
              <div className="flex-1 overflow-hidden">
                <p className="text-xs font-bold text-slate-800 truncate">{user.nama}</p>
                <p className="text-[9px] text-slate-500 font-mono truncate">{user.emel}</p>
              </div>
            )}
          </Link>
          
          <button
            onClick={handleLogout}
            title={isCollapsed ? "Log Keluar" : undefined}
            className={`flex items-center ${isCollapsed ? "justify-center" : "gap-3"} w-full px-4 py-3 text-slate-400 hover:bg-rose-50/60 hover:text-rose-600 rounded-2xl spring-hover font-bold text-xs cursor-pointer`}
          >
            <LogOut size={16} className="min-w-[16px]" />
            {!isCollapsed && "Log Keluar"}
          </button>
        </div>
      </aside>

      {/* Main Content Floating Glass Container */}
      <main className="flex-1 overflow-y-auto rounded-3xl bg-slate-50/50 border border-slate-200/30 backdrop-blur-xl shadow-xl shadow-slate-150/10 custom-scrollbar relative flex flex-col z-10">
        <div className="flex-1 p-6 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
