import type React from "react";
import { cn } from "@/shared/lib/cn";

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
	variant?: "rectangular" | "circular" | "text";
}

export function Skeleton({
	variant = "rectangular",
	className,
	...props
}: SkeletonProps) {
	return (
		<div
			className={cn(
				"animate-pulse bg-slate-200",
				variant === "circular" && "rounded-full",
				variant === "text" && "h-4 rounded-sm",
				variant === "rectangular" && "rounded-md",
				className,
			)}
			{...props}
		/>
	);
}

export function TableRowSkeleton({ columns = 4 }: { columns?: number }) {
	return (
		<div className="flex items-center gap-4 py-3 px-4 border-b border-slate-100 animate-pulse">
			{Array.from({ length: columns }).map((_, i) => (
				<Skeleton
					key={i}
					className={cn(
						"h-4",
						i === 0
							? "w-1/3"
							: i === 1
								? "w-1/4"
								: i === 2
									? "w-1/6"
									: "w-16 ml-auto",
					)}
				/>
			))}
		</div>
	);
}

export function CardSkeleton() {
	return (
		<div className="bg-white border border-slate-200 rounded-lg p-6 space-y-4 shadow-xs animate-pulse">
			<div className="flex items-center gap-3">
				<Skeleton variant="circular" className="h-10 w-10" />
				<div className="space-y-2 flex-1">
					<Skeleton className="h-4 w-1/2" />
					<Skeleton className="h-3 w-1/3" />
				</div>
			</div>
			<Skeleton className="h-12 w-full" />
			<div className="flex justify-between items-center pt-2">
				<Skeleton className="h-4 w-20" />
				<Skeleton className="h-8 w-24 rounded-md" />
			</div>
		</div>
	);
}
