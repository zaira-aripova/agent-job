#!/usr/bin/env node

import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

// Parse pipeline.md pour extraire les URLs
function parsePipeline() {
  const pipelineFile = 'data/pipeline.md';
  const content = fs.readFileSync(pipelineFile, 'utf-8');
  const lines = content.split('\n');

  const offers = [];
  for (const line of lines) {
    if (line.startsWith('[')) {
      // Format: [ ] URL | Company | Role
      const match = line.match(/\]\s+(https?[^\s]+)\s+\|\s+(.+?)\s+\|\s+(.+)$/);
      if (match) {
        offers.push({
          url: match[1].trim(),
          company: match[2].trim(),
          role: match[3].trim(),
          published: null,
          error: null
        });
      }
    }
  }
  return offers;
}

// Scrape la date de publication depuis Welcome to the Jungle
async function scrapeOfferDate(browser, url) {
  try {
    const page = await browser.newPage();
    console.log(`🔍 Scraping: ${url}`);

    await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });

    // Chercher la date de publication (plusieurs sélecteurs possibles)
    let publishedDate = null;

    // Essayer différents sélecteurs pour trouver la date
    const dateSelectors = [
      'time[datetime]',
      '[data-testid="posted-at"]',
      'span:has-text("Publié")',
      'span:has-text("Posted")',
      '.publication-date',
      '[aria-label*="Publié"]'
    ];

    for (const selector of dateSelectors) {
      try {
        const element = await page.$(selector);
        if (element) {
          const text = await element.textContent();
          const dateAttr = await element.getAttribute('datetime') || await element.getAttribute('data-date');

          if (dateAttr) {
            publishedDate = dateAttr;
            break;
          }
          if (text && (text.includes('Publié') || text.includes('Posted'))) {
            publishedDate = text;
            break;
          }
        }
      } catch (e) {
        // Continue to next selector
      }
    }

    // Fallback: rechercher dans le HTML brut
    if (!publishedDate) {
      const html = await page.content();
      const dateMatch = html.match(/Publié.*?(\d{1,2}\s+\w+\s+\d{4})/i) ||
                       html.match(/(il y a \d+\s+\w+)/i) ||
                       html.match(/(\d{1,2}\/\d{1,2}\/\d{4})/);
      if (dateMatch) {
        publishedDate = dateMatch[1];
      }
    }

    await page.close();
    return publishedDate;
  } catch (error) {
    return `ERROR: ${error.message}`;
  }
}

// Fonction pour calculer l'âge en jours
function calculateDaysOld(dateString) {
  if (!dateString || dateString.startsWith('ERROR') || dateString.startsWith('il y a')) {
    return null;
  }

  try {
    // Parse différents formats de date
    let date;

    // Format ISO (YYYY-MM-DD)
    if (dateString.match(/^\d{4}-\d{2}-\d{2}/)) {
      date = new Date(dateString.split('T')[0]);
    }
    // Format "il y a X jours/semaines"
    else if (dateString.includes('il y a')) {
      const match = dateString.match(/il y a\s+(\d+)\s+(\w+)/i);
      if (match) {
        const value = parseInt(match[1]);
        const unit = match[2].toLowerCase();
        const now = new Date();

        if (unit.includes('jour') || unit.includes('day')) {
          return value;
        } else if (unit.includes('semaine') || unit.includes('week')) {
          return value * 7;
        } else if (unit.includes('mois') || unit.includes('month')) {
          return value * 30;
        }
      }
    }
    // Format français "DD Mois YYYY"
    else if (dateString.match(/\d{1,2}\s+\w+\s+\d{4}/i)) {
      const months = {
        janvier: 0, février: 1, mars: 2, avril: 3, mai: 4, juin: 5,
        juillet: 6, août: 7, septembre: 8, octobre: 9, novembre: 10, décembre: 11,
        january: 0, february: 1, march: 2, april: 3, may: 4, june: 5,
        july: 6, august: 7, september: 8, october: 9, november: 10, december: 11
      };

      const parts = dateString.match(/(\d{1,2})\s+(\w+)\s+(\d{4})/i);
      if (parts) {
        const day = parseInt(parts[1]);
        const month = months[parts[2].toLowerCase()] || 0;
        const year = parseInt(parts[3]);
        date = new Date(year, month, day);
      }
    }

    if (date) {
      const now = new Date();
      const diffMs = now - date;
      const daysOld = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      return daysOld >= 0 ? daysOld : null;
    }
  } catch (e) {
    return null;
  }

  return null;
}

// Main
async function main() {
  console.log('📋 Parsing pipeline.md...\n');
  const offers = parsePipeline();

  console.log(`Found ${offers.length} offers to scrape\n`);

  const browser = await chromium.launch();

  for (let i = 0; i < offers.length; i++) {
    const offer = offers[i];
    const publishedDate = await scrapeOfferDate(browser, offer.url);
    offer.published = publishedDate;

    const daysOld = calculateDaysOld(publishedDate);
    const freshness = daysOld !== null ?
      (daysOld <= 14 ? `✅ ${daysOld}j (FRAIS)` : `⏳ ${daysOld}j`) :
      '❓ Date inconnue';

    console.log(`${i + 1}. ${offer.company} — ${freshness}`);
    console.log(`   Date: ${publishedDate || 'Not found'}\n`);
  }

  await browser.close();

  // Afficher résumé
  console.log('\n📊 RÉSUMÉ:\n');
  const freshOffers = offers.filter(o => {
    const days = calculateDaysOld(o.published);
    return days !== null && days <= 14;
  });

  console.log(`Offres fraîches (< 14 jours): ${freshOffers.length}/${offers.length}`);
  if (freshOffers.length > 0) {
    console.log('\n🌟 Offres fraîches:');
    freshOffers.forEach(o => {
      const days = calculateDaysOld(o.published);
      console.log(`   - ${o.company} | ${o.role} (${days}j)`);
    });
  }

  // Sauvegarder résultat en JSON
  fs.writeFileSync('output/offer-dates.json', JSON.stringify(offers, null, 2));
  console.log('\n✅ Résultats sauvegardés dans output/offer-dates.json');
}

main().catch(console.error);
