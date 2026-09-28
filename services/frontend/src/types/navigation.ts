export interface BreadcrumbItem {
	label: string;
	href?: string;
	isCurrent?: boolean;
}

export interface NavItem {
	label: string;
	href: string;
	icon?: string;
	badge?: string | number;
	children?: NavItem[];
}

export interface SitemapRoute {
	path: string;
	pageName: string;
	access: string;
	parentNav: string;
	category: "Auth" | "Core" | "Structure" | "Work" | "Settings" | "System";
	isNested?: boolean;
}
