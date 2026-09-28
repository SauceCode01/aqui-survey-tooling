"use client";

import {
	Check,
	Copy,
	Key as KeyIcon,
	Plus,
	ShieldAlert,
	ShieldCheck,
} from "lucide-react";
import { useState } from "react";
import { ActionButton } from "@/shared/ui/ActionButton";
import { Modal } from "@/shared/ui/Modal";
import { StatusPill } from "@/shared/ui/StatusPill";
import { useSourceKeys } from "../hooks/useSubmissionSources";
import type { SubmissionSource } from "../types/ISubmissionSourcesApi";

export interface KeyManagementModalProps {
	source: SubmissionSource | null;
	isOpen: boolean;
	onClose: () => void;
}

export function KeyManagementModal({
	source,
	isOpen,
	onClose,
}: KeyManagementModalProps) {
	const sourceId = source?.id;
	const { keys, isLoading, createKey, revokeKey } = useSourceKeys(sourceId);
	const [newlyCreatedKey, setNewlyCreatedKey] = useState<string | null>(null);
	const [copiedKeyId, setCopiedKeyId] = useState<string | null>(null);
	const [isGenerating, setIsGenerating] = useState(false);
	const [revokingKeyId, setRevokingKeyId] = useState<string | null>(null);

	if (!source) return null;

	const handleGenerateKey = async () => {
		setIsGenerating(true);
		try {
			const token = await createKey(source.id);
			setNewlyCreatedKey(token);
		} catch (err) {
			console.error("Failed to generate key:", err);
		} finally {
			setIsGenerating(false);
		}
	};

	const handleRevoke = async (keyId: string) => {
		setRevokingKeyId(keyId);
		try {
			await revokeKey(keyId);
		} catch (err) {
			console.error("Failed to revoke key:", err);
		} finally {
			setRevokingKeyId(null);
		}
	};

	const copyToClipboard = (text: string, identifier: string) => {
		navigator.clipboard.writeText(text);
		setCopiedKeyId(identifier);
		setTimeout(() => setCopiedKeyId(null), 2000);
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
		<Modal
			isOpen={isOpen}
			onClose={onClose}
			title={`API Keys: ${source.name}`}
			description="Manage API keys used by this source (Google Forms, webhooks, scripts) to submit surveys."
			className="max-w-2xl"
		>
			<div className="space-y-6">
				{/* Top Action Bar */}
				<div className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-xl">
					<div>
						<p className="text-xs font-semibold text-slate-800">
							Source ID:{" "}
							<code className="font-mono text-emerald-600">{source.id}</code>
						</p>
						<p className="text-2xs text-slate-500">
							Keys are cryptographically signed JWT credentials.
						</p>
					</div>
					<ActionButton
						variant="primary"
						size="sm"
						leftIcon={<Plus className="w-3.5 h-3.5" />}
						onClick={handleGenerateKey}
						isLoading={isGenerating}
					>
						Generate Key
					</ActionButton>
				</div>

				{/* Newly Created Key Alert Box */}
				{newlyCreatedKey && (
					<div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl space-y-2">
						<div className="flex items-center gap-2 text-emerald-800 font-semibold text-xs">
							<ShieldCheck className="w-4 h-4 text-emerald-600" />
							New API Key Generated Successfully
						</div>
						<p className="text-2xs text-emerald-700">
							Copy this key now. Include it in the <code>sourceKey</code>{" "}
							payload or header when forwarding form submissions.
						</p>
						<div className="flex items-center gap-2 p-2 bg-white rounded-lg border border-emerald-300">
							<code className="text-2xs font-mono text-slate-800 break-all flex-1 select-all">
								{newlyCreatedKey}
							</code>
							<button
								type="button"
								onClick={() => copyToClipboard(newlyCreatedKey, "new")}
								className="shrink-0 p-1.5 text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 rounded transition-colors"
								title="Copy to clipboard"
							>
								{copiedKeyId === "new" ? (
									<Check className="w-4 h-4 text-emerald-600" />
								) : (
									<Copy className="w-4 h-4" />
								)}
							</button>
						</div>
					</div>
				)}

				{/* Keys List */}
				<div className="space-y-3">
					<h4 className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
						Configured Keys ({keys.length})
					</h4>

					{isLoading ? (
						<div className="py-8 text-center text-xs text-slate-400">
							Loading keys...
						</div>
					) : keys.length === 0 ? (
						<div className="py-8 text-center border-2 border-dashed border-slate-200 rounded-xl">
							<KeyIcon className="w-8 h-8 text-slate-300 mx-auto mb-2" />
							<p className="text-xs font-medium text-slate-600">
								No API keys yet
							</p>
							<p className="text-2xs text-slate-400 mt-1">
								Generate a key to connect form submission webhooks.
							</p>
						</div>
					) : (
						<div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden bg-white">
							{keys.map((k) => (
								<div
									key={k.id}
									className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/80 transition-colors"
								>
									<div className="min-w-0 space-y-1">
										<div className="flex items-center gap-2">
											<span className="font-mono text-xs font-semibold text-slate-800">
												{k.id}
											</span>
											<StatusPill
												status={k.isValid ? "DONE" : "TODO"}
												label={k.isValid ? "Active" : "Revoked"}
												size="sm"
											/>
										</div>
										<div className="flex items-center gap-1.5 text-2xs font-mono text-slate-500">
											<span className="truncate max-w-[240px] sm:max-w-xs">
												{k.key}
											</span>
											<button
												type="button"
												onClick={() => copyToClipboard(k.key, k.id)}
												className="p-0.5 text-slate-400 hover:text-slate-700"
												title="Copy full key"
											>
												{copiedKeyId === k.id ? (
													<Check className="w-3 h-3 text-emerald-600" />
												) : (
													<Copy className="w-3 h-3" />
												)}
											</button>
										</div>
										<p className="text-3xs text-slate-400">
											Created: {formatDate(k.createdAt)}
										</p>
									</div>

									{k.isValid && (
										<ActionButton
											variant="destructiveOutline"
											size="sm"
											className="self-start sm:self-center"
											leftIcon={<ShieldAlert className="w-3 h-3" />}
											onClick={() => handleRevoke(k.id)}
											isLoading={revokingKeyId === k.id}
										>
											Revoke
										</ActionButton>
									)}
								</div>
							))}
						</div>
					)}
				</div>

				<div className="flex justify-end pt-2">
					<ActionButton variant="secondary" onClick={onClose}>
						Done
					</ActionButton>
				</div>
			</div>
		</Modal>
	);
}
