'use client';

import { useState } from 'react';
import Stepper, { Step } from './ui/stepper';
import { AuthForm } from './auth-form';

export function OnboardingStepper() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    purpose: '',
    interests: [] as string[],
  });

  const handleFinalComplete = () => {
    // Registration completed
    console.log('Registration completed with data:', formData);
  };

  return (
    <Stepper
      initialStep={1}
      onFinalStepCompleted={handleFinalComplete}
      backButtonText="Kembali"
      nextButtonText="Lanjut"
    >
      <Step>
        <div className="space-y-4 pb-6">
          <div className="space-y-2">
            <h2 className="text-2xl font-bold tracking-tight">Selamat Datang! 👋</h2>
            <p className="text-sm text-muted-foreground">
              Ayo mulai perjalanan AI Anda dengan UltramaxoAI
            </p>
          </div>
          
          <div className="space-y-3">
            <div className="rounded-lg border bg-card p-4">
              <h3 className="font-semibold mb-2">✨ Fitur Unggulan</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• Chat AI dengan model terbaru</li>
                <li>• Generate code & dokumen</li>
                <li>• Web search & weather tools</li>
                <li>• Multi-user collaboration</li>
              </ul>
            </div>
          </div>
        </div>
      </Step>

      <Step>
        <div className="space-y-4 pb-6">
          <div className="space-y-2">
            <h2 className="text-2xl font-bold tracking-tight">Apa Tujuan Anda?</h2>
            <p className="text-sm text-muted-foreground">
              Pilih tujuan utama menggunakan UltramaxoAI
            </p>
          </div>

          <div className="space-y-2">
            {[
              { value: 'coding', label: '💻 Coding & Development', desc: 'Bantuan programming dan debugging' },
              { value: 'writing', label: '✍️ Content Writing', desc: 'Menulis artikel, blog, dan konten' },
              { value: 'learning', label: '📚 Learning & Research', desc: 'Belajar topik baru dan riset' },
              { value: 'business', label: '💼 Business & Productivity', desc: 'Produktivitas dan analisis bisnis' },
              { value: 'creative', label: '🎨 Creative Projects', desc: 'Proyek kreatif dan brainstorming' },
            ].map((purpose) => (
              <button
                key={purpose.value}
                onClick={() => setFormData({ ...formData, purpose: purpose.value })}
                className={`w-full text-left rounded-lg border p-4 transition hover:border-primary ${
                  formData.purpose === purpose.value ? 'border-primary bg-primary/5' : ''
                }`}
              >
                <div className="font-medium">{purpose.label}</div>
                <div className="text-xs text-muted-foreground">{purpose.desc}</div>
              </button>
            ))}
          </div>
        </div>
      </Step>

      <Step>
        <div className="space-y-4 pb-6">
          <div className="space-y-2">
            <h2 className="text-2xl font-bold tracking-tight">Minat & Topik</h2>
            <p className="text-sm text-muted-foreground">
              Pilih topik yang Anda minati (opsional)
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2">
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
                  className={`rounded-lg border p-3 text-sm font-medium transition hover:border-primary ${
                    isSelected ? 'border-primary bg-primary/5' : ''
                  }`}
                >
                  {interest}
                </button>
              );
            })}
          </div>
        </div>
      </Step>

      <Step>
        <div className="space-y-4 pb-6">
          <div className="space-y-2">
            <h2 className="text-2xl font-bold tracking-tight">Buat Akun</h2>
            <p className="text-sm text-muted-foreground">
              Lengkapi data untuk membuat akun Anda
            </p>
          </div>

          <AuthForm action="register" />
        </div>
      </Step>
    </Stepper>
  );
}
