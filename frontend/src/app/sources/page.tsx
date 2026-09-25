"use client";

import { SourcesList } from "@/features/submissionSources/components";
import { useSubmissionSources } from "@/features/submissionSources/hooks/useSubmissionSources";
import { AppLayout } from "@/layouts/app/AppLayout";

export default function SourcesPage() {
	const { sources, isLoading, createSource, deleteSource } =
		useSubmissionSources();

	return (
		<AppLayout
			breadcrumbs={[
				{ label: "Dashboard", href: "/" },
				{ label: "Submission Sources" },
			]}
		>
			<SourcesList
				sources={sources}
				isLoading={isLoading}
				onCreateSource={async (name) => {
					await createSource({ name });
				}}
				onDeleteSource={async (id) => {
					await deleteSource(id);
				}}
			/>
		</AppLayout>
	);
}
