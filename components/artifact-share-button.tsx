"use client";

import { Share2Icon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export function ArtifactShareButton({
	documentId,
	defaultShared,
}: {
	documentId: string;
	defaultShared: boolean;
}) {
	const [isShared, setIsShared] = useState(defaultShared);
	const [loading, setLoading] = useState(false);
	const [confirmOpen, setConfirmOpen] = useState(false);

	const handleShare = async (nextShared: boolean) => {
		setLoading(true);
		try {
			const response = await fetch("/api/document/share", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ id: documentId, isShared: nextShared }),
			});

			if (!response.ok) {
				throw new Error();
			}

			setIsShared(nextShared);

			if (nextShared) {
				const url = `${window.location.origin}/share/artifact/${documentId}`;
				await navigator.clipboard.writeText(url);
				toast.success("Artifact share link copied");
			} else {
				toast.success("Artifact sharing disabled");
			}
		} catch {
			toast.error("Failed to update artifact sharing");
		} finally {
			setLoading(false);
		}
	};

	const handleButtonClick = () => {
		if (isShared) {
			setConfirmOpen(true);
			return;
		}

		void handleShare(true);
	};

	return (
		<>
			<Button
				className="h-fit rounded-full px-4 py-1.5 text-sm"
				disabled={loading}
				onClick={handleButtonClick}
				type="button"
				variant="outline"
			>
				<Share2Icon className="mr-1.5 h-4 w-4" />
				{isShared ? "Unshare" : "Share"}
			</Button>

			<AlertDialog onOpenChange={setConfirmOpen} open={confirmOpen}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Disable artifact sharing?</AlertDialogTitle>
						<AlertDialogDescription>
							Anyone with the current artifact link will lose access after this action.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>Cancel</AlertDialogCancel>
						<AlertDialogAction
							onClick={() => {
								setConfirmOpen(false);
								void handleShare(false);
							}}
						>
							Disable sharing
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</>
	);
}
