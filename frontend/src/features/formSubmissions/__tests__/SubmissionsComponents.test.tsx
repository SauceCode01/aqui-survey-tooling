import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { SubmissionDetailModal } from "../components/SubmissionDetailModal";
import { SubmissionStatsCards } from "../components/SubmissionStatsCards";
import { SubmissionsTable } from "../components/SubmissionsTable";
import type { FormSubmission } from "../types/IFormSubmissionsApi";

const MOCK_SUBMISSIONS: FormSubmission[] = [
	{
		id: "sub-1",
		email: "respondent1@example.com",
		sourceId: "src-1",
		createdAt: "2026-03-01T12:00:00Z",
		updatedAt: "2026-03-01T12:00:00Z",
		answers: [
			{
				question: "Satisfaction Level",
				questionType: "rating",
				answerType: "string",
				answer: "5/5",
			},
			{
				question: "Interested Topics",
				questionType: "multiple-choice",
				answerType: "string[]",
				answer: ["Cloud", "DevOps"],
			},
		],
	},
];

describe("Submissions Components", () => {
	it("renders SubmissionStatsCards accurately", () => {
		render(
			<SubmissionStatsCards
				totalSources={3}
				submissions={MOCK_SUBMISSIONS}
				activeKeysCount={2}
			/>,
		);

		expect(screen.getByText("Form Sources")).toBeInTheDocument();
		expect(screen.getByText("Total Submissions")).toBeInTheDocument();
		expect(screen.getByText("Active API Keys")).toBeInTheDocument();
		expect(screen.getByText("1")).toBeInTheDocument(); // 1 submission
	});

	it("renders SubmissionsTable and opens detail modal on inspect", () => {
		render(
			<SubmissionsTable
				submissions={MOCK_SUBMISSIONS}
				isLoading={false}
				sourceNamesById={{ "src-1": "Product Survey" }}
				onDeleteSubmission={vi.fn()}
			/>,
		);

		expect(screen.getByText("respondent1@example.com")).toBeInTheDocument();
		expect(screen.getByText("Product Survey")).toBeInTheDocument();

		const inspectBtn = screen.getByRole("button", { name: /Inspect/i });
		fireEvent.click(inspectBtn);

		expect(screen.getByText("Form Submission Details")).toBeInTheDocument();
		expect(screen.getByText("1. Satisfaction Level")).toBeInTheDocument();
		expect(screen.getByText("5/5")).toBeInTheDocument();
		expect(screen.getByText("Cloud")).toBeInTheDocument();
	});

	it("renders SubmissionDetailModal directly", () => {
		render(
			<SubmissionDetailModal
				submission={MOCK_SUBMISSIONS[0]!}
				isOpen={true}
				onClose={vi.fn()}
				sourceName="Product Survey"
			/>,
		);

		expect(screen.getByText("Form Submission Details")).toBeInTheDocument();
		expect(screen.getByText("respondent1@example.com")).toBeInTheDocument();
	});
});
