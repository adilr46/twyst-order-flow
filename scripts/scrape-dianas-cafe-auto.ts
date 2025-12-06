import puppeteer from 'puppeteer';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { join } from 'path';

// Load environment variables from .env.local
dotenv.config({ path: join(process.cwd(), '.env.local') });

// Create Supabase client for scripts
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables. Please check .env.local');
}

const supabaseServer = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

interface MenuItem {
  name: string;
  description?: string;
  price_cents: number;
  category: string;
}

/**
 * Intelligent scraper that automatically detects menu items
 * Tries multiple strategies to find menu items without manual configuration
 */
async function scrapeDianasCafeMenuAuto(): Promise<MenuItem[]> {
  console.log('🚀 Starting automatic Diana\'s Cafe menu scraper...');
  
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();
    
    // Set a longer timeout for slow-loading pages
    page.setDefaultTimeout(60000);
    
    console.log('📄 Loading page...');
    await page.goto('https://www.dianascafe.co.uk/bath/menu/dine-in.html', {
      waitUntil: 'networkidle2',
      timeout: 60000
    });

    console.log('⏳ Waiting for content to load...');
    // Wait a bit for JavaScript to render
    await page.waitForTimeout(5000);

    console.log('🔍 Analyzing page structure...');
    
    // Try multiple strategies to find menu items
    const menuItems = await page.evaluate(() => {
      const items: MenuItem[] = [];
      const foundSelectors = new Set<string>();

      // Strategy 1: Look for elements with price patterns nearby
      const pricePattern = /£[\d.]+|[\d.]+p/i;
      const allElements = document.querySelectorAll('*');
      
      allElements.forEach((element) => {
        const text = element.textContent || '';
        const priceMatch = text.match(pricePattern);
        
        if (priceMatch && element.children.length <= 3) {
          // Likely a menu item if it has a price and isn't too nested
          const priceText = priceMatch[0];
          const price = parseFloat(priceText.replace(/£|p/gi, ''));
          const priceCents = Math.round(price * 100);
          
          if (priceCents > 0 && priceCents < 50000) { // Reasonable price range
            // Try to extract name (usually before price)
            const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
            const name = lines.find(l => !pricePattern.test(l) && l.length > 3 && l.length < 100) || '';
            
            if (name && name.length > 3) {
              // Extract description (other text lines)
              const description = lines
                .filter(l => l !== name && !pricePattern.test(l) && l.length > 10)
                .join(' ')
                .substring(0, 200) || undefined;
              
              // Try to find category (look for parent headings)
              let category = 'Other';
              let parent = element.parentElement;
              for (let i = 0; i < 5 && parent; i++) {
                const heading = parent.querySelector('h1, h2, h3, h4, h5, h6, [class*="category"], [class*="section"]');
                if (heading) {
                  const catText = heading.textContent?.trim();
                  if (catText && catText.length < 50 && !pricePattern.test(catText)) {
                    category = catText;
                    break;
                  }
                }
                parent = parent.parentElement;
              }
              
              const itemKey = `${name}-${priceCents}`;
              if (!foundSelectors.has(itemKey)) {
                foundSelectors.add(itemKey);
                items.push({
                  name: name.substring(0, 200),
                  description,
                  price_cents: priceCents,
                  category: category.substring(0, 100)
                });
              }
            }
          }
        }
      });

      // Strategy 2: Look for common menu item patterns
      const commonSelectors = [
        '[class*="product"]',
        '[class*="menu-item"]',
        '[class*="item"]',
        '[data-product]',
        '[data-item]',
        'article',
        '.card',
        '[role="listitem"]'
      ];

      commonSelectors.forEach(selector => {
        try {
          const elements = document.querySelectorAll(selector);
          elements.forEach((element) => {
            const text = element.textContent || '';
            const priceMatch = text.match(pricePattern);
            
            if (priceMatch) {
              const priceText = priceMatch[0];
              const price = parseFloat(priceText.replace(/£|p/gi, ''));
              const priceCents = Math.round(price * 100);
              
              if (priceCents > 0) {
                // Extract structured data
                const nameEl = element.querySelector('[class*="name"], [class*="title"], h3, h4, strong, b');
                const name = nameEl?.textContent?.trim() || 
                            text.split('\n')[0]?.trim() || 
                            '';
                
                const descEl = element.querySelector('[class*="description"], [class*="desc"], p');
                const description = descEl?.textContent?.trim() || undefined;
                
                // Find category
                let category = 'Other';
                const categoryEl = element.closest('[class*="category"], [class*="section"]');
                if (categoryEl) {
                  const catHeading = categoryEl.querySelector('h1, h2, h3, h4');
                  if (catHeading) {
                    category = catHeading.textContent?.trim() || 'Other';
                  }
                }
                
                if (name && name.length > 3) {
                  const itemKey = `${name}-${priceCents}`;
                  if (!foundSelectors.has(itemKey)) {
                    foundSelectors.add(itemKey);
                    items.push({
                      name: name.substring(0, 200),
                      description: description?.substring(0, 500),
                      price_cents: priceCents,
                      category: category.substring(0, 100)
                    });
                  }
                }
              }
            }
          });
        } catch (e) {
          // Ignore selector errors
        }
      });

      // Remove duplicates and filter
      const uniqueItems = Array.from(
        new Map(items.map(item => [item.name + item.price_cents, item])).values()
      ).filter(item => 
        item.name.length > 3 && 
        item.price_cents > 0 && 
        item.price_cents < 50000
      );

      return uniqueItems;
    });

    console.log(`✅ Found ${menuItems.length} potential menu items`);
    
    // Show sample items
    if (menuItems.length > 0) {
      console.log('\n📋 Sample items found:');
      menuItems.slice(0, 5).forEach((item, i) => {
        console.log(`   ${i + 1}. ${item.name} - £${(item.price_cents / 100).toFixed(2)} (${item.category})`);
      });
      
      // Show category breakdown
      const categories = [...new Set(menuItems.map(i => i.category))];
      console.log(`\n📂 Categories found: ${categories.join(', ')}`);
    } else {
      console.log('⚠️  No items found automatically. The page structure might be different.');
      console.log('💡 Try running: pnpm run scrape:inspect to analyze the page manually.');
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
    // Scrape menu automatically
    const menuItems = await scrapeDianasCafeMenuAuto();
    
    if (menuItems.length === 0) {
      console.log('\n⚠️  No menu items found automatically.');
      console.log('💡 Options:');
      console.log('   1. Run: pnpm run scrape:inspect to analyze the page');
      console.log('   2. Manually update selectors in scrape-dianas-cafe.ts');
      console.log('   3. Enter menu items manually via SQL');
      return;
    }

    // Ask for confirmation (in a real scenario, you'd use readline)
    console.log(`\n📊 Ready to insert ${menuItems.length} items.`);
    console.log('💾 Inserting into database...');

    // Insert into database
    await insertMenuItems(venueSlug, menuItems);
    
    console.log('\n🎉 Done! Menu items have been added to your database.');
    console.log(`\n📊 Summary:`);
    console.log(`   - Items scraped: ${menuItems.length}`);
    const categories = [...new Set(menuItems.map(i => i.category))];
    console.log(`   - Categories: ${categories.join(', ')}`);
    console.log(`\n🌐 View menu at: /d/${venueSlug}?t=your-table-token`);
    
  } catch (error) {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  }
}

// Run if executed directly
if (require.main === module) {
  main();
}

export { scrapeDianasCafeMenuAuto, insertMenuItems };

