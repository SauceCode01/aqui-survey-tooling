import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { DiProvider } from "@/di/provider";
import { CreateSourceModal } from "../components/CreateSourceModal";
import { KeyManagementModal } from "../components/KeyManagementModal";
import { SourcesList } from "../components/SourcesList";
import type { SubmissionSource } from "../types/ISubmissionSourcesApi";

const MOCK_SOURCES: SubmissionSource[] = [
	{
		id: "src-1",
		name: "Customer Feedback Form",
		createdAt: "2026-01-01T00:00:00Z",
		updatedAt: "2026-01-01T00:00:00Z",
	},
	{
		id: "src-2",
		name: "Event RSVP Intake",
		createdAt: "2026-02-01T00:00:00Z",
		updatedAt: "2026-02-01T00:00:00Z",
	},
];

describe("Sources Components", () => {
	it("renders SourcesList with source names and actions", () => {
		render(
			<DiProvider>
				<SourcesList
					sources={MOCK_SOURCES}
					isLoading={false}
					onCreateSource={vi.fn()}
					onDeleteSource={vi.fn()}
				/>
			</DiProvider>,
		);

		expect(screen.getByText("Customer Feedback Form")).toBeInTheDocument();
		expect(screen.getByText("Event RSVP Intake")).toBeInTheDocument();
		expect(screen.getAllByText("Manage Keys").length).toBe(2);
	});

	it("handles creating a new source through CreateSourceModal", async () => {
		const handleCreate = vi.fn().mockResolvedValue(undefined);
		const handleClose = vi.fn();

		render(
			<CreateSourceModal
				isOpen={true}
				onClose={handleClose}
				onCreate={handleCreate}
			/>,
		);

		expect(screen.getByText("Add Submission Source")).toBeInTheDocument();

		const input = screen.getByPlaceholderText(
			"e.g. Google Forms - Customer Feedback",
		);
		fireEvent.change(input, { target: { value: "New Test Form" } });

		const submitBtn = screen.getByRole("button", { name: "Create Source" });
		fireEvent.click(submitBtn);

		await waitFor(() => {
			expect(handleCreate).toHaveBeenCalledWith("New Test Form");
			expect(handleClose).toHaveBeenCalled();
		});
	});

	it("renders KeyManagementModal and allows key actions", async () => {
		render(
			<DiProvider>
				<KeyManagementModal
					source={MOCK_SOURCES[0]!}
					isOpen={true}
					onClose={vi.fn()}
				/>
			</DiProvider>,
		);

		expect(
			screen.getByText("API Keys: Customer Feedback Form"),
		).toBeInTheDocument();
		expect(screen.getByText("Generate Key")).toBeInTheDocument();
	});
});
