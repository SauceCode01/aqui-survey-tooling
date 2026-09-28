"use client";

import type React from "react";
import { forwardRef } from "react";
import { cn } from "@/shared/lib/cn";

export interface InputProps
	extends React.InputHTMLAttributes<HTMLInputElement> {
	label?: string;
	helperText?: string;
	error?: string;
	leftIcon?: React.ReactNode;
	rightIcon?: React.ReactNode;
	rightIconAriaLabel?: string;
	onRightIconClick?: () => void;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
	(
		{
			label,
			helperText,
			error,
			leftIcon,
			rightIcon,
			rightIconAriaLabel,
			onRightIconClick,
			id,
			className,
			disabled,
			...props
		},
		ref,
	) => {
		const inputId =
			id || (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined);

		return (
			<div className="w-full space-y-1.5">
				{label && (
					<label
						htmlFor={inputId}
						className="block text-sm font-medium text-zinc-900 select-none"
					>
						{label}
					</label>
				)}

				<div className="relative rounded-xl">
					{leftIcon && (
						<div className="pointer-events-none absolute inset-y-0 left-0 pl-3.5 flex items-center text-zinc-400">
							{leftIcon}
						</div>
					)}

					<input
						ref={ref}
						id={inputId}
						disabled={disabled}
						aria-invalid={Boolean(error)}
						aria-describedby={
							error
								? `${inputId}-error`
								: helperText
									? `${inputId}-helper`
									: undefined
						}
						className={cn(
							"block w-full h-11 rounded-xl text-sm border transition-all duration-150 outline-none",
							"bg-white text-zinc-900 placeholder:text-zinc-400",
							"focus:ring-2 focus:ring-offset-0",
							leftIcon ? "pl-10" : "pl-3.5",
							rightIcon ? "pr-11" : "pr-3.5",
							error
								? "border-rose-500 text-zinc-900 focus:border-rose-500 focus:ring-rose-500/20"
								: "border-zinc-300 hover:border-zinc-400 focus:border-emerald-600 focus:ring-emerald-500/20",
							disabled &&
								"bg-zinc-200 text-zinc-500 border-zinc-200 cursor-not-allowed",
							className,
						)}
						{...props}
					/>

					{rightIcon &&
						(onRightIconClick ? (
							<button
								type="button"
								tabIndex={-1}
								aria-label={rightIconAriaLabel || "Toggle visibility"}
								className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-zinc-400 hover:text-zinc-600 transition-colors focus:outline-none"
								onClick={onRightIconClick}
							>
								{rightIcon}
							</button>
						) : (
							<div className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-zinc-400 pointer-events-none">
								{rightIcon}
							</div>
						))}
				</div>

				{error ? (
					<p
						id={`${inputId}-error`}
						className="text-xs text-rose-500 font-medium animate-in fade-in duration-150"
					>
						{error}
					</p>
				) : helperText ? (
					<p id={`${inputId}-helper`} className="text-xs text-zinc-500">
						{helperText}
					</p>
				) : null}
			</div>
		);
	},
);

Input.displayName = "Input";
