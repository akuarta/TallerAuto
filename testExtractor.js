const https = require('https');
const aRegex = /<a\s+([^>]*href=['"]([^'"]+)['"][^>]*|[^>]*name=['"]([^'"]+)['"][^>]*|[^>]*)>([\s\S]*?)<\/a>/gi;
https.get('https://charm.li/Toyota/1993/', (res) => {
    let rawData = '';
    res.on('data', (chunk) => { rawData += chunk; });
    res.on('end', () => {
        let match;
        const out = [];
        while ((match = aRegex.exec(rawData)) !== null) {
            const attrs = match[1];
            const content = match[4];
            if (content.includes('Corolla') || content.includes('Celica')) {
                 const hrefMatch = attrs.match(/href=['"]([^'"]+)['"]/i);
                 out.push({ href: hrefMatch ? hrefMatch[1] : null, text: content });
            }
        }
        console.log(out.slice(0, 3));
    });
});
