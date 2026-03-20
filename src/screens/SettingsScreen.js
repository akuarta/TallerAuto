import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
    View, Text, StyleSheet, ScrollView, TouchableOpacity,
    TextInput, Switch, Modal, Alert, Platform, ActivityIndicator
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import { Colors } from '../constants';
import { CustomHeader } from '../components/CustomHeader';
import {
    Settings, MapPin, Bell, Home, Wrench, ClipboardList,
    FileCheck, LayoutDashboard, Search, Calendar, Users, Shield,
    ChevronRight, Check, X, Edit3, Save
} from 'lucide-react-native';
import { MapView, Marker } from '../components/MapComponents';
import { useData } from '../context/DataContext';

const SETTINGS_KEY = '@taller_settings';
const GOOGLE_MAPS_API_KEY = "AIzaSyBhMnl-cxCpsL97ukncJA-MTJugjBrkpug";

const ALL_SHORTCUTS = [
    { id: 'Garage',          label: 'Garage',       icon: 'LayoutDashboard' },
    { id: 'Billing',         label: 'Facturación',  icon: 'FileCheck' },
    { id: 'Services',        label: 'Servicios',    icon: 'Wrench' },
    { id: 'VehicleSearch',   label: 'Buscar',       icon: 'Search' },
    { id: 'Orders',          label: 'Órdenes',      icon: 'ClipboardList' },
    { id: 'AppointmentList', label: 'Citas',        icon: 'Calendar' },
    { id: 'ClientList',      label: 'Clientes',     icon: 'Users' },
    { id: 'Rescue',          label: 'Rescate',      icon: 'MapPin' },
];

const DEFAULT_SETTINGS = {
    tallerName: 'Taller de Reparación Auto',
    tallerPhone: '',
    tallerAddress: '',
    tallerLat: 18.5126,
    tallerLng: -69.8943,
    notificationsEnabled: true,
    alertNewOrder: true,
    alertRescue: true,
    alertAppointment: true,
    shortcuts: ['Garage', 'Billing', 'Services', 'VehicleSearch'],
};

