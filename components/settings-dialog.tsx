"use client";

import { useState, useEffect } from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
} from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { toast } from "sonner";
import { 
  UserIcon, 
  LockIcon, 
  ShieldCheckIcon,
  ZapIcon,
  Loader2Icon
} from "lucide-react";

export function SettingsDialog({
  open,
  onOpenChange
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [activeTab, setActiveTab] = useState<'profile' | 'security'>('profile');
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [updateLoading, setUpdateLoading] = useState(false);

  useEffect(() => {
    if (open) {
      fetchUserData();
    }
  }, [open]);

  const fetchUserData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/user/settings');
      const data = await res.json();
      if (data.user) setUser(data.user);
    } catch (e) {
      toast.error("Gagal mengambil data user");
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error("Password konfirmasi tidak cocok");
      return;
    }

    setUpdateLoading(true);
    try {
      const res = await fetch('/api/user/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword
        })
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Password berhasil diubah");
        setPasswordData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
      } else {
        toast.error(data.error || "Gagal mengubah password");
      }
    } catch (e) {
      toast.error("Terjadi kesalahan");
    } finally {
      setUpdateLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden bg-[#09090b] border-zinc-800 rounded-3xl shadow-2xl">
        <div className="flex h-[500px]">
          {/* Sidebar Tabs */}
          <aside className="w-40 border-r border-zinc-800/50 bg-zinc-900/20 p-4 flex flex-col gap-2">
            <button 
              onClick={() => setActiveTab('profile')}
              className={`flex items-center gap-3 px-3 py-2 rounded-xl text-sm transition-all ${activeTab === 'profile' ? 'bg-white text-black font-bold shadow-lg' : 'text-zinc-500 hover:text-white hover:bg-zinc-800/50'}`}
            >
              <UserIcon size={16} />
              Profil
            </button>
            <button 
              onClick={() => setActiveTab('security')}
              className={`flex items-center gap-3 px-3 py-2 rounded-xl text-sm transition-all ${activeTab === 'security' ? 'bg-white text-black font-bold shadow-lg' : 'text-zinc-500 hover:text-white hover:bg-zinc-800/50'}`}
            >
              <LockIcon size={16} />
              Keamanan
            </button>
          </aside>

          {/* Tab Content */}
          <main className="flex-1 p-8 flex flex-col gap-6 overflow-y-auto">
            <header className="flex flex-col gap-1">
              <DialogTitle className="text-xl font-bold text-white leading-none">
                {activeTab === 'profile' ? 'Informasi Akun' : 'Ganti Password'}
              </DialogTitle>
              <p className="text-zinc-500 text-xs">
                {activeTab === 'profile' ? 'Liat detail profil dan sisa kuota chat kamu.' : 'Perbarui password akun kamu secara berkala.'}
              </p>
            </header>

            {loading ? (
              <div className="flex-1 flex flex-col items-center justify-center gap-4 text-zinc-500">
                <Loader2Icon className="animate-spin" size={32} />
                <span className="text-sm">Memuat data...</span>
              </div>
            ) : activeTab === 'profile' ? (
              <div className="flex flex-col gap-6">
                <div className="space-y-4">
                  <div className="flex flex-col gap-1.5 p-4 rounded-2xl bg-zinc-900/50 border border-zinc-800/50">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Email Address</Label>
                    <div className="text-sm text-white font-medium truncate">{user?.email || "N/A"}</div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5 p-4 rounded-2xl bg-zinc-900/50 border border-zinc-800/50">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Tier Status</Label>
                      <div className="flex items-center gap-2">
                        {user?.isPro ? (
                          <div className="text-xs px-2 py-0.5 bg-yellow-400/10 text-yellow-500 rounded-full font-bold border border-yellow-500/20">PRO</div>
                        ) : (
                          <div className="text-xs px-2 py-0.5 bg-zinc-800 text-zinc-400 rounded-full font-bold">FREE</div>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col gap-1.5 p-4 rounded-2xl bg-zinc-900/50 border border-zinc-800/50">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Chat Quota</Label>
                      <div className="flex items-center gap-1.5 text-sm text-white font-bold">
                        <ZapIcon size={14} className="text-blue-500 fill-blue-500" />
                        {user?.limitCount?.toLocaleString() || 0}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-4 p-4 rounded-2xl bg-blue-500/5 border border-blue-500/10 flex items-start gap-4">
                  <div className="p-2 rounded-xl bg-blue-500/10 text-blue-500">
                    <ShieldCheckIcon size={20} />
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-xs font-bold text-white">Akun kamu aman</span>
                    <p className="text-[10px] text-zinc-500 leading-relaxed">Gunakan fitur ini untuk memantau sisa kuota chat kamu secara real-time.</p>
                  </div>
                </div>
              </div>
            ) : (
              <form onSubmit={handlePasswordChange} className="flex flex-col gap-5">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-xs font-medium text-zinc-400 ml-1">Password Saat Ini</Label>
                    <Input 
                      type="password"
                      className="bg-zinc-900 border-zinc-800 rounded-xl h-11 text-sm focus:ring-zinc-700" 
                      placeholder="••••••••"
                      required
                      value={passwordData.currentPassword}
                      onChange={e => setPasswordData({...passwordData, currentPassword: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-medium text-zinc-400 ml-1">Password Baru</Label>
                    <Input 
                      type="password"
                      className="bg-zinc-900 border-zinc-800 rounded-xl h-11 text-sm focus:ring-zinc-700" 
                      placeholder="••••••••"
                      required
                      value={passwordData.newPassword}
                      onChange={e => setPasswordData({...passwordData, newPassword: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-medium text-zinc-400 ml-1">Konfirmasi Password Baru</Label>
                    <Input 
                      type="password"
                      className="bg-zinc-900 border-zinc-800 rounded-xl h-11 text-sm focus:ring-zinc-700" 
                      placeholder="••••••••"
                      required
                      value={passwordData.confirmPassword}
                      onChange={e => setPasswordData({...passwordData, confirmPassword: e.target.value})}
                    />
                  </div>
                </div>
                
                <Button 
                  disabled={updateLoading}
                  className="w-full bg-white text-black font-bold h-11 rounded-xl hover:bg-zinc-200 transition-all active:scale-[0.98] mt-2 shadow-xl"
                  type="submit"
                >
                  {updateLoading ? <Loader2Icon className="animate-spin" size={18} /> : 'Perbarui Password'}
                </Button>
              </form>
            )}
          </main>
        </div>
      </DialogContent>
    </Dialog>
  );
}
