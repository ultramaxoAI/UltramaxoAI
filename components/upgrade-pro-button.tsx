"use client";

import { CrownIcon } from "lucide-react";
import type { User } from "next-auth";
import { useState } from "react";
import { toast } from "sonner";
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

interface UpgradeProButtonProps {
  user: User;
  variant?: "default" | "minimal";
  customTrigger?: React.ReactNode;
}

const PLANS = [
  {
    id: "pro-1",
    name: "Pro - 1 Bulan",
    months: 1,
    price: 20_000,
    originalPrice: 20_000,
  },
  {
    id: "pro-3",
    name: "Pro - 3 Bulan",
    months: 3,
    price: 54_000,
    originalPrice: 60_000,
  },
  {
    id: "pro-6",
    name: "Pro - 6 Bulan",
    months: 6,
    price: 100_000,
    originalPrice: 120_000,
  },
  {
    id: "pro-12",
    name: "Pro - 12 Bulan (1 Tahun)",
    months: 12,
    price: 120_000,
    originalPrice: 240_000,
  },
];

export function UpgradeProButton({
  user,
  variant = "default",
  customTrigger,
}: UpgradeProButtonProps) {
  const [open, setOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<string>("");
  const [note, setNote] = useState("");

  const handleSubmit = () => {
    if (!selectedPlan) {
      toast.error("Pilih paket Pro terlebih dahulu");
      return;
    }

    const plan = PLANS.find((p) => p.id === selectedPlan);
    if (!plan) {
      return;
    }

    // Create WhatsApp message
    const message =
      "Halo, saya ingin upgrade ke paket Pro:\n\n" +
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

  // Render custom trigger if provided
  const TriggerButton = customTrigger ? (
    <div onClick={() => setOpen(true)}>{customTrigger}</div>
  ) : variant === "minimal" ? (
    <button
      className="px-3 py-1 text-xs font-medium text-gray-300 bg-transparent border border-white/20 rounded-full hover:bg-white/10 hover:text-white hover:border-white/30 transition-colors duration-200"
      onClick={() => setOpen(true)}
    >
      Upgrade
    </button>
  ) : (
    <Button
      className="relative bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-medium rounded-lg shadow-md hover:shadow-lg transition-all duration-200"
      onClick={() => setOpen(true)}
      size="sm"
    >
      <CrownIcon className="mr-2 h-4 w-4" />
      <span>Upgrade Plan</span>
    </Button>
  );

  return (
    <>
      {TriggerButton}

      <Dialog onOpenChange={setOpen} open={open}>
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
                <Label
                  className="text-sm font-semibold text-gray-300"
                  htmlFor="plan"
                >
                  Paket Pro
                </Label>
                <Select onValueChange={setSelectedPlan} value={selectedPlan}>
                  <SelectTrigger
                    className="bg-zinc-900/50 border-white/10 text-white rounded-xl h-12 hover:border-purple-500/50 transition-colors"
                    id="plan"
                  >
                    <SelectValue placeholder="Pilih paket" />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-900 border-white/10 backdrop-blur-xl">
                    {PLANS.map((plan) => (
                      <SelectItem
                        className="text-white hover:bg-white/10 focus:bg-white/10 rounded-lg my-1"
                        key={plan.id}
                        value={plan.id}
                      >
                        {plan.name} -{" "}
                        <span className="line-through text-gray-500">
                          Rp {plan.originalPrice.toLocaleString("id-ID")}
                        </span>{" "}
                        <span className="font-bold text-green-400">
                          Rp {plan.price.toLocaleString("id-ID")}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-3">
                <Label
                  className="text-sm font-semibold text-gray-300"
                  htmlFor="note"
                >
                  Catatan (Opsional)
                </Label>
                <Textarea
                  className="bg-zinc-900/50 border-white/10 text-white placeholder:text-gray-500 rounded-xl resize-none hover:border-purple-500/50 transition-colors focus:border-purple-500"
                  id="note"
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Tambahkan catatan jika diperlukan..."
                  rows={3}
                  value={note}
                />
              </div>

              {selectedPlan && (
                <div className="rounded-xl bg-gradient-to-br from-purple-500/10 to-blue-500/10 border border-purple-500/20 p-5 backdrop-blur-sm">
                  <h4 className="font-bold mb-3 text-purple-300 flex items-center gap-2">
                    <span className="w-1 h-4 bg-gradient-to-b from-purple-400 to-blue-400 rounded-full" />
                    Detail Paket
                  </h4>
                  <div className="text-sm space-y-2">
                    {PLANS.filter((p) => p.id === selectedPlan).map((plan) => (
                      <div className="space-y-2" key={plan.id}>
                        <div className="flex items-center justify-between text-gray-300">
                          <span>Durasi:</span>
                          <span className="font-semibold">
                            {plan.months} bulan
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-gray-400">
                          <span>Harga Normal:</span>
                          <span className="line-through">
                            Rp {plan.originalPrice.toLocaleString("id-ID")}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-white">
                            Harga Diskon:
                          </span>
                          <span className="font-bold text-xl bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
                            Rp {plan.price.toLocaleString("id-ID")}
                          </span>
                        </div>
                        <div className="pt-2 mt-2 border-t border-white/10">
                          <p className="text-xs text-green-400 font-semibold flex items-center gap-1">
                            <span className="inline-block w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                            Hemat Rp{" "}
                            {(plan.originalPrice - plan.price).toLocaleString(
                              "id-ID"
                            )}
                            !
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
                className="bg-zinc-900/50 border-white/10 text-gray-300 hover:bg-zinc-800 hover:text-white rounded-xl"
                onClick={() => setOpen(false)}
                variant="outline"
              >
                Batal
              </Button>
              <Button
                className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-xl shadow-lg shadow-purple-500/50 disabled:opacity-50 disabled:shadow-none font-bold"
                disabled={!selectedPlan}
                onClick={handleSubmit}
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
