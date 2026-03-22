---
name: google-maps-monitor
description: Configuración avanzada para el monitoreo y diagnóstico de APIs de Google Maps y servicios de ubicación.
---

# Google Maps Monitor Skill

Esta skill contiene la configuración y los patrones de instrumentación necesarios para monitorear en tiempo real todas las interacciones con Google Maps Platform (Geocoding, Places, Roads) y servicios de ubicación nativos.

## Implementación en el Código

Para implementar este monitoreo en cualquier pantalla con mapas, sigue estos patrones de logs:

### 1. Monitoreo de Geocodificación (Native & Web)
```javascript
// Petición
console.log("GOOGLE MAPS REQ (Geocoding):", url);
// Respuesta
console.log("GOOGLE MAPS RES (Geocoding):", data);
```

### 2. Monitoreo de Places Autocomplete (Buscador)
```javascript
// Mientras se escribe
console.log("GOOGLE MAPS REQ (Places Autocomplete):", query);
// Resultados
console.log("GOOGLE MAPS RES (Places Autocomplete):", status, results.length);
```

### 3. Comunicación Iframe (Web)
Para mapas en Web que usan iframe, monitorear el paso de mensajes:
- `FROM IFRAME (map_pick)`: Recepción de coordenadas y dirección desde el mapa.
- `FROM IFRAME (place_details)`: Recepción de datos enriquecidos de un local.
- `WEB GOOGLE CLICK (Place ID)`: Detección de clicks en puntos de interés de Google.

## Diagnóstico de Errores Comunes

| Error | Causa Probable | Solución |
|-------|----------------|----------|
| **403 Forbidden** | API no habilitada o resticción de llave | Habilitar API en consola y revisar restricciones de la API Key. |
| **404 Not Found** | CORS en Web (Roads API) o API inválida | La Roads API no debe llamarse vía fetch en navegadores. Usar solo en móvil. |
| **REQUEST_DENIED** | Billing no activo o API desactivada | Vincular cuenta de facturación y habilitar Geocoding/Places API. |
| **OVER_QUERY_LIMIT** | Cuota excedida | Revisar límites de uso en Google Cloud Console. |

## Credenciales Críticas
- **Google Maps API Key**: Debe tener habilitadas: `Maps SDK (Android/iOS)`, `Geocoding API`, `Places API` y `Roads API`.
- **Restricción de Referer**: En Web, asegurar que `localhost:8081` esté permitido si hay restricciones.

## Patrones de Fallback
Siempre incluir un fallback a **Nominatim (OpenStreetMap)** si Google falla para mantener la operatividad de la aplicación.

## Carga del Script de Google Maps en Iframes (CRÍTICO)

El patrón **correcto** para cargar Google Maps dentro de un `srcDoc` de iframe es:

```html
<!-- ✅ CORRECTO: Google llama a initMap automáticamente al cargar -->
<script src="https://maps.googleapis.com/maps/api/js?key=API_KEY&libraries=places&callback=initMap" async></script>

<!-- ❌ INCORRECTO: El mapa aparece en blanco porque initMap nunca se llama -->
<script src="https://maps.googleapis.com/maps/api/js?key=API_KEY&libraries=places&loading=async" defer></script>
<script src="https://maps.googleapis.com/maps/api/js?key=API_KEY&libraries=places"></script>
```

- Con `callback=initMap` en la URL + atributo `async`, Google invoca `initMap()` en cuanto la librería está lista.
- **No usar** `defer` ni `loading=async` en iframes de `srcDoc`, causan mapa en blanco.
- La función `initMap` debe estar declarada en el scope global del script inline del iframe.

## Diagnóstico: Mapa en Blanco

| Síntoma | Causa | Solución |
|---------|-------|----------|
| Mapa en blanco al abrir modal | Script con `defer` o `loading=async` | Usar `callback=initMap` + `async` |
| `REQUEST_DENIED` en idle | Geocoding API inactiva o billing faltante | Activar en Google Cloud Console |
| Advertencia "loaded without async" | Falta `async` en el script tag | Añadir atributo `async` |
