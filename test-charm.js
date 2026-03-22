const https = require('https');

function fetchURL(url) {
    return new Promise((resolve, reject) => {
        const req = https.get(url, { timeout: 15000 }, (res) => {
            if (res.statusCode === 301 || res.statusCode === 302) {
                return fetchURL(res.headers.location).then(resolve).catch(reject);
            }
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => resolve({ status: res.statusCode, body: data }));
        });
        req.on('timeout', () => { req.destroy(); reject(new Error('Timeout')); });
        req.on('error', reject);
    });
}

async function fetchViaProxy(targetUrl) {
    const proxied = `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(targetUrl)}`;
    const res = await fetchURL(proxied);
    return res.body;
}

async function test() {
    console.log('=== TEST 1: Marcas ===');
    try {
        const mainHtml = await fetchViaProxy('https://charm.li/');
        const makeRegex = /<li><a href="\/([^"\/]+)\/">([^<]+)<\/a><\/li>/g;
        const makes = [];
        let m;
        while ((m = makeRegex.exec(mainHtml)) !== null) {
            if (!m[1].includes('.')) makes.push({ name: m[2].trim(), slug: m[1] });
        }
        const unique = [...new Map(makes.map(x => [x.slug, x])).values()];
        console.log(`✅ Marcas: ${unique.length}`);
        console.log(unique.map(x => x.name).join(', '));
    } catch(e) { console.error('❌', e.message); }

    console.log('\n=== TEST 2: Años Acura ===');
    try {
        const html = await fetchViaProxy('https://charm.li/Acura/');
        const yearRegex = /<li><a href="\/[^"\/]+\/(\d{4})\/">(\d{4})<\/a><\/li>/g;
        const years = [];
        let m;
        while ((m = yearRegex.exec(html)) !== null) years.push(m[1]);
        const unique = [...new Set(years)].sort((a,b) => b-a);
        console.log(`✅ Años: ${unique.join(', ')}`);
    } catch(e) { console.error('❌', e.message); }

    console.log('\n=== TEST 3: Modelos Acura 2014 ===');
    try {
        const html = await fetchViaProxy('https://charm.li/Acura/2014/');
        const modelRegex = /<li><a href="\/Acura\/2014\/([^"\/]+)\/">([^<]+)<\/a><\/li>/g;
        const models = [];
        let m;
        while ((m = modelRegex.exec(html)) !== null) {
            models.push({ slug: m[1], name: decodeURIComponent(m[2].trim()) });
        }
        console.log(`✅ Modelos (${models.length}):`);
        models.forEach(x => console.log(`  - ${x.name} [${x.slug}]`));
    } catch(e) { console.error('❌', e.message); }
}

test();
