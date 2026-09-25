"use client";

import { Calendar, Check, Copy, Mail, Tag } from "lucide-react";
import { useState } from "react";
import { ActionButton } from "@/shared/ui/ActionButton";
import { Modal } from "@/shared/ui/Modal";
import type {
	FormSubmission,
	QuestionAnswer,
} from "../types/IFormSubmissionsApi";

export interface SubmissionDetailModalProps {
	submission: FormSubmission | null;
	isOpen: boolean;
	onClose: () => void;
	sourceName?: string;
}

export function SubmissionDetailModal({
	submission,
	isOpen,
	onClose,
	sourceName,
}: SubmissionDetailModalProps) {
	const [isCopied, setIsCopied] = useState(false);

	if (!submission) return null;

	const handleCopyJson = () => {
		navigator.clipboard.writeText(JSON.stringify(submission, null, 2));
		setIsCopied(true);
		setTimeout(() => setIsCopied(false), 2000);
	};

	const formatDate = (date: string | { millis: number }) => {
		if (typeof date === "object" && date !== null && "millis" in date) {
			return new Date(date.millis).toLocaleString();
		}
		return new Date(date).toLocaleString();
	};

	const renderAnswer = (qa: QuestionAnswer) => {
		if (qa.answerType === "string") {
			return (
				<p className="text-xs text-slate-800 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
					{qa.answer}
				</p>
			);
		}

		if (qa.answerType === "string[]") {
			return (
				<div className="flex flex-wrap gap-1.5 pt-1">
					{qa.answer.map((item, index) => (
						<span
							key={`${item}-${index}`}
							className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-medium"
						>
							<Tag className="w-3 h-3 text-emerald-600" />
							{item}
						</span>
					))}
				</div>
			);
		}

		if (qa.answerType === "string[][]") {
			return (
				<div className="overflow-x-auto border border-slate-200 rounded-lg">
					<table className="w-full text-xs text-left text-slate-700">
						<tbody className="divide-y divide-slate-100">
							{qa.answer.map((row, rIdx) => (
								<tr key={`row-${rIdx}`} className="hover:bg-slate-50">
									{row.map((cell, cIdx) => (
										<td
											key={`cell-${rIdx}-${cIdx}`}
											className="p-2 border-r last:border-r-0 border-slate-100 font-mono text-2xs"
										>
											{cell}
										</td>
									))}
								</tr>
							))}
						</tbody>
					</table>
				</div>
			);
		}

		return null;
	};

	return (
		<Modal
			isOpen={isOpen}
			onClose={onClose}
			title="Form Submission Details"
			description={`Submission ID: ${submission.id}`}
			className="max-w-2xl"
		>
			<div className="space-y-6">
				{/* Metadata Cards */}
				<div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 bg-slate-50 border border-slate-200 rounded-xl">
					<div className="flex items-center gap-2.5">
						<div className="p-2 bg-white rounded-lg border border-slate-200 text-slate-500">
							<Mail className="w-4 h-4" />
						</div>
						<div className="min-w-0">
							<p className="text-3xs text-slate-400 uppercase font-semibold">
								Submitter Email
							</p>
							<p className="text-xs font-medium text-slate-800 truncate">
								{submission.email}
							</p>
						</div>
					</div>

					<div className="flex items-center gap-2.5">
						<div className="p-2 bg-white rounded-lg border border-slate-200 text-slate-500">
							<Calendar className="w-4 h-4" />
						</div>
						<div className="min-w-0">
							<p className="text-3xs text-slate-400 uppercase font-semibold">
								Submitted At
							</p>
							<p className="text-xs font-medium text-slate-800 truncate">
								{formatDate(submission.createdAt)}
							</p>
						</div>
					</div>

					{sourceName && (
						<div className="sm:col-span-2 pt-2 border-t border-slate-200/60 flex items-center justify-between text-2xs">
							<span className="text-slate-500">
								Source:{" "}
								<span className="font-semibold text-slate-700">
									{sourceName}
								</span>
							</span>
							<span className="font-mono text-slate-400">
								{submission.sourceId}
							</span>
						</div>
					)}
				</div>

				{/* Questions & Answers breakdown */}
				<div className="space-y-4">
					<div className="flex items-center justify-between">
						<h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
							Responses ({submission.answers.length})
						</h4>
						<button
							type="button"
							onClick={handleCopyJson}
							className="inline-flex items-center gap-1.5 text-2xs text-slate-500 hover:text-slate-800 transition-colors"
						>
							{isCopied ? (
								<>
									<Check className="w-3.5 h-3.5 text-emerald-600" />
									<span className="text-emerald-600 font-medium">Copied!</span>
								</>
							) : (
								<>
									<Copy className="w-3.5 h-3.5" />
									<span>Copy JSON</span>
								</>
							)}
						</button>
					</div>

					<div className="space-y-4 divide-y divide-slate-100 max-h-96 overflow-y-auto pr-1">
						{submission.answers.map((qa, index) => (
							<div
								key={`${qa.question}-${index}`}
								className="pt-3 first:pt-0 space-y-1.5"
							>
								<div className="flex items-center justify-between gap-2">
									<p className="text-xs font-semibold text-slate-800">
										{index + 1}. {qa.question}
									</p>
									<span className="shrink-0 text-3xs font-mono uppercase px-1.5 py-0.5 rounded bg-slate-100 text-slate-500">
										{qa.questionType || qa.answerType}
									</span>
								</div>
								{renderAnswer(qa)}
							</div>
						))}
					</div>
				</div>

				{/* Footer */}
				<div className="flex justify-end pt-3 border-t border-slate-100">
					<ActionButton variant="secondary" onClick={onClose}>
						Close
					</ActionButton>
				</div>
			</div>
		</Modal>
	);
}
