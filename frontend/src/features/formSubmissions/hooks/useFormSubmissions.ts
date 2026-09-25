"use client";

import { useCallback, useEffect, useState } from "react";
import { useDi } from "@/di/provider";
import {
	type CreateSubmissionInput,
	type FormSubmission,
	IFormSubmissionsApi,
} from "../types/IFormSubmissionsApi";

export function useFormSubmissions(sourceId?: string) {
	const container = useDi();
	const api = container.resolve(IFormSubmissionsApi);
	const [submissions, setSubmissions] = useState<FormSubmission[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const fetchSubmissions = useCallback(async () => {
		setIsLoading(true);
		setError(null);
		try {
			const data = await api.listSubmissions(sourceId);
			setSubmissions(data);
		} catch (err) {
			setError(
				err instanceof Error ? err.message : "Failed to load submissions",
			);
		} finally {
			setIsLoading(false);
		}
	}, [api, sourceId]);

	useEffect(() => {
		fetchSubmissions();
	}, [fetchSubmissions]);

	const createSubmission = async (input: CreateSubmissionInput) => {
		try {
			const result = await api.createSubmission(input);
			await fetchSubmissions();
			return result;
		} catch (err) {
			const message =
				err instanceof Error ? err.message : "Failed to create submission";
			setError(message);
			throw new Error(message);
		}
	};

	const deleteSubmission = async (id: string) => {
		try {
			await api.deleteSubmission(id);
			setSubmissions((prev) => prev.filter((s) => s.id !== id));
		} catch (err) {
			const message =
				err instanceof Error ? err.message : "Failed to delete submission";
			setError(message);
			throw new Error(message);
		}
	};

	return {
		submissions,
		isLoading,
		error,
		fetchSubmissions,
		createSubmission,
		deleteSubmission,
	};
}

export function useFormSubmission(submissionId: string | null) {
	const container = useDi();
	const api = container.resolve(IFormSubmissionsApi);
	const [submission, setSubmission] = useState<FormSubmission | null>(null);
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const fetchSubmission = useCallback(async () => {
		if (!submissionId) {
			setSubmission(null);
			return;
		}
		setIsLoading(true);
		setError(null);
		try {
			const data = await api.getSubmission(submissionId);
			setSubmission(data);
		} catch (err) {
			setError(
				err instanceof Error ? err.message : "Failed to fetch submission",
			);
		} finally {
			setIsLoading(false);
		}
	}, [api, submissionId]);

	useEffect(() => {
		fetchSubmission();
	}, [fetchSubmission]);

	return {
		submission,
		isLoading,
		error,
		fetchSubmission,
	};
}
