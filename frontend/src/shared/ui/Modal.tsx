"use client";

import type React from "react";
import { useEffect } from "react";
import { cn } from "@/shared/lib/cn";
import { X } from "@/shared/lib/icons";

export type ModalSize = "sm" | "md" | "lg" | "xl";

export interface ModalProps {
	isOpen: boolean;
	onClose: () => void;
	title?: React.ReactNode;
	description?: React.ReactNode;
	children: React.ReactNode;
	footer?: React.ReactNode;
	size?: ModalSize;
	className?: string;
}

const sizeClasses: Record<ModalSize, string> = {
	sm: "max-w-sm",
	md: "max-w-md",
	lg: "max-w-lg",
	xl: "max-w-2xl",
};

export function Modal({
	isOpen,
	onClose,
	title,
	description,
	children,
	footer,
	size = "md",
	className,
}: ModalProps) {
	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			if (e.key === "Escape" && isOpen) {
				onClose();
			}
		};
		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, [isOpen, onClose]);

	if (!isOpen) return null;

	return (
		<div
			className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 sm:p-6"
			role="dialog"
			aria-modal="true"
		>
			{/* Backdrop */}
			<div
				className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity duration-200"
				onClick={onClose}
				aria-hidden="true"
			/>

			{/* Modal Container */}
			<div
				className={cn(
					"relative w-full bg-white rounded-lg shadow-xl border border-slate-200 overflow-hidden transform transition-all z-10",
					sizeClasses[size],
					className,
				)}
			>
				{/* Header */}
				{(title || description) && (
					<div className="px-6 py-4 border-b border-slate-100 flex items-start justify-between bg-slate-50/50">
						<div>
							{title && (
								<h3 className="text-lg font-semibold text-slate-900 leading-6">
									{title}
								</h3>
							)}
							{description && (
								<p className="mt-1 text-sm text-slate-500 leading-5">
									{description}
								</p>
							)}
						</div>
						<button
							type="button"
							onClick={onClose}
							className="text-slate-400 hover:text-slate-600 rounded-md p-1 hover:bg-slate-100 transition-colors ml-4"
							aria-label="Close dialog"
						>
							<X className="h-5 w-5" />
						</button>
					</div>
				)}

				{/* Content Body */}
				<div className="p-6">{children}</div>

				{/* Footer */}
				{footer && (
					<div className="px-6 py-3.5 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2.5">
						{footer}
					</div>
				)}
			</div>
		</div>
	);
}
