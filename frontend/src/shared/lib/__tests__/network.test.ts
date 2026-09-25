import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
	isOffline,
	isOnline,
	subscribeNetworkStatus,
	useIsOffline,
	useIsOnline,
} from "../network";
import {
	getOfflineOverride,
	resetOfflineOverride,
	setOffline,
	toggleOffline,
	useOfflineControl,
} from "../offlineControl";

describe("Network Status & Offline Control", () => {
	beforeEach(() => {
		resetOfflineOverride();
		localStorage.clear();
	});

	afterEach(() => {
		resetOfflineOverride();
		localStorage.clear();
	});

	describe("isOffline and isOnline utilities", () => {
		it("defaults to online when no override is set", () => {
			expect(isOffline()).toBe(false);
			expect(isOnline()).toBe(true);
			expect(getOfflineOverride()).toBeNull();
		});

		it("reflects manual override when set via offlineControl", () => {
			setOffline(true);
			expect(isOffline()).toBe(true);
			expect(isOnline()).toBe(false);
			expect(getOfflineOverride()).toBe(true);

			setOffline(false);
			expect(isOffline()).toBe(false);
			expect(isOnline()).toBe(true);
			expect(getOfflineOverride()).toBe(false);
		});

		it("resets override to natural browser state", () => {
			setOffline(true);
			expect(isOffline()).toBe(true);

			resetOfflineOverride();
			expect(getOfflineOverride()).toBeNull();
			expect(isOffline()).toBe(false);
		});

		it("toggles offline override cleanly", () => {
			expect(isOffline()).toBe(false);

			const toggledOn = toggleOffline();
			expect(toggledOn).toBe(true);
			expect(isOffline()).toBe(true);

			const toggledOff = toggleOffline();
			expect(toggledOff).toBe(false);
			expect(isOffline()).toBe(false);
		});
	});

	describe("subscribeNetworkStatus", () => {
		it("notifies listeners when offline status changes via override", () => {
			const listener = vi.fn();
			const unsubscribe = subscribeNetworkStatus(listener);

			setOffline(true);
			expect(listener).toHaveBeenCalledWith(true);

			setOffline(false);
			expect(listener).toHaveBeenCalledWith(false);

			unsubscribe();
			setOffline(true);
			expect(listener).toHaveBeenCalledTimes(2);
		});

		it("notifies listeners on browser online/offline events", () => {
			const listener = vi.fn();
			const unsubscribe = subscribeNetworkStatus(listener);

			window.dispatchEvent(new Event("offline"));
			expect(listener).toHaveBeenCalled();

			window.dispatchEvent(new Event("online"));
			expect(listener).toHaveBeenCalled();

			unsubscribe();
		});
	});

	describe("useIsOffline and useIsOnline hooks", () => {
		it("provides reactive offline status in React components", () => {
			const { result: isOfflineResult } = renderHook(() => useIsOffline());
			const { result: isOnlineResult } = renderHook(() => useIsOnline());

			expect(isOfflineResult.current).toBe(false);
			expect(isOnlineResult.current).toBe(true);

			act(() => {
				setOffline(true);
			});

			expect(isOfflineResult.current).toBe(true);
			expect(isOnlineResult.current).toBe(false);

			act(() => {
				setOffline(false);
			});

			expect(isOfflineResult.current).toBe(false);
			expect(isOnlineResult.current).toBe(true);
		});
	});

	describe("useOfflineControl hook", () => {
		it("provides control methods for showcase and testing", () => {
			const { result } = renderHook(() => useOfflineControl());

			expect(result.current.isOffline).toBe(false);
			expect(result.current.isOverridden).toBe(false);

			act(() => {
				result.current.toggleOffline();
			});

			expect(result.current.isOffline).toBe(true);
			expect(result.current.isOverridden).toBe(true);

			act(() => {
				result.current.resetOffline();
			});

			expect(result.current.isOffline).toBe(false);
			expect(result.current.isOverridden).toBe(false);
		});
	});
});
