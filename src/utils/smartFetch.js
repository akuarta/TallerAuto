import { Platform } from 'react-native';

/**
 * Realiza un fetch inteligente que usa proxies en Web para evitar CORS.
 * En nativo realiza la petición directa.
 */
export async function smartFetch(url, options = {}) {
    if (Platform.OS !== 'web') {
        return fetch(url, options);
    }

    const proxies = [
        `https://corsproxy.io/?${encodeURIComponent(url)}`,
        `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`
    ];
    
    for (const proxyUrl of proxies) {
        try {
            console.log('Trying proxy:', proxyUrl.split('?')[0]);
            const response = await fetch(proxyUrl, options);
            
            if (!response.ok) continue;

            let textContent;
            if (proxyUrl.includes('allorigins')) {
                const wrapper = await response.json();
                textContent = wrapper.contents;
            } else {
                textContent = await response.text();
            }

            // Validar si es JSON
            if (textContent.trim().startsWith('<')) {
                console.warn('Proxy returned HTML instead of JSON. Likely a Google error page.');
                console.log('HTML Start:', textContent.substring(0, 100));
                continue;
            }

            // Crear una respuesta falsa que soporte .json()
            return {
                ok: true,
                json: async () => JSON.parse(textContent)
            };
        } catch (error) {
            console.warn(`Proxy failed:`, error.message);
        }
    }

    // Ultimo recurso: directo (fallará si hay CORS)
    return fetch(url, options);
}
