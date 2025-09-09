import { useEffect, useState } from "react";

export function useVenue(slug?: string) {
  const [venue, setVenue] = useState<{ id: string; slug: string; name: string } | null>(null);
  const [loading, setLoading] = useState(!!slug);
  const [error, setError] = useState<unknown>(null);

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    
    // Fetch venue data from API
    fetch(`/api/venues/${slug}`)
      .then(res => res.json())
      .then(data => setVenue(data.venue))
      .catch(setError)
      .finally(() => setLoading(false));
  }, [slug]);

  return { venue, loading, error };
}