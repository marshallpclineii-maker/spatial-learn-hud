import { useEffect, useState } from "react";

export type XrSupport = "checking" | "supported" | "unsupported" | "insecure-context";

/** Reports what this device actually supports — never a fabricated connected state. */
export function useWebXrSupport(): XrSupport {
  const [support, setSupport] = useState<XrSupport>("checking");

  useEffect(() => {
    let cancelled = false;
    const nav = navigator as Navigator & { xr?: { isSessionSupported(mode: string): Promise<boolean> } };
    if (!window.isSecureContext) {
      setSupport("insecure-context");
      return;
    }
    if (!nav.xr) {
      setSupport("unsupported");
      return;
    }
    nav.xr
      .isSessionSupported("immersive-vr")
      .then((ok) => !cancelled && setSupport(ok ? "supported" : "unsupported"))
      .catch(() => !cancelled && setSupport("unsupported"));
    return () => {
      cancelled = true;
    };
  }, []);

  return support;
}
