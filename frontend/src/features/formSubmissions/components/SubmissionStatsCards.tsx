"use client";

import { CheckCircle2, Database, FileCheck, Layers } from "lucide-react";
import type { FormSubmission } from "../types/IFormSubmissionsApi";

export interface SubmissionStatsCardsProps {
	totalSources: number;
	submissions: FormSubmission[];
	activeKeysCount?: number;
}

export function SubmissionStatsCards({
	totalSources,
	submissions,
	activeKeysCount = 0,
}: SubmissionStatsCardsProps) {
	const totalSubmissions = submissions.length;

	// Calculate latest submission
	const latestSubmission =
		submissions.length > 0
			? submissions.reduce((prev, curr) => {
					const prevTime =
						typeof prev.createdAt === "object" && "millis" in prev.createdAt
							? prev.createdAt.millis
							: new Date(prev.createdAt).getTime();
					const currTime =
						typeof curr.createdAt === "object" && "millis" in curr.createdAt
							? curr.createdAt.millis
							: new Date(curr.createdAt).getTime();
					return currTime > prevTime ? curr : prev;
				})
			: null;

	const formatRelativeTime = (sub: FormSubmission | null) => {
		if (!sub) return "No submissions yet";
		const time =
			typeof sub.createdAt === "object" && "millis" in sub.createdAt
				? sub.createdAt.millis
				: new Date(sub.createdAt).getTime();
		const diffMinutes = Math.floor((Date.now() - time) / (1000 * 60));
		if (diffMinutes < 1) return "Just now";
		if (diffMinutes < 60) return `${diffMinutes}m ago`;
		const diffHours = Math.floor(diffMinutes / 60);
		if (diffHours < 24) return `${diffHours}h ago`;
		return `${Math.floor(diffHours / 24)}d ago`;
	};

	const cards = [
		{
			label: "Form Sources",
			value: totalSources,
			icon: Layers,
			color: "text-blue-600 bg-blue-50 border-blue-100",
			subtext: "Connected intake channels",
		},
		{
			label: "Total Submissions",
			value: totalSubmissions,
			icon: Database,
			color: "text-emerald-600 bg-emerald-50 border-emerald-100",
			subtext: "Responses recorded",
		},
		{
			label: "Active API Keys",
			value: activeKeysCount,
			icon: CheckCircle2,
			color: "text-amber-600 bg-amber-50 border-amber-100",
			subtext: "Authorized credentials",
		},
		{
			label: "Latest Activity",
			value: formatRelativeTime(latestSubmission),
			isText: true,
			icon: FileCheck,
			color: "text-purple-600 bg-purple-50 border-purple-100",
			subtext: latestSubmission
				? latestSubmission.email
				: "Awaiting first response",
		},
	];

	return (
		<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
			{cards.map((c) => {
				const Icon = c.icon;
				return (
					<div
						key={c.label}
						className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col justify-between"
					>
						<div className="flex items-center justify-between">
							<span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
								{c.label}
							</span>
							<div className={`p-2 rounded-lg border ${c.color}`}>
								<Icon className="w-4 h-4" />
							</div>
						</div>
						<div className="mt-3">
							<div
								className={`font-bold tracking-tight text-slate-900 ${
									c.isText ? "text-lg truncate" : "text-2xl"
								}`}
							>
								{c.value}
							</div>
							<p className="text-2xs text-slate-400 mt-1 truncate">
								{c.subtext}
							</p>
						</div>
					</div>
				);
			})}
		</div>
	);
}
