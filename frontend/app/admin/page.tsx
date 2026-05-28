"use client";

import { Card } from "@tremor/react";

export default function AdminDashboard() {
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
        Selamat Datang ke FoodLytics
      </h2>
      <p className="text-gray-500 dark:text-zinc-400">
        Urus premis anda, jana kod QR, dan pantau maklum balas pelanggan dari satu papan pemuka.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
        <Card className="ring-0 shadow-sm border border-gray-200 dark:border-zinc-800 bg-white/50 dark:bg-zinc-900/50 backdrop-blur-xl rounded-2xl">
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Langkah 1: Daftar Premis</h3>
          <p className="mt-2 text-gray-500 dark:text-zinc-400">
            Daftarkan restoran, kafe, atau gerai anda ke dalam sistem. Maklumat ini akan digunakan untuk borang maklum balas.
          </p>
        </Card>
        
        <Card className="ring-0 shadow-sm border border-gray-200 dark:border-zinc-800 bg-white/50 dark:bg-zinc-900/50 backdrop-blur-xl rounded-2xl">
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Langkah 2: Jana & Cetak QR</h3>
          <p className="mt-2 text-gray-500 dark:text-zinc-400">
            Jana Kod QR unik untuk setiap premis. Pelanggan boleh mengimbas kod ini untuk memberikan maklum balas secara terus.
          </p>
        </Card>
      </div>
    </div>
  );
}
