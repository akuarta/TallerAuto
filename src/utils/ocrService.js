const GOOGLE_API_KEY = "AIzaSyBhMnl-cxCpsL97ukncJA-MTJugjBrkpug";

/**
 * Utilidad para realizar el escaneo OCR utilizando Google Cloud Vision
 * @param {string} base64Image Imagen en formato base64
 * @returns {Promise<string>} Texto detectado (el más probable)
 */
export const performOCR = async (base64Image) => {
    try {
        const url = `https://vision.googleapis.com/v1/images:annotate?key=${GOOGLE_API_KEY}`;
        
        const body = {
            requests: [
                {
                    image: {
                        content: base64Image.split(',')[1] || base64Image // Eliminar prefijo data:image/... si existe
                    },
                    features: [
                        {
                            type: "TEXT_DETECTION"
                        }
                    ]
                }
            ]
        };

        const response = await fetch(url, {
            method: 'POST',
            body: JSON.stringify(body),
            headers: {
                'Content-Type': 'application/json'
            }
        });

        const data = await response.json();
        
        if (data.responses && data.responses[0].fullTextAnnotation) {
            const rawText = data.responses[0].fullTextAnnotation.text;
            return cleanOCRText(rawText);
        }
        
        return null;
    } catch (error) {
        console.error('Error en OCR:', error);
        throw error;
    }
};

/**
 * Limpia el texto detectado para intentar extraer matrículas o VIN
 * @param {string} text 
 */
function cleanOCRText(text) {
    if (!text) return "";
    
    // Matrícula (Latinoamérica/RD): Generalmente 1 letra + 6-7 números, o combinaciones de 3 letras + 3-4 números
    // VIN: 17 caracteres alfanuméricos
    
    const lines = text.split('\n');
    
    // Para matrícula, buscamos líneas cortas con patrones comunes
    const plateCandidate = lines.find(l => {
        const clean = l.replace(/\s/g, '').toUpperCase();
        return (clean.length >= 6 && clean.length <= 10);
    });

    // Para VIN, buscamos una cadena de 17 caracteres
    const vinCandidate = lines.find(l => {
        const clean = l.replace(/\s/g, '').toUpperCase();
        return clean.length === 17;
    });

    if (vinCandidate) return vinCandidate.replace(/\s/g, '').toUpperCase();
    if (plateCandidate) return plateCandidate.replace(/\s/g, '').toUpperCase();
    
    // Si no detectamos un patrón claro, retornamos la primera línea limpia
    return lines[0].trim().toUpperCase();
}
