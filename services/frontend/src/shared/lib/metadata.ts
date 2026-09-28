import type { Metadata } from "next";
import { config } from "./config";

export const APP_NAME = "SolidStack Fullstack Template";
export const DEFAULT_META_DESCRIPTION =
	"Clean Architecture fullstack template with Next.js, Express, Nginx Gateway, and end-to-end tests.";

interface GeneratePageMetadataProps {
	title?: string;
	description?: string;
	path?: string;
}

export function generatePageMetadata({
	title,
	description = DEFAULT_META_DESCRIPTION,
	path = "",
}: GeneratePageMetadataProps = {}): Metadata {
	const fullTitle = title ? `${title} | ${APP_NAME}` : APP_NAME;

	return {
		title: fullTitle,
		description,
		metadataBase: new URL(config.frontendExternalUrl),
		openGraph: {
			title: fullTitle,
			description,
			siteName: APP_NAME,
			type: "website",
			url: path,
		},
		robots: {
			index: true,
			follow: true,
		},
	};
}
