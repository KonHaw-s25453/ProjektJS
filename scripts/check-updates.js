const axios = require('axios');
const cheerio = require('cheerio');
const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

/**
 * Check if VCV Library has been updated by comparing module counts and last modified dates
 * @returns {object} - Update status information
 */
async function checkLibraryUpdates() {
  const db = await mysql.createPool({
    host: process.env.DB_HOST || '127.0.0.1',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASS || '',
    database: process.env.DB_NAME || 'vcv',
    port: process.env.DB_PORT || 3306,
  });

  try {
    // Get current stats from our database
    const [localStats] = await db.execute(`
      SELECT
        COUNT(DISTINCT CONCAT(plugin, '/', model)) as total_modules,
        COUNT(DISTINCT plugin) as total_plugins,
        MAX(updated_at) as last_price_update
      FROM module_prices
    `);

    const localData = localStats[0];

    // Check the main library page for basic stats
    console.log('Checking VCV Library for updates...');

    try {
      const response = await axios.get('https://library.vcvrack.com/', {
        timeout: 10000,
        headers: {
          'User-Agent': 'VCV-Patch-Archive-Update-Checker/1.0'
        }
      });

      const $ = cheerio.load(response.data);

      // Try to extract some basic info from the page
      const pageText = response.data;
      const moduleCountMatch = pageText.match(/(\d+)\s*modules/i);
      const pluginCountMatch = pageText.match(/(\d+)\s*plugins/i);

      const remoteModules = moduleCountMatch ? parseInt(moduleCountMatch[1]) : null;
      const remotePlugins = pluginCountMatch ? parseInt(pluginCountMatch[1]) : null;

      // Check for recent updates by looking at "new" or "updated" badges
      const hasNewContent = pageText.includes('new') || pageText.includes('updated') ||
                           pageText.includes('recent') || pageText.includes('latest');

      const updateInfo = {
        local: {
          modules: localData.total_modules,
          plugins: localData.total_plugins,
          lastUpdate: localData.last_price_update
        },
        remote: {
          modules: remoteModules,
          plugins: remotePlugins,
          hasNewContent: hasNewContent
        },
        needsUpdate: false,
        reasons: []
      };

      // Determine if update is needed
      if (remoteModules && remoteModules > localData.total_modules) {
        updateInfo.needsUpdate = true;
        updateInfo.reasons.push(`New modules detected: ${remoteModules} vs ${localData.total_modules}`);
      }

      if (remotePlugins && remotePlugins > localData.total_plugins) {
        updateInfo.needsUpdate = true;
        updateInfo.reasons.push(`New plugins detected: ${remotePlugins} vs ${localData.total_plugins}`);
      }

      // Check if it's been more than 7 days since last update
      const lastUpdate = localData.last_price_update ? new Date(localData.last_price_update) : new Date(0);
      const daysSinceUpdate = (Date.now() - lastUpdate.getTime()) / (1000 * 60 * 60 * 24);

      if (daysSinceUpdate > 7) {
        updateInfo.needsUpdate = true;
        updateInfo.reasons.push(`Prices are ${Math.round(daysSinceUpdate)} days old`);
      }

      if (hasNewContent && daysSinceUpdate > 1) {
        updateInfo.needsUpdate = true;
        updateInfo.reasons.push('Library shows recent updates');
      }

      return updateInfo;

    } catch (error) {
      console.error('Error checking library:', error.message);
      return {
        error: 'Could not check library status',
        local: {
          modules: localData.total_modules,
          plugins: localData.total_plugins,
          lastUpdate: localData.last_price_update
        },
        needsUpdate: true,
        reasons: ['Unable to check library - manual update recommended']
      };
    }

  } catch (error) {
    console.error('Database error:', error);
    return { error: 'Database connection failed' };
  } finally {
    await db.end();
  }
}

/**
 * Update prices and record the update timestamp
 */
async function updatePricesWithTimestamp() {
  const { updateAllModulePrices } = require('./update-prices');

  try {
    console.log('Starting price update...');
    await updateAllModulePrices();

    // Record the update timestamp
    const db = await mysql.createPool({
      host: process.env.DB_HOST || '127.0.0.1',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASS || '',
      database: process.env.DB_NAME || 'vcv',
      port: process.env.DB_PORT || 3306,
    });

    await db.execute('UPDATE module_prices SET updated_at = NOW() WHERE updated_at IS NULL OR updated_at < NOW()');
    await db.end();

    console.log('Price update completed and timestamp recorded');
    return { success: true };
  } catch (error) {
    console.error('Price update failed:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Check for updates and update prices if needed
 */
async function checkAndUpdateIfNeeded() {
  console.log('Checking for VCV Library updates...');

  const status = await checkLibraryUpdates();

  if (status.error) {
    console.error('Update check failed:', status.error);
    return status;
  }

  console.log('Update status:', {
    local: `${status.local.modules} modules, last update: ${status.local.lastUpdate || 'never'}`,
    remote: status.remote.modules ? `${status.remote.modules} modules` : 'unknown',
    needsUpdate: status.needsUpdate,
    reasons: status.reasons
  });

  if (status.needsUpdate) {
    console.log('Update needed, running price update...');
    const updateResult = await updatePricesWithTimestamp();
    return { ...status, updateResult };
  } else {
    console.log('No update needed');
    return { ...status, updateResult: { success: true, skipped: true } };
  }
}

// If run directly, check for updates and update if needed
if (require.main === module) {
  checkAndUpdateIfNeeded().then(result => {
    console.log('Check complete:', result);
    process.exit(result.updateResult?.success ? 0 : 1);
  });
}

module.exports = { checkLibraryUpdates, updatePricesWithTimestamp, checkAndUpdateIfNeeded };