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
        className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-semibold"
        size="sm"
      >
        <CrownIcon className="mr-2 h-4 w-4" />
        Upgrade Pro
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CrownIcon className="h-5 w-5 text-blue-500" />
              Upgrade ke Pro
            </DialogTitle>
            <DialogDescription>
              Pilih paket Pro yang sesuai dengan kebutuhan Anda. Admin akan
              meninjau request Anda dan memberikan instruksi pembayaran.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="plan">Paket Pro</Label>
              <Select value={selectedPlan} onValueChange={setSelectedPlan}>
                <SelectTrigger id="plan">
                  <SelectValue placeholder="Pilih paket" />
                </SelectTrigger>
                <SelectContent>
                  {PLANS.map((plan) => (
                    <SelectItem key={plan.id} value={plan.id}>
                      {plan.name} - <span className="line-through text-muted-foreground">Rp {plan.originalPrice.toLocaleString("id-ID")}</span> <span className="font-bold text-green-600">Rp {plan.price.toLocaleString("id-ID")}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="note">Catatan (Opsional)</Label>
              <Textarea
                id="note"
                placeholder="Tambahkan catatan jika diperlukan..."
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={3}
              />
            </div>

            {selectedPlan && (
              <div className="rounded-lg bg-muted p-4">
                <h4 className="font-semibold mb-2">Detail Paket</h4>
                <div className="text-sm space-y-1">
                  {PLANS.filter((p) => p.id === selectedPlan).map((plan) => (
                    <div key={plan.id}>
                      <p>Durasi: {plan.months} bulan</p>
                      <p className="text-muted-foreground">Harga Normal: <span className="line-through">Rp {plan.originalPrice.toLocaleString("id-ID")}</span></p>
                      <p className="font-semibold text-lg text-green-600">
                        Harga Diskon: Rp {plan.price.toLocaleString("id-ID")}
                      </p>
                      <p className="text-xs text-green-600 mt-1">Hemat Rp {(plan.originalPrice - plan.price).toLocaleString("id-ID")}!</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Batal
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!selectedPlan}
              className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700"
            >
              Beli Sekarang
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
