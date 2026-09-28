"use client";

import type React from "react";
import { forwardRef } from "react";
import { cn } from "@/shared/lib/cn";
import { Loader2 } from "@/shared/lib/icons";

export type ButtonVariant =
	| "primary"
	| "secondary"
	| "ghost"
	| "danger"
	| "destructiveOutline";
export type ButtonSize = "sm" | "md" | "lg";

export interface ActionButtonProps
	extends React.ButtonHTMLAttributes<HTMLButtonElement> {
	variant?: ButtonVariant;
	size?: ButtonSize;
	isLoading?: boolean;
	loadingText?: string;
	leftIcon?: React.ReactNode;
	rightIcon?: React.ReactNode;
	fullWidth?: boolean;
}

const variantStyles: Record<ButtonVariant, string> = {
	primary:
		"bg-emerald-600 text-white hover:bg-emerald-700 active:bg-emerald-800 shadow-sm focus-visible:ring-emerald-500/30 border border-transparent font-medium",
	secondary:
		"bg-white text-zinc-700 hover:bg-zinc-50 active:bg-zinc-100 border border-zinc-300 shadow-sm focus-visible:ring-zinc-400 font-medium",
	ghost:
		"bg-transparent text-zinc-600 hover:bg-zinc-100 active:bg-zinc-200 border border-transparent focus-visible:ring-zinc-400 font-medium",
	danger:
		"bg-rose-600 text-white hover:bg-rose-700 active:bg-rose-800 shadow-sm focus-visible:ring-rose-500/30 border border-transparent font-medium",
	destructiveOutline:
		"bg-white text-rose-600 border border-rose-300 hover:bg-rose-50 active:bg-rose-100 shadow-sm focus-visible:ring-rose-500/30 font-medium",
};

const sizeStyles: Record<ButtonSize, string> = {
	sm: "h-9 px-3 text-xs gap-1.5 rounded-lg",
	md: "h-11 px-4 text-sm gap-2 rounded-xl",
	lg: "h-12 px-6 text-base gap-2.5 rounded-xl font-semibold",
};

export const ActionButton = forwardRef<HTMLButtonElement, ActionButtonProps>(
	(
		{
			variant = "primary",
			size = "md",
			isLoading = false,
			loadingText,
			leftIcon,
			rightIcon,
			fullWidth = false,
			className,
			disabled,
			children,
			...props
		},
		ref,
	) => {
		const isDisabled = disabled || isLoading;

		return (
			<button
				ref={ref}
				disabled={isDisabled}
				aria-busy={isLoading}
				aria-disabled={isDisabled}
				className={cn(
					"inline-flex items-center justify-center transition-all duration-150 select-none cursor-pointer",
					"focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
					variantStyles[variant],
					sizeStyles[size],
					fullWidth && "w-full",
					isDisabled &&
						"opacity-50 cursor-not-allowed pointer-events-none bg-zinc-200 text-zinc-400 border-zinc-200 shadow-none",
					className,
				)}
				{...props}
			>
				{isLoading ? (
					<>
						<Loader2 className="h-4 w-4 animate-spin text-current shrink-0" />
						<span>{loadingText || children}</span>
					</>
				) : (
					<>
						{leftIcon && (
							<span className="inline-flex shrink-0">{leftIcon}</span>
						)}
						{children}
						{rightIcon && (
							<span className="inline-flex shrink-0">{rightIcon}</span>
						)}
					</>
				)}
			</button>
		);
	},
);

ActionButton.displayName = "ActionButton";
