import { useEffect, useState } from "react";

function readBooleanFromStorage(key: string, fallback: boolean) {
  try {
    const storedValue = localStorage.getItem(key);
    if (storedValue === null) {
      return fallback;
    }

    return JSON.parse(storedValue) as boolean;
  } catch {
    return fallback;
  }
}

export function useLocalStorageBoolean(key: string, fallback: boolean) {
  const [value, setValue] = useState<boolean>(() => readBooleanFromStorage(key, fallback));

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      return;
    }
  }, [key, value]);

  return [value, setValue] as const;
}
