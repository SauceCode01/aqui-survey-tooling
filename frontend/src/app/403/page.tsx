import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, ShieldAlert } from "@/shared/lib/icons";
import { ActionButton } from "@/shared/ui/ActionButton";

export const metadata: Metadata = {
	title: "403 - Permission Denied | SkillSprint PMIS",
	description: "You do not have permission to access this resource.",
};

export default function ForbiddenPage() {
	return (
		<div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-6 text-center select-none">
			<div className="flex flex-col items-center max-w-md">
				<ShieldAlert className="w-24 h-24 text-slate-400 mb-6 stroke-[1.25]" />

				<h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 mb-3">
					403 &ndash; Permission Denied
				</h1>

				<p className="text-sm sm:text-base text-slate-500 mb-8 leading-relaxed">
					You don&apos;t have access to this resource. The structure may be
					restricted, or your account lacks the required leadership or
					membership permissions.
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
