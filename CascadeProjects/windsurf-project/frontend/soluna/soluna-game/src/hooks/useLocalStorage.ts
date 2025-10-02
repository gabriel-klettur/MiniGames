import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * useLocalStorageState
 * React hook to keep a piece of state in sync with localStorage safely.
 * - Key collisions avoided by explicit key
 * - JSON serialization by default (custom serializers supported)
 */
export function useLocalStorageState<T>(
  key: string,
  initialValue: T,
  options?: {
    serialize?: (v: T) => string;
    deserialize?: (raw: string) => T;
  }
): [T, (v: T | ((prev: T) => T)) => void, () => void] {
  const serialize = options?.serialize ?? ((v: T) => JSON.stringify(v));
  const deserialize = options?.deserialize ?? ((raw: string) => JSON.parse(raw) as T);

  const initializedRef = useRef(false);
  const [value, setValue] = useState<T>(() => {
    try {
      const raw = window.localStorage.getItem(key);
      if (raw == null) return initialValue;
      return deserialize(raw);
    } catch {
      return initialValue;
    }
  });

  // Write-through effect
  useEffect(() => {
    if (!initializedRef.current) {
      initializedRef.current = true;
      return;
    }
    try {
      const raw = serialize(value);
      window.localStorage.setItem(key, raw);
    } catch {
      // Best-effort only
    }
  }, [key, serialize, value]);

  const remove = useCallback(() => {
    try { window.localStorage.removeItem(key); } catch {}
  }, [key]);

  const update = useCallback((next: T | ((prev: T) => T)) => {
    setValue((prev) => (typeof next === 'function' ? (next as (p: T) => T)(prev) : next));
  }, []);

  return [value, update, remove];
}

/**
 * useLocalStorageBoolean
 * Convenience wrapper for boolean flags persisted in localStorage.
 */
export function useLocalStorageBoolean(
  key: string,
  initial: boolean = false
): [boolean, (next: boolean | ((p: boolean) => boolean)) => void, () => void] {
  const [value, setValue, remove] = useLocalStorageState<boolean>(key, initial, {
    serialize: (v) => (v ? '1' : '0'),
    deserialize: (raw) => raw === '1',
  });
  return [value, setValue, remove];
}
