export const FIXED_CATEGORY_ORDER = ["All","Appetizers","Mains","Desserts","Drinks"] as const;
export type FixedCategory = typeof FIXED_CATEGORY_ORDER[number];

const normalizeTable: Record<string, FixedCategory | "UNKNOWN"> = {
  // All
  "all": "All",
  
  // Appetizers/Starters
  "appetizer": "Appetizers",
  "appetizers": "Appetizers",
  "starters": "Appetizers",
  "smallplates": "Appetizers",
  "sides": "Appetizers",
  "pastries": "Appetizers", // Added for cafe menu
  "pastry": "Appetizers",   // Added for cafe menu

  // Mains
  "main": "Mains",
  "mains": "Mains",
  "maincourse": "Mains",
  "entrees": "Mains",
  "entrée": "Mains",
  "entree": "Mains",
  "food": "Mains",         // Added for cafe menu
  "sandwiches": "Mains",   // Added for cafe menu
  "salads": "Mains",       // Added for cafe menu

  // Desserts
  "dessert": "Desserts",
  "desserts": "Desserts",
  "sweets": "Desserts",
  "cakes": "Desserts",     // Added for cafe menu
  "cookies": "Desserts",   // Added for cafe menu

  // Drinks
  "drinks": "Drinks",
  "beverages": "Drinks",
  "softdrinks": "Drinks",
  "cocktails": "Drinks",
  "mocktails": "Drinks",
  "coffee": "Drinks",
  "tea": "Drinks",
  "juices": "Drinks",
  "drink": "Drinks"        // Added for cafe menu
};

export function toTitleCase(input?: string): string {
  if (!input) return "";
  return input.replace(/\w\S*/g, (t) => t[0].toUpperCase() + t.slice(1).toLowerCase());
}

/** Normalize any incoming category string to one of FIXED_CATEGORY_ORDER (or "UNKNOWN"). */
export function normalizeCategory(raw?: string | null): FixedCategory | "UNKNOWN" {
  const t = (raw ?? "").toString().trim();
  if (!t) return "UNKNOWN";
  const key = t.toLowerCase().replace(/\s+/g, "");
  return normalizeTable[key] ?? (["appetizerf","apetizerf"].includes(key) ? "Appetizers" : "UNKNOWN");
}

/** Build a stable tab list: fixed order, always include All. */
export function buildTabsFromItems(items: Array<{ category?: string | null }> = []): FixedCategory[] {
  // Determine which fixed categories actually have items (besides All which is always there)
  const has = new Set<FixedCategory>();
  for (const it of items) {
    const norm = normalizeCategory(it?.category);
    if (norm !== "UNKNOWN") has.add(norm);
  }
  const tabs: FixedCategory[] = [];
  for (const f of FIXED_CATEGORY_ORDER) {
    if (f === "All") { tabs.push("All"); continue; }
    tabs.push(f); // always show the fixed four in order
  }
  return tabs;
}

/** Filter items by the selected tab, using the SAME normalization. */
export function filterItemsByTab<T extends { category?: string | null }>(items: T[], selected: FixedCategory): T[] {
  if (selected === "All") return items ?? [];
  return (items ?? []).filter((it) => normalizeCategory(it?.category) === selected);
}

/** Count items per tab for display or fallback logic. */
export function countPerTab(items: Array<{ category?: string | null }> = []): Record<FixedCategory, number> {
  const counts: Record<FixedCategory, number> = { All: 0, Appetizers: 0, Mains: 0, Desserts: 0, Drinks: 0 };
  for (const it of items) {
    counts.All++;
    const norm = normalizeCategory(it?.category);
    if (norm !== "UNKNOWN") counts[norm]++;
  }
  return counts;
}