import { cn } from "@/shared/lib/cn";
import type { TaskStatus } from "@/types/domain";

export type StatusType = TaskStatus | "SYNCED" | "SYNCING" | "FAILED" | string;

export interface StatusPillProps {
	status: StatusType;
	label?: string;
	size?: "sm" | "md";
	showDot?: boolean;
	className?: string;
}

interface StatusConfig {
	bg: string;
	text: string;
	border: string;
	dotBg: string;
	defaultLabel: string;
}

const statusConfigs: Record<string, StatusConfig> = {
	DONE: {
		bg: "bg-emerald-50",
		text: "text-emerald-700",
		border: "border-emerald-200",
		dotBg: "bg-emerald-500",
		defaultLabel: "Done",
	},
	IN_PROGRESS: {
		bg: "bg-sky-50",
		text: "text-sky-700",
		border: "border-sky-200",
		dotBg: "bg-sky-500",
		defaultLabel: "In Progress",
	},
	BLOCKED: {
		bg: "bg-red-50",
		text: "text-red-700",
		border: "border-red-200",
		dotBg: "bg-red-500",
		defaultLabel: "Blocked",
	},
	TODO: {
		bg: "bg-slate-100",
		text: "text-slate-700",
		border: "border-slate-200",
		dotBg: "bg-slate-400",
		defaultLabel: "To Do",
	},
	SYNCED: {
		bg: "bg-emerald-50",
		text: "text-emerald-700",
		border: "border-emerald-200",
		dotBg: "bg-emerald-500",
		defaultLabel: "Synced",
	},
	SYNCING: {
		bg: "bg-amber-50",
		text: "text-amber-700",
		border: "border-amber-200",
		dotBg: "bg-amber-500",
		defaultLabel: "Syncing...",
	},
	FAILED: {
		bg: "bg-red-50",
		text: "text-red-700",
		border: "border-red-200",
		dotBg: "bg-red-500",
		defaultLabel: "Conflicts",
	},
};

export function StatusPill({
	status,
	label,
	size = "md",
	showDot = true,
	className,
}: StatusPillProps) {
	const normalizedKey = (status || "").toUpperCase().replace(/\s+/g, "_");
	const config = statusConfigs[normalizedKey] || {
		bg: "bg-slate-100",
		text: "text-slate-700",
		border: "border-slate-200",
		dotBg: "bg-slate-400",
		defaultLabel: status,
	};

	const displayText = label || config.defaultLabel;

	return (
		<span
			className={cn(
				"inline-flex items-center gap-1.5 font-medium border rounded-full select-none transition-colors",
				config.bg,
				config.text,
				config.border,
				size === "sm"
					? "px-2 py-0.5 text-xs"
					: "px-2.5 py-1 text-xs sm:text-sm",
				className,
			)}
		>
			{showDot && (
				<span
					className={cn(
						"h-1.5 w-1.5 rounded-full shrink-0",
						config.dotBg,
						normalizedKey === "SYNCING" && "animate-pulse",
						normalizedKey === "FAILED" && "animate-ping",
					)}
				/>
			)}
			<span>{displayText}</span>
		</span>
	);
}
