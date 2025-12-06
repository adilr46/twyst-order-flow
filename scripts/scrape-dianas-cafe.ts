import puppeteer from 'puppeteer';
import { supabaseServer } from '../src/lib/supabase-server';

interface MenuItem {
  name: string;
  description?: string;
  price_cents: number;
  category: string;
}

/**
 * Scrapes menu items from Diana's Cafe website
 * Website: https://www.dianascafe.co.uk/bath/menu/dine-in.html
 */
async function scrapeDianasCafeMenu(): Promise<MenuItem[]> {
  console.log('🚀 Starting Diana\'s Cafe menu scraper...');
  
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();
    await page.goto('https://www.dianascafe.co.uk/bath/menu/dine-in.html', {
      waitUntil: 'networkidle2',
      timeout: 30000
    });

    console.log('📄 Page loaded, waiting for menu to render...');
    
    // Wait for menu items to load (adjust selector based on actual site structure)
    await page.waitForSelector('body', { timeout: 10000 });

    // Extract menu items
    // Note: The actual selectors need to be adjusted based on the real HTML structure
    // This is a template that you'll need to customize after inspecting the page
    const menuItems = await page.evaluate(() => {
      const items: MenuItem[] = [];
      
      // Try to find menu items - these selectors are placeholders
      // You'll need to inspect the actual page HTML to find the correct selectors
      const productElements = document.querySelectorAll('[class*="product"], [class*="menu-item"], [class*="item"]');
      
      productElements.forEach((element) => {
        try {
          // Extract name
          const nameEl = element.querySelector('[class*="name"], [class*="title"], h3, h4');
          const name = nameEl?.textContent?.trim() || '';

          // Extract description
          const descEl = element.querySelector('[class*="description"], [class*="desc"], p');
          const description = descEl?.textContent?.trim() || '';

          // Extract price
          const priceEl = element.querySelector('[class*="price"], [class*="cost"]');
          const priceText = priceEl?.textContent?.trim() || '';
          // Convert price string to cents (e.g., "£5.50" -> 550)
          const priceMatch = priceText.match(/[\d.]+/);
          const price = priceMatch ? Math.round(parseFloat(priceMatch[0]) * 100) : 0;

          // Extract category (might be in a parent element or data attribute)
          const categoryEl = element.closest('[class*="category"], [class*="section"]');
          const category = categoryEl?.querySelector('[class*="title"], h2, h3')?.textContent?.trim() || 'Other';

          if (name && price > 0) {
            items.push({
              name,
              description: description || undefined,
              price_cents: price,
              category: category || 'Other'
            });
          }
        } catch (err) {
          console.error('Error parsing item:', err);
        }
      });

      return items;
    });

    console.log(`✅ Found ${menuItems.length} menu items`);
    
    // Log a sample to verify structure
    if (menuItems.length > 0) {
      console.log('📋 Sample item:', menuItems[0]);
    }

    return menuItems;

  } catch (error) {
    console.error('❌ Error scraping menu:', error);
    throw error;
  } finally {
    await browser.close();
  }
}

/**
 * Inserts scraped menu items into the database
 */
async function insertMenuItems(venueSlug: string, items: MenuItem[]) {
  console.log(`\n💾 Inserting ${items.length} items for venue: ${venueSlug}...`);

  // Get venue ID
  const { data: venue, error: venueError } = await supabaseServer
    .from('venues')
    .select('id')
    .eq('slug', venueSlug)
    .single();

  if (venueError || !venue) {
    throw new Error(`Venue not found: ${venueSlug}. Please create the venue first.`);
  }

  const venueId = venue.id;
  console.log(`✅ Found venue: ${venueSlug} (${venueId})`);

  // Insert menu items
  const itemsToInsert = items.map(item => ({
    venue_id: venueId,
    name: item.name,
    description: item.description || null,
    price_cents: item.price_cents,
    category: item.category,
    is_active: true
  }));

  const { data, error } = await supabaseServer
    .from('menu_items')
    .insert(itemsToInsert)
    .select();

  if (error) {
    console.error('❌ Error inserting items:', error);
    throw error;
  }

  console.log(`✅ Successfully inserted ${data?.length || 0} menu items!`);
  return data;
}

/**
 * Main function
 */
async function main() {
  const venueSlug = process.env.VENUE_SLUG || 'dianas-cafe-bath';
  
  try {
    // Scrape menu
    const menuItems = await scrapeDianasCafeMenu();
    
    if (menuItems.length === 0) {
      console.log('⚠️  No menu items found. The page structure might have changed.');
      console.log('💡 Tip: Inspect the page HTML and update the selectors in the script.');
      return;
    }

    // Insert into database
    await insertMenuItems(venueSlug, menuItems);
    
    console.log('\n🎉 Done! Menu items have been added to your database.');
    console.log(`\n📊 Summary:`);
    console.log(`   - Items scraped: ${menuItems.length}`);
    console.log(`   - Categories: ${[...new Set(menuItems.map(i => i.category))].join(', ')}`);
    
  } catch (error) {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  }
}

// Run if executed directly
if (require.main === module) {
  main();
}

export { scrapeDianasCafeMenu, insertMenuItems };

