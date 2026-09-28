"use client";

import type React from "react";
import { forwardRef } from "react";
import { cn } from "@/shared/lib/cn";
import { ChevronDown } from "@/shared/lib/icons";

export interface SelectOption {
	value: string;
	label: string;
}

export interface SelectProps
	extends React.SelectHTMLAttributes<HTMLSelectElement> {
	label?: string;
	helperText?: string;
	error?: string;
	options?: SelectOption[];
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
	(
		{
			label,
			helperText,
			error,
			options,
			id,
			children,
			className,
			disabled,
			...props
		},
		ref,
	) => {
		const selectId =
			id || (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined);

		return (
			<div className="w-full space-y-1.5">
				{label && (
					<label
						htmlFor={selectId}
						className="block text-sm font-medium text-slate-700 select-none"
					>
						{label}
					</label>
				)}

				<div className="relative rounded-md shadow-xs">
					<select
						ref={ref}
						id={selectId}
						disabled={disabled}
						aria-invalid={Boolean(error)}
						aria-describedby={
							error
								? `${selectId}-error`
								: helperText
									? `${selectId}-helper`
									: undefined
						}
						className={cn(
							"block w-full h-10 pl-3 pr-10 rounded-md text-sm border appearance-none transition-colors outline-none cursor-pointer",
							"bg-white text-slate-900",
							"focus:ring-2 focus:ring-offset-0",
							error
								? "border-red-500 text-red-900 focus:border-red-500 focus:ring-red-500/20"
								: "border-slate-300 hover:border-slate-400 focus:border-indigo-600 focus:ring-indigo-600/20",
							disabled &&
								"bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed",
							className,
						)}
						{...props}
					>
						{options
							? options.map((opt) => (
									<option key={opt.value} value={opt.value}>
										{opt.label}
									</option>
								))
							: children}
					</select>

					<div className="pointer-events-none absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400">
						<ChevronDown className="h-4 w-4" />
					</div>
				</div>

				{error ? (
					<p
						id={`${selectId}-error`}
						className="text-xs text-red-600 font-medium"
					>
						{error}
					</p>
				) : helperText ? (
					<p id={`${selectId}-helper`} className="text-xs text-slate-500">
						{helperText}
					</p>
				) : null}
			</div>
		);
	},
);

Select.displayName = "Select";
