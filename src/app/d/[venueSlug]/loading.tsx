export default function Loading() {
  return (
    <div className="p-4 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="h-28 rounded-xl bg-gray-100 animate-pulse" />
      ))}
    </div>
  );
}



