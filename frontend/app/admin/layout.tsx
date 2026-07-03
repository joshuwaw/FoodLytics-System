"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { QrCode, Store, LayoutDashboard, Utensils } from "lucide-react";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isLoading) {
      if (!user) router.replace("/login");
      else if (user.peranan !== "Admin" && user.emel !== "admin@foodlytics.com") {
        router.replace("/unauthorized");
      }
    }
  }, [user, isLoading, router]);

  const navItems = [
    { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
    { href: "/admin/register", label: "Daftar Premis", icon: Store },
    { href: "/admin/qr", label: "Penjana QR", icon: QrCode },
  ];

  if (isLoading || !user || (user.peranan !== "Admin" && user.emel !== "admin@foodlytics.com")) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex h-screen font-sans mesh-dots bg-[#f1f5f9] p-4 gap-4 overflow-hidden relative">
      {/* Background Aurora Orbs */}
      <div className="absolute top-[-20%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-gradient-to-br from-teal-400/15 to-emerald-500/15 blur-[150px] pointer-events-none z-0 animate-aurora-1" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[45vw] h-[45vw] rounded-full bg-gradient-to-br from-indigo-400/15 to-blue-500/15 blur-[150px] pointer-events-none z-0 animate-aurora-2" />

      {/* Floating Glass Sidebar */}
      <aside className="glass-sidebar flex flex-col transition-all duration-300 w-64 rounded-3xl h-full shadow-lg z-10">
        {/* Brand */}
        <div className="p-6 border-b border-slate-200/30 flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-teal-500 to-emerald-500 rounded-2xl flex items-center justify-center shadow-lg shadow-teal-500/20 animate-pulse">
            <Utensils className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-black text-slate-900 tracking-tight">FoodLytics</h1>
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] bg-gradient-to-r from-teal-500 to-emerald-500 bg-clip-text text-transparent">Admin Portal</span>
          </div>
        </div>
        
        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2 mt-4 overflow-y-auto custom-scrollbar">
          {navItems.map(({ href, label, icon: Icon }) => {
            const isActive = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-3 px-4 py-3 rounded-2xl font-bold text-sm spring-hover border transition-all duration-300 ${
                  isActive
                    ? "bg-gradient-to-r from-teal-500 to-emerald-500 text-white shadow-md shadow-teal-500/25 border-transparent"
                    : "text-slate-600 border-transparent hover:bg-white/60 hover:text-slate-950"
                }`}
              >
                <Icon size={18} className="min-w-[18px]" />
                <span className="truncate">{label}</span>
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Main Content Floating Glass Container */}
      <main className="flex-1 overflow-y-auto rounded-3xl bg-slate-50/50 border border-slate-200/30 backdrop-blur-xl shadow-xl shadow-slate-150/10 custom-scrollbar relative flex flex-col z-10">
        <div className="flex-1 p-6 lg:p-8">
          <div className="max-w-4xl mx-auto">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
