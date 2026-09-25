"use client";

import { Building2, Home, Mail, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type React from "react";
import { cn } from "@/shared/lib/cn";
import { Avatar } from "@/shared/ui/Avatar";
import { BrandLogo } from "@/shared/ui/BrandLogo";

export interface SidebarProps {
	isOpen: boolean;
	onClose: () => void;
	className?: string;
}

interface NavItem {
	label: string;
	href: string;
	icon: React.ComponentType<{ className?: string }>;
}

const NAV_ITEMS: NavItem[] = [
	{
		label: "Overview",
		href: "/",
		icon: Home,
	},
	{
		label: "Submission Sources",
		href: "/sources",
		icon: Building2,
	},
	{
		label: "Form Submissions",
		href: "/submissions",
		icon: Mail,
	},
];

export function Sidebar({ isOpen, onClose, className }: SidebarProps) {
	const pathname = usePathname();
	const userName = "Survey Admin";
	const userEmail = "admin@aquisurvey.io";

	return (
		<>
			{/* Mobile Backdrop */}
			{isOpen && (
				<button
					type="button"
					aria-label="Close navigation overlay"
					onClick={onClose}
					className="fixed inset-0 z-40 bg-zinc-900/50 backdrop-blur-xs lg:hidden transition-opacity cursor-pointer border-0"
				/>
			)}

			<aside
				className={cn(
					"fixed inset-y-0 left-0 z-50 w-64 bg-zinc-900 text-zinc-300 flex flex-col border-r border-zinc-800 transition-transform duration-200 ease-in-out lg:translate-x-0 shadow-xl lg:shadow-none",
					isOpen ? "translate-x-0" : "-translate-x-full",
					className,
				)}
			>
				{/* Brand Header */}
				<div className="h-16 px-5 flex items-center justify-between border-b border-zinc-800 bg-zinc-950/60">
					<Link
						href="/"
						className="flex items-center gap-2.5 hover:opacity-90 transition-opacity"
					>
						<BrandLogo size="sm" showText={true} variant="dark" />
					</Link>
					<button
						type="button"
						onClick={onClose}
						className="p-1.5 -mr-1.5 text-zinc-400 hover:text-white rounded-md hover:bg-zinc-800 lg:hidden cursor-pointer"
						aria-label="Close sidebar"
					>
						<X className="h-5 w-5" />
					</button>
				</div>

				{/* Navigation Links */}
				<nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
					<div className="px-3 py-1.5 text-xs font-semibold text-zinc-500 uppercase tracking-wider">
						Navigation
					</div>
					{NAV_ITEMS.map((item) => {
						const Icon = item.icon;
						const isActive =
							pathname === item.href ||
							(item.href !== "/" && pathname?.startsWith(item.href));

						return (
							<Link
								key={item.href}
								href={item.href}
								onClick={onClose}
								className={cn(
									"flex items-center gap-3 px-3 py-2.5 text-xs font-medium rounded-xl transition-colors group",
									isActive
										? "bg-emerald-600/20 text-emerald-400 font-semibold border border-emerald-500/30"
										: "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60",
								)}
							>
								<Icon
									className={cn(
										"h-4 w-4 shrink-0",
										isActive
											? "text-emerald-400"
											: "text-zinc-400 group-hover:text-zinc-200",
									)}
								/>
								<span className="flex-1">{item.label}</span>
							</Link>
						);
					})}
				</nav>

				{/* User Profile Footer */}
				<div className="p-3 border-t border-zinc-800 bg-zinc-950/40">
					<div className="flex items-center justify-between p-2 rounded-xl bg-zinc-800/40 border border-zinc-800">
						<div className="flex items-center gap-2.5 min-w-0">
							<Avatar name={userName} size="sm" />
							<div className="min-w-0 flex-1">
								<p className="text-xs font-medium text-zinc-200 truncate">
									{userName}
								</p>
								<p className="text-2xs text-zinc-500 truncate">{userEmail}</p>
							</div>
						</div>
					</div>
				</div>
			</aside>
		</>
	);
}
