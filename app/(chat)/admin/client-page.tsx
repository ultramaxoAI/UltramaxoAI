"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { 
  UsersIcon, 
  TicketIcon, 
  SearchIcon,
  MessageSquareIcon,
  CrownIcon,
  KeyIcon,
  Settings2Icon,
  LogOutIcon,
  Trash2Icon
} from "lucide-react";

export default function AdminDashboardClient() {
  const [activeTab, setActiveTab] = useState<'vouchers' | 'users'>('vouchers');
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [voucherData, setVoucherData] = useState({
      code: '',
      type: 'PRO',
      value: 0,
      durationMonths: 1
  });
  const [voucherMessage, setVoucherMessage] = useState('');

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/users');
      const data = await res.json();
      if (data.users) setUsers(data.users);
    } catch (e) {
      toast.error("Failed to fetch users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'users') {
      fetchUsers();
    }
  }, [activeTab]);

  const handleVoucherSubmit = async () => {
      try {
          const res = await fetch('/api/admin/vouchers', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(voucherData),
          });
          const data = await res.json();
          if (data.error) toast.error(data.error);
          else {
              toast.success('Voucher created successfully!');
              setVoucherData({...voucherData, code: ''}); 
          }
      } catch (e) {
          toast.error('Error creating voucher');
      }
  };

  const handleUpdateUser = async (userId: string, updates: any) => {
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: userId, ...updates }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("User updated");
        fetchUsers();
      } else {
        toast.error(data.error || "Update failed");
      }
    } catch (e) {
      toast.error("Update failed");
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm("Are you sure you want to delete this user? This action cannot be undone.")) return;
    
    try {
      const res = await fetch(`/api/admin/users?id=${userId}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        toast.success("User deleted");
        fetchUsers();
      } else {
        toast.error(data.error || "Delete failed");
      }
    } catch (e) {
      toast.error("Delete failed");
    }
  };

  const filteredUsers = users.filter(u => 
    u.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.id?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex min-h-screen bg-[#09090b] text-zinc-100 font-sans">
      {/* Sidebar */}
      <aside className="w-64 border-r border-zinc-800 flex flex-col p-6 gap-8 bg-[#0c0c0e]">
        <div className="flex items-center gap-3 px-2">
          <div className="size-8 rounded-lg bg-white flex items-center justify-center">
            <Settings2Icon className="text-black size-5" />
          </div>
          <span className="font-bold text-lg tracking-tight">Admin OS</span>
        </div>

        <nav className="flex flex-col gap-2">
          <button 
            onClick={() => setActiveTab('vouchers')}
            className={`flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all ${activeTab === 'vouchers' ? 'bg-zinc-800 text-white shadow-lg' : 'text-zinc-500 hover:text-white hover:bg-zinc-800/50'}`}
          >
            <TicketIcon size={18} />
            <span className="text-sm font-medium">Vouchers</span>
          </button>
          <button 
            onClick={() => setActiveTab('users')}
            className={`flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all ${activeTab === 'users' ? 'bg-zinc-800 text-white shadow-lg' : 'text-zinc-500 hover:text-white hover:bg-zinc-800/50'}`}
          >
            <UsersIcon size={18} />
            <span className="text-sm font-medium">Users</span>
          </button>
        </nav>

        <div className="mt-auto">
          <button className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-zinc-500 hover:text-red-400 hover:bg-red-400/10 transition-all w-full leading-none">
            <LogOutIcon size={18} />
            <span className="text-sm font-medium">Exit Admin</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col p-10 gap-10 overflow-y-auto">
        <header className="flex flex-col gap-1">
          <h1 className="text-4xl font-bold tracking-tight text-white capitalize">
            {activeTab} Management
          </h1>
          <p className="text-zinc-500 text-sm">
            Manage your application's {activeTab} activity and settings.
          </p>
        </header>

        {activeTab === 'vouchers' ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <section className="bg-[#121214] border border-zinc-800/50 rounded-3xl p-8 flex flex-col gap-6 shadow-2xl">
              <div className="flex flex-col gap-1.5">
                <h2 className="text-xl font-bold text-white">Generate Voucher</h2>
                <p className="text-zinc-500 text-sm">Create a new redeemable code for users.</p>
              </div>

              <div className="space-y-5">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest ml-1">Voucher Code</label>
                  <input 
                    className="w-full bg-[#18181b] border border-zinc-800 rounded-2xl p-4 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-700 transition-all placeholder:text-zinc-700"
                    placeholder="e.g. ULTIMA-PRO-2025"
                    value={voucherData.code}
                    onChange={e => setVoucherData({...voucherData, code: e.target.value})}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest ml-1">Voucher Type</label>
                  <select 
                    className="w-full bg-[#18181b] border border-zinc-800 rounded-2xl p-4 text-sm focus:outline-none appearance-none"
                    value={voucherData.type}
                    onChange={e => setVoucherData({...voucherData, type: e.target.value})}
                  >
                    <option value="PRO">PRO Subscription</option>
                    <option value="CREDIT">Extra Credits</option>
                  </select>
                </div>

                {voucherData.type === 'PRO' ? (
                  <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest ml-1">Duration (Months)</label>
                    <input 
                      type="number"
                      className="w-full bg-[#18181b] border border-zinc-800 rounded-2xl p-4 text-sm focus:outline-none"
                      value={voucherData.durationMonths}
                      onChange={e => setVoucherData({...voucherData, durationMonths: parseInt(e.target.value)})}
                    />
                  </div>
                ) : (
                  <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest ml-1">Credit Amount</label>
                    <input 
                      type="number"
                      className="w-full bg-[#18181b] border border-zinc-800 rounded-2xl p-4 text-sm focus:outline-none"
                      value={voucherData.value}
                      onChange={e => setVoucherData({...voucherData, value: parseInt(e.target.value)})}
                    />
                  </div>
                )}
                
                <button 
                  onClick={handleVoucherSubmit} 
                  className="w-full bg-white text-black font-bold py-4 rounded-2xl hover:bg-zinc-200 transition-all active:scale-[0.98] shadow-xl mt-4"
                >
                  Create Voucher
                </button>
              </div>
            </section>
            
            <section className="flex items-center justify-center p-8 bg-[#121214]/30 border border-dashed border-zinc-800 rounded-3xl">
               <div className="text-center flex flex-col items-center gap-4">
                  <div className="size-16 rounded-full bg-zinc-800/50 flex items-center justify-center">
                    <TicketIcon className="text-zinc-600" size={32} />
                  </div>
                  <p className="text-zinc-600 text-sm max-w-[200px]">Active vouchers and history will appear here in the next update.</p>
               </div>
            </section>
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            <div className="flex justify-between items-center bg-[#121214] border border-zinc-800/50 rounded-2xl p-2 px-6">
              <div className="flex items-center gap-3 flex-1 max-w-md">
                <SearchIcon size={18} className="text-zinc-500" />
                <input 
                  className="bg-transparent w-full py-4 text-sm focus:outline-none"
                  placeholder="Search users by name or email..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                />
              </div>
              <button 
                onClick={fetchUsers}
                className="text-white bg-zinc-800 py-2 px-4 rounded-xl text-xs font-bold hover:bg-zinc-700 transition-all"
              >
                Refresh
              </button>
            </div>

            <div className="bg-[#121214] border border-zinc-800/50 rounded-3xl overflow-hidden shadow-2xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-zinc-800 bg-zinc-900/30">
                      <th className="p-6 text-xs font-bold text-zinc-500 uppercase tracking-widest">User</th>
                      <th className="p-6 text-xs font-bold text-zinc-500 uppercase tracking-widest">Chats</th>
                      <th className="p-6 text-xs font-bold text-zinc-500 uppercase tracking-widest">Limit</th>
                      <th className="p-6 text-xs font-bold text-zinc-500 uppercase tracking-widest">Plan</th>
                      <th className="p-6 text-xs font-bold text-zinc-500 uppercase tracking-widest">Status</th>
                      <th className="p-6 text-xs font-bold text-zinc-500 uppercase tracking-widest text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/50">
                    {loading ? (
                      <tr>
                        <td colSpan={6} className="p-20 text-center text-zinc-500">
                          <div className="animate-pulse flex flex-col items-center gap-4">
                             <div className="size-10 rounded-full bg-zinc-800" />
                             <span className="text-sm">Retrieving user records...</span>
                          </div>
                        </td>
                      </tr>
                    ) : filteredUsers.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="p-20 text-center text-zinc-600">No users found.</td>
                      </tr>
                    ) : filteredUsers.map(user => (
                      <tr key={user.id} className="hover:bg-zinc-800/20 transition-colors group">
                        <td className="p-6">
                          <div className="flex items-center gap-4">
                            <div className="size-10 rounded-full bg-zinc-800 flex items-center justify-center font-bold text-zinc-400">
                              {user.name?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase()}
                            </div>
                            <div className="flex flex-col">
                              <span className="font-bold text-white text-sm">{user.name || "Unnamed"}</span>
                              <span className="text-zinc-500 text-xs">{user.email}</span>
                            </div>
                          </div>
                        </td>
                        <td className="p-6">
                          <div className="flex items-center gap-2 text-zinc-300 font-medium">
                            <MessageSquareIcon size={14} className="text-zinc-500" />
                            <span>{user.chatCount || 0}</span>
                          </div>
                        </td>
                        <td className="p-6">
                          <span className="text-zinc-300 font-medium">{user.limitCount}</span>
                        </td>
                        <td className="p-6">
                           {user.isPro ? (
                             <span className="px-3 py-1 bg-yellow-400/10 text-yellow-400 text-[10px] font-black uppercase tracking-widest border border-yellow-400/20 rounded-full flex items-center gap-1.5 w-fit">
                               <CrownIcon size={10} />
                               PRO
                             </span>
                           ) : (
                             <span className="px-3 py-1 bg-zinc-800 text-zinc-500 text-[10px] font-black uppercase tracking-widest rounded-full w-fit">
                               FREE
                             </span>
                           )}
                        </td>
                        <td className="p-6">
                          {user.role === 'admin' ? (
                            <span className="px-3 py-1 bg-blue-400/10 text-blue-400 text-[10px] font-black uppercase tracking-widest border border-blue-400/20 rounded-full flex items-center gap-1.5 w-fit">
                              <KeyIcon size={10} />
                              ADMIN
                            </span>
                          ) : (
                            <span className="px-3 py-1 bg-zinc-800 text-zinc-500 text-[10px] font-black uppercase tracking-widest rounded-full w-fit">
                              USER
                            </span>
                          )}
                        </td>
                        <td className="p-6 text-right">
                           <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button 
                                onClick={() => handleUpdateUser(user.id, { isPro: !user.isPro, limitCount: !user.isPro ? 99999 : 0 })}
                                className="p-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white transition-all shadow-lg border border-zinc-700/50"
                                title={user.isPro ? "Revoke Pro" : "Grant Pro"}
                              >
                                {user.isPro ? <TicketIcon size={16} /> : <CrownIcon size={16} />}
                              </button>
                              <button 
                                onClick={() => {
                                  const newLimit = prompt("Enter new limit count:", user.limitCount);
                                  if (newLimit !== null) handleUpdateUser(user.id, { limitCount: parseInt(newLimit) });
                                }}
                                className="p-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white transition-all shadow-lg border border-zinc-700/50"
                                title="Edit Limit"
                              >
                                <Settings2Icon size={16} />
                              </button>
                              <button 
                                onClick={() => handleDeleteUser(user.id)}
                                className="p-2.5 rounded-xl bg-zinc-800 hover:bg-red-500/20 text-zinc-400 hover:text-red-400 transition-all shadow-lg border border-zinc-700/50"
                                title="Delete User"
                              >
                                <Trash2Icon size={16} />
                              </button>
                           </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
