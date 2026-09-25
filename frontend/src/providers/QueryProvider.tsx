"use client";

import {
	QueryClient,
	QueryClientProvider,
	useMutation,
	useQuery,
	useQueryClient,
} from "@tanstack/react-query";
import type React from "react";
import { useState } from "react";

export function createQueryClient(): QueryClient {
	return new QueryClient({
		defaultOptions: {
			queries: {
				staleTime: 60 * 1000,
				gcTime: 5 * 60 * 1000,
				refetchOnWindowFocus: false,
				retry: 1,
			},
			mutations: {
				retry: false,
			},
		},
	});
}

export function QueryProvider({ children }: { children: React.ReactNode }) {
	const [queryClient] = useState(() => createQueryClient());

	return (
		<QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
	);
}

export { useMutation, useQuery, useQueryClient };
