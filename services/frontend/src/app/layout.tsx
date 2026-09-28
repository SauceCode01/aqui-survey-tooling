import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { DiProvider } from "@/di/provider";
import { QueryProvider } from "@/providers/QueryProvider";
import { generatePageMetadata } from "@/shared/lib/metadata";
import "./globals.css";

const inter = Inter({
	variable: "--font-inter",
	subsets: ["latin"],
	display: "swap",
});

export const metadata: Metadata = generatePageMetadata({
	title: "SolidStack Fullstack Template",
	description:
		"Clean Architecture fullstack template with Next.js, Express, Nginx Gateway, and end-to-end tests.",
});

export default function RootLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<html lang="en" className={`${inter.variable} h-full antialiased`}>
			<body className="min-h-full flex flex-col font-sans bg-slate-50 text-slate-900">
				<DiProvider>
					<QueryProvider>{children}</QueryProvider>
				</DiProvider>
			</body>
		</html>
	);
}
