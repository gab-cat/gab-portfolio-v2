import type { ReactNode } from "react";

/** Clay pages wrap themselves in AppShell, so the frame adds nothing. */
export function Frame({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
