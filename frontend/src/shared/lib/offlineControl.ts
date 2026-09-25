import { onlineManager } from "@tanstack/react-query";
import { useEffect, useState } from "react";

const OFFLINE_OVERRIDE_KEY = "ssd_offline_override";

export type OfflineOverrideListener = (override: boolean | null) => void;
const overrideListeners = new Set<OfflineOverrideListener>();

let inMemoryOverride: boolean | null = null;

/**
 * Returns the currently active manual offline override,
 * or null if using standard browser network state.
 */
export function getOfflineOverride(): boolean | null {
	if (inMemoryOverride !== null) {
		return inMemoryOverride;
	}

	if (typeof window === "undefined") {
		return null;
	}

	try {
		const stored = localStorage.getItem(OFFLINE_OVERRIDE_KEY);
		if (stored === "true") return true;
		if (stored === "false") return false;
		return null;
	} catch {
		return null;
	}
}

/**
 * Sets or clears the manual offline override for testing and showcase simulation.
 * - true: forces isOffline() to return true.
 * - false: forces isOffline() to return false.
 * - null: clears the override and restores actual browser network state.
 */
export function setOfflineOverride(override: boolean | null): void {
	inMemoryOverride = override;

	if (typeof window !== "undefined") {
		try {
			if (override === null) {
				localStorage.removeItem(OFFLINE_OVERRIDE_KEY);
			} else {
				localStorage.setItem(OFFLINE_OVERRIDE_KEY, String(override));
			}
		} catch (err) {
			console.warn("Unable to persist offline override in localStorage:", err);
		}
	}

	// Synchronize TanStack Query internal network state
	try {
		if (override !== null) {
			onlineManager.setOnline(!override);
		} else if (
			typeof navigator !== "undefined" &&
			typeof navigator.onLine === "boolean"
		) {
			onlineManager.setOnline(navigator.onLine);
		}
	} catch {
		// safe ignore in non-browser/test contexts
	}

	// Broadcast to active subscribers
	for (const listener of overrideListeners) {
		try {
			listener(override);
		} catch (err) {
			console.error("Error in offline override listener:", err);
		}
	}
}

/**
 * Convenience setter for testing and showcase toggle: setOffline(true) or setOffline(false).
 */
export function setOffline(offline: boolean): void {
	setOfflineOverride(offline);
}

/**
 * Toggles the current offline status for showcase / manual testing.
 * If currently offline, restores online; if online, forces offline.
 */
export function toggleOffline(): boolean {
	const current = getOfflineOverride();
	const next = current !== true;
	setOfflineOverride(next);
	return next;
}

/**
 * Resets any manual offline override, restoring natural browser network detection.
 */
export function resetOfflineOverride(): void {
	setOfflineOverride(null);
}

/**
 * Subscribes a callback to manual offline override changes (including multi-tab StorageEvents).
 */
export function subscribeOfflineOverride(
	listener: OfflineOverrideListener,
): () => void {
	overrideListeners.add(listener);
	return () => {
		overrideListeners.delete(listener);
	};
}

/**
 * React hook for showcase controls and testing to read and toggle the manual offline override.
 */
export function useOfflineControl() {
	const [override, setOverride] = useState<boolean | null>(() =>
		getOfflineOverride(),
	);

	useEffect(() => {
		setOverride(getOfflineOverride());

		const unsubscribe = subscribeOfflineOverride((next) => {
			setOverride(next);
		});

		const handleStorage = (e: StorageEvent) => {
			if (e.key === OFFLINE_OVERRIDE_KEY) {
				const next =
					e.newValue === "true" ? true : e.newValue === "false" ? false : null;
				inMemoryOverride = next;
				setOverride(next);
				for (const listener of overrideListeners) {
					try {
						listener(next);
					} catch {
						// safe ignore
					}
				}
			}
		};

		if (typeof window !== "undefined") {
			window.addEventListener("storage", handleStorage);
		}

		return () => {
			unsubscribe();
			if (typeof window !== "undefined") {
				window.removeEventListener("storage", handleStorage);
			}
		};
	}, []);

	const isOverridden = override !== null;
	const isOffline = override === true;

	return {
		isOffline,
		isOverridden,
		setOffline,
		toggleOffline,
		resetOffline: resetOfflineOverride,
	};
}
