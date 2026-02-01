'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Mail, Key, ArrowRight, Loader2, CheckCircle2 } from 'lucide-react';

export default function VerifyPage() {
  const router = useRouter();
  const [step, setStep] = useState<'resend' | 'verify'>('verify');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleResendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!email) {
      setError('Email harus diisi');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Format email tidak valid');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/auth/resend-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const text = await response.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch {
        throw new Error('Server error: Invalid response');
      }

      if (!response.ok) {
        throw new Error(data.error || 'Gagal mengirim kode');
      }

      setSuccess(data.message || 'Kode verifikasi baru telah dikirim ke email Anda');
      setStep('verify');
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!email || !code) {
      setError('Email dan kode verifikasi harus diisi');
      return;
    }

    if (code.length !== 6) {
      setError('Kode verifikasi harus 6 digit');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/auth/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code }),
      });

      const text = await response.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch {
        throw new Error('Server error: Invalid response');
      }

      if (!response.ok) {
        throw new Error(data.error || 'Verifikasi gagal');
      }

      setSuccess('Verifikasi berhasil! Silakan login.');
      setTimeout(() => {
        router.push('/login');
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-900 via-slate-800 to-slate-900 flex flex-col items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="flex items-center justify-center mb-8">
          <div className="w-12 h-12 rounded-lg bg-slate-700 flex items-center justify-center">
            <span className="text-2xl font-bold text-white">N</span>
          </div>
        </div>

        <div className="bg-slate-900/50 backdrop-blur-xl rounded-2xl p-8 border border-slate-700/50 shadow-2xl">
          <div className="flex items-center justify-center mb-4">
            {step === 'verify' ? (
              <CheckCircle2 className="w-12 h-12 text-blue-400" />
            ) : (
              <Mail className="w-12 h-12 text-blue-400" />
            )}
          </div>

          <h1 className="text-2xl font-bold text-white mb-2 text-center">
            {step === 'verify' ? 'Verifikasi Akun' : 'Kirim Ulang Kode'}
          </h1>
          <p className="text-slate-400 text-sm text-center mb-6">
            {step === 'verify'
              ? 'Masukkan email dan kode verifikasi yang dikirim ke email Anda'
              : 'Masukkan email untuk menerima kode verifikasi baru'}
          </p>

          <form onSubmit={step === 'verify' ? handleVerify : handleResendCode} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                <input
                  type="email"
                  placeholder="nama@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                  required
                />
              </div>
            </div>

            {step === 'verify' && (
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Kode Verifikasi (6 digit)
                </label>
                <div className="relative">
                  <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                  <input
                    type="text"
                    placeholder="123456"
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all text-center text-2xl tracking-widest"
                    maxLength={6}
                    required
                  />
                </div>
              </div>
            )}

            {(error || success) && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`p-3 rounded-lg text-sm ${
                  success
                    ? 'bg-green-500/10 border border-green-500/50 text-green-400'
                    : 'bg-red-500/10 border border-red-500/50 text-red-400'
                }`}
              >
                {error || success}
              </motion.div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-white text-slate-900 rounded-lg font-medium hover:bg-slate-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Memproses...
                </>
              ) : (
                <>
                  {step === 'verify' ? 'Verifikasi' : 'Kirim Ulang Kode'}
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => {
                setStep(step === 'verify' ? 'resend' : 'verify');
                setError('');
                setSuccess('');
              }}
              className="text-slate-400 hover:text-white text-sm transition-colors"
            >
              {step === 'verify' ? 'Belum menerima kode? Kirim ulang' : 'Sudah punya kode? Verifikasi'}
            </button>
          </div>

          <div className="mt-4 text-center">
            <button
              onClick={() => router.push('/login')}
              className="text-slate-400 hover:text-white text-sm flex items-center justify-center gap-2 mx-auto transition-colors"
            >
              Kembali ke Login
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
