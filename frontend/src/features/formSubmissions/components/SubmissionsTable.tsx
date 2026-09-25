"use client";

import { Eye, FileSpreadsheet, Search, Trash2 } from "lucide-react";
import { useState } from "react";
import { ActionButton } from "@/shared/ui/ActionButton";
import { EmptyState } from "@/shared/ui/EmptyState";
import { Skeleton } from "@/shared/ui/Skeleton";
import type { FormSubmission } from "../types/IFormSubmissionsApi";
import { SubmissionDetailModal } from "./SubmissionDetailModal";

export interface SubmissionsTableProps {
	submissions: FormSubmission[];
	isLoading: boolean;
	sourceNamesById?: Record<string, string>;
	onDeleteSubmission?: (id: string) => Promise<void>;
}

export function SubmissionsTable({
	submissions,
	isLoading,
	sourceNamesById = {},
	onDeleteSubmission,
}: SubmissionsTableProps) {
	const [searchQuery, setSearchQuery] = useState("");
	const [selectedSubmission, setSelectedSubmission] =
		useState<FormSubmission | null>(null);
	const [deletingId, setDeletingId] = useState<string | null>(null);

	const filteredSubmissions = submissions.filter((sub) => {
		if (!searchQuery.trim()) return true;
		const query = searchQuery.toLowerCase();
		const matchEmail = sub.email.toLowerCase().includes(query);
		const matchId = sub.id.toLowerCase().includes(query);
		const matchSource = (sourceNamesById[sub.sourceId] || "")
			.toLowerCase()
			.includes(query);
		const matchAnswers = sub.answers.some((a) => {
			if (typeof a.answer === "string") {
				return a.answer.toLowerCase().includes(query);
			}
			if (Array.isArray(a.answer)) {
				return JSON.stringify(a.answer).toLowerCase().includes(query);
			}
			return false;
		});

		return matchEmail || matchId || matchSource || matchAnswers;
	});

	const handleDelete = async (id: string, email: string) => {
		if (
			window.confirm(
				`Are you sure you want to delete submission from ${email}?`,
			)
		) {
			if (!onDeleteSubmission) return;
			setDeletingId(id);
			try {
				await onDeleteSubmission(id);
			} catch (err) {
				console.error("Failed to delete submission:", err);
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
				hour: "2-digit",
				minute: "2-digit",
			});
		}
		return new Date(date).toLocaleDateString(undefined, {
			month: "short",
			day: "numeric",
			year: "numeric",
			hour: "2-digit",
			minute: "2-digit",
		});
	};

	return (
		<div className="space-y-4">
			{/* Search Filter Bar */}
			<div className="flex flex-col sm:flex-row items-center justify-between gap-3">
				<div className="relative w-full sm:w-72">
					<Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
					<input
						type="text"
						placeholder="Search by email, question, or text..."
						value={searchQuery}
						onChange={(e) => setSearchQuery(e.target.value)}
						className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all placeholder:text-slate-400"
					/>
				</div>

				<div className="text-2xs text-slate-500 self-end sm:self-center">
					Showing{" "}
					<span className="font-semibold text-slate-800">
						{filteredSubmissions.length}
					</span>{" "}
					of {submissions.length} responses
				</div>
			</div>

			{/* Table Container */}
			<div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
				{isLoading ? (
					<div className="p-6 space-y-4">
						{[1, 2, 3, 4].map((n) => (
							<div key={n} className="flex items-center gap-4">
								<Skeleton className="h-4 w-1/4" />
								<Skeleton className="h-4 w-1/4" />
								<Skeleton className="h-4 w-1/4" />
								<Skeleton className="h-4 w-1/4" />
							</div>
						))}
					</div>
				) : filteredSubmissions.length === 0 ? (
					<EmptyState
						icon={<FileSpreadsheet className="w-8 h-8 text-slate-400" />}
						title="No form submissions found"
						description={
							searchQuery
								? "No submissions matched your search query."
								: "No responses recorded yet for this source."
						}
					/>
				) : (
					<div className="overflow-x-auto">
						<table className="w-full text-left text-xs text-slate-600">
							<thead className="bg-slate-50/80 text-2xs uppercase tracking-wider text-slate-500 border-b border-slate-200">
								<tr>
									<th className="py-3 px-4 font-semibold">Submitter</th>
									<th className="py-3 px-4 font-semibold">Source</th>
									<th className="py-3 px-4 font-semibold">Answers</th>
									<th className="py-3 px-4 font-semibold">Submitted Date</th>
									<th className="py-3 px-4 font-semibold text-right">
										Actions
									</th>
								</tr>
							</thead>
							<tbody className="divide-y divide-slate-100">
								{filteredSubmissions.map((sub) => {
									const sourceName =
										sourceNamesById[sub.sourceId] || sub.sourceId;
									return (
										<tr
											key={sub.id}
											className="hover:bg-slate-50/70 transition-colors"
										>
											<td className="py-3 px-4">
												<div className="font-medium text-slate-900">
													{sub.email}
												</div>
												<div className="text-3xs font-mono text-slate-400">
													{sub.id}
												</div>
											</td>
											<td className="py-3 px-4">
												<span className="inline-flex items-center px-2 py-0.5 rounded-full text-3xs font-medium bg-slate-100 text-slate-700">
													{sourceName}
												</span>
											</td>
											<td className="py-3 px-4">
												<span className="text-xs font-semibold text-slate-800">
													{sub.answers.length}
												</span>{" "}
												<span className="text-2xs text-slate-400">fields</span>
											</td>
											<td className="py-3 px-4 text-slate-500 text-2xs">
												{formatDate(sub.createdAt)}
											</td>
											<td className="py-3 px-4 text-right">
												<div className="flex items-center justify-end gap-1.5">
													<ActionButton
														variant="secondary"
														size="sm"
														leftIcon={<Eye className="w-3.5 h-3.5" />}
														onClick={() => setSelectedSubmission(sub)}
													>
														Inspect
													</ActionButton>

													{onDeleteSubmission && (
														<button
															type="button"
															onClick={() => handleDelete(sub.id, sub.email)}
															disabled={deletingId === sub.id}
															className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
															title="Delete response"
														>
															<Trash2 className="w-3.5 h-3.5" />
														</button>
													)}
												</div>
											</td>
										</tr>
									);
								})}
							</tbody>
						</table>
					</div>
				)}
			</div>

			{/* Detail Modal */}
			<SubmissionDetailModal
				submission={selectedSubmission}
				sourceName={
					selectedSubmission
						? sourceNamesById[selectedSubmission.sourceId] ||
							selectedSubmission.sourceId
						: undefined
				}
				isOpen={Boolean(selectedSubmission)}
				onClose={() => setSelectedSubmission(null)}
			/>
		</div>
	);
}
