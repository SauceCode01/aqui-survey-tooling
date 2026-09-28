"use client";

import type React from "react";
import { useState } from "react";
import { ActionButton } from "@/shared/ui/ActionButton";
import { Input } from "@/shared/ui/Input";
import { Modal } from "@/shared/ui/Modal";

export interface CreateSourceModalProps {
	isOpen: boolean;
	onClose: () => void;
	onCreate: (name: string) => Promise<void>;
}

export function CreateSourceModal({
	isOpen,
	onClose,
	onCreate,
}: CreateSourceModalProps) {
	const [name, setName] = useState("");
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!name.trim()) {
			setError("Source name is required");
			return;
		}

		setIsSubmitting(true);
		setError(null);
		try {
			await onCreate(name.trim());
			setName("");
			onClose();
		} catch (err) {
			setError(err instanceof Error ? err.message : "Failed to create source");
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<Modal
			isOpen={isOpen}
			onClose={onClose}
			title="Add Submission Source"
			description="Register a new form source (e.g. Google Forms, Typeform, Webhook) to start collecting submissions."
		>
			<form onSubmit={handleSubmit} className="space-y-4">
				{error && (
					<div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg">
						{error}
					</div>
				)}

				<Input
					label="Source Name"
					placeholder="e.g. Google Forms - Customer Feedback"
					value={name}
					onChange={(e) => setName(e.target.value)}
					disabled={isSubmitting}
					autoFocus
				/>

				<div className="flex justify-end gap-2 pt-2">
					<ActionButton
						variant="secondary"
						type="button"
						onClick={onClose}
						disabled={isSubmitting}
					>
						Cancel
					</ActionButton>
					<ActionButton
						variant="primary"
						type="submit"
						isLoading={isSubmitting}
						disabled={!name.trim()}
					>
						Create Source
					</ActionButton>
				</div>
			</form>
		</Modal>
	);
}
