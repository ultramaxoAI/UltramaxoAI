import { memo } from "react";
import {
	initialArtifactData,
	useArtifact,
	useArtifactUiState,
} from "@/hooks/use-artifact";
import { CrossIcon } from "./icons";
import { Button } from "./ui/button";

function PureArtifactCloseButton() {
	const { setArtifact } = useArtifact();
	const {
		uiState: { isIdeLocked },
	} = useArtifactUiState();

	if (isIdeLocked) {
		return null;
	}

	return (
		<Button
			className="h-10 w-10 rounded-full border-zinc-800/80 bg-zinc-900/80 p-0 text-zinc-100 backdrop-blur hover:bg-zinc-800 dark:hover:bg-zinc-700"
			data-testid="artifact-close-button"
			onClick={() => {
				setArtifact((currentArtifact) =>
					currentArtifact.status === "streaming"
						? {
								...currentArtifact,
								isVisible: false,
							}
						: { ...initialArtifactData, status: "idle" },
				);
			}}
			variant="outline"
		>
			<CrossIcon size={18} />
		</Button>
	);
}

export const ArtifactCloseButton = memo(PureArtifactCloseButton, () => true);
