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
  { id: "pro-1", name: "Pro - 1 Bulan", months: 1, price: 50000 },
  { id: "pro-3", name: "Pro - 3 Bulan", months: 3, price: 135000 },
  { id: "pro-6", name: "Pro - 6 Bulan", months: 6, price: 240000 },
  { id: "pro-12", name: "Pro - 12 Bulan", months: 12, price: 450000 },
];

export function UpgradeProButton({ user }: UpgradeProButtonProps) {
  const [open, setOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<string>("");
  const [note, setNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!selectedPlan) {
      toast.error("Pilih paket Pro terlebih dahulu");
      return;
    }

    const plan = PLANS.find((p) => p.id === selectedPlan);
    if (!plan) return;

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/user/upgrade-request", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          planId: plan.id,
          months: plan.months,
          price: plan.price,
          note,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Gagal mengirim request");
      }

      toast.success("Request upgrade Pro berhasil dikirim!");
      setOpen(false);
      setSelectedPlan("");
      setNote("");
    } catch (error: any) {
      toast.error(error.message || "Gagal mengirim request upgrade");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Don't show button if user is already pro
  if (user.type === "pro") {
    return null;
  }

  return (
    <>
      <Button
        onClick={() => setOpen(true)}
        className="w-full bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-600 hover:to-amber-600 text-white font-semibold"
        size="sm"
      >
        <CrownIcon className="mr-2 h-4 w-4" />
        Upgrade Pro
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CrownIcon className="h-5 w-5 text-yellow-500" />
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
                      {plan.name} - Rp {plan.price.toLocaleString("id-ID")}
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
                      <p className="font-semibold text-lg text-yellow-600">
                        Total: Rp {plan.price.toLocaleString("id-ID")}
                      </p>
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
              disabled={isSubmitting}
            >
              Batal
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting || !selectedPlan}
              className="bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-600 hover:to-amber-600"
            >
              {isSubmitting ? "Mengirim..." : "Kirim Request"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
