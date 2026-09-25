"use client";

import { Key, Plus, RefreshCw } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import {
	SubmissionStatsCards,
	SubmissionsTable,
} from "@/features/formSubmissions/components";
import { useFormSubmissions } from "@/features/formSubmissions/hooks/useFormSubmissions";
import {
	CreateSourceModal,
	KeyManagementModal,
	SourcesList,
} from "@/features/submissionSources/components";
import {
	useSourceKeys,
	useSubmissionSources,
} from "@/features/submissionSources/hooks/useSubmissionSources";
import type { SubmissionSource } from "@/features/submissionSources/types/ISubmissionSourcesApi";
import { AppLayout } from "@/layouts/app/AppLayout";
import { ActionButton } from "@/shared/ui/ActionButton";

export default function DashboardPage() {
	const {
		sources,
		isLoading: sourcesLoading,
		createSource,
		deleteSource,
		fetchSources,
	} = useSubmissionSources();

	const {
		submissions,
		isLoading: submissionsLoading,
		deleteSubmission,
		fetchSubmissions,
	} = useFormSubmissions();

	const { keys, isLoading: keysLoading } = useSourceKeys();

	const [isCreateOpen, setIsCreateOpen] = useState(false);
	const [activeSourceForKeys, setActiveSourceForKeys] =
		useState<SubmissionSource | null>(null);

	const activeKeysCount = keys.filter((k) => k.isValid).length;

	const sourceNamesById = sources.reduce<Record<string, string>>((acc, s) => {
		acc[s.id] = s.name;
		return acc;
	}, {});

	const handleRefreshAll = async () => {
		await Promise.all([fetchSources(), fetchSubmissions()]);
	};

	return (
		<AppLayout
			breadcrumbs={[
				{ label: "Aqui Survey", href: "/" },
				{ label: "Dashboard" },
			]}
		>
			<div className="space-y-8">
				{/* Header Section */}
				<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-6">
					<div>
						<h1 className="text-2xl font-extrabold tracking-tight text-slate-900">
							Survey &amp; Submission Hub
						</h1>
						<p className="text-xs text-slate-500 mt-1">
							Manage form submission endpoints, API credentials, and review
							ingested survey responses.
						</p>
					</div>

					<div className="flex items-center gap-2">
						<ActionButton
							variant="secondary"
							size="sm"
							leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
							onClick={handleRefreshAll}
							isLoading={sourcesLoading || submissionsLoading}
						>
							Refresh
						</ActionButton>

						<ActionButton
							variant="primary"
							size="sm"
							leftIcon={<Plus className="w-3.5 h-3.5" />}
							onClick={() => setIsCreateOpen(true)}
						>
							New Source
						</ActionButton>
					</div>
				</div>

				{/* High-level Statistics */}
				<SubmissionStatsCards
					totalSources={sources.length}
					submissions={submissions}
					activeKeysCount={activeKeysCount}
				/>

				{/* Submission Sources Section */}
				<section className="space-y-4 pt-2">
					<SourcesList
						sources={sources}
						isLoading={sourcesLoading}
						onCreateSource={async (name) => {
							await createSource({ name });
						}}
						onDeleteSource={async (id) => {
							await deleteSource(id);
						}}
					/>
				</section>

				{/* Recent Form Submissions Section */}
				<section className="space-y-4 pt-4 border-t border-slate-200">
					<div className="flex items-center justify-between">
						<div>
							<h2 className="text-lg font-bold tracking-tight text-slate-900">
								Recent Responses
							</h2>
							<p className="text-xs text-slate-500 mt-0.5">
								Latest survey submissions collected across all sources.
							</p>
						</div>

						<Link href="/submissions">
							<ActionButton variant="ghost" size="sm">
								View All Submissions &rarr;
							</ActionButton>
						</Link>
					</div>

					<SubmissionsTable
						submissions={submissions.slice(0, 10)}
						isLoading={submissionsLoading}
						sourceNamesById={sourceNamesById}
						onDeleteSubmission={async (id) => {
							await deleteSubmission(id);
						}}
					/>
				</section>
			</div>

			<CreateSourceModal
				isOpen={isCreateOpen}
				onClose={() => setIsCreateOpen(false)}
				onCreate={async (name) => {
					await createSource({ name });
				}}
			/>

			<KeyManagementModal
				source={activeSourceForKeys}
				isOpen={Boolean(activeSourceForKeys)}
				onClose={() => setActiveSourceForKeys(null)}
			/>
		</AppLayout>
	);
}
