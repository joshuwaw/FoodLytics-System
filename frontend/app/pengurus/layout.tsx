"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth";
import Link from "next/link";
import { QrCode, LayoutDashboard, LogOut, Utensils, BrainCircuit, TrendingUp, Lightbulb } from "lucide-react";

export default function PengurusLayout({ children }: { children: React.ReactNode }) {
  const { user, logout, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isLoading) {
      if (!user) router.replace("/login");
      else if (user.peranan !== "Pengurus") router.replace("/staf");
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
    { href: "/pengurus", label: "Dashboard", icon: LayoutDashboard },
    { href: "/pengurus/trend", label: "Prestasi & Trend", icon: TrendingUp },
    { href: "/pengurus/topics", label: "Analisis Topik", icon: BrainCircuit },
    { href: "/pengurus/cadangan", label: "Cadangan & Tindakan", icon: Lightbulb },
    { href: "/pengurus/qr", label: "Jana Kod QR", icon: QrCode },
  ];


  return (
    <div className="flex h-screen font-sans mesh-dots">
      {/* Glass Sidebar */}
      <aside className="w-72 glass-sidebar flex flex-col">
        {/* Brand */}
        <div className="p-6 border-b border-slate-200/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl flex items-center justify-center shadow-lg shadow-orange-500/20">
              <Utensils className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-black text-slate-900 tracking-tight">FoodLytics</h1>
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-orange-500">Pengurus</span>
            </div>
          </div>
        </div>

        {/* User Info */}
        <div className="p-4">
          <div className="glass-light rounded-2xl px-4 py-3">
            <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold">Sesi aktif</p>
            <p className="text-sm font-black text-slate-800 truncate mt-0.5">{user.nama}</p>
            <p className="text-[11px] text-slate-400 font-mono truncate">{user.emel}</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 space-y-1">
          {navItems.map(({ href, label, icon: Icon }) => {
            const isActive = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-3 px-4 py-3 rounded-2xl font-semibold text-sm spring-hover ${
                  isActive
                    ? "bg-orange-500/10 text-orange-600 shadow-sm border border-orange-200/40"
                    : "text-slate-500 hover:bg-white/50 hover:text-slate-800"
                }`}
              >
                <Icon size={18} />
                {label}
              </Link>
            );
          })}
        </nav>

        {/* Logout */}
        <div className="p-4 border-t border-slate-200/30">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-4 py-3 text-slate-400 hover:bg-red-50/60 hover:text-red-500 rounded-2xl spring-hover font-medium text-sm"
          >
            <LogOut size={18} />
            Log Keluar
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
