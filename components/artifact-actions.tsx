import { type Dispatch, memo, type SetStateAction, useState } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { artifactDefinitions, type UIArtifact } from "./artifact";
import type { ArtifactActionContext } from "./create-artifact";
import { Button } from "./ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";

type ArtifactActionsProps = {
	artifact?: UIArtifact | null;
	handleVersionChange: (type: "next" | "prev" | "toggle" | "latest") => void;
	currentVersionIndex: number;
	isCurrentVersion: boolean;
	mode: "edit" | "diff";
	metadata: any;
	setMetadata: Dispatch<SetStateAction<any>>;
};

function PureArtifactActions({
	artifact,
	handleVersionChange,
	currentVersionIndex,
	isCurrentVersion,
	mode,
	metadata,
	setMetadata,
}: ArtifactActionsProps) {
	const [isLoading, setIsLoading] = useState(false);
	const safeArtifact = artifact ?? null;

	const artifactDefinition = safeArtifact
		? artifactDefinitions.find(
				(definition) => definition.kind === safeArtifact.kind,
			)
		: null;

	if (!artifactDefinition) {
		return null;
	}

	const actionContext: ArtifactActionContext = {
		content: safeArtifact?.content ?? "",
		handleVersionChange,
		currentVersionIndex,
		isCurrentVersion,
		mode,
		metadata,
		setMetadata,
	};

	return (
		<div className="flex flex-row gap-2">
			{artifactDefinition.actions.map((action) => (
				<Tooltip key={action.description}>
					<TooltipTrigger asChild>
						<Button
							className={cn(
								"h-fit rounded-lg text-sm transition-all",
								{
									"p-2": !action.label,
									"px-4 py-1.5": action.label,
								},
								action.label
									? "bg-white text-[#0b0d10] hover:bg-white/90"
									: "border-white/[0.08] bg-white/[0.03] text-white/35 hover:bg-white/[0.06] hover:text-white/75",
							)}
							disabled={
								isLoading || safeArtifact?.status === "streaming"
									? true
									: action.isDisabled
										? action.isDisabled(actionContext)
										: false
							}
							onClick={async () => {
								setIsLoading(true);

								try {
									await Promise.resolve(action.onClick(actionContext));
								} catch (_error) {
									toast.error("Failed to execute action");
								} finally {
									setIsLoading(false);
								}
							}}
							variant={action.label ? "default" : "outline"}
						>
							{action.icon}
							{action.label && (
								<span className="ml-1.5 font-medium">{action.label}</span>
							)}
						</Button>
					</TooltipTrigger>
					<TooltipContent>{action.description}</TooltipContent>
				</Tooltip>
			))}
		</div>
	);
}

export const ArtifactActions = memo(
	PureArtifactActions,
	(prevProps, nextProps) => {
		if (prevProps.artifact?.status !== nextProps.artifact?.status) {
			return false;
		}
		if (prevProps.currentVersionIndex !== nextProps.currentVersionIndex) {
			return false;
		}
		if (prevProps.isCurrentVersion !== nextProps.isCurrentVersion) {
			return false;
		}
		if (prevProps.artifact?.content !== nextProps.artifact?.content) {
			return false;
		}

		return true;
	},
);
