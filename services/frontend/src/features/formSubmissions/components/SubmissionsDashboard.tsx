"use client";

import { Filter, RefreshCw } from "lucide-react";
import { useState } from "react";
import { ActionButton } from "@/shared/ui/ActionButton";
import { useFormSubmissions } from "../hooks/useFormSubmissions";
import { SubmissionStatsCards } from "./SubmissionStatsCards";
import { SubmissionsTable } from "./SubmissionsTable";

export interface SubmissionsDashboardProps {
	initialSourceId?: string;
	sources: Array<{ id: string; name: string }>;
	activeKeysCount?: number;
}

export function SubmissionsDashboard({
	initialSourceId,
	sources,
	activeKeysCount = 0,
}: SubmissionsDashboardProps) {
	const [selectedSourceId, setSelectedSourceId] = useState<string>(
		initialSourceId || "",
	);
	const { submissions, isLoading, fetchSubmissions, deleteSubmission } =
		useFormSubmissions(selectedSourceId || undefined);

	const sourceNamesById = sources.reduce<Record<string, string>>((acc, s) => {
		acc[s.id] = s.name;
		return acc;
	}, {});

	return (
		<div className="space-y-6">
			{/* Top Header & Source Filter */}
			<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
				<div>
					<h2 className="text-xl font-bold tracking-tight text-slate-900">
						Form Submissions Dashboard
					</h2>
					<p className="text-xs text-slate-500 mt-1">
						Browse responses and survey records across all integrated sources.
					</p>
				</div>

				<div className="flex items-center gap-2">
					<div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-slate-600 shadow-2xs">
						<Filter className="w-3.5 h-3.5 text-slate-400" />
						<select
							value={selectedSourceId}
							onChange={(e) => setSelectedSourceId(e.target.value)}
							className="bg-transparent text-xs font-medium text-slate-800 focus:outline-hidden cursor-pointer"
						>
							<option value="">All Sources</option>
							{sources.map((s) => (
								<option key={s.id} value={s.id}>
									{s.name}
								</option>
							))}
						</select>
					</div>

					<ActionButton
						variant="secondary"
						size="sm"
						leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
						onClick={() => fetchSubmissions()}
						isLoading={isLoading}
					>
						Refresh
					</ActionButton>
				</div>
			</div>

			{/* KPI Stats */}
			<SubmissionStatsCards
				totalSources={sources.length}
				submissions={submissions}
				activeKeysCount={activeKeysCount}
			/>

			{/* Submissions Data Table */}
			<SubmissionsTable
				submissions={submissions}
				isLoading={isLoading}
				sourceNamesById={sourceNamesById}
				onDeleteSubmission={async (id) => {
					await deleteSubmission(id);
				}}
			/>
		</div>
	);
}
