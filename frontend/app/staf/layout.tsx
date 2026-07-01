"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth";
import Link from "next/link";
import { LayoutDashboard, LogOut, Utensils, ClipboardList, TrendingUp, BrainCircuit, UserCircle, ChevronLeft, ChevronRight } from "lucide-react";

export default function StafLayout({ children }: { children: React.ReactNode }) {
  const { user, logout, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);

  useEffect(() => {
    if (!isLoading) {
      if (!user) router.replace("/login");
      else if (user.peranan !== "Staf Operasi") router.replace("/pengurus");
    }
  }, [user, isLoading, router]);

  if (isLoading || !user || user.peranan !== "Staf Operasi") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  const navItems = [
    { href: "/staf", label: "Dashboard", icon: LayoutDashboard },
    { href: "/staf/tindakan", label: "Arahan Kerja", icon: ClipboardList },
    { href: "/staf/trend", label: "Prestasi & Trend", icon: TrendingUp },
    { href: "/staf/topics", label: "Analisis Topik", icon: BrainCircuit },
    { href: "/staf/profil", label: "Profil Saya", icon: UserCircle },
  ];

  return (
    <div className="flex h-screen font-sans mesh-dots">
      <aside className={`glass-sidebar flex flex-col transition-all duration-300 relative ${isCollapsed ? "w-20" : "w-72"}`}>
        {/* Toggle Button */}
        <button 
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="absolute -right-3 top-8 bg-white border border-slate-200 text-slate-500 hover:text-slate-900 rounded-full p-1 shadow-sm z-50"
        >
          {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>

        {/* Brand */}
        <div className={`p-6 border-b border-slate-200/30 flex items-center ${isCollapsed ? "justify-center px-0" : "gap-3"}`}>
          <div className="w-10 h-10 min-w-[40px] bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/20">
            <Utensils className="w-5 h-5 text-white" />
          </div>
          {!isCollapsed && (
            <div>
              <h1 className="text-lg font-black text-slate-900 tracking-tight">FoodLytics</h1>
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-blue-500">Staf Operasi</span>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 space-y-2 mt-6 overflow-y-auto overflow-x-hidden scrollbar-hide">
          {navItems.map(({ href, label, icon: Icon }) => {
            const isActive = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                title={isCollapsed ? label : undefined}
                className={`flex items-center ${isCollapsed ? "justify-center" : "gap-3"} px-4 py-3 rounded-2xl font-semibold text-sm spring-hover ${
                  isActive
                    ? "bg-blue-500/10 text-blue-600 shadow-sm border border-blue-200/40"
                    : "text-slate-500 hover:bg-white/50 hover:text-slate-800"
                }`}
              >
                <Icon size={18} className="min-w-[18px]" />
                {!isCollapsed && <span className="truncate">{label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* User Info (Moved to bottom) */}
        <div className="p-4 border-t border-slate-200/30">
          <Link href="/staf/profil" className={`flex items-center gap-3 p-3 rounded-2xl hover:bg-slate-100/50 transition-colors cursor-pointer ${isCollapsed ? "justify-center" : ""}`}>
            <div className="w-10 h-10 min-w-[40px] rounded-full bg-slate-200 flex items-center justify-center overflow-hidden border border-slate-300">
              <UserCircle className="w-6 h-6 text-slate-400" />
            </div>
            {!isCollapsed && (
              <div className="flex-1 overflow-hidden">
                <p className="text-sm font-bold text-slate-800 truncate">{user.nama}</p>
                <p className="text-[10px] text-slate-500 font-mono truncate">{user.emel}</p>
              </div>
            )}
          </Link>
          
          <button
            onClick={handleLogout}
            title={isCollapsed ? "Log Keluar" : undefined}
            className={`flex items-center ${isCollapsed ? "justify-center" : "gap-3"} w-full px-4 py-3 mt-2 text-slate-400 hover:bg-red-50/60 hover:text-red-500 rounded-2xl spring-hover font-medium text-sm`}
          >
            <LogOut size={18} className="min-w-[18px]" />
            {!isCollapsed && "Log Keluar"}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <div className="max-w-6xl mx-auto p-8 lg:p-10">
          {children}
        </div>
      </main>
    </div>
  );
}
