import Link from "next/link";
import { QrCode, Store, LayoutDashboard } from "lucide-react";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen bg-gray-50 dark:bg-zinc-950">
      {/* Sidebar */}
      <aside className="w-64 bg-white dark:bg-zinc-900 border-r border-gray-200 dark:border-zinc-800 flex flex-col">
        <div className="p-6 border-b border-gray-200 dark:border-zinc-800">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-teal-500 to-emerald-500 bg-clip-text text-transparent">
            FoodLytics
          </h1>
          <p className="text-sm text-gray-500 dark:text-zinc-400 mt-1">Admin Portal</p>
        </div>
        
        <nav className="flex-1 p-4 space-y-2">
          <Link href="/admin" className="flex items-center gap-3 px-4 py-3 text-gray-600 dark:text-zinc-400 hover:bg-teal-50 hover:text-teal-600 dark:hover:bg-zinc-800 dark:hover:text-teal-400 rounded-xl transition-colors">
            <LayoutDashboard size={20} />
            <span className="font-medium">Dashboard</span>
          </Link>
          <Link href="/admin/register" className="flex items-center gap-3 px-4 py-3 text-gray-600 dark:text-zinc-400 hover:bg-teal-50 hover:text-teal-600 dark:hover:bg-zinc-800 dark:hover:text-teal-400 rounded-xl transition-colors">
            <Store size={20} />
            <span className="font-medium">Daftar Premis</span>
          </Link>
          <Link href="/admin/qr" className="flex items-center gap-3 px-4 py-3 text-gray-600 dark:text-zinc-400 hover:bg-teal-50 hover:text-teal-600 dark:hover:bg-zinc-800 dark:hover:text-teal-400 rounded-xl transition-colors">
            <QrCode size={20} />
            <span className="font-medium">Penjana QR</span>
          </Link>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto p-8">
        <div className="max-w-4xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
