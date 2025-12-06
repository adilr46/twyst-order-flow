import puppeteer from 'puppeteer';

/**
 * Helper script to inspect Diana's Cafe page structure
 * This will help identify the correct CSS selectors for menu items
 */
async function inspectPage() {
  console.log('🔍 Inspecting Diana\'s Cafe page structure...\n');
  
  const browser = await puppeteer.launch({
    headless: false, // Show browser so you can see what's happening
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();
    await page.goto('https://www.dianascafe.co.uk/bath/menu/dine-in.html', {
      waitUntil: 'networkidle2',
      timeout: 30000
    });

    console.log('✅ Page loaded\n');
    console.log('📋 Analyzing page structure...\n');

    // Get all potential menu item selectors
    const analysis = await page.evaluate(() => {
      const results: any = {
        allElements: [],
        potentialMenuItems: [],
        prices: [],
        categories: []
      };

      // Find elements that might contain menu items
      const selectors = [
        '[class*="product"]',
        '[class*="menu"]',
        '[class*="item"]',
        '[class*="dish"]',
        '[class*="food"]',
        '[data-product]',
        '[data-item]',
        'article',
        '.card',
        '.menu-card'
      ];

      selectors.forEach(selector => {
        try {
          const elements = document.querySelectorAll(selector);
          if (elements.length > 0) {
            results.allElements.push({
              selector,
              count: elements.length,
              sample: elements[0]?.outerHTML?.substring(0, 200) || 'N/A'
            });
          }
        } catch (e) {
          // Ignore invalid selectors
        }
      });

      // Look for price patterns
      const pricePattern = /£[\d.]+/g;
      const allText = document.body.innerText;
      const prices = allText.match(pricePattern) || [];
      results.prices = [...new Set(prices)].slice(0, 20);

      // Look for category headings
      const headings = Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6'));
      results.categories = headings
        .map(h => h.textContent?.trim())
        .filter(Boolean)
        .slice(0, 20);

      return results;
    });

    console.log('📊 Found Elements:');
    analysis.allElements.forEach((el: any) => {
      console.log(`   - ${el.selector}: ${el.count} elements`);
    });

    console.log('\n💰 Sample Prices Found:');
    analysis.prices.forEach((price: string) => {
      console.log(`   - ${price}`);
    });

    console.log('\n📂 Potential Categories:');
    analysis.categories.forEach((cat: string) => {
      console.log(`   - ${cat}`);
    });

    console.log('\n💡 Next Steps:');
    console.log('   1. Open the page in your browser');
    console.log('   2. Right-click on a menu item and "Inspect Element"');
    console.log('   3. Note the CSS classes and structure');
    console.log('   4. Update the selectors in scrape-dianas-cafe.ts');
    console.log('\n⏸️  Browser will stay open for 30 seconds for manual inspection...');
    
    // Keep browser open for manual inspection
    await new Promise(resolve => setTimeout(resolve, 30000));

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await browser.close();
  }
}

inspectPage();

