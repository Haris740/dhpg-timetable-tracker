import { useState, useEffect } from 'react';
import { Preferences } from '@capacitor/preferences';
import { Capacitor } from '@capacitor/core';

export function useLocalStorage<T>(key: string, initialValue: T) {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error('LocalStorage Read Error:', error);
      return initialValue;
    }
  });

  // Sync with Capacitor Preferences whenever storedValue changes
  useEffect(() => {
    if (Capacitor.isNativePlatform()) {
      const syncWithNative = async () => {
        try {
          const valueToStore = storedValue !== undefined ? JSON.stringify(storedValue) : 'null';
          await Preferences.set({
            key: key,
            value: valueToStore,
          });
          console.log(`[Capacitor] Synced ${key}`);
        } catch (e) {
          console.error(`[Capacitor] Native Sync Error for ${key}:`, e);
        }
      };
      syncWithNative();
    }
  }, [key, storedValue]);

  const setValue = (value: T | ((val: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.error('LocalStorage Write Error:', error);
    }
  };

  return [storedValue, setValue] as const;
}
