import { useEffect, useState } from "react";
import { getOfflineOverride, subscribeOfflineOverride } from "./offlineControl";

/**
 * Returns whether the application/device is currently offline.
 * In production, checks navigator.onLine status.
 * Can be overridden via offlineControl for testing or showcase purposes.
 */
export function isOffline(): boolean {
	const override = getOfflineOverride();
	if (override !== null) {
		return override;
	}

	if (
		typeof navigator !== "undefined" &&
		typeof navigator.onLine === "boolean"
	) {
		return !navigator.onLine;
	}

	return false;
}

/**
 * Returns whether the application/device is currently online.
 */
export function isOnline(): boolean {
	return !isOffline();
}

/**
 * Subscribes a listener to network status changes.
 * Listens to browser online/offline events and manual offline control overrides.
 */
export function subscribeNetworkStatus(
	listener: (offline: boolean) => void,
): () => void {
	const handleEvent = () => {
		listener(isOffline());
	};

	if (typeof window !== "undefined") {
		window.addEventListener("online", handleEvent);
		window.addEventListener("offline", handleEvent);
	}

	const unsubscribeOverride = subscribeOfflineOverride((override) => {
		if (override !== null) {
			listener(override);
		} else {
			listener(isOffline());
		}
	});

	return () => {
		if (typeof window !== "undefined") {
			window.removeEventListener("online", handleEvent);
			window.removeEventListener("offline", handleEvent);
		}
		unsubscribeOverride();
	};
}

/**
 * React hook to observe current network offline status.
 * Mimics production network status observation (navigator.onLine + online/offline events),
 * while respecting any active offline override from testing/showcase.
 */
export function useIsOffline(): boolean {
	const [offline, setOfflineState] = useState<boolean>(() => isOffline());

	useEffect(() => {
		setOfflineState(isOffline());

		return subscribeNetworkStatus((nextOffline) => {
			setOfflineState(nextOffline);
		});
	}, []);

	return offline;
}

/**
 * React hook to observe current network online status.
 */
export function useIsOnline(): boolean {
	return !useIsOffline();
}
