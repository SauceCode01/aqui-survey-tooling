import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ActionButton } from "@/shared/ui/ActionButton";

describe("ActionButton component", () => {
	it("renders with default primary variant", () => {
		render(<ActionButton>Click Me</ActionButton>);
		const btn = screen.getByRole("button", { name: "Click Me" });
		expect(btn).toBeInTheDocument();
		expect(btn.className).toContain("bg-emerald-600");
	});

	it("renders with danger variant", () => {
		render(<ActionButton variant="danger">Delete</ActionButton>);
		const btn = screen.getByRole("button", { name: "Delete" });
		expect(btn.className).toContain("bg-rose-600");
	});

	it("renders loading state and disables button", () => {
		render(
			<ActionButton isLoading loadingText="Saving...">
				Save
			</ActionButton>,
		);
		const btn = screen.getByRole("button");
		expect(btn).toBeDisabled();
		expect(btn).toHaveAttribute("aria-busy", "true");
		expect(screen.getByText("Saving...")).toBeInTheDocument();
	});

	it("handles onClick callback", () => {
		const handleClick = vi.fn();
		render(<ActionButton onClick={handleClick}>Action</ActionButton>);
		const btn = screen.getByRole("button", { name: "Action" });
		fireEvent.click(btn);
		expect(handleClick).toHaveBeenCalledTimes(1);
	});

	it("does not fire click when disabled", () => {
		const handleClick = vi.fn();
		render(
			<ActionButton disabled onClick={handleClick}>
				Disabled
			</ActionButton>,
		);
		const btn = screen.getByRole("button", { name: "Disabled" });
		fireEvent.click(btn);
		expect(handleClick).not.toHaveBeenCalled();
	});
});
