const axios = require('axios');
const cheerio = require('cheerio');
const mysql = require('mysql2/promise');

/**
 * Fetch price for a module from VCV Rack Library
 * @param {string} plugin - Plugin name
 * @param {string} model - Model name
 * @returns {number|null} - Price in USD or null if not found/free
 */
async function fetchModulePrice(plugin, model) {
  try {
    const url = `https://library.vcvrack.com/${encodeURIComponent(plugin)}/${encodeURIComponent(model)}`;
    console.log(`Fetching price from: ${url}`);

    const response = await axios.get(url, {
      timeout: 10000,
      headers: {
        'User-Agent': 'VCV-Patch-Archive-Price-Checker/1.0'
      }
    });

    const $ = cheerio.load(response.data);

    // Look for the price element
    const priceElement = $('.library-price');
    if (priceElement.length > 0) {
      const priceText = priceElement.text().trim();
      // Extract number from "$10" format
      const priceMatch = priceText.match(/\$(\d+(?:\.\d{2})?)/);
      if (priceMatch) {
        return parseFloat(priceMatch[1]);
      }
    }

    // If no price element found, it's probably free
    return 0;
  } catch (error) {
    console.error(`Error fetching price for ${plugin}/${model}:`, error.message);
    return null;
  }
}

/**
 * Update module price in database
 * @param {object} db - Database connection
 * @param {string} plugin - Plugin name
 * @param {string} model - Model name
 * @param {number} price - Price to set
 */
async function updateModulePrice(db, plugin, model, price) {
  try {
    await db.execute(
      'INSERT INTO module_prices (plugin, model, price) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE price = ?',
      [plugin, model, price, price]
    );
    console.log(`Updated ${plugin}/${model}: $${price}`);
  } catch (error) {
    console.error(`Error updating price for ${plugin}/${model}:`, error.message);
  }
}

/**
 * Update prices for all modules in database
 */
async function updateAllModulePrices() {
  const db = await mysql.createPool({
    host: process.env.DB_HOST || '127.0.0.1',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASS || '',
    database: process.env.DB_NAME || 'vcv',
    port: process.env.DB_PORT || 3306,
  });

  try {
    // Get all unique plugin/model combinations from modules table
    const [modules] = await db.execute('SELECT DISTINCT plugin, model FROM modules');

    console.log(`Found ${modules.length} unique modules to check prices for`);

    for (const mod of modules) {
      const price = await fetchModulePrice(mod.plugin, mod.model);
      if (price !== null) {
        await updateModulePrice(db, mod.plugin, mod.model, price);
      }

      // Be nice to the server - small delay between requests
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    console.log('Price update completed');
  } catch (error) {
    console.error('Error updating prices:', error);
  } finally {
    await db.end();
  }
}

// If run directly, update all prices
if (require.main === module) {
  updateAllModulePrices();
}

module.exports = { fetchModulePrice, updateModulePrice, updateAllModulePrices };