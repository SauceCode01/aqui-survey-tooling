import type React from "react";
import { cn } from "@/shared/lib/cn";
import { FolderKanban } from "@/shared/lib/icons";
import { ActionButton } from "@/shared/ui/ActionButton";

export interface EmptyStateProps {
	icon?: React.ReactNode;
	title: string;
	description: string;
	actionLabel?: string;
	onAction?: () => void;
	action?: React.ReactNode;
	className?: string;
}

export function EmptyState({
	icon,
	title,
	description,
	actionLabel,
	onAction,
	action,
	className,
}: EmptyStateProps) {
	return (
		<div
			className={cn(
				"flex flex-col items-center justify-center text-center p-8 sm:p-12 bg-white rounded-lg border border-dashed border-slate-300",
				className,
			)}
		>
			<div className="h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-4">
				{icon || <FolderKanban className="h-6 w-6" />}
			</div>
			<h3 className="text-base font-semibold text-slate-900 mb-1">{title}</h3>
			<p className="text-sm text-slate-500 max-w-sm mb-6 leading-relaxed">
				{description}
			</p>
			{action ? (
				action
			) : actionLabel && onAction ? (
				<ActionButton variant="primary" size="md" onClick={onAction}>
					{actionLabel}
				</ActionButton>
			) : null}
		</div>
	);
}
