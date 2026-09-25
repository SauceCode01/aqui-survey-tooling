"use client";

import { FileText, Key, Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { ActionButton } from "@/shared/ui/ActionButton";
import { EmptyState } from "@/shared/ui/EmptyState";
import { Skeleton } from "@/shared/ui/Skeleton";
import type { SubmissionSource } from "../types/ISubmissionSourcesApi";
import { CreateSourceModal } from "./CreateSourceModal";
import { KeyManagementModal } from "./KeyManagementModal";

export interface SourcesListProps {
	sources: SubmissionSource[];
	isLoading: boolean;
	onCreateSource: (name: string) => Promise<void>;
	onDeleteSource: (id: string) => Promise<void>;
}

export function SourcesList({
	sources,
	isLoading,
	onCreateSource,
	onDeleteSource,
}: SourcesListProps) {
	const [isCreateOpen, setIsCreateOpen] = useState(false);
	const [activeSourceForKeys, setActiveSourceForKeys] =
		useState<SubmissionSource | null>(null);
	const [deletingId, setDeletingId] = useState<string | null>(null);

	const handleDelete = async (id: string, name: string) => {
		if (
			window.confirm(
				`Are you sure you want to delete "${name}"? This will revoke all associated keys and remove access.`,
			)
		) {
			setDeletingId(id);
			try {
				await onDeleteSource(id);
			} catch (err) {
				console.error("Failed to delete source:", err);
			} finally {
				setDeletingId(null);
			}
		}
	};

	const formatDate = (date: string | { millis: number }) => {
		if (typeof date === "object" && date !== null && "millis" in date) {
			return new Date(date.millis).toLocaleDateString(undefined, {
				month: "short",
				day: "numeric",
				year: "numeric",
			});
		}
		return new Date(date).toLocaleDateString(undefined, {
			month: "short",
			day: "numeric",
			year: "numeric",
		});
	};

	return (
		<div className="space-y-6">
			{/* Header with Title and Add Button */}
			<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
				<div>
					<h2 className="text-xl font-bold tracking-tight text-slate-900">
						Submission Sources
					</h2>
					<p className="text-xs text-slate-500 mt-1">
						Connect Google Forms, webhooks, or frontends using API keys.
					</p>
				</div>
				<ActionButton
					variant="primary"
					leftIcon={<Plus className="w-4 h-4" />}
					onClick={() => setIsCreateOpen(true)}
				>
					Add Source
				</ActionButton>
			</div>

			{/* Source Cards Grid */}
			{isLoading ? (
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
					{[1, 2, 3].map((n) => (
						<div
							key={n}
							className="p-5 bg-white border border-slate-200 rounded-xl space-y-3"
						>
							<Skeleton className="h-5 w-2/3" />
							<Skeleton className="h-4 w-1/2" />
							<div className="pt-4 flex gap-2">
								<Skeleton className="h-8 w-24" />
								<Skeleton className="h-8 w-24" />
							</div>
						</div>
					))}
				</div>
			) : sources.length === 0 ? (
				<EmptyState
					icon={<FileText className="w-8 h-8 text-slate-400" />}
					title="No submission sources found"
					description="Create a submission source to generate credentials and start receiving survey data."
					action={
						<ActionButton
							variant="primary"
							size="sm"
							leftIcon={<Plus className="w-3.5 h-3.5" />}
							onClick={() => setIsCreateOpen(true)}
						>
							Create First Source
						</ActionButton>
					}
				/>
			) : (
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
					{sources.map((source) => (
						<div
							key={source.id}
							className="bg-white border border-slate-200 hover:border-slate-300 rounded-xl p-5 shadow-xs flex flex-col justify-between transition-all hover:shadow-md"
						>
							<div className="space-y-2">
								<div className="flex items-start justify-between gap-2">
									<h3 className="font-semibold text-sm text-slate-900 leading-snug">
										{source.name}
									</h3>
									<button
										type="button"
										onClick={() => handleDelete(source.id, source.name)}
										disabled={deletingId === source.id}
										className="text-slate-400 hover:text-rose-600 p-1 rounded-md hover:bg-rose-50 transition-colors"
										title="Delete source"
									>
										<Trash2 className="w-4 h-4" />
									</button>
								</div>
								<div className="space-y-1">
									<p className="text-2xs font-mono text-slate-500">
										ID: <span className="text-slate-700">{source.id}</span>
									</p>
									<p className="text-2xs text-slate-400">
										Created: {formatDate(source.createdAt)}
									</p>
								</div>
							</div>

							<div className="pt-5 mt-4 border-t border-slate-100 flex items-center justify-between gap-2">
								<ActionButton
									variant="secondary"
									size="sm"
									leftIcon={<Key className="w-3.5 h-3.5 text-emerald-600" />}
									onClick={() => setActiveSourceForKeys(source)}
								>
									Manage Keys
								</ActionButton>

								<Link
									href={`/submissions?sourceId=${encodeURIComponent(source.id)}`}
								>
									<ActionButton
										variant="ghost"
										size="sm"
										leftIcon={<FileText className="w-3.5 h-3.5" />}
									>
										Submissions
									</ActionButton>
								</Link>
							</div>
						</div>
					))}
				</div>
			)}

			{/* Modals */}
			<CreateSourceModal
				isOpen={isCreateOpen}
				onClose={() => setIsCreateOpen(false)}
				onCreate={onCreateSource}
			/>

			<KeyManagementModal
				source={activeSourceForKeys}
				isOpen={Boolean(activeSourceForKeys)}
				onClose={() => setActiveSourceForKeys(null)}
			/>
		</div>
	);
}
