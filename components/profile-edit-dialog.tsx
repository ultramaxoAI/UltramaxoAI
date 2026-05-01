"use client";

import {
	formatFileSize,
	MAX_IMAGE_SIZE,
	validateImage,
} from "@backend/file-validation";
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
				description: validation.error || "Invalid file",
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
				throw new Error(data.error || "Failed to update profile");
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

			toast({ type: "success", description: "Profile successfully updated!" });
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
				<button
					type="button"
					className="relative flex w-full cursor-pointer select-none items-center rounded-lg px-2 py-1.5 text-sm outline-none transition-colors hover:bg-zinc-100 focus:bg-zinc-100 dark:hover:bg-zinc-800 dark:focus:bg-zinc-800 gap-2"
				>
					<span className="h-4 w-4 flex items-center justify-center">
						<PencilIcon />
					</span>
					Edit Profile
				</button>
			</DialogTrigger>
			<DialogContent className="sm:max-w-[425px]">
				<DialogHeader>
					<DialogTitle>Edit Profile</DialogTitle>
					<DialogDescription>
						Update your name and profile photo
					</DialogDescription>
				</DialogHeader>
				<form className="space-y-4" onSubmit={handleSubmit}>
					<div className="space-y-2">
						<Label htmlFor="name">Name</Label>
						<Input
							id="name"
							onChange={(e) => setName(e.target.value)}
							placeholder="Full name"
							value={name}
						/>
					</div>

					<div className="space-y-2">
						<Label htmlFor="image">Profile Photo</Label>
						<Input
							accept="image/*"
							id="image"
							onChange={handleImageChange}
							type="file"
						/>
						<p className="text-xs text-muted-foreground">
							Maximum {formatFileSize(MAX_IMAGE_SIZE)} - JPG, PNG, GIF, or WebP
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
							Cancel
						</Button>
						<Button disabled={loading} type="submit">
							{loading && <LoaderIcon />}
							Save
						</Button>
					</div>
				</form>
			</DialogContent>
		</Dialog>
	);
}
