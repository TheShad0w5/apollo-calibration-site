async function main() {
// Node 18+. Dry-run default. Supply public canonical URLs; --submit sends one batch.
// Example: node scripts/submit-indexnow.mjs https://www.tunedbykeith.com/ --submit
const host = 'www.tunedbykeith.com';
const key = 'c1e3aa7c6d024b4f9aac0522a4f7420d';
const submit = process.argv.includes('--submit');
const urls = [...new Set(process.argv.slice(2).filter(x => x !== '--submit'))];
if (!urls.length || urls.length > 100) throw new Error('Supply 1–100 changed public URLs.');
const sitemapResponse = await fetch('https://' + host + '/sitemap.xml');
if (!sitemapResponse.ok) throw new Error('Sitemap unavailable');
const sitemap = await sitemapResponse.text();
const allowed = new Set([...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(x => x[1]));
for (const raw of urls) {
 const u = new URL(raw);
 if (u.origin !== 'https://' + host || u.search || u.hash || !allowed.has(raw)) throw new Error('Not an approved public canonical URL: ' + raw);
 const r = await fetch(raw, {redirect:'manual'});
 if (r.status !== 200) throw new Error('Page is not HTTP 200: ' + raw);
 const html = await r.text();
 if (/noindex/i.test(r.headers.get('x-robots-tag') || '') ||
 [...html.matchAll(/<meta\b[^>]*>/gi)].some(x => /name\s*=\s*["'](?:robots|bingbot|googlebot)["']/i.test(x[0]) && /noindex/i.test(x[0])))
 throw new Error('Page is excluded from indexing: ' + raw);
 const canonical = [...html.matchAll(/<link\b[^>]*>/gi)].find(x => /rel\s*=\s*["']canonical["']/i.test(x[0]))?.[0].match(/href\s*=\s*["']([^"']+)["']/i)?.[1];
 if (canonical !== raw) throw new Error('Canonical mismatch: ' + raw);
}
const verification = await fetch('https://' + host + '/' + key + '.txt');
if (!verification.ok || (await verification.text()).trim() !== key) throw new Error('Live key verification failed');
if (!submit) console.log(JSON.stringify({mode:'dry-run',validated:urls.length,urls},null,2));
else {
 const r=await fetch('https://www.bing.com/indexnow',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({host,key,urlList:urls})});
 console.log(JSON.stringify({at:new Date().toISOString(),status:r.status,submitted:urls.length,urls,note:r.status===200?'Received; indexing is not guaranteed':r.status===202?'Received; key validation pending':'Submission failed'},null,2));
 if (![200,202].includes(r.status)) process.exitCode=1;
}

}
main().catch(error => { console.error(JSON.stringify({status:'failed',message:error.message,note:'No successful receipt confirmed. Inspect the error before retrying.'})); process.exitCode=1; });
