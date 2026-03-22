
const BASE_URL = 'https://charm.li/';
const PROXY = 'https://api.codetabs.com/v1/proxy?quest=';

async function fetchHTML(targetUrl) {
    const encodedUrl = encodeURI(targetUrl);
    const finalUrl = `${PROXY}${encodedUrl}`;
    console.log(`Fetching: ${finalUrl}`);
    const response = await fetch(finalUrl);
    if (!response.ok) throw new Error(`Error ${response.status}`);
    return await response.text();
}

async function testExplorer() {
    try {
        console.log("--- TEST 1: GET MAKES ---");
        const homeHtml = await fetchHTML(BASE_URL);
        const linkRegex = /<a href="([^"]+)">([^<]+)<\/a>/gi;
        let match;
        const makes = [];
        while ((match = linkRegex.exec(homeHtml)) !== null) {
            const href = match[1];
            const name = match[2].trim();
            if (!href.startsWith('http') && !['Home', 'About', 'Operation CHARM'].includes(name) && !href.startsWith('/') && !href.includes('.css') && !href.includes('.js')) {
                makes.push({ name, href });
            }
        }
        console.log(`Found ${makes.length} makes. First 3:`, makes.slice(0, 3));

        if (makes.length > 0) {
            const firstMake = makes.find(m => m.name === 'Buick') || makes[0];
            console.log(`\n--- TEST 2: GET YEARS FOR ${firstMake.name} ---`);
            const yearHtml = await fetchHTML(`${BASE_URL}${firstMake.href}`);
            const years = [];
            linkRegex.lastIndex = 0; // Reset regex
            while ((match = linkRegex.exec(yearHtml)) !== null) {
                const href = match[1];
                if (/^\d{4}\/$/.test(href)) {
                    years.push(href.replace('/', ''));
                }
            }
            console.log(`Found ${years.length} years for ${firstMake.name}. Sample:`, years.slice(0, 5));

            if (years.length > 0) {
                const testYear = years.includes('1990') ? '1990' : years[0];
                console.log(`\n--- TEST 3: GET MODELS FOR ${firstMake.name} ${testYear} ---`);
                const modelHtml = await fetchHTML(`${BASE_URL}${firstMake.href}${testYear}/`);
                const models = [];
                linkRegex.lastIndex = 0;
                while ((match = linkRegex.exec(modelHtml)) !== null) {
                    const href = match[1];
                    const name = match[2].trim();
                    if (!href.startsWith('http') && !['Home', 'About'].includes(name) && !href.startsWith('/')) {
                        models.push({ name, href });
                    }
                }
                console.log(`Found ${models.length} items for ${testYear}. Sample:`, models.slice(0, 3));
            }
        }
        console.log("\n✅ ALL TESTS PASSED!");
    } catch (e) {
        console.error("❌ TEST FAILED:", e.message);
    }
}

testExplorer();
