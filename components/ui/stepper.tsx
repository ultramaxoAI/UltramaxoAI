import { AnimatePresence, motion, type Variants } from "motion/react";
import React, {
	Children,
	type HTMLAttributes,
	type ReactNode,
	useLayoutEffect,
	useRef,
	useState,
} from "react";

interface StepperProps extends HTMLAttributes<HTMLDivElement> {
	children: ReactNode;
	initialStep?: number;
	onStepChange?: (step: number) => void;
	onFinalStepCompleted?: () => void;
	validateStep?: (step: number) => boolean;
	stepCircleContainerClassName?: string;
	stepContainerClassName?: string;
	contentClassName?: string;
	footerClassName?: string;
	backButtonProps?: React.ButtonHTMLAttributes<HTMLButtonElement>;
	nextButtonProps?: React.ButtonHTMLAttributes<HTMLButtonElement>;
	backButtonText?: string;
	nextButtonText?: string;
	disableStepIndicators?: boolean;
	renderStepIndicator?: (props: {
		step: number;
		currentStep: number;
		onStepClick: (clicked: number) => void;
	}) => ReactNode;
}

export default function Stepper({
	children,
	initialStep = 1,
	onStepChange = () => {},
	onFinalStepCompleted = () => {},
	validateStep,
	stepCircleContainerClassName = "",
	stepContainerClassName = "",
	contentClassName = "",
	footerClassName = "",
	backButtonProps = {},
	nextButtonProps = {},
	backButtonText = "Back",
	nextButtonText = "Continue",
	disableStepIndicators = false,
	renderStepIndicator,
	...rest
}: StepperProps) {
	const [currentStep, setCurrentStep] = useState<number>(initialStep);
	const [direction, setDirection] = useState<number>(0);
	const stepsArray = Children.toArray(children);
	const totalSteps = stepsArray.length;
	const isCompleted = currentStep > totalSteps;
	const isLastStep = currentStep === totalSteps;

	const updateStep = (newStep: number) => {
		setCurrentStep(newStep);
		if (newStep > totalSteps) {
			onFinalStepCompleted();
		} else {
			onStepChange(newStep);
		}
	};

	const handleBack = () => {
		if (currentStep > 1) {
			setDirection(-1);
			updateStep(currentStep - 1);
		}
	};

	const handleNext = () => {
		if (!isLastStep) {
			// Validate current step before proceeding
			if (validateStep && !validateStep(currentStep)) {
				return;
			}
			setDirection(1);
			updateStep(currentStep + 1);
		}
	};

	const handleComplete = () => {
		// Validate last step before completing
		if (validateStep && !validateStep(currentStep)) {
			return;
		}
		setDirection(1);
		updateStep(totalSteps + 1);
	};

	return (
		<div
			className="flex min-h-full flex-1 flex-col items-center justify-center p-4"
			{...rest}
		>
			<div
				className={`mx-auto w-full max-w-md rounded-lg border border-border bg-background shadow-lg ${stepCircleContainerClassName}`}
			>
				<div
					className={`${stepContainerClassName} flex w-full items-center p-6`}
				>
					{stepsArray.map((_, index) => {
						const stepNumber = index + 1;
						const isNotLastStep = index < totalSteps - 1;
						return (
							<React.Fragment key={stepNumber}>
								{renderStepIndicator ? (
									renderStepIndicator({
										step: stepNumber,
										currentStep,
										onStepClick: (clicked) => {
											setDirection(clicked > currentStep ? 1 : -1);
											updateStep(clicked);
										},
									})
								) : (
									<StepIndicator
										step={stepNumber}
										disableStepIndicators={disableStepIndicators}
										currentStep={currentStep}
										onClickStep={(clicked) => {
											setDirection(clicked > currentStep ? 1 : -1);
											updateStep(clicked);
										}}
									/>
								)}
								{isNotLastStep && (
									<StepConnector isComplete={currentStep > stepNumber} />
								)}
							</React.Fragment>
						);
					})}
				</div>

				<StepContentWrapper
					isCompleted={isCompleted}
					currentStep={currentStep}
					direction={direction}
					className={`space-y-4 px-6 ${contentClassName}`}
				>
					{stepsArray[currentStep - 1]}
				</StepContentWrapper>

				{!isCompleted && (
					<div className={`px-6 pb-6 ${footerClassName}`}>
						<div
							className={`mt-6 flex ${currentStep !== 1 ? "justify-between" : "justify-end"}`}
						>
							{currentStep !== 1 && (
								<button
									onClick={handleBack}
									className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
										currentStep === 1
											? "pointer-events-none opacity-50 text-gray-500"
											: "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800"
									}`}
									{...backButtonProps}
								>
									{backButtonText}
								</button>
							)}
							<button
								onClick={isLastStep ? handleComplete : handleNext}
								className="flex items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-200 text-gray-900 px-4 py-2 text-sm font-semibold transition hover:bg-gray-200 dark:hover:bg-gray-300 border border-gray-300 dark:border-gray-400 shadow-sm active:scale-[0.98]"
								{...nextButtonProps}
							>
								{isLastStep ? "Complete" : nextButtonText}
							</button>
						</div>
					</div>
				)}
			</div>
		</div>
	);
}

interface StepContentWrapperProps {
	isCompleted: boolean;
	currentStep: number;
	direction: number;
	children: ReactNode;
	className?: string;
}

function StepContentWrapper({
	isCompleted,
	currentStep,
	direction,
	children,
	className = "",
}: StepContentWrapperProps) {
	const [parentHeight, setParentHeight] = useState<number>(0);

	return (
		<motion.div
			style={{ position: "relative", overflow: "hidden" }}
			animate={{ height: isCompleted ? 0 : parentHeight }}
			transition={{ type: "spring", duration: 0.4 }}
			className={className}
		>
			<AnimatePresence initial={false} mode="sync" custom={direction}>
				{!isCompleted && (
					<SlideTransition
						key={currentStep}
						direction={direction}
						onHeightReady={(h) => setParentHeight(h)}
					>
						{children}
					</SlideTransition>
				)}
			</AnimatePresence>
		</motion.div>
	);
}

interface SlideTransitionProps {
	children: ReactNode;
	direction: number;
	onHeightReady: (height: number) => void;
}

function SlideTransition({
	children,
	direction,
	onHeightReady,
}: SlideTransitionProps) {
	const containerRef = useRef<HTMLDivElement | null>(null);

	useLayoutEffect(() => {
		if (containerRef.current) {
			onHeightReady(containerRef.current.offsetHeight);
		}
	}, [children, onHeightReady]);

	return (
		<motion.div
			ref={containerRef}
			custom={direction}
			variants={stepVariants}
			initial="enter"
			animate="center"
			exit="exit"
			transition={{ duration: 0.4 }}
			style={{ position: "absolute", left: 0, right: 0, top: 0 }}
		>
			{children}
		</motion.div>
	);
}

const stepVariants: Variants = {
	enter: (dir: number) => ({
		x: dir >= 0 ? "-100%" : "100%",
		opacity: 0,
	}),
	center: {
		x: "0%",
		opacity: 1,
	},
	exit: (dir: number) => ({
		x: dir >= 0 ? "50%" : "-50%",
		opacity: 0,
	}),
};

interface StepProps {
	children: ReactNode;
}

export function Step({ children }: StepProps) {
	return <div>{children}</div>;
}

interface StepIndicatorProps {
	step: number;
	currentStep: number;
	onClickStep: (clicked: number) => void;
	disableStepIndicators?: boolean;
}

function StepIndicator({
	step,
	currentStep,
	onClickStep,
	disableStepIndicators = false,
}: StepIndicatorProps) {
	const status =
		currentStep === step
			? "active"
			: currentStep < step
				? "inactive"
				: "complete";

	const handleClick = () => {
		if (step !== currentStep && !disableStepIndicators) {
			onClickStep(step);
		}
	};

	return (
		<motion.div
			onClick={handleClick}
			className="relative cursor-pointer outline-none focus:outline-none"
			animate={status}
			initial={false}
		>
			<motion.div
				variants={{
					inactive: {
						scale: 1,
						backgroundColor: "hsl(var(--muted))",
						color: "hsl(var(--muted-foreground))",
					},
					active: {
						scale: 1,
						backgroundColor: "hsl(var(--primary))",
						color: "hsl(var(--primary-foreground))",
					},
					complete: {
						scale: 1,
						backgroundColor: "hsl(var(--primary))",
						color: "hsl(var(--primary-foreground))",
					},
				}}
				transition={{ duration: 0.3 }}
				className="flex h-8 w-8 items-center justify-center rounded-full font-semibold"
			>
				{status === "complete" ? (
					<CheckIcon className="h-4 w-4" />
				) : status === "active" ? (
					<div className="h-3 w-3 rounded-full bg-background" />
				) : (
					<span className="text-sm">{step}</span>
				)}
			</motion.div>
		</motion.div>
	);
}

interface StepConnectorProps {
	isComplete: boolean;
}

function StepConnector({ isComplete }: StepConnectorProps) {
	const lineVariants: Variants = {
		incomplete: { width: 0, backgroundColor: "transparent" },
		complete: { width: "100%", backgroundColor: "hsl(var(--primary))" },
	};

	return (
		<div className="relative mx-2 h-0.5 flex-1 overflow-hidden rounded bg-muted">
			<motion.div
				className="absolute left-0 top-0 h-full"
				variants={lineVariants}
				initial={false}
				animate={isComplete ? "complete" : "incomplete"}
				transition={{ duration: 0.4 }}
			/>
		</div>
	);
}

interface CheckIconProps extends React.SVGProps<SVGSVGElement> {}

function CheckIcon(props: CheckIconProps) {
	return (
		<svg
			{...props}
			fill="none"
			stroke="currentColor"
			strokeWidth={2}
			viewBox="0 0 24 24"
		>
			<motion.path
				initial={{ pathLength: 0 }}
				animate={{ pathLength: 1 }}
				transition={{
					delay: 0.1,
					type: "tween",
					ease: "easeOut",
					duration: 0.3,
				}}
				strokeLinecap="round"
				strokeLinejoin="round"
				d="M5 13l4 4L19 7"
			/>
		</svg>
	);
}
