import { useEffect, useState } from "react";

/** True only after client hydration — gate browser-only rendering with this. */
export function useHydrated() {
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);
  return hydrated;
}
