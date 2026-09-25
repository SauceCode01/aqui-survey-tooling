import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { DiProvider } from "@/di/provider";
import { AppLayout } from "@/layouts/app/AppLayout";
import { QueryProvider } from "@/providers/QueryProvider";

describe("AppLayout shell", () => {
	it("renders layout shell with navbar, sidebar brand, and content", () => {
		render(
			<DiProvider>
				<QueryProvider>
					<AppLayout
						breadcrumbs={[
							{ label: "Overview", href: "/welcome" },
							{ label: "Dashboard" },
						]}
					>
						<div data-testid="page-content">Main Page Content</div>
					</AppLayout>
				</QueryProvider>
			</DiProvider>,
		);

		expect(screen.getByTestId("page-content")).toBeInTheDocument();
		expect(screen.getByText("Dashboard")).toBeInTheDocument();
		expect(screen.getByText("Aqui Survey")).toBeInTheDocument();
		expect(screen.getAllByText("Overview").length).toBeGreaterThan(0);
	});
});
