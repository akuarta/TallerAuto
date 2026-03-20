/**
 * CharmAPI.js - Versión Turbo-Proactiva (v10)
 * Soporte para Carpetas Virtuales y corrección de 404 en niveles profundos.
 */

const BASE_URL = 'https://charm.li/';

const PROXIES = [
    'https://corsproxy.io/?',
    'https://api.allorigins.win/raw?url=',
    'https://api.codetabs.com/v1/proxy?quest='
];

const HTML_CACHE = new Map();

async function fetchHTML(targetUrl) {
    if (HTML_CACHE.has(targetUrl)) return HTML_CACHE.get(targetUrl);

    let urlToFetch = targetUrl.replace('http://', 'https://');
    if (!urlToFetch.endsWith('/') && !urlToFetch.split('/').pop().includes('.')) {
        urlToFetch += '/';
    }

    const fetchWithProxy = async (proxyBase) => {
        // Aseguramos que la URL esté decodificada antes de mandarla al proxy para evitar doble encode (%2520)
        const rawUrl = decodeURIComponent(urlToFetch);
        const finalUrl = `${proxyBase}${encodeURIComponent(rawUrl)}`;
        const controller = new AbortController();
        const id = setTimeout(() => controller.abort(), 9000); 

        const response = await fetch(finalUrl, { signal: controller.signal });
        clearTimeout(id);
        if (!response.ok) throw new Error(`Proxy Fail: ${response.status}`);
        const text = await response.text();
        if (text.length < 200) throw new Error('Empty');
        return text;
    };

    try {
        const race = await Promise.any([
            (async () => { const html = await fetchWithProxy(PROXIES[0]); return { html, proxy: 'CorsProxy' }; })(),
            (async () => { const html = await fetchWithProxy(PROXIES[1]); return { html, proxy: 'AllOrigins' }; })()
        ]);
        console.log(`[CharmAPI] ⚡ Winner: ${race.proxy} (${targetUrl})`);
        HTML_CACHE.set(targetUrl, race.html);
        return race.html;
    } catch (error) {
        try {
            console.warn("[CharmAPI] Fallback al Proxy 3...");
            const fallback = await fetchWithProxy(PROXIES[2]);
            HTML_CACHE.set(targetUrl, fallback);
            return fallback;
        } catch (e) {
            throw new Error("Sin conexión al catálogo.");
        }
    }
}

class CharmAPI {
    static async getFolderItems(relativePath) {
        try {
            const cleanRelPath = (relativePath || '').replace(/^\/|\/$/g, '');
            
            // 🛑 CARPETA VIRTUAL: Si el contenido ya fue extraído de un nivel superior, lo usamos.
            if (HTML_CACHE.has(cleanRelPath)) {
                console.log(`[CharmAPI] 🧠 Renderizando Carpeta Virtual: ${cleanRelPath}`);
                return this.parseHTMLContent(HTML_CACHE.get(cleanRelPath), cleanRelPath);
            }

            const fullUrl = `${BASE_URL}${cleanRelPath}${cleanRelPath ? '/' : ''}`;
            console.log(`[CharmAPI] 🛰️ Navegando a: ${cleanRelPath || 'RAÍZ'}`);
            const html = await fetchHTML(fullUrl);
            
            return this.parseHTMLContent(html, cleanRelPath);
        } catch (error) {
            console.error('getFolderItems Error:', error);
            throw error;
        }
    }

