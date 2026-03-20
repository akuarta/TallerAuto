import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Platform, ActivityIndicator, TouchableOpacity, Alert } from 'react-native';
import { Colors } from '../constants';
import { CustomHeader } from '../components/CustomHeader';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Location from 'expo-location';
import { MapPin, Clock, Route, RefreshCw } from 'lucide-react-native';
import { FAB } from '../components/FAB';
import { useData } from '../context/DataContext';

import { MapView, Marker, Polyline } from '../components/MapComponents';

const GOOGLE_MAPS_API_KEY = "AIzaSyBhMnl-cxCpsL97ukncJA-MTJugjBrkpug";

export default function RescueScreen({ route, navigation }) {
    const insets = useSafeAreaInsets();
    const rescue = route?.params?.rescue || {};
    const { rescates, refreshData, loading: dataLoading, updateItem, settings } = useData();
    const [location, setLocation] = useState(null);
    const [errorMsg, setErrorMsg] = useState(null);
    const [loading, setLoading] = useState(false);
    const [destPos, setDestPos] = useState(null);
    
    const [rescueInfo, setRescueInfo] = useState({
        hora: rescue.Hora || new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
        estado: rescue.Estado || 'En camino (Tiempo est: 15 min)',
        cliente: rescue.Cliente || 'Cliente',
        lugar: rescue['Lugar del Rescate'] || 'No especificado',
        partida: rescue['Punto de Partida'] || 'Taller'
    });

    // Obtener la versión más fresca del rescate desde el contexto
    const currentRescue = (rescates || []).find(r => String(r.id) === String(rescue?.id)) || rescue;

    useEffect(() => {
        if (currentRescue && currentRescue.id) {
            setRescueInfo({
                hora: currentRescue.Hora || '',
                estado: currentRescue.Estado || 'Pendiente',
                cliente: currentRescue.Cliente || 'Cliente',
                lugar: currentRescue['Lugar del Rescate'] || 'No especificado',
                partida: currentRescue['Punto de Partida'] || 'Taller'
            });
        }
    }, [currentRescue]);

    const handleUpdateStatus = (newStatus) => {
        const targetId = currentRescue?.id || rescue?.id;
        if (!targetId) {
            Alert.alert("Error", "No se puede actualizar un rescate que no ha sido guardado.");
            return;
        }
        updateItem('rescates', targetId, { Estado: newStatus });
    };

    const confirmCancel = () => {
        Alert.alert(
            "Cancelar Rescate",
            "¿Estás seguro de que deseas cancelar este rescate?",
            [
                { text: "No", style: "cancel" },
                { text: "Sí, Cancelar", onPress: () => handleUpdateStatus('Cancelado'), style: 'destructive' }
            ]
        );
    };

    const parseCoords = (str) => {
        if (!str || typeof str !== 'string') return null;
        const match = str.match(/\(([^,]+),\s*([^)]+)\)/);
        if (match) {
            return {
                latitude: parseFloat(match[1]),
                longitude: parseFloat(match[2])
            };
        }
        // Fallback si es solo coordenadas planas
        const parts = str.split(',');
        if (parts.length >= 2) {
            const lat = parseFloat(parts[0]);
            const lng = parseFloat(parts[1]);
            if (!isNaN(lat) && !isNaN(lng)) return { latitude: lat, longitude: lng };
        }
        return null;
    };

    const originCoords = parseCoords(rescue['Punto de Partida']) || { latitude: settings?.tallerLat || 18.5126, longitude: settings?.tallerLng || -69.8943 }; // Default Taller
    const initialDest = parseCoords(rescue['Lugar del Rescate']);
    const destCoords = initialDest || destPos;

    useEffect(() => {
        const fetchMissingCoords = async () => {
            if (!initialDest && rescueInfo.lugar && rescueInfo.lugar !== 'No especificado') {
                try {
                    setLoading(true);
                    console.log("EXPO LOCATION REQ (GeocodeAsync):", rescueInfo.lugar + ", Santo Domingo");
                    const results = await Location.geocodeAsync(rescueInfo.lugar + ", Santo Domingo");
                    console.log("EXPO LOCATION RES (GeocodeAsync):", results);
                    if (results && results.length > 0) {
                        setDestPos({
                            latitude: results[0].latitude,
                            longitude: results[0].longitude
                        });
                    } else {
                        // Fallback Nominatim si Google/Native falla
                        console.log("EXPO Geocode empty. Intentando Fallback Nominatim (OSM)...");
                        const nomUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(rescueInfo.lugar + ", Santo Domingo")}&limit=1`;
                        const nomRes = await fetch(nomUrl, { headers: { 'User-Agent': 'TallerApp/1.0' } });
                        const nomData = await nomRes.json();
                        console.log("NOMINATIM RES (Fallback):", nomData);
                        if (nomData && nomData.length > 0) {
                            setDestPos({
                                latitude: parseFloat(nomData[0].lat),
                                longitude: parseFloat(nomData[0].lon)
                            });
                        }
                    }
                } catch (e) {
                    console.log("Error geocodificando destino manual:", e);
                } finally {
                    setLoading(false);
                }
            }
        };
        fetchMissingCoords();
    }, [rescueInfo.lugar, initialDest]);

    const requestLocation = async () => {
        setLoading(true);
        try {
            let { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                setErrorMsg('El permiso de ubicación fue denegado.');
                if (Platform.OS !== 'web') {
                    Alert.alert("Permiso Denegado", "Se requiere permiso de ubicación para usar el mapa de rescate.");
                }
                setLoading(false);
                return;
            }

            let loc = await Location.getCurrentPositionAsync({});
            setLocation(loc);
            setErrorMsg(null);
        } catch (error) {
            setErrorMsg('Hubo un error obteniendo la ubicación.');
            console.error(error);
        }
        setLoading(false);
    };

    useEffect(() => {
        requestLocation();
    }, []);

    const handleRefresh = async () => {
        setLoading(true);
        try {
            await refreshData();
            setRescueInfo(prev => ({
                ...prev,
                hora: new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
            }));
            await requestLocation();
        } catch (err) {
            console.error("Error refreshing rescue data:", err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <CustomHeader 
                title="Detalle de Rescate" 
                leftIcon={rescue.id ? "arrow-left" : "menu"} 
                onLeftPress={() => (currentRescue?.id || rescue?.id) ? navigation.goBack() : navigation.toggleDrawer()} 
            />

            <ScrollView contentContainerStyle={styles.scrollContent}>
                
                {/* Information Cards */}
                <View style={styles.card}>
                    <View style={styles.cardHeader}>
                        <View>
                            <Text style={styles.cardTitle}>Servicio de Rescate</Text>
                            <Text style={{ color: Colors.primary, fontWeight: 'bold', fontSize: 13 }}>ID: {currentRescue.id || rescue.id || 'NUEVO'}</Text>
                        </View>
                        <TouchableOpacity onPress={handleRefresh} style={styles.refreshButton}>
                            <RefreshCw color={Colors.primary} size={20} />
                        </TouchableOpacity>
                    </View>

                    <View style={styles.infoRow}>
                        <View style={styles.iconContainer}>
                            <MapPin color={Colors.text} size={20} />
                        </View>
                        <View style={styles.infoTexts}>
                            <Text style={styles.infoLabel}>Cliente / Vehículo</Text>
                            <Text style={styles.infoValue}>{rescueInfo.cliente}</Text>
                            {!!currentRescue?.Matricula && <Text style={{ color: Colors.textSecondary, fontSize: 13 }}>{currentRescue.Matricula}</Text>}
                        </View>
                    </View>

                    <View style={styles.infoRow}>
                        <View style={styles.iconContainer}>
                            <Clock color={Colors.text} size={20} />
                        </View>
                        <View style={styles.infoTexts}>
                            <Text style={styles.infoLabel}>Hora de Solicitud</Text>
                            <Text style={styles.infoValue}>{rescueInfo.hora}</Text>
                        </View>
                    </View>

                    <View style={styles.infoRow}>
                        <View style={styles.iconContainer}>
                            <Route color={Colors.text} size={20} />
                        </View>
                        <View style={styles.infoTexts}>
                            <Text style={styles.infoLabel}>Trayectoria / Estado</Text>
                            <Text style={styles.infoValue}>{rescueInfo.estado}</Text>
                        </View>
                    </View>
                    
                    <View style={styles.infoRow}>
                        <View style={styles.iconContainer}>
                            <MapPin color={Colors.text} size={20} />
                        </View>
                        <View style={styles.infoTexts}>
                            <Text style={styles.infoLabel}>Lugar del Rescate</Text>
                            <Text style={styles.infoValue}>{rescueInfo.lugar}</Text>
                            {loading ? (
                                <ActivityIndicator size="small" color={Colors.primary} style={{ alignSelf: 'flex-start', marginTop: 5 }} />
                            ) : errorMsg ? (
                                <Text style={styles.errorText}>{errorMsg}</Text>
                            ) : location ? (
                                <Text style={{ color: Colors.textSecondary, fontSize: 11, marginTop: 4 }}>Mi posición: {location.coords.latitude.toFixed(4)}, {location.coords.longitude.toFixed(4)}</Text>
                            ) : null}
                        </View>
                    </View>
                </View>

                {/* Map Section */}
                <View style={styles.mapContainer}>
                    {destCoords ? (
                        Platform.OS === 'web' ? (
                            <iframe
                                width="100%"
                                height="100%"
                                style={{ border: 0 }}
                                loading="lazy"
                                allowFullScreen
                                src={`https://www.google.com/maps/embed/v1/directions?key=${GOOGLE_MAPS_API_KEY}&origin=${originCoords.latitude},${originCoords.longitude}&destination=${destCoords.latitude},${destCoords.longitude}&mode=driving`}
                            />
                        ) : (
                            <MapView
                                style={styles.map}
                                initialRegion={{
                                    latitude: (originCoords.latitude + destCoords.latitude) / 2,
                                    longitude: (originCoords.longitude + destCoords.longitude) / 2,
                                    latitudeDelta: Math.abs(originCoords.latitude - destCoords.latitude) * 1.5 || 0.05,
                                    longitudeDelta: Math.abs(originCoords.longitude - destCoords.longitude) * 1.5 || 0.05,
                                }}
                                userInterfaceStyle="dark"
                            >
                                <Marker
                                    coordinate={originCoords}
                                    title="Punto de Partida"
                                    pinColor="blue"
                                />
                                <Marker
                                    coordinate={destCoords}
                                    title="Ubicación Rescate"
                                    pinColor="red"
                                />
                                <Polyline
                                    coordinates={[originCoords, destCoords]}
                                    strokeColor={Colors.primary}
                                    strokeWidth={4}
                                />
                            </MapView>
                        )
                    ) : (
                        <View style={styles.webMapPlaceholder}>
                            {loading ? (
                                <View style={{ alignItems: 'center' }}>
                                    <ActivityIndicator size="large" color={Colors.primary} />
                                    <Text style={[styles.webMapText, { marginTop: 15, fontWeight: 'bold' }]}>
                                        Calculando trayectoria...
                                    </Text>
                                    <Text style={styles.webMapSubtext}>
                                        Estamos geocodificando la dirección del cliente
                                    </Text>
                                </View>
                            ) : (
                                <View style={{ alignItems: 'center', padding: 20 }}>
                                    <MapPin color={Colors.border} size={64} style={{ marginBottom: 15 }} />
                                    <Text style={[styles.webMapText, { fontWeight: 'bold' }]}>Ruta No Disponible</Text>
                                    <Text style={styles.webMapSubtext}>
                                        La dirección no tiene coordenadas GPS válidas. Prueba a editar el rescate y usar el selector de mapa.
                                    </Text>
                                </View>
                            )}
                        </View>
                    )}
                </View>

                {/* Gestión de Estado */}
                <View style={styles.actionSection}>
                    <Text style={styles.sectionLabel}>GESTIÓN DE ESTADO</Text>
                    
                    {rescueInfo.estado.toLowerCase().includes('finalizado') || rescueInfo.estado.toLowerCase().includes('cancelado') ? (
                        <View style={[
                            styles.statusMessage, 
                            rescueInfo.estado.toLowerCase().includes('finalizado') ? styles.finalizadoBadge : styles.canceladoBadge
                        ]}>
                            <Text style={styles.statusMessageText}>
                                SERVICIO {rescueInfo.estado.toUpperCase()}
                            </Text>
                        </View>
                    ) : (
                        <>
                            <View style={styles.buttonRow}>
                                <TouchableOpacity 
                                    style={[
                                        styles.actionBtn, 
                                        { backgroundColor: '#2196F3' },
                                        (rescueInfo.estado.toLowerCase().includes('proceso') || rescueInfo.estado.toLowerCase().includes('camino')) && { opacity: 0.5 }
                                    ]} 
                                    onPress={() => handleUpdateStatus('En Proceso')}
                                    disabled={rescueInfo.estado.toLowerCase().includes('proceso') || rescueInfo.estado.toLowerCase().includes('camino')}
                                >
                                    <Text style={styles.btnText}>INICIAR</Text>
                                </TouchableOpacity>
                                
                                <TouchableOpacity 
                                    style={[styles.actionBtn, { backgroundColor: '#4CAF50' }]} 
                                    onPress={() => handleUpdateStatus('Finalizado')}
                                >
                                    <Text style={styles.btnText}>COMPLETAR</Text>
                                </TouchableOpacity>
                            </View>
                            
                            <TouchableOpacity 
                                style={styles.cancelBtn} 
                                onPress={confirmCancel}
                            >
                                <Text style={styles.cancelBtnText}>CANCELAR RESCATE</Text>
                            </TouchableOpacity>
                        </>
                    )}
                </View>

            </ScrollView>

            <FAB 
                onPress={() => navigation.navigate('Form', { 
                    title: 'Nuevo Rescate', 
                    dataKey: 'rescates', 
                    fields: ['IdRescate', 'Cliente', 'Matricula', 'Fecha', 'Hora', 'Punto de Partida', 'Lugar del Rescate', 'Trayectoria'],
                    prefill: { 'Estado': 'Pendiente', 'Fecha': new Date().toISOString().split('T')[0] }
                })} 
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    scrollContent: {
        padding: 16,
        paddingBottom: 40,
    },
    card: {
        backgroundColor: Colors.card,
        borderRadius: 12,
        padding: 16,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
        paddingBottom: 10,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
    },
    cardTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: Colors.text,
    },
    refreshButton: {
        padding: 5,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    iconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: Colors.background,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 15,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    infoTexts: {
        flex: 1,
        justifyContent: 'center',
    },
    infoLabel: {
        fontSize: 12,
        color: Colors.textSecondary,
        marginBottom: 2,
    },
    infoValue: {
        fontSize: 15,
        color: Colors.text,
        fontWeight: '500',
    },
    errorText: {
        fontSize: 14,
        color: Colors.danger,
        fontWeight: '500',
    },
    mapContainer: {
        height: 400,
        borderRadius: 12,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: Colors.border,
        backgroundColor: Colors.card,
    },
    map: {
        width: '100%',
        height: '100%',
    },
    webMapPlaceholder: {
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
        backgroundColor: Colors.background,
    },
    webMapText: {
        color: Colors.text,
        textAlign: 'center',
        fontSize: 16,
    },
    webMapSubtext: {
        color: Colors.textSecondary,
        textAlign: 'center',
        fontSize: 12,
        marginTop: 8,
        paddingHorizontal: 30,
    },
    actionSection: {
        marginTop: 10,
        marginBottom: 30,
    },
    sectionLabel: {
        color: Colors.textSecondary,
        fontSize: 12,
        fontWeight: 'bold',
        marginBottom: 10,
        letterSpacing: 1,
    },
    buttonRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 12,
    },
    actionBtn: {
        flex: 1,
        height: 50,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginHorizontal: 5,
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 3,
    },
    btnText: {
        color: '#FFF',
        fontWeight: 'bold',
        fontSize: 14,
    },
    cancelBtn: {
        height: 50,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#F44336',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 5,
    },
    cancelBtnText: {
        color: '#F44336',
        fontWeight: '600',
        fontSize: 14,
    },
    statusMessage: {
        height: 60,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
    },
    statusMessageText: {
        fontWeight: 'bold',
        fontSize: 16,
        letterSpacing: 1.5,
    },
    finalizadoBadge: {
        backgroundColor: '#E8F5E9',
        borderColor: '#4CAF50',
    },
    canceladoBadge: {
        backgroundColor: '#FFEBEE',
        borderColor: '#F44336',
    }
});
