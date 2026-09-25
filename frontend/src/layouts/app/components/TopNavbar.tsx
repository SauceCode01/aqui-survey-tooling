"use client";

import { Menu } from "lucide-react";
import { Avatar } from "@/shared/ui/Avatar";
import { Breadcrumbs } from "@/shared/ui/Breadcrumbs";
import type { BreadcrumbItem } from "@/types/navigation";

export interface TopNavbarProps {
	onToggleSidebar: () => void;
	breadcrumbs?: BreadcrumbItem[];
}

export function TopNavbar({
	onToggleSidebar,
	breadcrumbs = [],
}: TopNavbarProps) {
	const userName = "Survey Admin";
	const userEmail = "admin@aquisurvey.io";

	return (
		<header className="sticky top-0 z-30 h-16 bg-white border-b border-zinc-200 px-4 lg:px-8 flex items-center justify-between shadow-2xs">
			{/* Left section: Mobile menu toggle + Breadcrumbs */}
			<div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1 mr-4">
				<button
					type="button"
					onClick={onToggleSidebar}
					className="p-2 -ml-2 text-zinc-500 hover:text-zinc-900 rounded-md hover:bg-zinc-100 lg:hidden shrink-0 cursor-pointer"
					aria-label="Open sidebar menu"
				>
					<Menu className="h-5 w-5" />
				</button>

				{/* Breadcrumb path */}
				<div className="min-w-0 flex-1">
					<Breadcrumbs items={breadcrumbs} />
				</div>
			</div>

			{/* Right Section: User Profile */}
			<div className="flex items-center gap-3 shrink-0">
				<div className="flex items-center gap-2 p-1.5 pl-3 text-sm text-zinc-700 rounded-full">
					<div className="text-right hidden sm:block">
						<p className="text-xs font-semibold text-zinc-800 leading-none">
							{userName}
						</p>
						<p className="text-2xs text-zinc-400 mt-0.5 leading-none">
							{userEmail}
						</p>
					</div>
					<Avatar name={userName} size="sm" />
				</div>
			</div>
		</header>
	);
}
