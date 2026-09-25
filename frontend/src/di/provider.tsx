"use client";

import type { Container } from "@solid-stack/di";
import type React from "react";
import { createContext, useContext, useMemo } from "react";
import { container as defaultContainer } from "./container";

const DiContext = createContext<Container | null>(null);

export interface DiProviderProps {
	children: React.ReactNode;
	customContainer?: Container;
}

/**
 * Context provider that supplies a loaded @solid-stack/di Container to the client-side React component tree.
 */
export function DiProvider({ children, customContainer }: DiProviderProps) {
	const containerInstance = useMemo(() => {
		return customContainer ?? defaultContainer;
	}, [customContainer]);

	return (
		<DiContext.Provider value={containerInstance}>
			{children}
		</DiContext.Provider>
	);
}

/**
 * Hook to retrieve the current @solid-stack/di Container from React Context.
 */
export function useDi(): Container {
	const context = useContext(DiContext);
	if (!context) {
		// Graceful fallback to default singleton container if rendered outside provider
		return defaultContainer;
	}
	return context;
}

/**
 * Hook to resolve a dependency token directly from the @solid-stack/di Container.
 */
export function useInject<T>(token: Parameters<Container["resolve"]>[0]): T {
	const container = useDi();
	return container.resolve(token) as T;
}