const googleMapsDarkStyle = [
    { elementType: 'geometry', stylers: [{ color: '#212121' }] },
    { elementType: 'labels.text.fill', stylers: [{ color: '#757575' }] },
    { elementType: 'labels.text.stroke', stylers: [{ color: '#212121' }] },
    { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#373737' }] },
    { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#3c3c3c' }] },
    { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#000000' }] },
];

function ShortcutIcon({ name, color, size }) {
    const icons = { LayoutDashboard, FileCheck, Wrench, Search, ClipboardList, Calendar, Users, MapPin };
    const Icon = icons[name] || Settings;
    return <Icon size={size} color={color} />;
}

export default function SettingsScreen({ navigation }) {
    const { settings: globalSettings, updateSettings } = useData();
    const [settings, setSettings] = useState(globalSettings || DEFAULT_SETTINGS);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [mapModalVisible, setMapModalVisible] = useState(false);
    const [mapAddress, setMapAddress] = useState('');
    const [mapLoading, setMapLoading] = useState(false);
    const [initialMapCoords, setInitialMapCoords] = useState(null);
    const [locationPermission, setLocationPermission] = useState(null);
    const [notifPermission, setNotifPermission] = useState(null);
    const reverseGeocodeRef = useRef(null);

    // Sincronizar con el contexto global inicial si cambia
    useEffect(() => {
        if (globalSettings) {
             setSettings(prev => ({ ...prev, ...globalSettings }));
        }
    }, [globalSettings]);

    useEffect(() => {
        checkPermissions();
    }, []);

    const checkPermissions = async () => {
        try {
            const locStatus = await Location.getForegroundPermissionsAsync();
            setLocationPermission(locStatus.status);
        } catch (e) {
            setLocationPermission('unavailable');
        }
        // expo-notifications no funciona sin development build (SDK 53+)
        setNotifPermission(Platform.OS === 'web' ? 'web' : 'expo-go');
    };

    const saveSettings = async (newSettings) => {
        setSaving(true);
        try {
            await updateSettings(newSettings);
            setSettings(newSettings);
            setSaved(true);
            setTimeout(() => setSaved(false), 2000);
        } catch (e) {
            Alert.alert('Error', 'No se pudo guardar la configuración.');
        }
        setSaving(false);
    };

    const update = (key, value) => {
        const updated = { ...settings, [key]: value };
        setSettings(updated);
    };

    const toggleShortcut = (id) => {
        const current = settings.shortcuts || [];
        const updated = current.includes(id)
            ? current.filter(s => s !== id)
            : current.length < 4 ? [...current, id] : current;
        update('shortcuts', updated);
    };

    const requestLocationPermission = async () => {
        const { status } = await Location.requestForegroundPermissionsAsync();
        setLocationPermission(status);
    };

    const requestNotifPermission = async () => {
        // Requiere development build para funcionar
        setNotifPermission('expo-go');
    };

    const reverseGeocode = useCallback(async (lat, lng) => {
        setMapLoading(true);
        try {
            if (GOOGLE_MAPS_API_KEY && Platform.OS !== 'web') {
                const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${GOOGLE_MAPS_API_KEY}&language=es`;
                console.log("SETTINGS GOOGLE REQ (Geocoding):", url);
                const res = await fetch(url);
                const data = await res.json();
                console.log("SETTINGS GOOGLE RES (Geocoding):", data.status);
                if (data.status === 'OK' && data.results[0]) {
                    setMapAddress(data.results[0].formatted_address);
                    setMapLoading(false);
                    return;
                }
            }
            // Fallback Nominatim
            const nomRes = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`, {
                headers: { 'Accept-Language': 'es', 'User-Agent': 'TallerApp/1.0' }
            });
            const nomData = await nomRes.json();
            if (nomData && nomData.display_name) setMapAddress(nomData.display_name);
        } catch (e) {
            console.log('Error geocoding:', e);
        }
        setMapLoading(false);
    }, []);

    reverseGeocodeRef.current = reverseGeocode;

    const openMapForTaller = async () => {
        setInitialMapCoords({ latitude: settings.tallerLat, longitude: settings.tallerLng });
        setMapAddress(settings.tallerAddress || 'Cargando dirección...');
        setMapModalVisible(true);
        reverseGeocode(settings.tallerLat, settings.tallerLng);
    };

    // useEffect para escuchar mensajes del iframe en web
    useEffect(() => {
        if (Platform.OS === 'web') {
            const handleMsg = (event) => {
                try {
                    const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
                    if (data.type === 'map_pick') {
                        console.log("SETTINGS IFRAME (map_pick):", data.address, data.lat, data.lng);
                        update('tallerLat', data.lat);
                        update('tallerLng', data.lng);
                        if (data.address) setMapAddress(data.address);
                    }
                } catch (e) {}
            };
            window.addEventListener('message', handleMsg);
            return () => window.removeEventListener('message', handleMsg);
        }
    }, [settings]);

    const memoizedWebMap = useMemo(() => {
        if (!initialMapCoords || Platform.OS !== 'web') return null;
        const { latitude, longitude } = initialMapCoords;
        return (
            <iframe
                id="settings-map-iframe"
                width="100%"
                height="100%"
                style={{ border: 0 }}
                srcDoc={`
                    <!DOCTYPE html>
                    <html><head>
                        <meta name="viewport" content="width=device-width,initial-scale=1.0,maximum-scale=1.0,user-scalable=no"/>
                        ${GOOGLE_MAPS_API_KEY ? `<script src="https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=places&callback=initMap" async></script>` : ''}
                        <style>
                            body,html,#map{margin:0;padding:0;width:100%;height:100%;overflow:hidden;background:#121212;}
                            .pin{position:absolute;top:50%;left:50%;transform:translate(-50%,-100%);z-index:1000;pointer-events:none;font-size:36px;}
                        </style>
                    </head><body>
                        <div id="map"></div>
                        <div class="pin">📍</div>
                        <script>
                        var map, geocoder;
                        function initMap(){
                            map = new google.maps.Map(document.getElementById('map'),{
                                center:{lat:${latitude},lng:${longitude}},
                                zoom:17,
                                disableDefaultUI:false,
                                zoomControl:true,
                                styles:${JSON.stringify(googleMapsDarkStyle)}
                            });
                            geocoder = new google.maps.Geocoder();
                            map.addListener('idle',function(){
                                var c = map.getCenter();
                                console.log("SETTINGS IFRAME (Geocoding):", c.lat(), c.lng());
                                geocoder.geocode({location:c},function(results,status){
                                    var address = status==='OK'&&results[0] ? results[0].formatted_address : null;
                                    window.parent.postMessage(JSON.stringify({type:'map_pick',lat:c.lat(),lng:c.lng(),address:address}),'*');
                                });
                            });
                        }
                        if(window.google&&window.google.maps){initMap();}
                        else{window.initMap=initMap;}
                        </script>
                    </body></html>
                `}
            />
        );
    }, [initialMapCoords]);

    const confirmMapLocation = () => {
        const updatedSettings = {
            ...settings,
            tallerAddress: mapAddress,
        };
        setMapModalVisible(false);
        saveSettings(updatedSettings);
    };

    // ---- UI Helpers ----
    const SectionHeader = ({ title, icon }) => (
        <View style={styles.sectionHeader}>
            <View style={styles.sectionIconBox}>{icon}</View>
            <Text style={styles.sectionTitle}>{title}</Text>
        </View>
    );

    const SettingRow = ({ label, sub, children }) => (
        <View style={styles.settingRow}>
            <View style={{ flex: 1 }}>
                <Text style={styles.settingLabel}>{label}</Text>
                {sub ? <Text style={styles.settingSubLabel}>{sub}</Text> : null}
            </View>
            {children}
        </View>
    );

    const PermissionBadge = ({ status }) => {
        const granted = status === 'granted';
        const isExpoGo = status === 'expo-go';
        const bgColor = granted ? '#1B5E20' : isExpoGo ? '#4A3728' : '#B71C1C';
        const label = granted ? 'Permitido' : isExpoGo ? 'Expo Go' : status === 'web' ? 'Web' : 'Denegado';
        return (
            <View style={[styles.badge, { backgroundColor: bgColor }]}>
                <Text style={styles.badgeText}>{label}</Text>
            </View>
        );
    };

    return (
        <View style={styles.screen}>
            <CustomHeader title="CONFIGURACIÓN" />
            <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

                {/* ─── DATOS DEL TALLER ─────────────────────────── */}
                <SectionHeader title="DATOS DEL TALLER" icon={<Settings size={18} color={Colors.primary} />} />
                <View style={styles.card}>
                    <View style={styles.inputGroup}>
                        <Text style={styles.inputLabel}>Nombre del Taller</Text>
                        <TextInput
                            style={styles.input}
                            value={settings.tallerName}
                            onChangeText={v => update('tallerName', v)}
                            placeholder="Nombre del taller"
                            placeholderTextColor={Colors.textSecondary}
                        />
                    </View>
                    <View style={styles.inputGroup}>
                        <Text style={styles.inputLabel}>Teléfono</Text>
                        <TextInput
                            style={styles.input}
                            value={settings.tallerPhone}
                            onChangeText={v => update('tallerPhone', v)}
                            placeholder="(809) 000-0000"
                            placeholderTextColor={Colors.textSecondary}
                            keyboardType="phone-pad"
                        />
                    </View>
                </View>

                {/* ─── UBICACIÓN DEL TALLER ─────────────────────── */}
                <SectionHeader title="UBICACIÓN DEL TALLER" icon={<MapPin size={18} color="#E53935" />} />
                <View style={styles.card}>
                    <TouchableOpacity style={styles.locationRow} onPress={openMapForTaller} activeOpacity={0.7}>
                        <MapPin size={20} color="#E53935" />
                        <View style={{ flex: 1, marginLeft: 12 }}>
                            <Text style={styles.settingLabel}>Ubicación actual</Text>
                            <Text style={styles.settingSubLabel} numberOfLines={2}>
                                {settings.tallerAddress || `${settings.tallerLat.toFixed(5)}, ${settings.tallerLng.toFixed(5)}`}
                            </Text>
                        </View>
                        <ChevronRight size={18} color={Colors.textSecondary} />
                    </TouchableOpacity>
                    <Text style={styles.hint}>
                        Esta ubicación se usará como "Punto de Partida" por defecto en todos los rescates.
                    </Text>
                </View>

                {/* ─── ACCESOS DIRECTOS ─────────────────────────── */}
                <SectionHeader title="ACCESOS DIRECTOS" icon={<Home size={18} color="#FF9800" />} />
                <View style={styles.card}>
                    <Text style={styles.hint}>Selecciona hasta 4 accesos rápidos para la pantalla de inicio.</Text>
                    <View style={styles.shortcutsGrid}>
                        {ALL_SHORTCUTS.map(sc => {
                            const active = settings.shortcuts?.includes(sc.id);
                            return (
                                <TouchableOpacity
                                    key={sc.id}
                                    style={[styles.shortcutChip, active && styles.shortcutChipActive]}
                                    onPress={() => toggleShortcut(sc.id)}
                                    activeOpacity={0.7}
                                >
                                    <ShortcutIcon name={sc.icon} size={18} color={active ? '#FFF' : Colors.textSecondary} />
                                    <Text style={[styles.chipLabel, active && { color: '#FFF' }]}>{sc.label}</Text>
                                    {active && <Check size={12} color="#FFF" style={{ marginLeft: 4 }} />}
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                </View>

                {/* ─── ALERTAS Y NOTIFICACIONES ─────────────────── */}
                <SectionHeader title="ALERTAS Y NOTIFICACIONES" icon={<Bell size={18} color="#4CAF50" />} />
                <View style={styles.card}>
                    <SettingRow label="Activar Notificaciones" sub="Notificaciones push de la app">
                        <Switch
                            value={settings.notificationsEnabled}
                            onValueChange={v => update('notificationsEnabled', v)}
                            trackColor={{ false: Colors.border, true: '#1B5E20' }}
                            thumbColor={settings.notificationsEnabled ? '#4CAF50' : Colors.textSecondary}
                        />
                    </SettingRow>
                    <View style={styles.separator} />
                    <SettingRow label="Nuevas Órdenes" sub="Aviso al recibir una nueva orden de trabajo">
                        <Switch
                            value={settings.alertNewOrder}
                            onValueChange={v => update('alertNewOrder', v)}
                            trackColor={{ false: Colors.border, true: '#1B5E20' }}
                            thumbColor={settings.alertNewOrder ? '#4CAF50' : Colors.textSecondary}
                            disabled={!settings.notificationsEnabled}
                        />
                    </SettingRow>
                    <View style={styles.separator} />
                    <SettingRow label="Rescates" sub="Aviso al crear un nuevo rescate">
                        <Switch
                            value={settings.alertRescue}
                            onValueChange={v => update('alertRescue', v)}
                            trackColor={{ false: Colors.border, true: '#1B5E20' }}
                            thumbColor={settings.alertRescue ? '#4CAF50' : Colors.textSecondary}
                            disabled={!settings.notificationsEnabled}
                        />
                    </SettingRow>
                    <View style={styles.separator} />
                    <SettingRow label="Recordatorio de Citas" sub="Aviso antes de cada cita agendada">
                        <Switch
                            value={settings.alertAppointment}
                            onValueChange={v => update('alertAppointment', v)}
                            trackColor={{ false: Colors.border, true: '#1B5E20' }}
                            thumbColor={settings.alertAppointment ? '#4CAF50' : Colors.textSecondary}
                            disabled={!settings.notificationsEnabled}
                        />
                    </SettingRow>
                </View>

                {/* ─── PERMISOS DEL SISTEMA ─────────────────────── */}
                <SectionHeader title="PERMISOS DEL SISTEMA" icon={<Shield size={18} color="#9C27B0" />} />
                <View style={styles.card}>
                    <SettingRow label="Ubicación (GPS)" sub="Necesario para el mapa y rescates">
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                            <PermissionBadge status={locationPermission} />
                            {locationPermission !== 'granted' && (
                                <TouchableOpacity onPress={requestLocationPermission} style={styles.grantBtn}>
                                    <Text style={styles.grantBtnText}>Activar</Text>
                                </TouchableOpacity>
                            )}
                        </View>
                    </SettingRow>
                    <View style={styles.separator} />
                    <SettingRow label="Notificaciones" sub="Necesario para alertas y avisos">
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                            <PermissionBadge status={notifPermission} />
                            {notifPermission === 'expo-go' && (
                                <Text style={{ color: Colors.textSecondary, fontSize: 11 }}>Build requerido</Text>
                            )}
                            {notifPermission !== 'granted' && notifPermission !== 'web' && notifPermission !== 'expo-go' && (
                                <TouchableOpacity onPress={requestNotifPermission} style={styles.grantBtn}>
                                    <Text style={styles.grantBtnText}>Activar</Text>
                                </TouchableOpacity>
                            )}
                        </View>
                    </SettingRow>
                </View>

                {/* ─── BOTÓN GUARDAR ────────────────────────────── */}
                <TouchableOpacity
                    style={[styles.saveBtn, saved && styles.saveBtnSuccess]}
                    onPress={() => saveSettings(settings)}
                    disabled={saving}
                    activeOpacity={0.8}
                >
                    {saving ? (
                        <ActivityIndicator color="#FFF" />
                    ) : saved ? (
                        <>
                            <Check size={20} color="#FFF" />
                            <Text style={styles.saveBtnText}>¡Guardado!</Text>
                        </>
                    ) : (
                        <>
                            <Save size={20} color="#FFF" />
                            <Text style={styles.saveBtnText}>Guardar Configuración</Text>
                        </>
                    )}
                </TouchableOpacity>

                <View style={{ height: 60 }} />
            </ScrollView>

            {/* ─── MODAL MAPA TALLER ─────────────────────────── */}
            <Modal visible={mapModalVisible} animationType="slide" onRequestClose={() => setMapModalVisible(false)}>
                <View style={{ flex: 1, backgroundColor: Colors.background }}>
                    <View style={styles.mapHeader}>
                        <TouchableOpacity onPress={() => setMapModalVisible(false)} style={styles.mapCloseBtn}>
                            <X size={22} color={Colors.text} />
                        </TouchableOpacity>
                        <Text style={styles.mapTitle}>Ubicación del Taller</Text>
                        <TouchableOpacity onPress={confirmMapLocation} style={styles.mapConfirmBtn}>
                            <Check size={22} color="#FFF" />
                        </TouchableOpacity>
                    </View>

                    <View style={styles.mapAddressBar}>
                        <MapPin size={16} color="#E53935" />
                        {mapLoading ? (
                            <ActivityIndicator size="small" color={Colors.primary} style={{ marginLeft: 8 }} />
                        ) : (
                            <Text style={styles.mapAddressText} numberOfLines={2}>{mapAddress || 'Sin dirección'}</Text>
                        )}
                    </View>

                    <View style={{ flex: 1 }}>
                        {Platform.OS === 'web' && initialMapCoords ? memoizedWebMap : (
                            initialMapCoords ? (
                                <MapView
                                    style={{ flex: 1 }}
                                    initialRegion={{
                                        latitude: initialMapCoords.latitude,
                                        longitude: initialMapCoords.longitude,
                                        latitudeDelta: 0.005,
                                        longitudeDelta: 0.005,
                                    }}
                                    onMapReady={() => console.log('Settings MapReady')}
                                    onRegionChangeComplete={(region) => {
                                        update('tallerLat', region.latitude);
                                        update('tallerLng', region.longitude);
                                        reverseGeocode(region.latitude, region.longitude);
                                    }}
                                />
                            ) : (
                                <View style={styles.mapPlaceholder}>
                                    <ActivityIndicator size="large" color={Colors.primary} />
                                </View>
                            )
                        )}
                        {/* Puntero fijo en el centro para el Native Map */}
                        {Platform.OS !== 'web' && (
                            <View style={{ position: 'absolute', top: '50%', left: '50%', marginLeft: -16, marginTop: -32, pointerEvents: 'none' }}>
                                <MapPin size={32} color="#E53935" fill="white" />
                            </View>
                        )}
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    screen: { flex: 1, backgroundColor: Colors.background },
    scroll: { padding: 16, paddingBottom: 40 },

    sectionHeader: {
        flexDirection: 'row', alignItems: 'center',
        marginTop: 24, marginBottom: 10,
    },
    sectionIconBox: {
        width: 30, height: 30, borderRadius: 8, justifyContent: 'center', alignItems: 'center',
        backgroundColor: 'rgba(59,89,152,0.15)', marginRight: 10,
    },
    sectionTitle: {
        color: Colors.text, fontSize: 12, fontWeight: '700',
        letterSpacing: 1, textTransform: 'uppercase',
    },

    card: {
        backgroundColor: Colors.card, borderRadius: 14,
        borderWidth: 1, borderColor: Colors.border,
        overflow: 'hidden',
    },
    inputGroup: { padding: 14, borderBottomWidth: 1, borderBottomColor: Colors.border },
    inputLabel: { color: Colors.textSecondary, fontSize: 11, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 },
    input: {
        color: Colors.text, fontSize: 15,
        paddingVertical: 0,
    },

    locationRow: {
        flexDirection: 'row', alignItems: 'center', padding: 14,
    },
    hint: {
        color: Colors.textSecondary, fontSize: 12, paddingHorizontal: 14, paddingBottom: 12, lineHeight: 18,
    },

    shortcutsGrid: { flexDirection: 'row', flexWrap: 'wrap', padding: 10, gap: 8 },
    shortcutChip: {
        flexDirection: 'row', alignItems: 'center', gap: 6,
        backgroundColor: Colors.background, borderRadius: 20,
        paddingHorizontal: 12, paddingVertical: 8,
        borderWidth: 1, borderColor: Colors.border,
    },
    shortcutChipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
    chipLabel: { color: Colors.textSecondary, fontSize: 13 },

    settingRow: {
        flexDirection: 'row', alignItems: 'center',
        paddingHorizontal: 14, paddingVertical: 12,
    },
    settingLabel: { color: Colors.text, fontSize: 14, fontWeight: '500' },
    settingSubLabel: { color: Colors.textSecondary, fontSize: 12, marginTop: 2 },
    separator: { height: 1, backgroundColor: Colors.border, marginHorizontal: 14 },

    badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
    badgeText: { color: '#FFF', fontSize: 11, fontWeight: '600' },
    grantBtn: {
        backgroundColor: Colors.primary, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10,
    },
    grantBtnText: { color: '#FFF', fontSize: 11, fontWeight: '600' },

    saveBtn: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
        backgroundColor: Colors.primary, borderRadius: 14,
        paddingVertical: 16, marginTop: 28,
    },
    saveBtnSuccess: { backgroundColor: '#2E7D32' },
    saveBtnText: { color: '#FFF', fontSize: 16, fontWeight: '700' },

    // Map Modal
    mapHeader: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: 16, paddingTop: Platform.OS === 'ios' ? 56 : 20, paddingBottom: 12,
        backgroundColor: Colors.card, borderBottomWidth: 1, borderBottomColor: Colors.border,
    },
    mapCloseBtn: { padding: 4 },
    mapTitle: { color: Colors.text, fontSize: 16, fontWeight: '700' },
    mapConfirmBtn: {
        backgroundColor: Colors.primary, padding: 8, borderRadius: 10,
    },
    mapAddressBar: {
        flexDirection: 'row', alignItems: 'center', gap: 8,
        backgroundColor: Colors.card, padding: 12, minHeight: 50,
        borderBottomWidth: 1, borderBottomColor: Colors.border,
    },
    mapAddressText: { color: Colors.text, fontSize: 13, flex: 1 },
    mapPlaceholder: {
        flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12,
    },
    mapPlaceholderText: { color: Colors.text, fontSize: 18, fontWeight: 'bold' },
    mapPlaceholderSub: { color: Colors.textSecondary, fontSize: 13, textAlign: 'center' },
});
