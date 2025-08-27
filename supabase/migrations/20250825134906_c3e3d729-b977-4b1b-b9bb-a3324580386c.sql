-- Add category field to items table for menu organization
ALTER TABLE public.items ADD COLUMN category text DEFAULT 'main';

-- Add some sample categories to existing items
UPDATE public.items 
SET category = CASE 
  WHEN name ILIKE '%coffee%' OR name ILIKE '%tea%' OR name ILIKE '%drink%' THEN 'drinks'
  WHEN name ILIKE '%sandwich%' OR name ILIKE '%burger%' OR name ILIKE '%pasta%' THEN 'mains'
  WHEN name ILIKE '%cake%' OR name ILIKE '%cookie%' OR name ILIKE '%dessert%' THEN 'desserts'
  WHEN name ILIKE '%salad%' OR name ILIKE '%soup%' OR name ILIKE '%appetizer%' THEN 'appetizers'
  ELSE 'mains'
END;