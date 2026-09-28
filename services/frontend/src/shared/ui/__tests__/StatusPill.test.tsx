import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { StatusPill } from "@/shared/ui/StatusPill";

describe("StatusPill component", () => {
	it("renders DONE status correctly", () => {
		render(<StatusPill status="DONE" />);
		const pill = screen.getByText("Done");
		expect(pill).toBeInTheDocument();
	});

	it("renders IN_PROGRESS status correctly", () => {
		render(<StatusPill status="IN_PROGRESS" />);
		expect(screen.getByText("In Progress")).toBeInTheDocument();
	});

	it("renders BLOCKED status correctly", () => {
		render(<StatusPill status="BLOCKED" />);
		expect(screen.getByText("Blocked")).toBeInTheDocument();
	});

	it("renders custom label when provided", () => {
		render(<StatusPill status="TODO" label="Pending Review" />);
		expect(screen.getByText("Pending Review")).toBeInTheDocument();
	});
});
