'use client';

import { useState, useActionState } from 'react';
import Stepper, { Step } from './ui/stepper';
import { AuthForm } from './auth-form';
import { SubmitButton } from './submit-button';
import { register, type RegisterActionState } from '@/app/(auth)/actions';
import Link from 'next/link';
import { toast } from './toast';

export function OnboardingStepper() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    purpose: '',
    interests: [] as string[],
  });

  const [state, formAction] = useActionState<RegisterActionState, FormData>(
    register,
    {
      status: 'idle',
    }
  );

  const [isSuccessful, setIsSuccessful] = useState(false);

  const handleFinalComplete = () => {
    // Registration completed
    console.log('Registration completed with data:', formData);
  };

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 2:
        if (!formData.purpose) {
          toast({
            type: 'error',
            description: 'Silakan pilih minimal 1 tujuan untuk melanjutkan',
          });
          return false;
        }
        return true;
      case 3:
        if (formData.interests.length < 2) {
          toast({
            type: 'error',
            description: 'Silakan pilih minimal 2 topik minat untuk melanjutkan',
          });
          return false;
        }
        return true;
      default:
        return true;
    }
  };

  return (
    <Stepper
      initialStep={1}
      onFinalStepCompleted={handleFinalComplete}
      backButtonText="Kembali"
      nextButtonText="Lanjut"
      validateStep={validateStep}
    >
      <Step>
        <div className="space-y-4 pb-6">
          <div className="space-y-2">
            <h2 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
              Selamat Datang! 👋
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Ayo mulai perjalanan AI Anda dengan UltramaxoAI
            </p>
          </div>
          
          <div className="space-y-3">
            <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50 p-5">
              <h3 className="font-semibold mb-3 text-gray-900 dark:text-gray-100 flex items-center gap-2">
                <span className="text-lg">✨</span> Fitur Unggulan
              </h3>
              <ul className="space-y-2.5 text-sm">
                <li className="flex items-start gap-2 text-gray-700 dark:text-gray-300">
                  <span className="text-gray-500 dark:text-gray-400 font-bold mt-0.5">✓</span>
                  <span>Chat AI dengan model terbaru</span>
                </li>
                <li className="flex items-start gap-2 text-gray-700 dark:text-gray-300">
                  <span className="text-gray-500 dark:text-gray-400 font-bold mt-0.5">✓</span>
                  <span>Generate code & dokumen</span>
                </li>
                <li className="flex items-start gap-2 text-gray-700 dark:text-gray-300">
                  <span className="text-gray-500 dark:text-gray-400 font-bold mt-0.5">✓</span>
                  <span>Web search & weather tools</span>
                </li>
                <li className="flex items-start gap-2 text-gray-700 dark:text-gray-300">
                  <span className="text-gray-500 dark:text-gray-400 font-bold mt-0.5">✓</span>
                  <span>Multi-user collaboration</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </Step>

      <Step>
        <div className="space-y-4 pb-6">
          <div className="space-y-2">
            <h2 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
              Apa Tujuan Anda?
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Pilih tujuan utama menggunakan UltramaxoAI <span className="text-gray-500 font-semibold">*</span>
            </p>
          </div>

          <div className="space-y-2.5">
            {[
              { value: 'coding', label: '💻 Coding & Development', desc: 'Bantuan programming dan debugging' },
              { value: 'writing', label: '✍️ Content Writing', desc: 'Menulis artikel, blog, dan konten' },
              { value: 'learning', label: '📚 Learning & Research', desc: 'Belajar topik baru dan riset' },
              { value: 'business', label: '💼 Business & Productivity', desc: 'Produktivitas dan analisis bisnis' },
              { value: 'creative', label: '🎨 Creative Projects', desc: 'Proyek kreatif dan brainstorming' },
            ].map((purpose) => {
              const isSelected = formData.purpose === purpose.value;
              return (
                <button
                  key={purpose.value}
                  onClick={() => setFormData({ ...formData, purpose: purpose.value })}
                  className={`group relative w-full text-left rounded-lg border p-4 transition-all duration-200 ${
                    isSelected 
                      ? 'border-gray-400 dark:border-gray-600 bg-gray-200 dark:bg-gray-800' 
                      : 'border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-900/50'
                  }`}
                >
                  {isSelected && (
                    <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-gray-700 dark:bg-gray-400 flex items-center justify-center">
                      <span className="text-xs font-bold text-gray-100 dark:text-gray-900">✓</span>
                    </div>
                  )}
                  <div className={`font-semibold ${isSelected ? 'text-gray-900 dark:text-gray-100' : 'text-gray-900 dark:text-gray-100'}`}>
                    {purpose.label}
                  </div>
                  <div className={`text-sm mt-1 leading-relaxed ${isSelected ? 'text-gray-700 dark:text-gray-300' : 'text-gray-600 dark:text-gray-400'}`}>
                    {purpose.desc}
                  </div>
                </button>
              );
            })}
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-500 flex items-center gap-1">
            <span className="text-gray-600 dark:text-gray-400">*</span> Wajib memilih minimal 1 tujuan
          </p>
        </div>
      </Step>

      <Step>
        <div className="space-y-4 pb-6">
          <div className="space-y-2">
            <h2 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
              Minat & Topik
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Pilih topik yang Anda minati <span className="text-gray-500 font-semibold">*</span>
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            {[
              '🐍 Python',
              '⚛️ React',
              '🟢 Node.js',
              '🤖 AI/ML',
              '📊 Data Science',
              '🎮 Game Dev',
              '📱 Mobile',
              '🌐 Web Dev',
              '☁️ Cloud',
              '🔐 Security',
              '🎯 Marketing',
              '📈 Analytics',
            ].map((interest) => {
              const isSelected = formData.interests.includes(interest);
              return (
                <button
                  key={interest}
                  onClick={() => {
                    setFormData({
                      ...formData,
                      interests: isSelected
                        ? formData.interests.filter((i) => i !== interest)
                        : [...formData.interests, interest],
                    });
                  }}
                  className={`relative rounded-lg border p-3 text-sm font-medium transition-all duration-200 ${
                    isSelected
                      ? 'border-gray-400 dark:border-gray-600 bg-gray-200 dark:bg-gray-800 text-gray-900 dark:text-gray-100'
                      : 'border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-900/50 text-gray-900 dark:text-gray-100'
                  }`}
                >
                  {isSelected && (
                    <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-gray-700 dark:bg-gray-400 flex items-center justify-center">
                      <span className="text-xs font-bold text-gray-100 dark:text-gray-900">✓</span>
                    </div>
                  )}
                  {interest}
                </button>
              );
            })}
          </div>
          
          <div className="flex items-center justify-between text-xs">
            <p className="text-gray-500 dark:text-gray-500 flex items-center gap-1">
              <span className="text-gray-600 dark:text-gray-400">*</span> Wajib pilih minimal 2 topik
            </p>
            <p className={`font-semibold ${
              formData.interests.length >= 2 
                ? 'text-gray-900 dark:text-gray-100' 
                : 'text-gray-400 dark:text-gray-600'
            }`}>
              {formData.interests.length} dipilih
            </p>
          </div>
        </div>
      </Step>

      <Step>
        <div className="space-y-4 pb-6">
          <div className="space-y-2">
            <h2 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-gray-100">Buat Akun</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Lengkapi data untuk membuat akun Anda
            </p>
          </div>

          <AuthForm action={formAction} type="register">
            <SubmitButton isSuccessful={isSuccessful}>Buat Akun</SubmitButton>
            <p className="mt-4 text-center text-sm text-gray-600 dark:text-gray-400">
              Sudah punya akun?{' '}
              <Link href="/login" className="text-gray-100 dark:text-gray-200 hover:text-white dark:hover:text-white font-medium hover:underline">
                Masuk di sini
              </Link>
            </p>
          </AuthForm>
        </div>
      </Step>
    </Stepper>
  );
}
