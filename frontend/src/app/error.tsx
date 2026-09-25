"use client";

import Link from "next/link";
import { useEffect } from "react";
import { ArrowRight, RefreshCw, Server } from "@/shared/lib/icons";
import { ActionButton } from "@/shared/ui/ActionButton";

export default function GlobalError({
	error,
	reset,
}: {
	error: Error & { digest?: string };
	reset: () => void;
}) {
	useEffect(() => {
		// Log unexpected client error to monitoring console
		console.error("Uncaught application runtime error:", error);
	}, [error]);

	return (
		<div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-6 text-center select-none">
			<div className="flex flex-col items-center max-w-md">
				<Server className="w-24 h-24 text-slate-400 mb-6 stroke-[1.25]" />

				<h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 mb-3">
					500 &ndash; Internal Server Error
				</h1>

				<p className="text-sm sm:text-base text-slate-500 mb-8 leading-relaxed">
					An unexpected server error occurred while processing your request. The
					engineering team has been notified.
				</p>

				<div className="flex items-center gap-3">
					<ActionButton
						variant="secondary"
						size="md"
						leftIcon={<RefreshCw className="h-4 w-4" />}
						onClick={() => reset()}
					>
						Try Again
					</ActionButton>

					<Link href="/">
						<ActionButton
							variant="primary"
							size="md"
							rightIcon={<ArrowRight className="h-4 w-4" />}
						>
							Back to Dashboard
						</ActionButton>
					</Link>
				</div>
			</div>
		</div>
	);
}
