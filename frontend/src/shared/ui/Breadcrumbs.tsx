import Link from "next/link";
import { cn } from "@/shared/lib/cn";
import { ChevronRight, Home } from "@/shared/lib/icons";
import type { BreadcrumbItem } from "@/types/navigation";

export interface BreadcrumbsProps {
	items: BreadcrumbItem[];
	className?: string;
}

export function Breadcrumbs({ items, className }: BreadcrumbsProps) {
	return (
		<nav
			className={cn(
				"flex items-center text-xs sm:text-sm text-slate-500",
				className,
			)}
			aria-label="Breadcrumb"
		>
			<ol className="flex items-center space-x-1.5 sm:space-x-2 truncate">
				<li>
					<Link
						href="/"
						className="inline-flex items-center text-slate-400 hover:text-slate-600 transition-colors"
						title="Home"
					>
						<Home className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" />
						<span className="sr-only">Home</span>
					</Link>
				</li>

				{items.map((item, index) => {
					const isLast = index === items.length - 1;

					return (
						<li
							key={index}
							className="flex items-center space-x-1.5 sm:space-x-2 truncate"
						>
							<ChevronRight className="h-3.5 w-3.5 text-slate-400 shrink-0" />
							{isLast || !item.href ? (
								<span
									className="font-medium text-slate-900 truncate max-w-[120px] sm:max-w-[200px]"
									aria-current={isLast ? "page" : undefined}
								>
									{item.label}
								</span>
							) : (
								<Link
									href={item.href}
									className="hover:text-indigo-600 transition-colors truncate max-w-[100px] sm:max-w-[160px]"
								>
									{item.label}
								</Link>
							)}
						</li>
					);
				})}
			</ol>
		</nav>
	);
}
