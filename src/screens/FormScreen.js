import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, ScrollView, TouchableOpacity, Alert, Modal, ActivityIndicator, Platform, KeyboardAvoidingView } from 'react-native';
import { Colors } from '../constants';
import { CustomHeader } from '../components/CustomHeader';
import { useData } from '../context/DataContext';
import { Save, X, Lock, Trash2, Calendar, Camera, Plus, Phone, Search as SearchIcon, Star, AlertTriangle, MapPin } from 'lucide-react-native';
import * as Contacts from 'expo-contacts';
import * as Location from 'expo-location';

let MapView, Marker;
if (Platform.OS !== 'web') {
    const Maps = require('react-native-maps');
    MapView = Maps.default;
    Marker = Maps.Marker;
}

const SHEET_URL = "https://docs.google.com/spreadsheets/d/1Xv37q0S-2pU3b_b1qN5v9fU8rN6-F6N6/edit?usp=sharing";
const GOOGLE_MAPS_API_KEY = "AIzaSyBhMnl-cxCpsL97ukncJA-MTJugjBrkpug"; // PEGA TU API KEY AQUÍ PARA MAPAS PROFESIONALES

export default function FormScreen({ route, navigation }) {
    const { title, dataKey, fields, item, prefill } = route.params || {};
    const { deleteItemByField, addItem, updateItem, syncing, ...allData } = useData();
    const [formData, setFormData] = useState(item || prefill || {});
    const [initialData, setInitialData] = useState(item || prefill || {}); // Para detectar cambios reales
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [pickerVisible, setPickerVisible] = useState(false);
    const [pickerConfig, setPickerConfig] = useState(null); // { field, data, labelField }
    const [pickerSearchQuery, setPickerSearchQuery] = useState('');
    const [showYearPicker, setShowYearPicker] = useState(false);
    const [tempMonth, setTempMonth] = useState('01');
    const [tempYear, setTempYear] = useState(new Date().getFullYear().toString());

    // Es edición si tiene un ID (lo que significa que ya existe en la base de datos)
    const isEdit = !!(item && item.id);

    // Helper para alertas compatibles con Web
    const showAlert = (title, message, buttons) => {
        if (Platform.OS === 'web') {
            if (buttons && buttons.length > 1) {
                const confirmed = window.confirm(`${title}\n\n${message}`);
                if (confirmed) {
                    // Ejecutar la acción del botón positivo (el que no es cancel)
                    const confirmBtn = buttons.find(b => b.style !== 'cancel') || buttons[buttons.length - 1];
                    if (confirmBtn && confirmBtn.onPress) confirmBtn.onPress();
                } else {
                    // Ejecutar la acción de cancelar si existe
                    const cancelBtn = buttons.find(b => b.style === 'cancel');
                    if (cancelBtn && cancelBtn.onPress) cancelBtn.onPress();
                }
            } else {
                alert(`${title}\n\n${message}`);
            }
        } else {
            Alert.alert(title, message, buttons);
        }
    };

    const goBackToList = () => {
        const mapping = {
            'orders': 'Orders',
            'garage': 'Garage',
            'invoices': 'Billing',
            'catalog': 'VehicleSearch',
            'vehiculos': 'VehicleList',
            'clients': 'ClientList',
            'tecnicos': 'TechnicianList',
            'citas': 'AppointmentList',
            'facturando': 'InvoicingList'
        };
        const target = mapping[dataKey];
        if (target) {
            navigation.navigate(target);
        } else {
            navigation.goBack();
        }
    };

    // Función para identificar si un campo es un campo ID
    const isIdField = (field) => {
        const f = field.toLowerCase().trim();
        // Detectar si empieza por ID, contiene _ID, o es exactamente ID
        return f === 'id' ||
            f.startsWith('id ') ||
            f.startsWith('id_') ||
            f.includes('_id') ||
            f.includes('id_') ||
            f.startsWith('id') && f.length > 2 && !['identificacion', 'identidad'].includes(f); // Evitar falsos positivos como 'identidad'
    };

    // Función para obtener las iniciales según el tipo de entidad (usando los prefijos existentes)
    const getPrefix = () => {
        const titleLower = title?.toLowerCase() || '';
        if (titleLower.includes('servicio')) return 'HS';
        if (titleLower.includes('cliente')) return 'DNI';
        if (titleLower.includes('orden')) return 'HO';
        if (titleLower.includes('marca')) return '';
        if (titleLower.includes('modelo')) return '';
        if (titleLower.includes('factura')) return '';
        if (titleLower.includes('cita')) return 'CIT';
        // Para vehículos, usamos 'HV' como prefijo
        if (titleLower.includes('vehículo') || titleLower.includes('vehiculo')) return 'HV';
        if (titleLower.includes('producto')) return 'HP';
        if (titleLower.includes('técnico') || titleLower.includes('tecnico')) return 'HT';
        if (titleLower.includes('herramienta')) return 'HH';
        return '';
    };

    // Función para obtener el prefijo del ID existente
    const getExistingPrefix = (idValue) => {
        if (!idValue) return '';
        // Buscar prefijos conocidos
        const prefixes = ['SER', 'CLI', 'ORD', 'MAR', 'MOD', 'FAC', 'CIT', 'VEH', 'PRO', 'TEC', 'HER', 'HO', 'HS', 'HP', 'HT', 'HH', 'H'];
        for (const prefix of prefixes) {
            if (idValue.toString().toUpperCase().startsWith(prefix)) {
                return prefix;
            }
        }
        return '';
    };

    // Función para generar ID específico para marca/modelo del catálogo (solo números)
    const generateCatalogId = (idField) => {
        const list = allData.catalog || [];

        // Filtrar solo los que tienen el campo ID correspondiente
        const filteredList = list.filter(item => item[idField]);

        // Para ID_Marca e ID_Modelo, solo buscar números
        const maxId = filteredList.reduce((max, curr) => {
            const val = parseInt(curr[idField]) || 0;
            return !isNaN(val) && val > max ? val : max;
        }, 0);

        // Devolver solo el número sin prefijo
        return String(maxId + 1);
    };

    // --- FUNCIONES AUXILIARES ---

    // Función universal para generar IDs siguiendo la lógica histórica de la tabla
    const generateUniversalId = (idField, dKey) => {
        const list = allData[dKey] || [];
        if (list.length === 0) {
            const prefix = getPrefix();
            return prefix + "1";
        }

        const ids = list.map(item => item[idField]?.toString() || "").filter(id => id !== "");
        if (ids.length === 0) return getPrefix() + "1";

        const lastId = ids[ids.length - 1];
        const prefixMatch = lastId.match(/^([A-Za-z]+)/);
        const prefix = prefixMatch ? prefixMatch[1] : "";

        const maxNum = ids.reduce((max, id) => {
            const numPart = id.replace(/^\D+/g, '');
            const num = parseInt(numPart) || 0;
            return num > max ? num : max;
        }, 0);

        return prefix + (maxNum + 1);
    };

    // Función para formatear el año como mm/AAAA
    const formatMonthYear = (text) => {
        // Eliminar cualquier cosa que no sea número
        const cleaned = text.replace(/\D/g, '');
        let formatted = cleaned;

        if (cleaned.length > 2) {
            formatted = cleaned.slice(0, 2) + '/' + cleaned.slice(2, 6);
        }

        return formatted;
    };

    // Función para formatear la hora como HH:mm
    const formatTime = (text) => {
        const cleaned = text.replace(/\D/g, '');
        let formatted = cleaned;
        if (cleaned.length > 2) {
            formatted = cleaned.slice(0, 2) + ':' + cleaned.slice(2, 4);
        }
        return formatted;
    };

    // Función para traducir colores de español a inglés (para CSS)
    const translateColor = (colorName) => {
        if (!colorName) return '';
        const lower = colorName.toLowerCase().trim();
        const colorMap = {
            'rojo': 'red', 'azul': 'blue', 'verde': 'green', 'amarillo': 'yellow',
            'negro': 'black', 'blanco': 'white', 'gris': 'gray', 'naranja': 'orange',
            'morado': 'purple', 'purpura': 'purple', 'rosa': 'pink', 'rosado': 'pink',
            'marron': 'brown', 'café': 'brown', 'cafe': 'brown', 'plateado': 'silver',
            'plata': 'silver', 'dorado': 'gold', 'oro': 'gold', 'celeste': 'skyblue',
            'turquesa': 'turquoise', 'cian': 'cyan', 'magenta': 'magenta', 'lima': 'lime',
            'azul marino': 'navy', 'oliva': 'olive', 'trigo': 'wheat', 'crema': 'beige',
        };
        return colorMap[lower] || lower;
    };

    // Función para importar desde contactos
    const importFromContacts = async () => {
        try {
            const { status } = await Contacts.requestPermissionsAsync();
            if (status === 'granted') {
                const result = await Contacts.presentContactPickerAsync();
                if (result && !result.cancelled) {
                    const contact = result;
                    const name = contact.name || '';
                    const phone = contact.phoneNumbers && contact.phoneNumbers.length > 0
                        ? contact.phoneNumbers[0].number
                        : '';

                    setFormData(prev => ({
                        ...prev,
                        Nombre: name,
                        Telefono: phone
                    }));
                }
            } else {
                showAlert("Permiso Denegado", "No se puede acceder a los contactos sin permiso.");
            }
        } catch (error) {
            console.error(error);
            showAlert("Error", "No se pudo abrir la agenda de contactos.");
        }
    };

    const [mapModalVisible, setMapModalVisible] = useState(false);
    const [mapCoords, setMapCoords] = useState(null);
    const [mapAddress, setMapAddress] = useState("");
    const [mapField, setMapField] = useState(null);
    const [mapSearchQuery, setMapSearchQuery] = useState("");
    const [mapSearching, setMapSearching] = useState(false);
    const [mapSuggestions, setMapSuggestions] = useState([]);
    const [initialMapCoords, setInitialMapCoords] = useState(null);

    const reverseGeocode = async (coords) => {
        try {
            if (GOOGLE_MAPS_API_KEY) {
                const response = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?latlng=${coords.latitude},${coords.longitude}&key=${GOOGLE_MAPS_API_KEY}&language=es`);
                const data = await response.json();
                if (data.status === 'OK' && data.results.length > 0) {
                    setMapAddress(data.results[0].formatted_address);
                    return;
                }
            }
            
            // Fallback a Nominatim
            const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${coords.latitude}&lon=${coords.longitude}&addressdetails=1`);
            const data = await response.json();
            
            if (data && data.display_name) {
                const parts = data.display_name.split(',');
                const shortAddress = parts.slice(0, 3).join(',').trim();
                setMapAddress(shortAddress);
            } else {
                setMapAddress(`${coords.latitude.toFixed(6)}, ${coords.longitude.toFixed(6)}`);
            }
        } catch (error) {
            console.log("Error reverseGeocode", error);
            setMapAddress(`${coords.latitude.toFixed(6)}, ${coords.longitude.toFixed(6)}`);
        }
    };

    // Buscar sugerencias (Google Maps si hay KEY, sino Nominatim)
    useEffect(() => {
        const fetchSuggestions = async () => {
            if (mapSearchQuery.length < 3) {
                setMapSuggestions([]);
                return;
            }
            try {
                if (GOOGLE_MAPS_API_KEY) {
                    // Usar Geocoding API de Google para buscar (sesgado a República Dominicana)
                    const response = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(mapSearchQuery)}&key=${GOOGLE_MAPS_API_KEY}&components=country:DO&language=es`);
                    const data = await response.json();
                    if (data.status === 'OK') {
                        const formatted = data.results.map(r => ({
                            display_name: r.formatted_address,
                            lat: r.geometry.location.lat,
                            lon: r.geometry.location.lng,
                            isGoogle: true
                        }));
                        setMapSuggestions(formatted);
                        return;
                    }
                }

                // Fallback Nominatim
                const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(mapSearchQuery)}&addressdetails=1&limit=6&viewbox=-72,20,-68,17&countrycodes=do`);
                const data = await response.json();
                setMapSuggestions(data);
            } catch (error) {
                console.log("Error buscando sugerencias", error);
            }
        };

        const timer = setTimeout(fetchSuggestions, 500);
        return () => clearTimeout(timer);
    }, [mapSearchQuery]);

    const handleSelectSuggestion = (suggestion) => {
        const newCoords = {
            latitude: parseFloat(suggestion.lat),
            longitude: parseFloat(suggestion.lon)
        };
        setMapCoords(newCoords);
        setMapAddress(suggestion.display_name);
        setMapSearchQuery(suggestion.display_name);
        setMapSuggestions([]);

        if (Platform.OS === 'web') {
            const iframe = document.getElementById('map-iframe');
            if (iframe && iframe.contentWindow) {
                iframe.contentWindow.postMessage(JSON.stringify({
                    type: 'set_view',
                    lat: newCoords.latitude,
                    lng: newCoords.longitude
                }), '*');
            }
        }
    };

    // Memoizar el iframe para que NO se resetee el zoom al cambiar otros estados
    const memoizedWebMap = React.useMemo(() => {
        if (Platform.OS !== 'web' || !initialMapCoords) return null;

        // Estilo Oscuro Premium para Google Maps
        const googleMapsDarkStyle = [
            { "elementType": "geometry", "stylers": [{ "color": "#242f3e" }] },
            { "elementType": "labels.text.stroke", "stylers": [{ "color": "#242f3e" }] },
            { "elementType": "labels.text.fill", "stylers": [{ "color": "#746855" }] },
            { "featureType": "administrative.locality", "elementType": "labels.text.fill", "stylers": [{ "color": "#d59563" }] },
            { "featureType": "poi", "elementType": "labels.text.fill", "stylers": [{ "color": "#d59563" }] },
            { "featureType": "road", "elementType": "geometry", "stylers": [{ "color": "#38414e" }] },
            { "featureType": "road", "elementType": "geometry.stroke", "stylers": [{ "color": "#212a37" }] },
            { "featureType": "road", "elementType": "labels.text.fill", "stylers": [{ "color": "#9ca5b3" }] },
            { "featureType": "water", "elementType": "geometry", "stylers": [{ "color": "#17263c" }] }
        ];

        if (GOOGLE_MAPS_API_KEY) {
            return (
                <iframe
                    id="map-iframe"
                    width="100%"
                    height="100%"
                    style={{ border: 0 }}
                    srcDoc={`
                        <!DOCTYPE html>
                        <html>
                        <head>
                            <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
                            <script src="https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}"></script>
                            <style>
                                body, html, #map { margin: 0; padding: 0; width: 100%; height: 100%; overflow: hidden; background: #121212; }
                                .center-marker {
                                    position: absolute;
                                    top: 50%;
                                    left: 50%;
                                    transform: translate(-50%, -100%);
                                    z-index: 1000;
                                    pointer-events: none;
                                    width: 44px;
                                    height: 44px;
                                }
                            </style>
                        </head>
                        <body>
                            <div id="map"></div>
                            <svg class="center-marker" viewBox="0 0 24 24" fill="none" stroke="#E53935" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                                <circle cx="12" cy="10" r="3"></circle>
                            </svg>
                            <script>
                                var map;
                                function initMap() {
                                    map = new google.maps.Map(document.getElementById('map'), {
                                        center: {lat: ${initialMapCoords.latitude}, lng: ${initialMapCoords.longitude}},
                                        zoom: 16,
                                        disableDefaultUI: false,
                                        zoomControl: true,
                                        styles: ${JSON.stringify(googleMapsDarkStyle)}
                                    });

                                    map.addListener('idle', function() {
                                        var center = map.getCenter();
                                        window.parent.postMessage(JSON.stringify({ 
                                            type: 'map_pick', 
                                            lat: center.lat(), 
                                            lng: center.lng() 
                                        }), '*');
                                    });
                                }
                                initMap();

                                window.addEventListener('message', function(event) {
                                    try {
                                        var data = JSON.parse(event.data);
                                        if (data.type === 'set_view') {
                                            map.setCenter({lat: data.lat, lng: data.lng});
                                            map.setZoom(17);
                                        }
                                    } catch(e) {}
                                });
                            </script>
                        </body>
                        </html>
                    `}
                />
            );
        }

        // Fallback a Leaflet (Gratis)
        return (
            <iframe
                id="map-iframe"
                width="100%"
                height="100%"
                style={{ border: 0 }}
                srcDoc={`
                    <!DOCTYPE html>
                    <html>
                    <head>
                        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
                        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
                        <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
                    <style>
                        body, html, #map { margin: 0; padding: 0; width: 100%; height: 100%; overflow: hidden; background: #121212; }
                        #map { filter: invert(100%) hue-rotate(180deg) brightness(95%) contrast(90%); }
                        .leaflet-control-zoom { filter: invert(0); }
                        .center-marker {
                            position: absolute;
                            top: 50%;
                            left: 50%;
                            transform: translate(-50%, -100%);
                            z-index: 1000;
                            pointer-events: none;
                            width: 40px;
                            height: 40px;
                            filter: invert(100%) hue-rotate(180deg);
                        }
                    </style>
                    </head>
                    <body>
                        <div id="map"></div>
                        <svg class="center-marker" viewBox="0 0 24 24" fill="none" stroke="#E53935" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                            <circle cx="12" cy="10" r="3"></circle>
                        </svg>
                        <script>
                            var map = L.map('map', {zoomControl: true}).setView([${initialMapCoords.latitude}, ${initialMapCoords.longitude}], 16);
                            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);
                            
                            map.on('moveend', function() {
                                var center = map.getCenter();
                                window.parent.postMessage(JSON.stringify({ type: 'map_pick', lat: center.lat, lng: center.lng }), '*');
                            });

                            window.addEventListener('message', function(event) {
                                try {
                                    var data = JSON.parse(event.data);
                                    if (data.type === 'set_view') {
                                        map.setView([data.lat, data.lng], 16);
                                    }
                                } catch(e) {}
                            });
                        </script>
                    </body>
                    </html>
                `}
            />
        );
    }, [initialMapCoords]);

    const handleSearchAddress = async () => {
        if (!mapSearchQuery.trim()) return;
        setMapSearching(true);
        try {
            const result = await Location.geocodeAsync(mapSearchQuery);
            if (result && result.length > 0) {
                const newCoords = { latitude: result[0].latitude, longitude: result[0].longitude };
                setMapCoords(newCoords);
                reverseGeocode(newCoords);
                if (Platform.OS === 'web') {
                    const iframe = document.getElementById('map-iframe');
                    if (iframe && iframe.contentWindow) {
                        iframe.contentWindow.postMessage(JSON.stringify({
                            type: 'set_view',
                            lat: newCoords.latitude,
                            lng: newCoords.longitude
                        }), '*');
                    }
                }
            }
        } catch (error) { }
        setMapSearching(false);
    };

    useEffect(() => {
        if (Platform.OS === 'web') {
            const handleMessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    if (data.type === 'map_pick') {
                        const newCoords = { latitude: data.lat, longitude: data.lng };
                        setMapCoords(newCoords);
                        reverseGeocode(newCoords);
                    }
                } catch (e) { }
            };
            window.addEventListener('message', handleMessage);
            return () => window.removeEventListener('message', handleMessage);
        }
    }, []);

    // Función para abrir modal interactivo de mapa
    const openMapForField = async (field) => {
        setMapField(field);
        let initialLat = 18.4861;
        let initialLng = -69.9312;

        try {
            const currentVal = formData[field];
            if (currentVal && currentVal.includes(',')) {
                const parts = currentVal.split(',');
                const maybeLat = parseFloat(parts[0]);
                const maybeLng = parseFloat(parts[1]);
                if (!isNaN(maybeLat) && !isNaN(maybeLng)) {
                    initialLat = maybeLat;
                    initialLng = maybeLng;
                }
            } else {
                let { status } = await Location.requestForegroundPermissionsAsync();
                if (status === 'granted') {
                    let loc = await Location.getCurrentPositionAsync({});
                    initialLat = loc.coords.latitude;
                    initialLng = loc.coords.longitude;
                }
            }
        } catch (error) {
            console.log("Error obteniendo ubicacion incial", error);
        }

        setMapCoords({ latitude: initialLat, longitude: initialLng });
        setInitialMapCoords({ latitude: initialLat, longitude: initialLng });
        setMapAddress("Cargando dirección...");
        setMapSearchQuery("");
        setMapSuggestions([]);
        setMapModalVisible(true);
        reverseGeocode({ latitude: initialLat, longitude: initialLng });
    };

    const confirmMapPick = () => {
        if (mapCoords && mapField) {
            const value = mapAddress && mapAddress !== "Cargando dirección..."
                ? `${mapAddress} (${mapCoords.latitude.toFixed(6)}, ${mapCoords.longitude.toFixed(6)})`
                : `${mapCoords.latitude.toFixed(6)}, ${mapCoords.longitude.toFixed(6)}`;

            setFormData(prev => ({
                ...prev,
                [mapField]: value
            }));
        }
        setMapModalVisible(false);
    };

    // Encontrar el campo ID principal
    const getIdField = () => fields.find(f => isIdField(f));

    useEffect(() => {
        const data = item || prefill || {};
        setFormData(data);
        setInitialData({ ...data }); // Guardar copia inicial
    }, [item, prefill, dataKey]);

    useEffect(() => {
        if (!isEdit) {
            // Generar ID para cada campo ID que esté vacío
            const updatedFormData = { ...formData };
            let hasChanges = false;

            fields?.forEach(field => {
                if (isIdField(field) && !formData[field]) {
                    updatedFormData[field] = generateUniversalId(field, dataKey);
                    hasChanges = true;
                }
            });

            if (hasChanges) setFormData(updatedFormData);
        }
    }, [allData, dataKey, fields, isEdit, item, prefill]);

    const handleSave = async (stayInFormForModel = false) => {
        // Validación básica
        if (Object.keys(formData).length === 0) {
            showAlert("Error", "Por favor completa al menos un campo");
            return;
        }

        const idField = getIdField();

        // Validación de Matrícula Única para Vehículos
        if (dataKey === 'vehiculos') {
            const matricula = formData.Matricula;
            // Solo validar si es nuevo o si cambió la matrícula
            const isMatriculaChanged = !isEdit || item.Matricula !== matricula;

            if (isMatriculaChanged) {
                const existingVehicle = allData.vehiculos?.find(v =>
                    String(v.Matricula || '').toLowerCase() === String(matricula || '').toLowerCase() &&
                    (!isEdit || v.id !== item.id)
                );

                if (existingVehicle) {
                    showAlert(
                        "Matrícula Duplicada",
                        `La matrícula ${matricula} ya está registrada en otro vehículo.`
                    );
                    return;
                }
            }
        }

        // Validación de Duplicados para Catálogo (Marcas/Modelos)
        if (dataKey === 'catalog' && !isEdit) {
            const titleLower = title?.toLowerCase() || '';
            const fieldsLower = fields?.map(f => f.toLowerCase()) || [];

            // Si el formulario contiene 'Modelo' y 'Marca', es un Modelo
            if (fieldsLower.includes('modelo') && fieldsLower.includes('marca')) {
                const existingModel = allData.catalog?.find(m =>
                    String(m.Marca || '').toLowerCase().trim() === String(formData.Marca || '').toLowerCase().trim() &&
                    String(m.Modelo || '').toLowerCase().trim() === String(formData.Modelo || '').toLowerCase().trim()
                );
                if (existingModel) {
                    showAlert("Modelo Existente", `El modelo "${formData.Modelo}" ya está registrado para la marca ${formData.Marca}.`);
                    return;
                }
            }
            // Si tiene 'Marca' pero NO 'Modelo', es una Marca
            else if (fieldsLower.includes('marca')) {
                const existingBrand = allData.catalog?.find(b =>
                    String(b.Marca || '').toLowerCase().trim() === String(formData.Marca || '').toLowerCase().trim()
                );
                if (existingBrand) {
                    showAlert("Marca Existente", `La marca "${formData.Marca}" ya está registrada.`);
                    return;
                }
            }
        }

        // Lógica específica para Clientes (requerimiento de tener vehículo)
        if (dataKey === 'clients') {
            const clientName = formData.Nombre || formData.Cliente;
            const vehicleMatricula = formData['Vehículo'] || formData['Matricula'];

            if (!isEdit) {
                const vehicles = allData.getVehiculosByCliente(clientName);
                if (!vehicleMatricula && vehicles.length === 0) {
                    showAlert(
                        "Vehículo Requerido",
                        "Cada cliente debe tener al menos un vehículo asignado. ¿Deseas registrar uno ahora?",
                        [
                            { text: "Cancelar", style: "cancel" },
                            {
                                text: "Sí, Registrar Vehículo",
                                onPress: async () => {
                                    await addItem(dataKey, formData);
                                    navigation.navigate('Form', {
                                        title: 'Vehículo',
                                        dataKey: 'vehiculos',
                                        fields: ['Matricula', 'Marca', 'Modelo', 'Año de Fabricacion', 'Color', 'Codigo VIN', 'Notas'],
                                        prefill: { 'Cliente(REF)': clientName, ID_Cliente: formData[idField] }
                                    });
                                }
                            }
                        ]
                    );
                    return;
                }
            }

            // Si se seleccionó un vehículo existente, vincularlo
            if (vehicleMatricula) {
                const vehicle = allData.vehiculos.find(v => v.Matricula === vehicleMatricula);
                if (vehicle) {
                    allData.updateItem('vehiculos', vehicle.id || vehicle['ID Vehiculo'], {
                        'Cliente(REF)': clientName,
                        'Cliente': clientName
                    });
                }
            }
        }

        try {
            let result;
            if (isEdit) {
                result = await updateItem(dataKey, formData.id, formData);
            } else {
                result = await addItem(dataKey, formData);
            }

            if (result && result.success === false) {
                goBackToList();
                showAlert(
                    "Sincronización Pendiente",
                    "Los datos se guardaron localmente pero hubo un problema con la nube: " + (result.error || "Error de respuesta")
                );
            } else {
                if (stayInFormForModel) {
                    navigation.navigate('Form', {
                        title: 'Modelo',
                        dataKey: 'catalog',
                        prefill: { Marca: formData.Marca, ID_Marca: formData.ID_Marca },
                        fields: ['ID_Marca', 'ID_Modelo', 'Marca', 'Modelo', 'Slug_Modelo']
                    });
                } else {
                    goBackToList();
                }
            }
        } catch (error) {
            showAlert("Error de Conexión", "No se pudo contactar con el servidor. Revisa tu internet.");
        }
    };

    const [isDeleting, setIsDeleting] = useState(false);

    const handleDelete = () => {
        setShowDeleteModal(true);
    };

    const confirmDelete = async () => {
        if (formData.id) {
            setIsDeleting(true);
            try {
                const result = await allData.deleteItem(dataKey, formData.id);
                setShowDeleteModal(false);

                if (result && result.success === false) {
                    goBackToList();
                    showAlert("Borrado Local", "Se eliminó localmente pero no se pudo borrar en la nube.");
                } else {
                    goBackToList();
                    showAlert("Eliminado", "El registro se ha eliminado correctamente de la nube.");
                }
            } catch (error) {
                showAlert("Error", "No se pudo procesar la eliminación.");
            } finally {
                setIsDeleting(false);
            }
        } else {
            setShowDeleteModal(false);
            showAlert("Error", "No se pudo eliminar el registro");
        }
    };

    // Lógica de Pickers
    const openPicker = (field) => {
        let options = [];
        let labelField = '';
        const fieldLower = field.toLowerCase();

        if (fieldLower.includes('cliente')) {
            options = allData.clients || [];
            labelField = 'Nombre';
        } else if (fieldLower.includes('tecnico')) {
            options = allData.tecnicos || [];
            labelField = 'Nombre';
        } else if (fieldLower === 'estado') {
            options = [
                { id: '1', name: 'Pendiente' },
                { id: '2', name: 'En Proceso' },
                { id: '3', name: 'Completado' },
                { id: '4', name: 'Cancelado' }
            ];
            labelField = 'name';
        } else if (fieldLower.includes('marca')) {
            // Obtener marcas únicas del catálogo
            const marcasSet = new Set();
            (allData.catalog || []).forEach(item => {
                if (item.Marca) marcasSet.add(item.Marca);
            });
            options = Array.from(marcasSet).sort().map(m => ({ id: m, Marca: m }));
            labelField = 'Marca';
        } else if (fieldLower.includes('modelo')) {
            const selectedMarca = formData.Marca;
            if (!selectedMarca) {
                showAlert("Atención", "Por favor selecciona primero una Marca");
                return;
            }
            // Filtrar modelos por la marca seleccionada
            const modelosSet = new Set();
            (allData.catalog || []).forEach(item => {
                if (item.Marca === selectedMarca && item.Modelo) {
                    modelosSet.add(item.Modelo);
                }
            });
            options = Array.from(modelosSet).sort().map(m => ({ id: m, Modelo: m }));
            labelField = 'Modelo';
        } else if (fieldLower.includes('matricula') || fieldLower.includes('vehiculo') || fieldLower.includes('vehículo')) {
            const selectedClient = formData.Nombre || formData.Cliente || formData.ID_Cliente;
            options = allData.vehiculos || [];

            if (dataKey === 'clients') {
                options = options.filter(v => {
                    const clientRef = v.Cliente || v.ID_Cliente || v['Cliente(REF)'] || v['ID Cliente'];
                    return !clientRef || clientRef === '';
                });
            } else if (selectedClient) {
                options = options.filter(v =>
                    String(v.Cliente || '').toLowerCase() === String(selectedClient || '').toLowerCase() ||
                    String(v.ID_Cliente || '').toLowerCase() === String(selectedClient || '').toLowerCase()
                );
            }
            labelField = 'Matricula';
        }

        if (options.length > 0 || fieldLower.includes('vehiculo') || fieldLower.includes('vehículo') || fieldLower.includes('placa') || fieldLower.includes('matricula')) {
            setPickerConfig({ field, data: options, labelField });
            setPickerSearchQuery(''); // Resetear búsqueda al abrir
            setPickerVisible(true);
        } else {
            showAlert("Info", "No hay opciones disponibles para este campo");
        }
    };

    const handleSelectOption = (option) => {
        const { field, labelField } = pickerConfig;
        const value = option[labelField];

        const newFormData = { ...formData, [field]: value };

        const fieldLower = field.toLowerCase();
        if (fieldLower.includes('cliente')) {
            newFormData['Placa'] = '';
            newFormData['Vehículo'] = '';
        } else if (fieldLower.includes('marca')) {
            // Si cambia la marca, limpiamos el modelo para mantener coherencia
            newFormData['Modelo'] = '';
        } else if (fieldLower.includes('matricula') || fieldLower.includes('vehiculo') || fieldLower.includes('vehículo')) {
            if (fields.includes('Marca')) newFormData['Marca'] = option['Marca'];
            if (fields.includes('Modelo')) newFormData['Modelo'] = option['Modelo'];
            if (field === 'Vehículo') newFormData['Vehículo'] = option['Matricula'] || option['id'];
        }

        setFormData(newFormData);
        setPickerVisible(false);
    };

    const isPickerField = (field) => {
        if (isIdField(field)) return false;

        const f = field.toLowerCase();
        const titleLower = title?.toLowerCase() || '';

        // En el CATALOGO, el campo que define la entidad debe ser texto libre
        if (dataKey === 'catalog') {
            if (titleLower.includes('marca') && f.includes('marca')) return false;
            if (titleLower.includes('modelo') && f.includes('modelo')) return false;
            // Otros campos del catálogo como 'Slug_Modelo' también son texto
            if (f.includes('slug')) return false;
        }

        if ((f === 'placa' || f === 'matricula') && dataKey === 'vehiculos') {
            return false;
        }

        return f.includes('cliente') || f.includes('tecnico') || f.includes('placa') || f.includes('matricula') ||
            f === 'estado' || f.includes('vehiculo') || f.includes('vehículo') ||
            f.includes('marca') || f.includes('modelo');
    };

    const idField = getIdField();

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={styles.container}
        >
            <CustomHeader
                title={isEdit ? `EDITAR ${title}` : `NUEVO ${title}`}
                showBack={true}
                leftAction={() => {
                    // Comparar JSONs para detectar cambios reales de forma profunda
                    const hasChanges = JSON.stringify(formData) !== JSON.stringify(initialData);

                    if (hasChanges) {
                        showAlert(
                            "Salir",
                            "¿Deseas descartar los cambios realizados?",
                            [
                                { text: "No", style: "cancel" },
                                { text: "Sí", onPress: goBackToList }
                            ]
                        );
                    } else {
                        goBackToList();
                    }
                }}
            />
            <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.scroll}>
                {fields.map((field) => {
                    const isId = isIdField(field);
                    const isPicker = isPickerField(field);

                    return (
                        <View key={field} style={styles.inputGroup}>
                            <Text style={styles.label}>{field}</Text>
                            <View style={styles.inputContainer}>
                                {field.toLowerCase() === 'color' && formData[field] && (
                                    <View
                                        style={[
                                            styles.colorPreview,
                                            { backgroundColor: translateColor(formData[field]) }
                                        ]}
                                    />
                                )}
                                {isPicker ? (
                                    <TouchableOpacity
                                        style={[styles.input, isId && styles.idInput, { justifyContent: 'center' }]}
                                        onPress={() => openPicker(field)}
                                    >
                                        <Text style={{ color: formData[field] ? Colors.text : Colors.textSecondary }}>
                                            {formData[field] || `Seleccionar ${field}...`}
                                        </Text>
                                    </TouchableOpacity>
                                ) : isId ? (
                                    <View style={[styles.input, styles.idInput, { justifyContent: 'center' }]}>
                                        <Text style={{ color: Colors.primary, fontWeight: 'bold', fontSize: 16 }}>
                                            {formData[field]?.toString() || ''}
                                        </Text>
                                        <Lock size={16} color={Colors.primary} style={styles.idIcon} />
                                    </View>
                                ) : (
                                    <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }}>
                                        <TextInput
                                            style={[styles.input, { flex: 1 }]}
                                            placeholder={`Ingresa ${field}...`}
                                            placeholderTextColor={Colors.textSecondary}
                                            value={formData[field]?.toString() || ''}
                                            keyboardType={(field.toLowerCase().includes('año') || field.toLowerCase().includes('fabricacion') || field.toLowerCase().includes('hora')) ? 'numeric' : 'default'}
                                            autoCapitalize={(field.toLowerCase() === 'placa' || field.toLowerCase() === 'matricula' || field.toLowerCase().includes('vin')) ? 'characters' : 'sentences'}
                                            onChangeText={(text) => {
                                                let finalValue = text;
                                                const fLower = field.toLowerCase();
                                                if (fLower === 'año' || fLower.includes('fabricacion')) {
                                                    finalValue = formatMonthYear(text);
                                                } else if (fLower.includes('hora')) {
                                                    finalValue = formatTime(text);
                                                } else if (fLower === 'placa' || fLower === 'matricula' || fLower.includes('vin')) {
                                                    finalValue = text.toUpperCase();
                                                }

                                                setFormData({ ...formData, [field]: finalValue });
                                            }}
                                            maxLength={
                                                (field.toLowerCase().includes('año') || field.toLowerCase().includes('fabricacion')) ? 7 :
                                                    field.toLowerCase().includes('hora') ? 5 :
                                                        undefined
                                            }
                                        />
                                        {(field.toLowerCase().includes('año') || field.toLowerCase().includes('fabricacion')) && (
                                            <TouchableOpacity
                                                style={styles.calendarButton}
                                                onPress={() => {
                                                    const current = formData[field]?.split('/') || [];
                                                    if (current.length === 2) {
                                                        setTempMonth(current[0]);
                                                        setTempYear(current[1]);
                                                    }
                                                    setShowYearPicker(true);
                                                }}
                                            >
                                                <Calendar size={24} color={Colors.primary} />
                                            </TouchableOpacity>
                                        )}
                                        {(field.toLowerCase() === 'matricula' || field.toLowerCase().includes('vin')) && (
                                            <TouchableOpacity
                                                style={styles.calendarButton}
                                                onPress={() => {
                                                    showAlert("Escáner", `Iniciando escáner para ${field}... (Simulado)`);
                                                    // Aquí iría la lógica de OCR real
                                                }}
                                            >
                                                <Camera size={24} color={Colors.primary} />
                                            </TouchableOpacity>
                                        )}
                                        {field === 'Nombre' && dataKey === 'clients' && (
                                            <TouchableOpacity
                                                style={styles.calendarButton}
                                                onPress={importFromContacts}
                                            >
                                                <SearchIcon size={24} color={Colors.primary} />
                                            </TouchableOpacity>
                                        )}
                                        {(field.toLowerCase().includes('lugar') || field.toLowerCase().includes('partida')) && dataKey === 'rescates' && (
                                            <TouchableOpacity
                                                style={styles.calendarButton}
                                                onPress={() => openMapForField(field)}
                                            >
                                                <MapPin size={24} color={Colors.primary} />
                                            </TouchableOpacity>
                                        )}
                                    </View>
                                )}
                                {isPicker && (
                                    <View style={styles.idIcon}>
                                        <X size={16} color={Colors.textSecondary} />
                                    </View>
                                )}
                            </View>
                        </View>
                    );
                })}

                {/* Resumen de Reputación del Cliente (si se ha seleccionado uno) */}
                {(formData.Cliente || formData.Nombre) && (dataKey === 'orders' || dataKey === 'invoices') && (
                    <View style={styles.reputationCard}>
                        {(() => {
                            const clientName = formData.Cliente || formData.Nombre;
                            const rep = allData.getClientReputation(clientName);
                            return (
                                <>
                                    <View style={styles.reputationHeader}>
                                        <Text style={styles.reputationTitle}>Historial del Cliente: {clientName}</Text>
                                        <View style={styles.starsRow}>
                                            {[1, 2, 3, 4, 5].map(s => (
                                                <Star
                                                    key={s}
                                                    size={14}
                                                    color={s <= rep.estrellas ? "#FFD700" : Colors.textSecondary + '40'}
                                                    fill={s <= rep.estrellas ? "#FFD700" : "transparent"}
                                                />
                                            ))}
                                        </View>
                                    </View>

                                    <View style={styles.reputationStats}>
                                        <View style={styles.repStatItem}>
                                            <Text style={styles.repStatLabel}>Puntos</Text>
                                            <Text style={styles.repStatValue}>{rep.puntos}</Text>
                                        </View>
                                        <View style={styles.repStatItem}>
                                            <Text style={styles.repStatLabel}>Propinas</Text>
                                            <Text style={[styles.repStatValue, { color: '#32CD32' }]}>${rep.totalPropinas}</Text>
                                        </View>
                                        <View style={styles.repStatItem}>
                                            <Text style={styles.repStatLabel}>Regateos</Text>
                                            <Text style={[styles.repStatValue, { color: '#FF6347' }]}>${rep.totalRegateos}</Text>
                                        </View>
                                    </View>

                                    {rep.frecuenciaRegateo > 0 && (
                                        <View style={styles.hagglingWarning}>
                                            <AlertTriangle size={18} color="#FF6347" />
                                            <View style={{ marginLeft: 10 }}>
                                                <Text style={styles.warningTitle}>ALERTA DE REGATEO</Text>
                                                <Text style={styles.warningDesc}>Este cliente suele pedir descuentos con frecuencia.</Text>
                                            </View>
                                        </View>
                                    )}

                                    {rep.estrellas === 5 && (
                                        <View style={[styles.hagglingWarning, { backgroundColor: '#FFD70015', borderColor: '#FFD70040' }]}>
                                            <Star size={18} color="#FFD700" fill="#FFD700" />
                                            <View style={{ marginLeft: 10 }}>
                                                <Text style={[styles.warningTitle, { color: '#DAA520' }]}>CLIENTE VIP</Text>
                                                <Text style={[styles.warningDesc, { color: '#DAA520' }]}>Este cliente tiene un excelente historial de pagos.</Text>
                                            </View>
                                        </View>
                                    )}
                                </>
                            );
                        })()}
                    </View>
                )}

                <View style={styles.actions}>
                    {isEdit && (
                        <TouchableOpacity style={[styles.button, styles.delete]} onPress={handleDelete}>
                            <Trash2 size={20} color="#FFF" />
                            <Text style={styles.buttonText}>ELIMINAR</Text>
                        </TouchableOpacity>
                    )}
                    <TouchableOpacity
                        style={[styles.button, styles.cancel]}
                        onPress={goBackToList}
                    >
                        <X size={20} color={Colors.text} />
                        <Text style={styles.buttonText}>CANCELAR</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.button, styles.save]} onPress={() => handleSave()}>
                        <Save size={20} color="#FFF" />
                        <Text style={styles.buttonText}>GUARDAR</Text>
                    </TouchableOpacity>
                    {dataKey === 'catalog' && fields?.some(f => f.toLowerCase() === 'marca') && !fields?.some(f => f.toLowerCase() === 'modelo') && !isEdit && (
                        <TouchableOpacity
                            style={[styles.button, { backgroundColor: Colors.primary, flex: 1.5 }]}
                            onPress={() => handleSave(true)}
                        >
                            <Plus size={20} color="#FFF" />
                            <Text style={styles.buttonText}>GUARDAR Y AÑADIR MODELO</Text>
                        </TouchableOpacity>
                    )}
                </View>
            </ScrollView>

            {/* Modal de confirmación de eliminación */}
            <Modal
                visible={showDeleteModal}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setShowDeleteModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>¿Confirmar eliminación?</Text>
                        <Text style={styles.modalMessage}>
                            ¿Estás seguro de que deseas eliminar este registro? Esta acción no se puede deshacer.
                        </Text>
                        <View style={styles.modalActions}>
                            <TouchableOpacity
                                style={[styles.modalButton, styles.modalCancel]}
                                onPress={() => setShowDeleteModal(false)}
                            >
                                <Text style={styles.modalButtonText}>CANCELAR</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.modalButton, styles.modalDelete]}
                                onPress={confirmDelete}
                            >
                                <Text style={styles.modalButtonText}>ELIMINAR</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Modal de Selección (Picker) */}
            <Modal
                visible={pickerVisible}
                transparent={true}
                animationType="slide"
                onRequestClose={() => setPickerVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { maxHeight: '70%' }]}>
                        <View style={styles.pickerHeader}>
                            <Text style={styles.modalTitle}>SELECCIONAR {pickerConfig?.field.toUpperCase()}</Text>
                            <TouchableOpacity onPress={() => setPickerVisible(false)}>
                                <X size={24} color={Colors.text} />
                            </TouchableOpacity>
                        </View>

                        <TextInput
                            style={styles.pickerSearchInput}
                            placeholder="Buscar..."
                            placeholderTextColor={Colors.textSecondary}
                            value={pickerSearchQuery}
                            onChangeText={setPickerSearchQuery}
                            autoFocus={false}
                        />

                        <ScrollView style={{ marginTop: 10 }}>
                            {pickerConfig?.data
                                .filter(opt => {
                                    if (!pickerSearchQuery) return true;
                                    const val = opt[pickerConfig.labelField]?.toString().toLowerCase() || '';
                                    return val.includes(pickerSearchQuery.toLowerCase());
                                })
                                .map((opt, idx) => (
                                    <TouchableOpacity
                                        key={idx}
                                        style={styles.pickerOption}
                                        onPress={() => {
                                            handleSelectOption(opt);
                                            setPickerSearchQuery('');
                                        }}
                                    >
                                        <Text style={styles.pickerOptionText}>{opt[pickerConfig.labelField]}</Text>
                                        {opt.Modelo && <Text style={styles.pickerOptionSubtext}>{opt.Marca} {opt.Modelo}</Text>}
                                    </TouchableOpacity>
                                ))}

                            {/* Opciones de crear nuevo al final de la lista */}
                            {(pickerConfig?.field.toLowerCase().includes('cliente')) && (
                                <TouchableOpacity
                                    style={[styles.pickerOption, { borderBottomWidth: 0, marginTop: 10, backgroundColor: Colors.primary + '20' }]}
                                    onPress={() => {
                                        setPickerVisible(false);
                                        navigation.push('Form', {
                                            title: 'Cliente',
                                            dataKey: 'clients',
                                            fields: ['DNI', 'Nombre', 'Telefono', 'Direccion', 'Notas', 'Vehículo']
                                        });
                                    }}
                                >
                                    <Text style={[styles.pickerOptionText, { color: Colors.primary, fontWeight: 'bold' }]}>+ AÑADIR NUEVO CLIENTE</Text>
                                    <Text style={styles.pickerOptionSubtext}>Si el cliente no está registrado</Text>
                                </TouchableOpacity>
                            )}

                            {(pickerConfig?.field.toLowerCase().includes('tecnico')) && (
                                <TouchableOpacity
                                    style={[styles.pickerOption, { borderBottomWidth: 0, marginTop: 10, backgroundColor: Colors.primary + '20' }]}
                                    onPress={() => {
                                        setPickerVisible(false);
                                        navigation.push('Form', {
                                            title: 'Técnico',
                                            dataKey: 'tecnicos',
                                            fields: ['ID_tecnico', 'Nombre', 'Especialidad', 'Telefono', 'Estado']
                                        });
                                    }}
                                >
                                    <Text style={[styles.pickerOptionText, { color: Colors.primary, fontWeight: 'bold' }]}>+ AÑADIR NUEVO TÉCNICO</Text>
                                    <Text style={styles.pickerOptionSubtext}>Registrar un nuevo mecánico</Text>
                                </TouchableOpacity>
                            )}

                            {(pickerConfig?.field.toLowerCase().includes('marca')) && (
                                <TouchableOpacity
                                    style={[styles.pickerOption, { borderBottomWidth: 0, marginTop: 10, backgroundColor: Colors.primary + '20' }]}
                                    onPress={() => {
                                        setPickerVisible(false);
                                        navigation.push('Form', {
                                            title: 'Marca',
                                            dataKey: 'catalog',
                                            fields: ['Marca', 'ID_Marca']
                                        });
                                    }}
                                >
                                    <Text style={[styles.pickerOptionText, { color: Colors.primary, fontWeight: 'bold' }]}>+ AÑADIR NUEVA MARCA</Text>
                                    <Text style={styles.pickerOptionSubtext}>Si la marca no está en el catálogo</Text>
                                </TouchableOpacity>
                            )}

                            {(pickerConfig?.field.toLowerCase().includes('modelo')) && (
                                <TouchableOpacity
                                    style={[styles.pickerOption, { borderBottomWidth: 0, marginTop: 10, backgroundColor: Colors.primary + '20' }]}
                                    onPress={() => {
                                        setPickerVisible(false);
                                        const brandVal = formData.Marca || formData.ID_Marca;
                                        navigation.push('Form', {
                                            title: 'Modelo',
                                            dataKey: 'catalog',
                                            prefill: brandVal ? { Marca: brandVal } : {},
                                            fields: ['ID_Marca', 'ID_Modelo', 'Marca', 'Modelo', 'Slug_Modelo']
                                        });
                                    }}
                                >
                                    <Text style={[styles.pickerOptionText, { color: Colors.primary, fontWeight: 'bold' }]}>+ AÑADIR NUEVO MODELO</Text>
                                    <Text style={styles.pickerOptionSubtext}>Si el modelo no está en el catálogo</Text>
                                </TouchableOpacity>
                            )}

                            {(pickerConfig?.field.toLowerCase().includes('matricula') || pickerConfig?.field.toLowerCase().includes('vehiculo') || pickerConfig?.field.toLowerCase().includes('vehículo')) && (
                                <TouchableOpacity
                                    style={[styles.pickerOption, { borderBottomWidth: 0, marginTop: 10, backgroundColor: Colors.primary + '20' }]}
                                    onPress={() => {
                                        setPickerVisible(false);
                                        // Obtener el cliente actual para pre-vincular el vehículo
                                        const currentClient = formData.Nombre || formData.Cliente;
                                        const currentClientIdField = fields.find(f => f.toLowerCase().includes('id_cliente'));
                                        const currentClientId = currentClientIdField ? formData[currentClientIdField] : null;

                                        navigation.push('Form', {
                                            title: 'Vehículo',
                                            dataKey: 'vehiculos',
                                            fields: ['Matricula', 'Marca', 'Modelo', 'Año de Fabricacion', 'Color', 'Codigo VIN', 'Notas'],
                                            prefill: {
                                                'Cliente(REF)': currentClient,
                                                'Cliente': currentClient,
                                                ID_Cliente: currentClientId
                                            }
                                        });
                                    }}
                                >
                                    <Text style={[styles.pickerOptionText, { color: Colors.primary, fontWeight: 'bold' }]}>+ AÑADIR NUEVO VEHÍCULO</Text>
                                    <Text style={styles.pickerOptionSubtext}>Si el vehículo no está en la lista</Text>
                                </TouchableOpacity>
                            )}
                        </ScrollView>
                    </View>
                </View>
            </Modal>

            {/* Modal Selector de Mes/Año (Calendario) */}
            <Modal
                visible={showYearPicker}
                transparent={true}
                animationType="slide"
                onRequestClose={() => setShowYearPicker(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Seleccionar Fecha</Text>

                        <View style={styles.pickerRow}>
                            <View style={{ flex: 1, marginRight: 5 }}>
                                <Text style={styles.pickerSubLabel}>Mes</Text>
                                <ScrollView style={{ maxHeight: 200 }}>
                                    {['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'].map(m => (
                                        <TouchableOpacity
                                            key={m}
                                            style={[styles.pickerItem, tempMonth === m && styles.selectedItem]}
                                            onPress={() => setTempMonth(m)}
                                        >
                                            <Text style={[styles.pickerItemText, tempMonth === m && styles.selectedItemText]}>{m}</Text>
                                        </TouchableOpacity>
                                    ))}
                                </ScrollView>
                            </View>

                            <View style={{ flex: 1, marginLeft: 5 }}>
                                <Text style={styles.pickerSubLabel}>Año</Text>
                                <ScrollView style={{ maxHeight: 200 }}>
                                    {Array.from({ length: 50 }, (_, i) => (new Date().getFullYear() - i).toString()).map(y => (
                                        <TouchableOpacity
                                            key={y}
                                            style={[styles.pickerItem, tempYear === y && styles.selectedItem]}
                                            onPress={() => setTempYear(y)}
                                        >
                                            <Text style={[styles.pickerItemText, tempYear === y && styles.selectedItemText]}>{y}</Text>
                                        </TouchableOpacity>
                                    ))}
                                </ScrollView>
                            </View>
                        </View>

                        <View style={[styles.modalActions, { marginTop: 20 }]}>
                            <TouchableOpacity
                                style={[styles.modalButton, styles.modalCancel]}
                                onPress={() => setShowYearPicker(false)}
                            >
                                <Text style={styles.modalButtonText}>CANCELAR</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.modalButton, { backgroundColor: Colors.primary }]}
                                onPress={() => {
                                    const fieldToUpdate = fields.find(f => f.toLowerCase().includes('año') || f.toLowerCase().includes('fabricacion'));
                                    if (fieldToUpdate) {
                                        setFormData({ ...formData, [fieldToUpdate]: `${tempMonth}/${tempYear}` });
                                    }
                                    setShowYearPicker(false);
                                }}
                            >
                                <Text style={styles.modalButtonText}>ACEPTAR</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Overlay de Sincronización (Loading) */}
            <Modal transparent={true} visible={syncing || isDeleting}>
                <View style={styles.syncOverlay}>
                    <View style={styles.syncCard}>
                        <ActivityIndicator size="large" color={Colors.primary} />
                        <Text style={styles.syncText}>Sincronizando con la nube...</Text>
                    </View>
                </View>
            </Modal>

            {/* Modal Interactivos de Mapa */}
            <Modal visible={mapModalVisible} animationType="slide" transparent={true}>
                <View style={[styles.modalOverlay, { padding: 0, justifyContent: 'flex-end' }]}>
                    <View style={[styles.modalContent, { height: '90%', padding: 0, borderRadius: 0, borderTopLeftRadius: 16, borderTopRightRadius: 16, zIndex: 1 }]}>
                        {/* Header con Buscador Style Uber */}
                        <View style={{ padding: 16, backgroundColor: Colors.card, borderBottomWidth: 1, borderBottomColor: Colors.border, borderTopLeftRadius: 16, borderTopRightRadius: 16, zIndex: 5000, elevation: 5 }}>
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 }}>
                                <Text style={styles.modalTitle}>¿A dónde vamos?</Text>
                                <TouchableOpacity onPress={() => setMapModalVisible(false)} style={{ padding: 5 }}>
                                    <X size={24} color={Colors.textSecondary} />
                                </TouchableOpacity>
                            </View>

                            <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.background, borderRadius: 8, paddingHorizontal: 10, borderWidth: 1, borderColor: Colors.border }}>
                                <SearchIcon size={20} color={Colors.textSecondary} />
                                <TextInput
                                    style={{ flex: 1, height: 45, color: Colors.text, paddingHorizontal: 10, fontSize: 15 }}
                                    placeholder="Buscar dirección (ej: Calle El Conde)..."
                                    placeholderTextColor={Colors.textSecondary}
                                    value={mapSearchQuery}
                                    onChangeText={setMapSearchQuery}
                                    onSubmitEditing={handleSearchAddress}
                                    returnKeyType="search"
                                />
                                {mapSearching ? (
                                    <ActivityIndicator size="small" color={Colors.primary} />
                                ) : (
                                    <TouchableOpacity onPress={handleSearchAddress}>
                                        <Plus size={20} color={Colors.primary} />
                                    </TouchableOpacity>
                                )}
                            </View>

                            {/* Lista de Sugerencias */}
                            {mapSuggestions.length > 0 && (
                                <View style={{
                                    position: 'absolute',
                                    top: 110,
                                    left: 16,
                                    right: 16,
                                    backgroundColor: Colors.card,
                                    borderRadius: 12,
                                    zIndex: 2000,
                                    elevation: 10,
                                    borderWidth: 1,
                                    borderColor: Colors.border,
                                    shadowColor: "#000",
                                    shadowOffset: { width: 0, height: 4 },
                                    shadowOpacity: 0.3,
                                    shadowRadius: 5
                                }}>
                                    <View style={{ padding: 10, borderBottomWidth: 1, borderBottomColor: Colors.border }}>
                                        <Text style={{ color: Colors.textSecondary, fontSize: 11, fontWeight: 'bold', textTransform: 'uppercase' }}>Sugerencias encontradas</Text>
                                    </View>
                                    {mapSuggestions.slice(0, 6).map((item, index) => (
                                        <TouchableOpacity
                                            key={index}
                                            style={{
                                                flexDirection: 'row',
                                                alignItems: 'center',
                                                padding: 14,
                                                borderBottomWidth: index === 5 ? 0 : 1,
                                                borderBottomColor: Colors.border
                                            }}
                                            onPress={() => handleSelectSuggestion(item)}
                                        >
                                            <MapPin size={18} color={Colors.primary} style={{ marginRight: 12 }} />
                                            <View style={{ flex: 1 }}>
                                                <Text numberOfLines={1} style={{ color: Colors.text, fontSize: 14, fontWeight: '500' }}>
                                                    {item.display_name.split(',')[0]}
                                                </Text>
                                                <Text numberOfLines={1} style={{ color: Colors.textSecondary, fontSize: 12 }}>
                                                    {item.display_name.split(',').slice(1).join(',').trim()}
                                                </Text>
                                            </View>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            )}
                        </View>

                        <View style={{ flex: 1, backgroundColor: '#CCC', zIndex: -1 }}>
                            {Platform.OS === 'web' ? memoizedWebMap : null}
                            {Platform.OS !== 'web' && mapCoords && MapView && (
                                <View style={{ flex: 1 }}>
                                    <MapView
                                        style={{ flex: 1 }}
                                        userInterfaceStyle="dark"
                                        initialRegion={{
                                            latitude: mapCoords.latitude,
                                            longitude: mapCoords.longitude,
                                            latitudeDelta: 0.005,
                                            longitudeDelta: 0.005,
                                        }}
                                        onRegionChangeComplete={(region) => {
                                            const newC = { latitude: region.latitude, longitude: region.longitude };
                                            // Solo actualizar si la diferencia es significante para evitar bucles
                                            const diffLat = Math.abs(newC.latitude - mapCoords.latitude);
                                            const diffLng = Math.abs(newC.longitude - mapCoords.longitude);
                                            if (diffLat > 0.00001 || diffLng > 0.00001) {
                                                setMapCoords(newC);
                                                reverseGeocode(newC);
                                            }
                                        }}
                                    />
                                    <View style={[StyleSheet.absoluteFill, { justifyContent: 'center', alignItems: 'center' }]} pointerEvents="none">
                                        <MapPin size={48} color="#E53935" fill="#E53935" style={{ marginBottom: 48 }} />
                                    </View>
                                </View>
                            )}
                        </View>
                        <View style={{ padding: 16, backgroundColor: Colors.card, borderTopColor: Colors.border, borderTopWidth: 1 }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 15, backgroundColor: Colors.background, padding: 12, borderRadius: 10 }}>
                                <View style={{ backgroundColor: Colors.primary + '20', padding: 8, borderRadius: 20, marginRight: 12 }}>
                                    <MapPin size={24} color={Colors.primary} />
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={{ color: Colors.textSecondary, fontSize: 11, fontWeight: 'bold', textTransform: 'uppercase', marginBottom: 2 }}>Ubicación Seleccionada</Text>
                                    <Text numberOfLines={2} style={{ color: Colors.text, fontSize: 15, fontWeight: 'bold' }}>
                                        {mapAddress || 'Buscando dirección...'}
                                    </Text>
                                </View>
                            </View>

                            <TouchableOpacity style={[styles.primaryButton, { height: 55 }]} onPress={confirmMapPick}>
                                <Text style={styles.primaryButtonText}>Confirmar Punto de Rescate</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background },
    scroll: { padding: 20, paddingBottom: 100 },
    inputGroup: { marginBottom: 20 },
    label: { color: Colors.text, fontSize: 14, fontWeight: 'bold', marginBottom: 8, textTransform: 'uppercase' },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    input: {
        flex: 1,
        backgroundColor: Colors.card,
        borderWidth: 1,
        borderColor: Colors.border,
        borderRadius: 8,
        color: Colors.text,
        padding: 12,
        fontSize: 16,
    },
    idInput: {
        backgroundColor: '#2A2A2A',
        borderColor: Colors.primary,
        fontWeight: 'bold',
        color: Colors.primary,
    },
    idIcon: {
        position: 'absolute',
        right: 12,
    },
    reputationCard: {
        backgroundColor: Colors.card,
        marginHorizontal: 16,
        marginTop: 8,
        marginBottom: 24,
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    reputationHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    reputationTitle: {
        color: Colors.text,
        fontSize: 14,
        fontWeight: 'bold',
    },
    starsRow: {
        flexDirection: 'row',
    },
    reputationStats: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        backgroundColor: Colors.background,
        padding: 12,
        borderRadius: 8,
    },
    repStatItem: {
        alignItems: 'center',
        flex: 1,
    },
    repStatLabel: {
        color: Colors.textSecondary,
        fontSize: 10,
        textTransform: 'uppercase',
    },
    repStatValue: {
        color: Colors.text,
        fontSize: 15,
        fontWeight: 'bold',
        marginTop: 4,
    },
    hagglingWarning: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FF634710',
        padding: 12,
        borderRadius: 8,
        marginTop: 12,
        borderWidth: 1,
        borderColor: '#FF634730',
    },
    warningTitle: {
        color: '#FF6347',
        fontSize: 12,
        fontWeight: 'bold',
    },
    warningDesc: {
        color: '#FF6347',
        fontSize: 11,
        opacity: 0.8,
    },
    actions: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 20, flexWrap: 'wrap' },
    button: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 15,
        borderRadius: 8,
        flex: 1,
        marginHorizontal: 4,
        marginBottom: 8,
    },
    cancel: { backgroundColor: '#444' },
    save: { backgroundColor: Colors.primary },
    delete: { backgroundColor: Colors.accent },
    buttonText: { color: '#FFF', fontWeight: 'bold', marginLeft: 8 },

    // Estilos del modal
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        backgroundColor: Colors.card,
        borderRadius: 12,
        padding: 20,
        width: '85%',
        borderWidth: 1,
        borderColor: Colors.border,
    },
    modalTitle: {
        color: Colors.text,
        fontSize: 20,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 15,
    },
    modalMessage: {
        color: Colors.textSecondary,
        fontSize: 16,
        textAlign: 'center',
        marginBottom: 20,
        lineHeight: 22,
    },
    modalActions: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    modalButton: {
        flex: 1,
        padding: 12,
        borderRadius: 8,
        alignItems: 'center',
        marginHorizontal: 5,
    },
    modalCancel: {
        backgroundColor: '#444',
    },
    modalDelete: {
        backgroundColor: Colors.accent,
    },
    modalButtonText: {
        color: '#FFF',
        fontWeight: 'bold',
        fontSize: 14,
    },
    pickerHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
    pickerOption: { paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: Colors.border },
    pickerOptionText: { color: Colors.text, fontSize: 16, fontWeight: '500' },
    pickerOptionSubtext: { color: Colors.textSecondary, fontSize: 12, marginTop: 2 },
    addOptionBtn: { backgroundColor: Colors.primary, padding: 12, borderRadius: 8, marginTop: 15, alignItems: 'center' },
    addOptionText: { color: '#FFF', fontWeight: 'bold' },
    pickerSearchInput: {
        backgroundColor: Colors.background,
        borderWidth: 1,
        borderColor: Colors.border,
        borderRadius: 8,
        color: Colors.text,
        padding: 10,
        marginBottom: 10,
        fontSize: 14,
    },
    colorPreview: {
        width: 30,
        height: 30,
        borderRadius: 6,
        marginRight: 10,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    calendarButton: {
        padding: 10,
        marginLeft: 8,
        backgroundColor: Colors.card,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: Colors.border,
        justifyContent: 'center',
        alignItems: 'center',
    },
    pickerRow: { flexDirection: 'row', justifyContent: 'space-between' },
    pickerSubLabel: { color: Colors.textSecondary, fontSize: 12, marginBottom: 5, textAlign: 'center' },
    pickerItem: { padding: 10, alignItems: 'center', borderRadius: 6, marginBottom: 2 },
    selectedItem: { backgroundColor: Colors.primary + '30' },
    pickerItemText: { color: Colors.text, fontSize: 16 },
    selectedItemText: { color: Colors.primary, fontWeight: 'bold' },
    syncOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.8)',
        justifyContent: 'center',
        alignItems: 'center'
    },
    syncCard: {
        backgroundColor: Colors.card,
        padding: 30,
        borderRadius: 16,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: Colors.border,
        elevation: 5
    },
    syncText: {
        color: Colors.text,
        marginTop: 15,
        fontSize: 16,
        fontWeight: 'bold'
    }
});
