"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { SubmissionsDashboard } from "@/features/formSubmissions/components";
import {
	useSourceKeys,
	useSubmissionSources,
} from "@/features/submissionSources/hooks/useSubmissionSources";
import { AppLayout } from "@/layouts/app/AppLayout";

function SubmissionsContent() {
	const searchParams = useSearchParams();
	const sourceIdParam = searchParams.get("sourceId") || undefined;

	const { sources } = useSubmissionSources();
	const { keys } = useSourceKeys();

	const activeKeysCount = keys.filter((k) => k.isValid).length;

	return (
		<SubmissionsDashboard
			initialSourceId={sourceIdParam}
			sources={sources.map((s) => ({ id: s.id, name: s.name }))}
			activeKeysCount={activeKeysCount}
		/>
	);
}

export default function SubmissionsPage() {
	return (
		<AppLayout
			breadcrumbs={[
				{ label: "Dashboard", href: "/" },
				{ label: "Form Submissions" },
			]}
		>
			<Suspense
				fallback={
					<div className="py-12 text-center text-xs text-slate-400">
						Loading dashboard...
					</div>
				}
			>
				<SubmissionsContent />
			</Suspense>
		</AppLayout>
	);
}
