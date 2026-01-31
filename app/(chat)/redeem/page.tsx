"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function RedeemPage() {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const router = useRouter();

  const handleRedeem = async () => {
    if (!code) return;
    setLoading(true);
    setMessage('');
    
    try {
        const res = await fetch('/api/redeem', {
            method: 'POST',
            body: JSON.stringify({ code }),
        });
        const data = await res.json();
        
        if (data.error) {
            setMessage(data.error);
        } else {
            setMessage('Voucher berhasil diredeem! Refreshing...');
            setTimeout(() => {
                router.refresh();
                setCode('');
            }, 1000);
        }
    } catch (e) {
        setMessage('Terjadi kesalahan.');
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-background text-foreground">
      <div className="w-full max-w-md space-y-8">
        <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-6 shadow-sm">
           <h2 className="text-2xl font-semibold">Redeem Voucher</h2>
           <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">Masukan kode voucher yang kamu dapatkan.</p>
           
           <div className="mt-6 space-y-4">
             <input
               value={code}
               onChange={(e) => setCode(e.target.value)}
               placeholder="ABC-XYZ-123"
               className="w-full p-4 rounded-2xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:border-slate-900 dark:focus:border-slate-100 outline-none transition-colors"
             />
             <button
               onClick={handleRedeem}
               disabled={loading}
               className="w-full py-3 rounded-2xl bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 font-bold hover:opacity-90 disabled:opacity-50 transition-opacity"
             >
               {loading ? 'Processing...' : 'Claim Sekarang'}
             </button>
             {message && <p className="text-center text-sm font-medium">{message}</p>}
           </div>
        </div>
      </div>
    </div>
  );
}
