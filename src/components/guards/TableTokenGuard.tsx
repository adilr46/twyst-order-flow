"use client";

export default function TableTokenGuard({ children }: { children: React.ReactNode }) {
  // TODO: read token and redirect to /scan-again if missing
  return <>{children}</>;
}