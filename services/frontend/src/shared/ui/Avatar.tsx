import React from "react";
import { cn } from "@/shared/lib/cn";

export type AvatarSize = "xs" | "sm" | "md" | "lg" | "xl";

export interface AvatarProps {
	src?: string | null;
	name?: string;
	alt?: string;
	size?: AvatarSize;
	className?: string;
}

const sizeClasses: Record<AvatarSize, { container: string; text: string }> = {
	xs: { container: "h-6 w-6 text-[10px]", text: "text-[10px]" },
	sm: { container: "h-8 w-8 text-xs", text: "text-xs" },
	md: { container: "h-10 w-10 text-sm", text: "text-sm font-medium" },
	lg: { container: "h-12 w-12 text-base", text: "text-base font-semibold" },
	xl: { container: "h-20 w-20 text-2xl", text: "text-2xl font-bold" },
};

function getInitials(name?: string): string {
	if (!name) return "U";
	const parts = name.trim().split(/\s+/);
	if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
	return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function Avatar({
	src,
	name = "User",
	alt,
	size = "md",
	className,
}: AvatarProps) {
	const { container, text } = sizeClasses[size];
	const initials = getInitials(name);

	return (
		<div
			className={cn(
				"relative inline-flex items-center justify-center shrink-0 rounded-full overflow-hidden select-none bg-indigo-100 text-indigo-700 font-semibold border border-indigo-200",
				container,
				className,
			)}
			title={name}
			role="img"
			aria-label={name}
		>
			{src ? (
				// eslint-disable-next-line @next/next/no-img-element
				<img
					src={src}
					alt={alt || name}
					className="h-full w-full object-cover"
				/>
			) : (
				<span className={text}>{initials}</span>
			)}
		</div>
	);
}

export interface AvatarGroupProps {
	children: React.ReactNode;
	max?: number;
	totalCount?: number;
	className?: string;
}

export function AvatarGroup({
	children,
	max = 4,
	totalCount,
	className,
}: AvatarGroupProps) {
	const childrenArray = React.Children.toArray(children);
	const visibleAvatars = childrenArray.slice(0, max);
	const remainingCount =
		(totalCount ?? childrenArray.length) - visibleAvatars.length;

	return (
		<div
			className={cn(
				"inline-flex items-center -space-x-2 overflow-hidden",
				className,
			)}
		>
			{visibleAvatars.map((child, index) => (
				<div key={index} className="ring-2 ring-white rounded-full">
					{child}
				</div>
			))}
			{remainingCount > 0 && (
				<div
					className="relative inline-flex items-center justify-center h-8 w-8 rounded-full bg-slate-200 text-slate-700 text-xs font-medium ring-2 ring-white select-none"
					title={`${remainingCount} more members`}
				>
					+{remainingCount}
				</div>
			)}
		</div>
	);
}
