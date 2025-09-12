"use client";

export default function VenueLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="h-screen h-dvh bg-gray-50 relative overflow-hidden">
      <div className="relative z-10 h-full overflow-y-auto">
        {children}
      </div>
    </div>
  );
}
