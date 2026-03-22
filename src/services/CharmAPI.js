/**
 * CharmAPI.js - V32 PROXY OBLIGATORIO PARA WEB
 */

const BASE_URL = 'https://charm.li/';
const HTML_CACHE = new Map();

// Proxy CORS para saltar la restricción del navegador
const CORS_PROXY = "https://corsproxy.io/?";

/**
 * fetchHTML - Obtiene el contenido HTML usando un Proxy CORS para evitar bloqueos.
 */
async function fetchHTML(targetUrl) {
    if (HTML_CACHE.has(targetUrl)) return HTML_CACHE.get(targetUrl);

    // 1. Normalizar URL
    let finalUrl = targetUrl.toString().replace('http://', 'https://');
    if (!finalUrl.endsWith('/') && !finalUrl.split('/').pop().includes('.')) {
        finalUrl += '/';
    }

    // 2. Aplicar Proxy CORS (Indispensable para localhost:8081)
    const proxyUrl = `${CORS_PROXY}${encodeURIComponent(finalUrl)}`;

    console.log(`[CharmAPI] 🛰️ FETCH VIA PROXY: ${finalUrl}`);
    
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 20000);

        const response = await fetch(proxyUrl, { 
            signal: controller.signal,
            headers: {
                'Accept': 'text/html',
                'X-Requested-With': 'XMLHttpRequest'
            }
        });
        
        clearTimeout(timeoutId);

        if (!response.ok) {
            throw new Error(`Servidor respondió con error ${response.status}`);
        }

        const text = await response.text();
        if (text.length < 100) {
            throw new Error('La respuesta parece estar vacía o bloqueada');
        }

        HTML_CACHE.set(targetUrl, text);
        return text;
    } catch (err) {
        console.error(`[CharmAPI] ❌ Error de red: ${err.message}`);
        throw err;
    }
}

class CharmAPI {
    /**
     * Obtiene los elementos de una "carpeta" (nivel de navegación)
     */
    static async getFolderItems(relativePath) {
        try {
            const cleanRelPath = decodeURIComponent(relativePath || '').replace(/^\/|\/$/g, '');
            const fullUrl = `${BASE_URL}${cleanRelPath}${cleanRelPath ? '/' : ''}`;
            
            // Usar cache de sesión
            if (HTML_CACHE.has(fullUrl)) {
                return this.parseHTMLContent(HTML_CACHE.get(fullUrl), cleanRelPath);
            }

            const html = await fetchHTML(fullUrl);
            return this.parseHTMLContent(html, cleanRelPath);
        } catch (error) {
            console.error('[CharmAPI] Error en getFolderItems:', error);
            throw error;
        }
    }

