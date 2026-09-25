import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Server } from "@/shared/lib/icons";
import { ActionButton } from "@/shared/ui/ActionButton";

export const metadata: Metadata = {
	title: "500 - Internal Server Error | PMIS",
	description: "An unexpected server-side error occurred.",
};

export default function ServerErrorPage() {
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
					<Link href="/">
						<ActionButton
							variant="primary"
							size="md"
							rightIcon={<ArrowRight className="h-4 w-4" />}
						>
							Back to Dashboard
						</ActionButton>
					</Link>
					<Link href="/orgs">
						<ActionButton variant="secondary" size="md">
							Browse Directory
						</ActionButton>
					</Link>
				</div>
			</div>
		</div>
	);
}
