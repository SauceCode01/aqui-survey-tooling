import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Search } from "@/shared/lib/icons";
import { ActionButton } from "@/shared/ui/ActionButton";

export const metadata: Metadata = {
	title: "404 - Page Not Found | SkillSprint PMIS",
	description: "The requested resource could not be found.",
};

export default function NotFoundPage() {
	return (
		<div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-6 text-center select-none">
			<div className="flex flex-col items-center max-w-md">
				<Search className="w-24 h-24 text-slate-400 mb-6 stroke-[1.25]" />

				<h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 mb-3">
					404 &ndash; Page Not Found
				</h1>

				<p className="text-sm sm:text-base text-slate-500 mb-8 leading-relaxed">
					The requested resource could not be found. It may have been deleted,
					moved, or you may have followed an outdated link.
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
