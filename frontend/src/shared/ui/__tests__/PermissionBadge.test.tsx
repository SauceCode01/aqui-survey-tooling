import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { PermissionBadge } from "@/shared/ui/PermissionBadge";

describe("PermissionBadge component", () => {
	it("renders standard permission badge", () => {
		render(<PermissionBadge permission="VIEW" />);
		const badge = screen.getByText("VIEW");
		expect(badge).toBeInTheDocument();
	});

	it("renders OWNER permission with indigo styling", () => {
		render(<PermissionBadge permission="OWNER" />);
		const badge = screen.getByText("OWNER");
		expect(badge).toBeInTheDocument();
		expect(badge.className).toContain("bg-indigo-100");
	});

	it("renders HEAD permission with purple styling", () => {
		render(<PermissionBadge permission="HEAD" />);
		const badge = screen.getByText("HEAD");
		expect(badge).toBeInTheDocument();
		expect(badge.className).toContain("bg-purple-100");
	});
});
