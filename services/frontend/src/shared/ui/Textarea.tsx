"use client";

import type React from "react";
import { forwardRef } from "react";
import { cn } from "@/shared/lib/cn";

export interface TextareaProps
	extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
	label?: string;
	helperText?: string;
	error?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
	(
		{ label, helperText, error, id, className, disabled, rows = 3, ...props },
		ref,
	) => {
		const textareaId =
			id || (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined);

		return (
			<div className="w-full space-y-1.5">
				{label && (
					<label
						htmlFor={textareaId}
						className="block text-sm font-medium text-slate-700 select-none"
					>
						{label}
					</label>
				)}

				<textarea
					ref={ref}
					id={textareaId}
					rows={rows}
					disabled={disabled}
					aria-invalid={Boolean(error)}
					aria-describedby={
						error
							? `${textareaId}-error`
							: helperText
								? `${textareaId}-helper`
								: undefined
					}
					className={cn(
						"block w-full rounded-md text-sm border p-3 transition-colors outline-none resize-y",
						"bg-white text-slate-900 placeholder:text-slate-400",
						"focus:ring-2 focus:ring-offset-0",
						error
							? "border-red-500 text-red-900 focus:border-red-500 focus:ring-red-500/20"
							: "border-slate-300 hover:border-slate-400 focus:border-indigo-600 focus:ring-indigo-600/20",
						disabled &&
							"bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed",
						className,
					)}
					{...props}
				/>

				{error ? (
					<p
						id={`${textareaId}-error`}
						className="text-xs text-red-600 font-medium"
					>
						{error}
					</p>
				) : helperText ? (
					<p id={`${textareaId}-helper`} className="text-xs text-slate-500">
						{helperText}
					</p>
				) : null}
			</div>
		);
	},
);

Textarea.displayName = "Textarea";
