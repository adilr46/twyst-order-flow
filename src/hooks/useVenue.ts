import { useEffect, useState } from "react";
import { getVenueBySlug } from "@/lib/data-layer";

export function useVenue(slug?: string) {
  const [venue, setVenue] = useState<{ id: string; slug: string; name: string } | null>(null);
  const [loading, setLoading] = useState(!!slug);
  const [error, setError] = useState<unknown>(null);

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    getVenueBySlug(slug).then(setVenue).catch(setError).finally(() => setLoading(false));
  }, [slug]);

  return { venue, loading, error };
}