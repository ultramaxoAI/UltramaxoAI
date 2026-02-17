"use client";

import { useState } from "react";
import { CrownIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import type { User } from "next-auth";

interface UpgradeProButtonProps {
  user: User;
}

const PLANS = [
  { id: "pro-1", name: "Pro - 1 Bulan", months: 1, price: 15000, originalPrice: 20000 },
  { id: "pro-3", name: "Pro - 3 Bulan", months: 3, price: 40500, originalPrice: 60000 },
  { id: "pro-6", name: "Pro - 6 Bulan", months: 6, price: 75000, originalPrice: 120000 },
  { id: "pro-12", name: "Pro - 12 Bulan", months: 12, price: 135000, originalPrice: 240000 },
];

export function UpgradeProButton({ user }: UpgradeProButtonProps) {
  const [open, setOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<string>("");
  const [note, setNote] = useState("");

  const handleSubmit = () => {
    if (!selectedPlan) {
      toast.error("Pilih paket Pro terlebih dahulu");
      return;
    }

    const plan = PLANS.find((p) => p.id === selectedPlan);
    if (!plan) return;

    // Create WhatsApp message
    const message = `Halo, saya ingin upgrade ke paket Pro:\n\n` +
      `📦 Paket: ${plan.name}\n` +
      `💰 Harga: Rp ${plan.price.toLocaleString("id-ID")}\n` +
      `⏱️ Durasi: ${plan.months} bulan\n` +
      `👤 Email: ${user.email}\n` +
      (note ? `\n📝 Catatan: ${note}` : "");

    // Encode message for URL
    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/6285191689131?text=${encodedMessage}`;

    // Open WhatsApp in new tab
    window.open(whatsappUrl, "_blank");
    
    toast.success("Membuka WhatsApp...");
    setOpen(false);
    setSelectedPlan("");
    setNote("");
  };

  // Don't show button if user is already pro
  if (user.type === "pro") {
    return null;
  }

  return (
    <>
      <Button
        onClick={() => setOpen(true)}
        className="relative bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-medium rounded-lg shadow-md hover:shadow-lg transition-all duration-200"
        size="sm"
      >
        <CrownIcon className="mr-2 h-4 w-4" />
        <span>Upgrade Plan</span>
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[500px] border-0 bg-black/40 backdrop-blur-2xl p-0 overflow-hidden shadow-2xl">
          <div className="relative border border-white/10 rounded-2xl bg-gradient-to-b from-zinc-900/90 to-black/90 p-6">
            <DialogHeader className="space-y-3">
              <DialogTitle className="flex items-center gap-3 text-2xl">
                <div className="p-2 rounded-xl bg-gradient-to-br from-purple-500 to-blue-500 shadow-lg shadow-purple-500/50">
                  <CrownIcon className="h-6 w-6 text-white" />
                </div>
                <span className="bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent font-bold">
                  Upgrade ke Pro
                </span>
              </DialogTitle>
              <DialogDescription className="text-gray-400 text-base leading-relaxed">
                Pilih paket Pro yang sesuai dengan kebutuhan Anda. Admin akan
                meninjau request Anda dan memberikan instruksi pembayaran.
              </DialogDescription>
            </DialogHeader>

          <div className="grid gap-6 py-6">
            <div className="grid gap-3">
              <Label htmlFor="plan" className="text-sm font-semibold text-gray-300">Paket Pro</Label>
              <Select value={selectedPlan} onValueChange={setSelectedPlan}>
                <SelectTrigger id="plan" className="bg-zinc-900/50 border-white/10 text-white rounded-xl h-12 hover:border-purple-500/50 transition-colors">
                  <SelectValue placeholder="Pilih paket" />
                </SelectTrigger>
                <SelectContent className="bg-zinc-900 border-white/10 backdrop-blur-xl">
                  {PLANS.map((plan) => (
                    <SelectItem key={plan.id} value={plan.id} className="text-white hover:bg-white/10 focus:bg-white/10 rounded-lg my-1">
                      {plan.name} - <span className="line-through text-gray-500">Rp {plan.originalPrice.toLocaleString("id-ID")}</span> <span className="font-bold text-green-400">Rp {plan.price.toLocaleString("id-ID")}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-3">
              <Label htmlFor="note" className="text-sm font-semibold text-gray-300">Catatan (Opsional)</Label>
              <Textarea
                id="note"
                placeholder="Tambahkan catatan jika diperlukan..."
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={3}
                className="bg-zinc-900/50 border-white/10 text-white placeholder:text-gray-500 rounded-xl resize-none hover:border-purple-500/50 transition-colors focus:border-purple-500"
              />
            </div>

            {selectedPlan && (
              <div className="rounded-xl bg-gradient-to-br from-purple-500/10 to-blue-500/10 border border-purple-500/20 p-5 backdrop-blur-sm">
                <h4 className="font-bold mb-3 text-purple-300 flex items-center gap-2">
                  <span className="w-1 h-4 bg-gradient-to-b from-purple-400 to-blue-400 rounded-full"></span>
                  Detail Paket
                </h4>
                <div className="text-sm space-y-2">
                  {PLANS.filter((p) => p.id === selectedPlan).map((plan) => (
                    <div key={plan.id} className="space-y-2">
                      <div className="flex items-center justify-between text-gray-300">
                        <span>Durasi:</span>
                        <span className="font-semibold">{plan.months} bulan</span>
                      </div>
                      <div className="flex items-center justify-between text-gray-400">
                        <span>Harga Normal:</span>
                        <span className="line-through">Rp {plan.originalPrice.toLocaleString("id-ID")}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-white">Harga Diskon:</span>
                        <span className="font-bold text-xl bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
                          Rp {plan.price.toLocaleString("id-ID")}
                        </span>
                      </div>
                      <div className="pt-2 mt-2 border-t border-white/10">
                        <p className="text-xs text-green-400 font-semibold flex items-center gap-1">
                          <span className="inline-block w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                          Hemat Rp {(plan.originalPrice - plan.price).toLocaleString("id-ID")}!
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="gap-3">
            <Button
              variant="outline"
              onClick={() => setOpen(false)}
              className="bg-zinc-900/50 border-white/10 text-gray-300 hover:bg-zinc-800 hover:text-white rounded-xl"
            >
              Batal
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!selectedPlan}
              className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-xl shadow-lg shadow-purple-500/50 disabled:opacity-50 disabled:shadow-none font-bold"
            >
              Beli Sekarang
            </Button>
          </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
