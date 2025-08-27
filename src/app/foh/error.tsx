"use client";

export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="p-6">
      <h2 className="text-xl font-semibold">FOH encountered an error.</h2>
      <p className="text-sm text-white/60">{error.message}</p>
      <button className="mt-4 px-4 py-2 bg-white/10 rounded-lg" onClick={() => reset()}>
        Try again
      </button>
    </div>
  );
}



