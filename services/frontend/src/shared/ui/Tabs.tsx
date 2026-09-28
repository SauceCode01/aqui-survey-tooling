"use client";

import type React from "react";
import { cn } from "@/shared/lib/cn";

export interface TabItem {
	id: string;
	label: string;
	count?: number;
	icon?: React.ReactNode;
}

export interface TabsProps {
	tabs: TabItem[];
	activeTab: string;
	onChange: (tabId: string) => void;
	className?: string;
}

export function Tabs({ tabs, activeTab, onChange, className }: TabsProps) {
	return (
		<div className={cn("border-b border-slate-200", className)}>
			<div
				className="-mb-px flex space-x-6 overflow-x-auto no-scrollbar"
				aria-label="Tabs"
				role="tablist"
			>
				{tabs.map((tab) => {
					const isActive = tab.id === activeTab;
					return (
						<button
							key={tab.id}
							role="tab"
							type="button"
							aria-selected={isActive}
							onClick={() => onChange(tab.id)}
							className={cn(
								"whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm inline-flex items-center gap-2 transition-colors select-none",
								isActive
									? "border-indigo-600 text-indigo-600 font-semibold"
									: "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300",
							)}
						>
							{tab.icon && <span className="shrink-0">{tab.icon}</span>}
							<span>{tab.label}</span>
							{typeof tab.count === "number" && (
								<span
									className={cn(
										"ml-1 py-0.5 px-2 rounded-full text-xs",
										isActive
											? "bg-indigo-100 text-indigo-700"
											: "bg-slate-100 text-slate-600",
									)}
								>
									{tab.count}
								</span>
							)}
						</button>
					);
				})}
			</div>
		</div>
	);
}
