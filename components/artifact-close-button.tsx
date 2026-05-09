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
	const artifactUiState = useArtifactUiState();
	const isIdeLocked = artifactUiState?.uiState?.isIdeLocked ?? false;

	if (isIdeLocked) {
		return null;
	}

	return (
		<Button
			className="h-10 w-10 rounded-full border-white/[0.08] bg-white/[0.04] p-0 text-white/65 backdrop-blur transition-colors hover:bg-white/[0.08] hover:text-white/90"
			data-testid="artifact-close-button"
			onClick={() => {
				setArtifact((currentArtifact) => ({
					...(currentArtifact ?? initialArtifactData),
					isVisible: false,
				}));
			}}
			variant="outline"
		>
			<CrossIcon size={18} />
		</Button>
	);
}

export const ArtifactCloseButton = memo(PureArtifactCloseButton, () => true);
