import { cn } from "@/shared/lib/cn";

export interface BrandLogoProps {
	className?: string;
	size?: "sm" | "md" | "lg";
	showText?: boolean;
	variant?: "light" | "dark";
}

export function BrandLogo({
	className,
	size = "md",
	showText = true,
	variant = "light",
}: BrandLogoProps) {
	const iconSizes = {
		sm: "h-8 w-8 text-xs",
		md: "h-10 w-10 text-sm",
		lg: "h-12 w-12 text-base",
	};

	return (
		<div className={cn("inline-flex items-center gap-2.5", className)}>
			<div
				className={cn(
					"rounded-xl bg-gradient-to-br from-emerald-600 to-emerald-700 text-white font-bold flex items-center justify-center shadow-md shadow-emerald-600/20 select-none",
					iconSizes[size],
				)}
			>
				{/* Stylized Punch / Click Icon */}
				<svg
					className="w-5 h-5 text-white"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					strokeWidth="2.2"
					strokeLinecap="round"
					strokeLinejoin="round"
					aria-hidden="true"
				>
					<path d="M15 6v12a3 3 0 1 0 3-3H6a3 3 0 1 0 3 3V6a3 3 0 1 0-3 3h12a3 3 0 1 0-3-3" />
				</svg>
			</div>

			{showText && (
				<div className="flex flex-col text-left">
					<span
						className={cn(
							"font-bold tracking-tight text-base sm:text-lg leading-tight",
							variant === "dark" ? "text-white" : "text-zinc-900",
						)}
					>
						Aqui Survey
					</span>
					<span className="text-2xs font-medium text-zinc-400 uppercase tracking-wider">
						Survey Suite
					</span>
				</div>
			)}
		</div>
	);
}
