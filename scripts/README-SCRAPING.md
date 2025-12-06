# Menu Scraping Guide

This guide explains how to scrape menu items from cafe websites and import them into your database.

## Setup

1. **Install dependencies** (already done):
   ```bash
   pnpm install
   ```

2. **Create the venue first** (if it doesn't exist):
   ```sql
   INSERT INTO venues (name, slug, currency) 
   VALUES ('Diana''s Cafe Bath', 'dianas-cafe-bath', 'GBP');
   ```

## Step 1: Inspect the Page Structure

Before scraping, you need to understand the website's HTML structure:

```bash
pnpm run scrape:inspect
```

This will:
- Open the page in a browser
- Analyze the HTML structure
- Show potential selectors for menu items
- Keep the browser open for 30 seconds for manual inspection

**Manual Inspection:**
1. Open the website in your browser
2. Right-click on a menu item → "Inspect Element"
3. Note the CSS classes and HTML structure
4. Update the selectors in `scrape-dianas-cafe.ts`

## Step 2: Update the Scraper

Edit `scripts/scrape-dianas-cafe.ts` and update the selectors in the `page.evaluate()` function:

```typescript
// Example: If menu items have class "menu-item"
const productElements = document.querySelectorAll('.menu-item');

// Example: If price is in a span with class "price"
const priceEl = element.querySelector('.price');
```

## Step 3: Run the Scraper

```bash
# Set the venue slug (or it defaults to 'dianas-cafe-bath')
VENUE_SLUG=dianas-cafe-bath pnpm run scrape:dianas
```

Or on Windows PowerShell:
```powershell
$env:VENUE_SLUG="dianas-cafe-bath"; pnpm run scrape:dianas
```

## Troubleshooting

### No items found
- The page structure may have changed
- The selectors might be incorrect
- The page might require JavaScript to load (Puppeteer handles this)

### Price parsing issues
- Check the price format (e.g., "£5.50" vs "5.50")
- Update the regex pattern in the script

### Category detection
- Categories might be in parent elements
- You may need to manually map categories

## Legal & Ethical Considerations

⚠️ **Important:**
- Always check the website's Terms of Service
- Respect `robots.txt` file
- Don't overload their servers (add delays between requests)
- Get permission if scraping commercial data
- Use scraped data responsibly

## Alternative: Manual Entry

If scraping is too complex or not allowed, you can manually enter items:

```sql
INSERT INTO menu_items (venue_id, name, description, price_cents, category, is_active)
SELECT 
  id,
  'Item Name',
  'Item description',
  500, -- price in pence (500 = £5.00)
  'Category Name',
  true
FROM venues
WHERE slug = 'dianas-cafe-bath';
```

## Next Steps

After scraping:
1. Verify items in your database
2. Check the menu displays correctly at `/d/dianas-cafe-bath?t=your-table-token`
3. Adjust categories if needed
4. Set `is_active = false` for items you don't want to show