    static parseHTMLContent(html, currentPath) {
        const cleanRelPath = (currentPath || '').replace(/^\/|\/$/g, '');
        
        // 🔎 PRE-PROCESADOR DE CARPETAS VIRTUALES
        // Algunos menús (como Diagrams) están anidados en el mismo HTML.
        // Buscamos: <li class='li-folder'><a name='PATH'>Nombre</a><ul>...</ul></li>
        const virtualFolderRegex = /<li\s+class=['"]li-folder['"]>\s*<a\s+name=['"](.*?)['"]>(.*?)<\/a>\s*<ul>([\s\S]*?)<\/ul>/gi;
        let vMatch;
        while ((vMatch = virtualFolderRegex.exec(html)) !== null) {
            const virtualPath = decodeURIComponent(vMatch[1]).replace(/^\/|\/$/g, '');
            const virtualContent = vMatch[3];
            if (!HTML_CACHE.has(virtualPath)) {
                HTML_CACHE.set(virtualPath, virtualContent);
                console.log(`[CharmAPI] 🧬 Virtual sub-path cached: ${virtualPath}`);
            }
        }

        const mainMatch = html.match(/<div class=['"]main['"]>([\s\S]*?)<\/div>/i);
        const contentToSearch = mainMatch ? mainMatch[1] : html;

        const aTagRegex = /<a\s+[^>]*?(href|name)=(['"])(.*?)\2[^>]*?>(.*?)<\/a>/gi;
        const items = [];
        let match;
        
        while ((match = aTagRegex.exec(contentToSearch)) !== null) {
            let attrValue = decodeURIComponent(match[3]).trim();
            let linkText = match[4].replace(/<[^>]*>?/gm, '').trim();

            if (!attrValue || attrValue === "#" || attrValue.includes('javascript:')) continue;

            let technicalPath = "";
            if (attrValue.startsWith('http')) {
                try { technicalPath = new URL(attrValue).pathname.replace(/^\/|\/$/g, ''); } 
                catch (e) { technicalPath = attrValue; }
            } else if (attrValue.startsWith('/')) {
                technicalPath = attrValue.replace(/^\/|\/$/g, '');
            } else {
                technicalPath = `${cleanRelPath}/${attrValue}`.replace(/\/+/g, '/').replace(/^\/|\/$/g, '');
            }

            const normTech = technicalPath.toLowerCase();
            const normCurrent = cleanRelPath.toLowerCase();
            
            const isNoise = ['home', 'about', 'privacy', 'operation charm', 'repair manuals', 'expand all', 'collapse all'].some(n => linkText.toLowerCase().includes(n));
            const isDescendant = normTech.startsWith(normCurrent) || normCurrent === "";

            if (technicalPath && normTech !== normCurrent && isDescendant && !isNoise) {
                // Es carpeta si termina en /, no tiene punto, o es un anchor 'name' con contenido anidado
                const isFolder = attrValue.endsWith('/') || !technicalPath.includes('.') || html.includes(`name='${attrValue}'`);
                
                let finalName = decodeURIComponent(linkText);
                if (!finalName || finalName.length < 2) {
                    const techParts = technicalPath.split('/');
                    finalName = decodeURIComponent(techParts[techParts.length - 1]);
                }

                items.push({
                    name: finalName,
                    path: technicalPath + (isFolder ? '/' : ''),
                    type: isFolder ? 'folder' : 'document'
                });
            }
        }

        if (items.length === 0 && (html.includes('<img') || html.includes('<object'))) {
            return [{ name: "📖 Ver Contenido Técnico", path: cleanRelPath, type: 'document' }];
        }

        const seen = new Set();
        const uniqueResults = [];
        const currentLevelCount = cleanRelPath ? cleanRelPath.split('/').length : 0;

        items.forEach(item => {
            const itemPathNoSlash = item.path.replace(/\/$/, '');
            const itemPartsCount = itemPathNoSlash.split('/').length;
            
            // En niveles profundos, a veces el path salta niveles. 
            // Si no hay items en el nivel +1, aceptamos el siguiente nivel disponible.
            if (itemPartsCount === currentLevelCount + 1 || currentLevelCount === 0) {
                if (!seen.has(item.path)) {
                    seen.add(item.path);
                    uniqueResults.push(item);
                }
            }
        });

        const finalResults = uniqueResults.length > 0 ? uniqueResults : items.filter(el => {
            const isDup = seen.has(el.path);
            seen.add(el.path);
            return !isDup;
        }).slice(0, 50); // Límite de seguridad

        return finalResults.sort((a,b) => a.name.localeCompare(b.name, undefined, {numeric: true}));
    }

    static async getMakes() { return this.getFolderItems(''); }

    static async getTechnicalContent(relativePath) {
        try {
            const cleanRelPath = relativePath.replace(/^\/|\/$/g, '');
            const fullUrl = `${BASE_URL}${cleanRelPath}`;
            const html = await fetchHTML(fullUrl);
            const mainMatch = html.match(/<div class=['"]main['"]>([\s\S]*?)<\/div>/i);
            let content = mainMatch ? mainMatch[1] : html;
            content = content.replace(/<h1>[\s\S]*?<\/h1>/i, '').replace(/<ul class=['"]breadcrumbs['"]>[\s\S]*?<\/ul>/gi, '');
            content = content.replace(/<img[^>]+src=['"]([^'"]+)['"][^>]*>/gi, (match, src) => {
                const abs = src.startsWith('http') ? src : `${BASE_URL}${src.startsWith('/') ? src.slice(1) : src}`;
                return `<img src="${abs}" style="width: 100%; border-radius: 10px; margin: 10px 0;" />`;
            });
            return content.trim();
        } catch (e) { throw e; }
    }
}

export default CharmAPI;
