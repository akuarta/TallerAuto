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

    // 2. Strict URI encoding for path parts to avoid 404s on chars like (, ), /
    // Construimos la URL manualmente para evitar que urlObj.pathname decodifique y rompa los slashes codificados (%2F)
    const parts = finalUrl.split('/');
    const protocol = parts[0]; // https:
    const domain = parts[2];   // charm.li
    const pathParts = parts.slice(3);
    
    const encodedPath = pathParts.map(part => {
        if (!part) return '';
        // Decodificamos primero por si ya venía codificado, luego codificamos estrictamente
        return encodeURIComponent(decodeURIComponent(part))
            .replace(/[!'()*]/g, c => '%' + c.charCodeAt(0).toString(16).toUpperCase());
    }).join('/');

    const strictUrl = `${protocol}//${domain}/${encodedPath}`;

    // 3. Aplicar Proxy CORS (Indispensable para localhost:8081)
    const proxyUrl = `${CORS_PROXY}${encodeURIComponent(strictUrl)}`;

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
            // Ya no decodificamos: mantene el path real (codificado) para construir la URL
            const cleanRelPath = (relativePath || '').replace(/^\/|\/$/g, '');
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
        // Para construir paths hijos, usamos el path padre TAL CUAL (codificado)
        const encodedParentPath = (currentPath || '').replace(/^\/|\/$/g, '');
        
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
            // Para el nombre visual, limpiamos el HTML interno
            const content = match[4].replace(/<[^>]*>?/gm, '').trim();

            if (!content || /^(back|home|refresh)$/i.test(content)) continue;

            const hrefMatch = attrs.match(/href=['"]([^'"]+)['"]/i);
            const nameMatch = attrs.match(/name=['"]([^'"]+)['"]/i);
            
            if (!hrefMatch && !nameMatch) continue;

            const rawHref = hrefMatch ? hrefMatch[1] : '';
            const rawName = nameMatch ? nameMatch[1] : '';
            
            if (rawHref.includes('://') && !rawHref.includes('charm.li')) continue;
            if (rawHref.startsWith('#')) continue;

            // PATH BUILDING: Usamos rawHref directamente sin decodificar
            let itemPath = rawHref.startsWith('/') 
                ? rawHref.slice(1) 
                : `${encodedParentPath}/${rawHref || rawName}`.replace(/\/+/g, '/').replace(/^\/+|\/+$/g, '');

            if (seen.has(itemPath) || !itemPath) continue;
            seen.add(itemPath);

            const isFolder = !hrefMatch || rawHref.endsWith('/') || attrs.includes('folder') || attrs.includes('li-folder');
            const isVirtual = isFolder && !hrefMatch;

            let finalName = content;
            // Purificar nombre para legibilidad
            finalName = CharmAPI.purifyName(finalName);

            // Robust deep decode for UI
            while (finalName.includes('%')) {
                try {
                    const decoded = decodeURIComponent(finalName);
                    if (decoded === finalName) break;
                    finalName = decoded;
                } catch(e) {
                    finalName = finalName.replace(/%20/g, ' ').replace(/%28/g, '(').replace(/%29/g, ')');
                    break;
                }
            }

            items.push({
                type: hrefMatch ? 'item' : 'group',
                name: finalName,
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
                items.push({
                    type: 'item',
                    name: '📄 Ver contenido técnico...',
                    path: currentPath,
                    isNavigableDir: true,
                    hasLink: true,
                    level: 0
                });
            }
        }

        return items;
    }

    /**
     * Limpia nombres excesivamente largos o repetitivos de Charm.li
     */
    static purifyName(name) {
        if (!name) return '';
        
        let clean = name;
        // 1. Eliminar repeticiones de "(from ...)" si aparecen más de una vez
        const fromPart = /\s*\(from [^)]+\)/gi;
        const matches = clean.match(fromPart);
        if (matches && matches.length > 1) {
            // Mantener solo el primero o ninguno si es redundante
            clean = clean.replace(fromPart, ''); 
        }

        // 2. Limpiar variantes de Volkswagen comunes que ensucian
        clean = clean.replace(/ , High \([^)]+\) , Medium \([^)]+\) , Low \) , from April 2005/gi, '');
        clean = clean.replace(/, Standard Equipment/gi, '');
        
        // 3. Recortar si sigue siendo ridículamente largo (más de 120 chars)
        if (clean.length > 120) {
            clean = clean.substring(0, 117) + '...';
        }

        return clean.trim();
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