    /**
     * Parsea HTML crudo para extraer Grupos (li-folder) e Ítems (a href)
     */
    static parseHTMLContent(inputHtml, currentPath) {
        const cleanCurrentPath = decodeURIComponent(currentPath || '').replace(/^\/|\/$/g, '');
        
        // 1. Extraer sección útil sin copiar todo el string
        let contentStart = 0;
        let contentEnd = inputHtml.length;
        const mainMatch = /<div[^>]*class=['"][^'"]*main[^'"]*['"][\s\S]*?>/i.exec(inputHtml);
        
        if (mainMatch) {
            contentStart = mainMatch.index + mainMatch[0].length;
            const closingDiv = inputHtml.indexOf('</div>', contentStart);
            if (closingDiv !== -1) contentEnd = closingDiv;
        }

        const source = inputHtml.substring(contentStart, contentEnd);
        const items = [];
        const seen = new Set();
        let currentLevel = 0;
        let lastMatchIndex = 0;
        
        // 2. Regex optimizado
        const aRegex = /<a\s+([^>]*href=['"]([^'"]+)['"][^>]*|[^>]*name=['"]([^'"]+)['"][^>]*|[^>]*)>([\s\S]*?)<\/a>/gi;
        let match;

        while ((match = aRegex.exec(source)) !== null) {
            // Calcular nivel basado en etiquetas <ul> y </ul> antes de este match
            const between = source.substring(lastMatchIndex, match.index);
            const ups = (between.match(/<ul[\s>]/gi) || []).length;
            const downs = (between.match(/<\/ul>/gi) || []).length;
            currentLevel += (ups - downs);
            lastMatchIndex = match.index;

            const attrs = match[1];
            const content = match[4].replace(/<[^>]*>?/gm, '').trim();

            if (!content || /^(back|home|refresh)$/i.test(content)) continue;

            // Extraer href o name de los atributos capturados
            const hrefMatch = attrs.match(/href=['"]([^'"]+)['"]/i);
            const nameMatch = attrs.match(/name=['"]([^'"]+)['"]/i);
            
            if (!hrefMatch && !nameMatch) continue;

            const rawHref = hrefMatch ? hrefMatch[1] : '';
            const rawName = nameMatch ? nameMatch[1] : '';
            
            if (rawHref.includes('://') && !rawHref.includes('charm.li')) continue;
            if (rawHref.startsWith('#')) continue;

            // PATH BUILDING
            let itemPath = rawHref.startsWith('/') 
                ? rawHref.slice(1) 
                : `${cleanCurrentPath}/${rawHref || rawName}`.replace(/\/+/g, '/').replace(/^\/+|\/+$/g, '');

            if (seen.has(itemPath) || !itemPath) continue;
            seen.add(itemPath);

            // DETECCION CARPETA (Minimalista para velocidad)
            const isFolder = !hrefMatch || rawHref.endsWith('/') || attrs.includes('folder') || attrs.includes('li-folder');
            const isVirtual = isFolder && !hrefMatch;

            items.push({
                type: hrefMatch ? 'item' : 'group',
                name: decodeURIComponent(content),
                path: itemPath,
                isNavigableDir: isFolder,
                hasLink: !!hrefMatch,
                isVirtual: isVirtual,
                level: Math.max(0, currentLevel - 1) // Ajuste para que el primer nivel sea 0
            });
        }

        if (items.length === 0) {
            const hasSignificantText = source.replace(/<[^>]*>?/gm, '').trim().length > 20;
            const hasImg = inputHtml.includes('<img');
            
            if (hasImg || hasSignificantText) {
                return [{ 
                    type: 'item', 
                    name: '📖 Ver Documento o Información', 
                    path: cleanCurrentPath, 
                    isNavigableDir: false, 
                    hasLink: true, 
                    isVirtual: false 
                }];
            }
        }

        return items;
    }

    static async getMakes() {
        return this.getFolderItems('');
    }

    /**
     * Obtiene el contenido técnico (HTML limpio) para mostrar en el lector
     */
    static async getTechnicalContent(relativePath) {
        try {
            const cleanPath = decodeURIComponent(relativePath).replace(/^\/|\/$/g, '');
            const fullUrl = `${BASE_URL}${cleanPath}`;
            const html = await fetchHTML(fullUrl);
            
            // Limpiar HTML para mostrar solo el contenido útil
            let content = html;
            const startTag = /<div[^>]*class=['"]main['"][^>]*>/i.exec(html);
            if (startTag) {
                const startIdx = startTag.index + startTag[0].length;
                let endIdx = html.indexOf('<div class="theme-colors footer"', startIdx);
                if (endIdx === -1) endIdx = html.indexOf('<div class="footer"', startIdx);
                if (endIdx === -1) endIdx = html.indexOf('<ul class="breadcrumbs"', startIdx);
                
                if (endIdx !== -1) {
                    content = html.substring(startIdx, endIdx);
                } else {
                    const endBody = html.indexOf('</body>', startIdx);
                    content = (endBody !== -1) ? html.substring(startIdx, endBody) : html.substring(startIdx);
                }
            }

            // Limpiar encabezados repetitivos y breadcrumbs finales
            content = content.replace(/<ul class=['"]breadcrumbs['"]>[\s\S]*?<\/ul>/gi, '')
                           .replace(/<h1>[\s\S]*?<\/h1>/i, '');

            // Arreglar imágenes para que carguen directo de charm.li
            content = content.replace(/<img[^>]+src=['"]([^'"]+)['"][^>]*>/gi, (img, src) => {
                const absSrc = src.startsWith('http') ? src : `${BASE_URL}${src.startsWith('/') ? src.slice(1) : src}`;
                return `<img src="${absSrc}" style="width:100%; height:auto; border-radius:8px; margin:15px 0; box-shadow:0 4px 10px rgba(0,0,0,0.1);" />`;
            });

            return content.trim();
        } catch (error) {
            console.error('[CharmAPI] Error getTechnicalContent:', error);
            throw error;
        }
    }
}

export default CharmAPI;
