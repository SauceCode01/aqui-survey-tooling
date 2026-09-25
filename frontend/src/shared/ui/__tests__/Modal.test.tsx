import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Modal } from "@/shared/ui/Modal";

describe("Modal component", () => {
	it("does not render when isOpen is false", () => {
		render(
			<Modal isOpen={false} onClose={vi.fn()} title="Test Modal">
				Modal Content
			</Modal>,
		);
		expect(screen.queryByText("Test Modal")).not.toBeInTheDocument();
	});

	it("renders when isOpen is true", () => {
		render(
			<Modal isOpen={true} onClose={vi.fn()} title="Test Modal">
				Modal Content
			</Modal>,
		);
		expect(screen.getByText("Test Modal")).toBeInTheDocument();
		expect(screen.getByText("Modal Content")).toBeInTheDocument();
	});

	it("calls onClose when close button clicked", () => {
		const handleClose = vi.fn();
		render(
			<Modal isOpen={true} onClose={handleClose} title="Test Modal">
				Modal Content
			</Modal>,
		);
		const closeBtn = screen.getByRole("button", { name: "Close dialog" });
		fireEvent.click(closeBtn);
		expect(handleClose).toHaveBeenCalledTimes(1);
	});

	it("calls onClose when Escape key is pressed", () => {
		const handleClose = vi.fn();
		render(
			<Modal isOpen={true} onClose={handleClose} title="Test Modal">
				Modal Content
			</Modal>,
		);
		fireEvent.keyDown(window, { key: "Escape" });
		expect(handleClose).toHaveBeenCalledTimes(1);
	});
});
