"use client";

import { useCallback, useEffect, useState } from "react";
import { useDi } from "@/di/provider";
import {
	type CreateSourceInput,
	ISubmissionSourcesApi,
	type SourceKey,
	type SubmissionSource,
} from "../types/ISubmissionSourcesApi";

export function useSubmissionSources() {
	const container = useDi();
	const api = container.resolve(ISubmissionSourcesApi);
	const [sources, setSources] = useState<SubmissionSource[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const fetchSources = useCallback(async () => {
		setIsLoading(true);
		setError(null);
		try {
			const data = await api.listSources();
			setSources(data);
		} catch (err) {
			setError(err instanceof Error ? err.message : "Failed to load sources");
		} finally {
			setIsLoading(false);
		}
	}, [api]);

	useEffect(() => {
		fetchSources();
	}, [fetchSources]);

	const createSource = async (input: CreateSourceInput) => {
		try {
			const created = await api.createSource(input);
			await fetchSources();
			return created;
		} catch (err) {
			const message =
				err instanceof Error ? err.message : "Failed to create source";
			setError(message);
			throw new Error(message);
		}
	};

	const deleteSource = async (id: string) => {
		try {
			await api.deleteSource(id);
			setSources((prev) => prev.filter((s) => s.id !== id));
		} catch (err) {
			const message =
				err instanceof Error ? err.message : "Failed to delete source";
			setError(message);
			throw new Error(message);
		}
	};

	return {
		sources,
		isLoading,
		error,
		fetchSources,
		createSource,
		deleteSource,
	};
}

export function useSourceKeys(sourceId?: string) {
	const container = useDi();
	const api = container.resolve(ISubmissionSourcesApi);
	const [keys, setKeys] = useState<SourceKey[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const fetchKeys = useCallback(async () => {
		setIsLoading(true);
		setError(null);
		try {
			const data = await api.listKeys(sourceId);
			setKeys(data);
		} catch (err) {
			setError(err instanceof Error ? err.message : "Failed to load keys");
		} finally {
			setIsLoading(false);
		}
	}, [api, sourceId]);

	useEffect(() => {
		fetchKeys();
	}, [fetchKeys]);

	const createKey = async (targetSourceId: string) => {
		try {
			const result = await api.createKey(targetSourceId);
			await fetchKeys();
			return result.key;
		} catch (err) {
			const message =
				err instanceof Error ? err.message : "Failed to generate key";
			setError(message);
			throw new Error(message);
		}
	};

	const revokeKey = async (keyId: string) => {
		try {
			await api.revokeKey(keyId);
			await fetchKeys();
		} catch (err) {
			const message =
				err instanceof Error ? err.message : "Failed to revoke key";
			setError(message);
			throw new Error(message);
		}
	};

	return {
		keys,
		isLoading,
		error,
		fetchKeys,
		createKey,
		revokeKey,
	};
}
