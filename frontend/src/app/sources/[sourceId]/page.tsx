"use client";

import { Key, Plus } from "lucide-react";
import { useParams } from "next/navigation";
import { useState } from "react";
import {
	SubmissionStatsCards,
	SubmissionsTable,
} from "@/features/formSubmissions/components";
import { useFormSubmissions } from "@/features/formSubmissions/hooks/useFormSubmissions";
import { KeyManagementModal } from "@/features/submissionSources/components";
import {
	useSourceKeys,
	useSubmissionSources,
} from "@/features/submissionSources/hooks/useSubmissionSources";
import { AppLayout } from "@/layouts/app/AppLayout";
import { ActionButton } from "@/shared/ui/ActionButton";
import { Skeleton } from "@/shared/ui/Skeleton";

export default function SourceDetailPage() {
	const params = useParams();
	const sourceId = params.sourceId as string;

	const { sources, isLoading: sourcesLoading } = useSubmissionSources();
	const source = sources.find((s) => s.id === sourceId) || null;

	const {
		submissions,
		isLoading: subsLoading,
		deleteSubmission,
	} = useFormSubmissions(sourceId);

	const { keys } = useSourceKeys(sourceId);
	const [isKeysOpen, setIsKeysOpen] = useState(false);

	const activeKeysCount = keys.filter((k) => k.isValid).length;

	if (sourcesLoading) {
		return (
			<AppLayout
				breadcrumbs={[
					{ label: "Dashboard", href: "/" },
					{ label: "Submission Sources", href: "/sources" },
					{ label: "Loading..." },
				]}
			>
				<div className="space-y-4">
					<Skeleton className="h-8 w-1/3" />
					<Skeleton className="h-24 w-full" />
				</div>
			</AppLayout>
		);
	}

	if (!source) {
		return (
			<AppLayout
				breadcrumbs={[
					{ label: "Dashboard", href: "/" },
					{ label: "Submission Sources", href: "/sources" },
					{ label: "Not Found" },
				]}
			>
				<div className="p-8 text-center bg-white border border-slate-200 rounded-xl">
					<p className="text-sm font-semibold text-slate-700">
						Submission Source Not Found
					</p>
					<p className="text-xs text-slate-400 mt-1">
						The source ID &quot;{sourceId}&quot; does not exist.
					</p>
				</div>
			</AppLayout>
		);
	}

	return (
		<AppLayout
			breadcrumbs={[
				{ label: "Dashboard", href: "/" },
				{ label: "Submission Sources", href: "/sources" },
				{ label: source.name },
			]}
		>
			<div className="space-y-8">
				{/* Source Header */}
				<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-6">
					<div>
						<h1 className="text-2xl font-extrabold tracking-tight text-slate-900">
							{source.name}
						</h1>
						<p className="text-xs font-mono text-slate-500 mt-1">
							Source ID: {source.id}
						</p>
					</div>

					<ActionButton
						variant="primary"
						size="sm"
						leftIcon={<Key className="w-3.5 h-3.5" />}
						onClick={() => setIsKeysOpen(true)}
					>
						Manage API Keys ({keys.length})
					</ActionButton>
				</div>

				{/* Stats Cards */}
				<SubmissionStatsCards
					totalSources={1}
					submissions={submissions}
					activeKeysCount={activeKeysCount}
				/>

				{/* Submissions Section */}
				<div className="space-y-4">
					<h2 className="text-lg font-bold tracking-tight text-slate-900">
						Submissions ({submissions.length})
					</h2>

					<SubmissionsTable
						submissions={submissions}
						isLoading={subsLoading}
						sourceNamesById={{ [source.id]: source.name }}
						onDeleteSubmission={async (id) => {
							await deleteSubmission(id);
						}}
					/>
				</div>
			</div>

			<KeyManagementModal
				source={source}
				isOpen={isKeysOpen}
				onClose={() => setIsKeysOpen(false)}
			/>
		</AppLayout>
	);
}
