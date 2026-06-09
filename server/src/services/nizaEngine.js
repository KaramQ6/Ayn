// Niza (Conflict & Encroachment Intelligence) Engine
// Uses Wikipedia API (free, no auth, no rate limits) to surface real information
// about Jordan's documented land/forest conflict zones.

const WIKI_API = 'https://en.wikipedia.org/w/api.php';

// Curated queries targeting Jordan's known conflict/encroachment zones
const WIKI_QUERIES = [
  { q: 'Ajloun Forest Reserve Jordan',              zone: 'ajloun' },
  { q: 'Dibbeen Forest Reserve Jordan',             zone: 'dibeen' },
  { q: 'Wadi Rum nature reserve Jordan pastoral',   zone: 'wadi_rum' },
  { q: 'Jordan Badia aquifer groundwater overuse',  zone: 'badia' },
  { q: 'Environmental issues Jordan deforestation', zone: 'general' },
  { q: 'Jordan nature reserve illegal encroachment overgrazing', zone: 'general' },
];

function stripHtml(html) {
  return html ? html.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim() : '';
}

export async function fetchNizaEvents(db, broadcast) {
  console.log('[Niza] Running Conflict Intelligence Engine (Wikipedia)...');
  const allArticles = [];

  for (const entry of WIKI_QUERIES) {
    try {
      const params = new URLSearchParams({
        action:      'query',
        list:        'search',
        srsearch:    entry.q,
        format:      'json',
        srlimit:     3,
        utf8:        '1',
        srprop:      'snippet|titlesnippet',
      });

      const res = await fetch(`${WIKI_API}?${params}`, {
        headers: { 'User-Agent': 'ForestGuard-AI/1.0 (jordan environmental monitoring)' },
        signal: AbortSignal.timeout(8000),
      });

      if (!res.ok) throw new Error(`Wikipedia API ${res.status}`);
      const data = await res.json();

      for (const article of (data.query?.search ?? [])) {
        const title   = article.title;
        const snippet = stripHtml(article.snippet);
        const url     = `https://en.wikipedia.org/wiki/${encodeURIComponent(title.replace(/ /g, '_'))}`;

        if (!title || !snippet) continue;

        // Keep only articles directly relevant to Jordan land/environment/conflict
        const lower = (title + snippet).toLowerCase();
        const jordanRelated = lower.includes('jordan') || lower.includes('ajloun') || lower.includes('dibeen')
          || lower.includes('wadi rum') || lower.includes('wadi mujib') || lower.includes('badia')
          || lower.includes('hashemite') || lower.includes('amman') || lower.includes('irbid')
          || lower.includes('aqaba') || lower.includes('petra') || lower.includes('zarqa');
        const topicRelated  = lower.includes('forest') || lower.includes('reserve') || lower.includes('encroachment')
          || lower.includes('nature') || lower.includes('environment') || lower.includes('grazing')
          || lower.includes('water') || lower.includes('land use') || lower.includes('deforest')
          || lower.includes('conservation') || lower.includes('wildlife') || lower.includes('ecology');
        // Explicit blocklist for generic/unrelated titles
        const blocked = ['houston', 'cairngorm', 'carolinian', 'abu dhabi', 'pakistan', 'india ', 'china ',
          ' tree', 'archaeology of the arabian', 'nomad', 'environmental science', 'abd'];
        const isBlocked  = blocked.some(b => lower.includes(b));
        const isRelevant = jordanRelated && topicRelated && !isBlocked;

        if (isRelevant) {
          allArticles.push({
            title,
            url,
            source_domain: 'Wikipedia',
            event_date:    null,
            snippet,
            zone: entry.zone,
          });
        }
      }

      await new Promise(r => setTimeout(r, 150));
    } catch (err) {
      console.warn(`  [Niza] Wikipedia query failed (${entry.q.slice(0, 40)}):`, err.message);
    }
  }

  // Deduplicate by URL
  const seen = new Set();
  const unique = allArticles.filter(a => {
    if (seen.has(a.url)) return false;
    seen.add(a.url);
    return true;
  });

  let inserted = 0;
  for (const article of unique) {
    try {
      const exists = db.prepare('SELECT id FROM niza_events WHERE url = ?').get(article.url);
      if (!exists) {
        db.prepare(`
          INSERT INTO niza_events (title, url, source_domain, event_date)
          VALUES (?, ?, ?, ?)
        `).run(article.title, article.url, 'Wikipedia', article.event_date);
        inserted++;
      }
    } catch {
      // ignore duplicate insert errors
    }
  }

  if (unique.length > 0) broadcast({ type: 'NIZA_UPDATE', data: unique.slice(0, 6) });
  console.log(`[Niza] Done — ${inserted} new articles (${unique.length} total unique)`);
  return unique;
}
