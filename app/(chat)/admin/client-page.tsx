"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminDashboardClient() {
  const [formData, setFormData] = useState({
      code: '',
      type: 'PRO',
      value: 0,
      durationMonths: 1
  });
  const [message, setMessage] = useState('');

  const handleSubmit = async () => {
      try {
          const res = await fetch('/api/admin/vouchers', {
              method: 'POST',
              body: JSON.stringify(formData),
          });
          const data = await res.json();
          if (data.error) setMessage(data.error);
          else {
              setMessage('Voucher created successfully!');
              setFormData({...formData, code: ''}); 
          }
      } catch (e) {
          setMessage('Error creating voucher');
      }
  };

  return (
    <div className="flex flex-col p-8 min-h-screen bg-background text-foreground">
      <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>
      <div className="rounded-lg border border-border bg-card p-6 shadow-sm max-w-xl">
        <h2 className="text-xl font-semibold mb-4">Generate Voucher</h2>
        <div className="space-y-4">
            <div>
                <label className="text-sm font-medium">Code</label>
                <input 
                    className="w-full p-3 mt-1 border border-input rounded-md bg-transparent" 
                    placeholder="Code (e.g. PRO-2025)"
                    value={formData.code}
                    onChange={e => setFormData({...formData, code: e.target.value})}
                />
            </div>
            <div>
                <label className="text-sm font-medium">Type</label>
                <select 
                    className="w-full p-3 mt-1 border border-input rounded-md bg-transparent"
                    value={formData.type}
                    onChange={e => setFormData({...formData, type: e.target.value})}
                >
                    <option value="PRO">PRO Subscription</option>
                    <option value="CREDIT">Extra Credits</option>
                </select>
            </div>
            
            {formData.type === 'PRO' ? (
                 <div>
                    <label className="text-sm font-medium">Duration (Months)</label>
                    <input 
                        type="number"
                        className="w-full p-3 mt-1 border border-input rounded-md bg-transparent" 
                        placeholder="Duration (Months)"
                        value={formData.durationMonths}
                        onChange={e => setFormData({...formData, durationMonths: parseInt(e.target.value)})}
                    />
                 </div>
            ) : (
                <div>
                    <label className="text-sm font-medium">Credit Value</label>
                    <input 
                        type="number"
                        className="w-full p-3 mt-1 border border-input rounded-md bg-transparent" 
                        placeholder="Credits Amount"
                        value={formData.value}
                        onChange={e => setFormData({...formData, value: parseInt(e.target.value)})}
                    />
                </div>
            )}
            
            <button 
                onClick={handleSubmit} 
                className="w-full bg-foreground text-background p-3 rounded-md font-bold hover:opacity-90 transition-opacity"
            >
                Generate Voucher
            </button>
            {message && <p className="text-sm font-medium text-center mt-2">{message}</p>}
        </div>
      </div>
    </div>
  );
}
