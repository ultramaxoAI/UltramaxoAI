"use client";

import { useControllableState } from "@radix-ui/react-use-controllable-state";
import { CheckIcon, ChevronDownIcon, LoaderIcon } from "lucide-react";
import type { ComponentProps } from "react";
import {
	createContext,
	memo,
	useCallback,
	useContext,
	useEffect,
	useRef,
	useState,
} from "react";
import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import { Response } from "./response";

type ReasoningContextValue = {
	isStreaming: boolean;
	isOpen: boolean;
	setIsOpen: (open: boolean) => void;
	/** Final duration in seconds (set after streaming ends). */
	duration: number;
	/** Live elapsed seconds that tick every second during streaming. */
	elapsedSeconds: number;
};

const ReasoningContext = createContext<ReasoningContextValue | null>(null);

const useReasoning = () => {
	const context = useContext(ReasoningContext);
	if (!context) {
		throw new Error("Reasoning components must be used within Reasoning");
	}
	return context;
};

export type ReasoningProps = ComponentProps<typeof Collapsible> & {
	isStreaming?: boolean;
	open?: boolean;
	defaultOpen?: boolean;
	onOpenChange?: (open: boolean) => void;
	duration?: number;
};

const AUTO_CLOSE_DELAY = 500;
const MS_IN_S = 1000;

export const Reasoning = memo(
	({
		className,
		isStreaming = false,
		open,
		defaultOpen = true,
		onOpenChange,
		duration: durationProp,
		children,
		...props
	}: ReasoningProps) => {
		const [isOpen, setIsOpen] = useControllableState({
			prop: open,
			defaultProp: defaultOpen,
			onChange: onOpenChange,
		});
		const [duration, setDuration] = useControllableState({
			prop: durationProp,
			defaultProp: 0,
		});

		const [hasAutoClosedRef, setHasAutoClosedRef] = useState(false);
		const [startTime, setStartTime] = useState<number | null>(null);
		const [elapsedSeconds, setElapsedSeconds] = useState(0);
		const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

		// Track duration when streaming starts and ends
		useEffect(() => {
			if (isStreaming) {
				if (startTime === null) {
					const now = Date.now();
					setStartTime(now);
					setElapsedSeconds(0);
				}
			} else if (startTime !== null) {
				setDuration(Math.round((Date.now() - startTime) / MS_IN_S));
				setStartTime(null);
			}
		}, [isStreaming, startTime, setDuration]);

		// Live elapsed timer — ticks every second while streaming
		useEffect(() => {
			if (isStreaming && startTime !== null) {
				// Tick immediately then every second
				const tick = () => {
					setElapsedSeconds(Math.round((Date.now() - startTime) / MS_IN_S));
				};
				tick();
				intervalRef.current = setInterval(tick, MS_IN_S);

				return () => {
					if (intervalRef.current) {
						clearInterval(intervalRef.current);
						intervalRef.current = null;
					}
				};
			}
			// Clear interval when not streaming
			if (intervalRef.current) {
				clearInterval(intervalRef.current);
				intervalRef.current = null;
			}
		}, [isStreaming, startTime]);

		// Auto-open when streaming starts, auto-close when streaming ends (once only)
		useEffect(() => {
			if (defaultOpen && !isStreaming && isOpen && !hasAutoClosedRef) {
				// Add a small delay before closing to allow user to see the content
				const timer = setTimeout(() => {
					setIsOpen(false);
					setHasAutoClosedRef(true);
				}, AUTO_CLOSE_DELAY);

				return () => clearTimeout(timer);
			}
		}, [isStreaming, isOpen, defaultOpen, setIsOpen, hasAutoClosedRef]);

		const handleOpenChange = useCallback(
			(newOpen: boolean) => {
				setIsOpen(newOpen);
			},
			[setIsOpen],
		);

		return (
			<ReasoningContext.Provider
				value={{ isStreaming, isOpen, setIsOpen, duration, elapsedSeconds }}
			>
				<Collapsible
					className={cn("not-prose", className)}
					onOpenChange={handleOpenChange}
					open={isOpen}
					{...props}
				>
					{children}
				</Collapsible>
			</ReasoningContext.Provider>
		);
	},
);

export type ReasoningTriggerProps = ComponentProps<typeof CollapsibleTrigger>;

export const ReasoningTrigger = memo(
	({ className, children, ...props }: ReasoningTriggerProps) => {
		const { isStreaming, isOpen, duration, elapsedSeconds } = useReasoning();

		const displaySeconds = isStreaming ? elapsedSeconds : duration;

		return (
			<CollapsibleTrigger
				className={cn(
					"flex items-center gap-1.5 rounded-md px-2 py-1 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
					className,
				)}
				{...props}
			>
				{children ?? (
					<>
						{isStreaming ? (
							<LoaderIcon className="size-3.5 animate-spin" />
						) : (
							<CheckIcon className="size-3.5 text-emerald-500 dark:text-emerald-400" />
						)}
						<span className="font-medium">
							{isStreaming
								? `Thinking for ${displaySeconds}s`
								: `Worked for ${displaySeconds}s`}
						</span>
						<ChevronDownIcon
							className={cn(
								"size-3 transition-transform duration-200",
								isOpen ? "rotate-180" : "rotate-0",
							)}
						/>
					</>
				)}
			</CollapsibleTrigger>
		);
	},
);

export type ReasoningContentProps = ComponentProps<
	typeof CollapsibleContent
> & {
	children: string;
};

export const ReasoningContent = memo(
	({ className, children, ...props }: ReasoningContentProps) => {
		const { isStreaming } = useReasoning();
		const scrollRef = useRef<HTMLDivElement>(null);

		// Auto-scroll to bottom while streaming
		useEffect(() => {
			if (isStreaming && scrollRef.current) {
				scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
			}
		}, [isStreaming]);

		return (
			<CollapsibleContent
				className={cn(
					"mt-1.5 text-[11px] text-muted-foreground leading-relaxed",
					"data-[state=closed]:fade-out-0 data-[state=closed]:slide-out-to-top-2 data-[state=open]:slide-in-from-top-2 outline-hidden data-[state=closed]:animate-out data-[state=open]:animate-in",
					className,
				)}
				{...props}
			>
				<div
					className="max-h-48 overflow-y-auto rounded-md border border-border/50 bg-muted/30 p-2.5"
					ref={scrollRef}
				>
					<Response className="grid gap-1 text-[11px] **:text-[11px] [&_li]:my-0 [&_ol]:my-1 [&_p]:my-0 [&_ul]:my-1">
						{children}
					</Response>
				</div>
			</CollapsibleContent>
		);
	},
);

Reasoning.displayName = "Reasoning";
ReasoningTrigger.displayName = "ReasoningTrigger";
ReasoningContent.displayName = "ReasoningContent";
