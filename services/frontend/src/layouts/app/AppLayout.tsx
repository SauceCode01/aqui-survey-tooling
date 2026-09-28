"use client";

import type React from "react";
import { useState } from "react";
import { Sidebar } from "@/layouts/app/components/Sidebar";
import { TopNavbar } from "@/layouts/app/components/TopNavbar";
import { cn } from "@/shared/lib/cn";
import type { BreadcrumbItem } from "@/types/navigation";

export interface AppLayoutProps {
	children: React.ReactNode;
	breadcrumbs?: BreadcrumbItem[];
	className?: string;
}

export function AppLayout({
	children,
	breadcrumbs = [],
	className,
}: AppLayoutProps) {
	const [isSidebarOpen, setIsSidebarOpen] = useState(false);

	return (
		<div className="min-h-screen bg-slate-50 flex flex-col text-slate-900">
			{/* Primary Sidebar (Fixed desktop / Drawer mobile) */}
			<Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

			{/* Main layout container (offset by 256px on desktop lg:) */}
			<div className="lg:pl-64 flex flex-col flex-1 min-w-0">
				<TopNavbar
					onToggleSidebar={() => setIsSidebarOpen((prev) => !prev)}
					breadcrumbs={breadcrumbs}
				/>

				{/* Page Content Body */}
				<main
					className={cn(
						"flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto min-w-0",
						className,
					)}
				>
					{children}
				</main>
			</div>
		</div>
	);
}
