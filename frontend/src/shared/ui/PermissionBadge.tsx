import { cn } from "@/shared/lib/cn";
import type { Permission } from "@/types/domain";

export interface PermissionBadgeProps {
	permission: Permission | string;
	className?: string;
}

export function PermissionBadge({
	permission,
	className,
}: PermissionBadgeProps) {
	const perm = (permission || "").toUpperCase();

	let colorClasses = "bg-slate-100 text-slate-700 border-slate-200";

	if (perm === "OWNER" || perm === "LEADER") {
		colorClasses = "bg-indigo-100 text-indigo-700 border-indigo-200";
	} else if (perm === "OVERSEER" || perm === "HEAD") {
		colorClasses = "bg-purple-100 text-purple-700 border-purple-200";
	} else if (perm === "MANAGE_ACCESS") {
		colorClasses = "bg-amber-100 text-amber-700 border-amber-200";
	} else if (perm === "DELETE") {
		colorClasses = "bg-red-100 text-red-700 border-red-200";
	} else if (perm === "CREATE" || perm === "EDIT") {
		colorClasses = "bg-sky-100 text-sky-700 border-sky-200";
	}

	return (
		<span
			className={cn(
				"inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider border select-none",
				colorClasses,
				className,
			)}
		>
			{permission}
		</span>
	);
}
