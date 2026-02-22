"use client";

import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useState } from "react";
import { toast } from "@/components/toast";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	formatFileSize,
	MAX_IMAGE_SIZE,
	validateImage,
} from "@/lib/file-validation";
import { LoaderIcon, PencilIcon } from "./icons";

export function ProfileEditDialog() {
	const { data: session, update } = useSession();
	const router = useRouter();
	const [open, setOpen] = useState(false);
	const [loading, setLoading] = useState(false);

	const [name, setName] = useState(session?.user?.name || "");
	const [imageFile, setImageFile] = useState<File | null>(null);
	const [imagePreview, setImagePreview] = useState<string | null>(null);

	const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (!file) {
			return;
		}

		const validation = validateImage(file);
		if (!validation.valid) {
			toast({
				type: "error",
				description: validation.error || "File tidak valid",
			});
			return;
		}

		setImageFile(file);
		const reader = new FileReader();
		reader.onloadend = () => {
			setImagePreview(reader.result as string);
		};
		reader.readAsDataURL(file);
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setLoading(true);

		try {
			const formData = new FormData();
			formData.append("name", name);
			if (imageFile) {
				formData.append("image", imageFile);
			}

			const response = await fetch("/api/user/profile", {
				method: "PATCH",
				body: formData,
			});

			if (!response.ok) {
				const data = await response.json();
				throw new Error(data.error || "Gagal update profile");
			}

			const data = await response.json();

			// Update session
			await update({
				...session,
				user: {
					...session?.user,
					name: data.name,
					image: data.image,
				},
			});

			toast({ type: "success", description: "Profile berhasil diupdate!" });
			setOpen(false);
			router.refresh();
		} catch (error: any) {
			toast({ type: "error", description: error.message });
		} finally {
			setLoading(false);
		}
	};

	return (
		<Dialog onOpenChange={setOpen} open={open}>
			<DialogTrigger asChild>
				<Button size="sm" variant="ghost">
					<PencilIcon />
					Edit Profile
				</Button>
			</DialogTrigger>
			<DialogContent className="sm:max-w-[425px]">
				<DialogHeader>
					<DialogTitle>Edit Profile</DialogTitle>
					<DialogDescription>
						Update nama dan foto profile Anda
					</DialogDescription>
				</DialogHeader>
				<form className="space-y-4" onSubmit={handleSubmit}>
					<div className="space-y-2">
						<Label htmlFor="name">Nama</Label>
						<Input
							id="name"
							onChange={(e) => setName(e.target.value)}
							placeholder="Nama lengkap"
							value={name}
						/>
					</div>

					<div className="space-y-2">
						<Label htmlFor="image">Foto Profile</Label>
						<Input
							accept="image/*"
							id="image"
							onChange={handleImageChange}
							type="file"
						/>
						<p className="text-xs text-muted-foreground">
							Maksimal {formatFileSize(MAX_IMAGE_SIZE)} - JPG, PNG, GIF, atau
							WebP
						</p>
						{imagePreview && (
							<div className="mt-2">
								<img
									alt="Preview"
									className="h-20 w-20 rounded-full object-cover"
									src={imagePreview}
								/>
							</div>
						)}
					</div>

					<div className="flex gap-2 justify-end pt-4">
						<Button
							disabled={loading}
							onClick={() => setOpen(false)}
							type="button"
							variant="outline"
						>
							Batal
						</Button>
						<Button disabled={loading} type="submit">
							{loading && <LoaderIcon />}
							Simpan
						</Button>
					</div>
				</form>
			</DialogContent>
		</Dialog>
	);
}
