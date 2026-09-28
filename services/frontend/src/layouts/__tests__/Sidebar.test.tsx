import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Sidebar } from "@/layouts/app/components/Sidebar";

vi.mock("next/navigation", () => ({
	usePathname: () => "/",
}));

describe("Sidebar component", () => {
	it("renders brand, navigation items, and user profile", () => {
		const onClose = vi.fn();
		render(<Sidebar isOpen={true} onClose={onClose} />);

		expect(screen.getByText("Aqui Survey")).toBeInTheDocument();
		expect(screen.getByText("Overview")).toBeInTheDocument();
		expect(screen.getByText("Submission Sources")).toBeInTheDocument();
		expect(screen.getByText("Form Submissions")).toBeInTheDocument();
		expect(screen.getByText("Survey Admin")).toBeInTheDocument();
		expect(screen.getByText("admin@aquisurvey.io")).toBeInTheDocument();
	});

	it("renders internal navigation links with correct hrefs", () => {
		const onClose = vi.fn();
		render(<Sidebar isOpen={true} onClose={onClose} />);

		const overviewLink = screen.getByRole("link", {
			name: /Overview/i,
		});
		expect(overviewLink).toHaveAttribute("href", "/");

		const sourcesLink = screen.getByRole("link", {
			name: /Submission Sources/i,
		});
		expect(sourcesLink).toHaveAttribute("href", "/sources");

		const submissionsLink = screen.getByRole("link", {
			name: "Form Submissions",
		});
		expect(submissionsLink).toHaveAttribute("href", "/submissions");
	});

	it("triggers onClose when navigation items are clicked", () => {
		const onClose = vi.fn();
		render(<Sidebar isOpen={true} onClose={onClose} />);

		const sourcesLink = screen.getByRole("link", {
			name: /Submission Sources/i,
		});
		fireEvent.click(sourcesLink);
		expect(onClose).toHaveBeenCalled();
	});
});
