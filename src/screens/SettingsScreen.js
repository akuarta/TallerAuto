import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
    View, Text, StyleSheet, ScrollView, TouchableOpacity,
    TextInput, Switch, Modal, Alert, Platform, ActivityIndicator
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import { CustomHeader } from '../components/CustomHeader';
import {
    Settings, MapPin, Bell, Home, Wrench, ClipboardList,
    FileCheck, LayoutDashboard, Search, Calendar, Users, Shield,
    ChevronRight, Check, X, Edit3, Save, Moon, Sun, Monitor,
    Car, Warehouse, Scan
} from 'lucide-react-native';
import { MapView, Marker } from '../components/MapComponents';
import { useData } from '../context/DataContext';
import { useTheme } from '../context/ThemeContext';

const SETTINGS_KEY = '@taller_settings';
const GOOGLE_MAPS_API_KEY = "AIzaSyBhMnl-cxCpsL97ukncJA-MTJugjBrkpug";

const ALL_SHORTCUTS = [
    // ── LISTAS ──
    { id: 'Garage',          label: 'Garage',       icon: 'Warehouse',    isForm: false },
    { id: 'Orders',          label: 'Órdenes',      icon: 'ClipboardList', isForm: false },
    { id: 'AppointmentList', label: 'Citas',        icon: 'Calendar',     isForm: false },
    { id: 'ClientList',      label: 'Clientes',     icon: 'Users',        isForm: false },
    { id: 'Rescue',          label: 'Rescates',     icon: 'MapPin',       isForm: false },
    { id: 'Billing',         label: 'Facturación',  icon: 'FileCheck',    isForm: false },
    { id: 'Services',        label: 'Servicios',    icon: 'Wrench',       isForm: false },
    { id: 'VehicleSearch',   label: 'Buscar',       icon: 'Search',       isForm: false },
    { id: 'VehicleManager',  label: 'Vehículos',    icon: 'Car',          isForm: false },
    { id: 'TechnicianList',  label: 'Técnicos',     icon: 'Users',        isForm: false },
    { id: 'Inventory',       label: 'Inventario',   icon: 'ClipboardList',isForm: false },
    { id: 'Entradas',        label: 'Entradas',     icon: 'Warehouse',    isForm: false },
    { id: 'Salidas',         label: 'Salidas',      icon: 'Warehouse',    isForm: false },
    { id: 'InvoicingList',   label: 'Facturando',   icon: 'FileCheck',    isForm: false },

    // ── FORMULARIOS (Creación directa) ──
    { id: 'NewOrder',        label: 'Nueva Orden',  icon: 'ClipboardList', isForm: true },
    { id: 'NewClient',       label: 'Nuevo Cliente',icon: 'Users',         isForm: true },
    { id: 'NewAppt',         label: 'Nueva Cita',   icon: 'Calendar',      isForm: true },
    { id: 'NewVehicle',      label: 'Nuevo Vehículo',icon: 'Car',          isForm: true },
    { id: 'NewRescue',       label: 'Nuevo Rescate',icon: 'MapPin',        isForm: true },
    { id: 'NewProduct',      label: 'Nuevo Prod.',  icon: 'ClipboardList', isForm: true },
    { id: 'NewTech',         label: 'Nuevo Téc.',   icon: 'Users',         isForm: true },
    { id: 'NewService',      label: 'Nuevo Serv.',  icon: 'Wrench',        isForm: true },
    { id: 'Scanner',         label: 'Escanear',     icon: 'Scan',          isForm: false },
];

const DEFAULT_SETTINGS = {
    adminName: 'Administrador',
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
    const icons = { LayoutDashboard, FileCheck, Wrench, Search, ClipboardList, Calendar, Users, MapPin, Car, Warehouse, Scan };
    const Icon = icons[name] || Settings;
    return <Icon size={size} color={color} />;
}

export default function SettingsScreen({ navigation }) {
    const { settings: globalSettings, updateSettings } = useData();
    const { colors, themeMode, setTheme, isDark } = useTheme();
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
            : current.length < 8 ? [...current, id] : current;
        update('shortcuts', updated);
    };

    const requestLocationPermission = async () => {
        const { status } = await Location.requestForegroundPermissionsAsync();
        setLocationPermission(status);
    };

    const requestNotifPermission = async () => {
        setNotifPermission('expo-go');
    };

    const reverseGeocode = useCallback(async (lat, lng) => {
        setMapLoading(true);
        try {
            if (GOOGLE_MAPS_API_KEY && Platform.OS !== 'web') {
                const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${GOOGLE_MAPS_API_KEY}&language=es`;
                const res = await fetch(url);
                const data = await res.json();
                if (data.status === 'OK' && data.results[0]) {
                    setMapAddress(data.results[0].formatted_address);
                    setMapLoading(false);
                    return;
                }
            }
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

    useEffect(() => {
        if (Platform.OS === 'web') {
            const handleMsg = (event) => {
                try {
                    const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
                    if (data.type === 'map_pick') {
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
                            body,html,#map{margin:0;padding:0;width:100%;height:100%;overflow:hidden;background:${isDark ? '#121212' : '#F2F2F7'};}
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
                                styles:${isDark ? JSON.stringify(googleMapsDarkStyle) : '[]'}
                            });
                            geocoder = new google.maps.Geocoder();
                            map.addListener('idle',function(){
                                var c = map.getCenter();
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
    }, [initialMapCoords, isDark]);

    const confirmMapLocation = () => {
        const updatedSettings = {
            ...settings,
            tallerAddress: mapAddress,
        };
        setMapModalVisible(false);
        saveSettings(updatedSettings);
    };

    const SectionHeader = ({ title, icon, iconColor }) => (
        <View style={styles.sectionHeader}>
            <View style={[styles.sectionIconBox, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }]}>
                {React.cloneElement(icon, { color: iconColor || colors.primary })}
            </View>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>{title}</Text>
        </View>
    );

    const SettingRow = ({ label, sub, children }) => (
        <View style={styles.settingRow}>
            <View style={{ flex: 1 }}>
                <Text style={[styles.settingLabel, { color: colors.text }]}>{label}</Text>
                {sub ? <Text style={[styles.settingSubLabel, { color: colors.textSecondary }]}>{sub}</Text> : null}
            </View>
            {children}
        </View>
    );

    const PermissionBadge = ({ status }) => {
        const granted = status === 'granted';
        const isExpoGo = status === 'expo-go';
        const bgColor = granted ? '#1B5E20' : isExpoGo ? (isDark ? '#4A3728' : '#D2B48C') : '#B71C1C';
        const label = granted ? 'Permitido' : isExpoGo ? 'Expo Go' : status === 'web' ? 'Web' : 'Denegado';
        return (
            <View style={[styles.badge, { backgroundColor: bgColor }]}>
                <Text style={styles.badgeText}>{label}</Text>
            </View>
        );
    };

    return (
        <View style={[styles.screen, { backgroundColor: colors.background }]}>
            <CustomHeader title="CONFIGURACIÓN" />
            <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

                {/* ─── APARIENCIA ─────────────────────────────── */}
                <SectionHeader title="APARIENCIA" icon={<Sun size={18} />} iconColor="#FFD60A" />
                <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
                    <View style={styles.themeToggleContainer}>
                        {[
                            { id: 'light', label: 'Claro', icon: Sun },
                            { id: 'dark', label: 'Oscuro', icon: Moon },
                            { id: 'system', label: 'Sistema', icon: Monitor },
                        ].map((m) => (
                            <TouchableOpacity
                                key={m.id}
                                style={[
                                    styles.themeOption,
                                    themeMode === m.id && { backgroundColor: colors.primary }
                                ]}
                                onPress={() => setTheme(m.id)}
                            >
                                <m.icon size={20} color={themeMode === m.id ? '#FFF' : colors.textSecondary} />
                                <Text style={[
                                    styles.themeOptionLabel,
                                    { color: themeMode === m.id ? '#FFF' : colors.textSecondary }
                                ]}>
                                    {m.label}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                {/* ─── DATOS DEL TALLER ─────────────────────────── */}
                <SectionHeader title="DATOS DEL TALLER" icon={<Settings size={18} />} />
                <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
                    <View style={[styles.inputGroup, { borderBottomColor: colors.border }]}>
                        <Text style={styles.inputLabel}>Tu Nombre</Text>
                        <TextInput
                            style={[styles.input, { color: colors.text }]}
                            value={settings.adminName}
                            onChangeText={v => update('adminName', v)}
                            placeholder="Nombre del usuario"
                            placeholderTextColor={colors.textSecondary}
                        />
                    </View>
                    <View style={[styles.inputGroup, { borderBottomColor: colors.border }]}>
                        <Text style={styles.inputLabel}>Nombre del Taller</Text>
                        <TextInput
                            style={[styles.input, { color: colors.text }]}
                            value={settings.tallerName}
                            onChangeText={v => update('tallerName', v)}
                            placeholder="Nombre del taller"
                            placeholderTextColor={colors.textSecondary}
                        />
                    </View>
                    <View style={[styles.inputGroup, { borderBottomColor: colors.border }]}>
                        <Text style={styles.inputLabel}>Teléfono</Text>
                        <TextInput
                            style={[styles.input, { color: colors.text }]}
                            value={settings.tallerPhone}
                            onChangeText={v => update('tallerPhone', v)}
                            placeholder="(809) 000-0000"
                            placeholderTextColor={colors.textSecondary}
                            keyboardType="phone-pad"
                        />
                    </View>
                </View>

                {/* ─── UBICACIÓN DEL TALLER ─────────────────────── */}
                <SectionHeader title="UBICACIÓN DEL TALLER" icon={<MapPin size={18} />} iconColor="#FF3B30" />
                <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
                    <TouchableOpacity style={styles.locationRow} onPress={openMapForTaller} activeOpacity={0.7}>
                        <MapPin size={20} color="#FF3B30" />
                        <View style={{ flex: 1, marginLeft: 12 }}>
                            <Text style={[styles.settingLabel, { color: colors.text }]}>Ubicación actual</Text>
                            <Text style={[styles.settingSubLabel, { color: colors.textSecondary }]} numberOfLines={2}>
                                {settings.tallerAddress || `${settings.tallerLat.toFixed(5)}, ${settings.tallerLng.toFixed(5)}`}
                            </Text>
                        </View>
                        <ChevronRight size={18} color={colors.textSecondary} />
                    </TouchableOpacity>
                    <Text style={[styles.hint, { color: colors.textSecondary }]}>
                        Esta ubicación se usará como "Punto de Partida" por defecto en todos los rescates.
                    </Text>
                </View>

                {/* ─── ACCESOS DIRECTOS ─────────────────────────── */}
                <SectionHeader title="ACCESOS DIRECTOS" icon={<Home size={18} />} iconColor="#FF9500" />
                <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
                    <Text style={[styles.hint, { color: colors.textSecondary, paddingTop: 10 }]}>Selecciona hasta 8 atajos. El orden en que los selecciones será el de aparición.</Text>

                    {/* Grupo: Listas */}
                    <Text style={[styles.shortcutGroupLabel, { color: colors.textSecondary }]}>LISTAS — Ver registros</Text>
                    <View style={styles.shortcutsGrid}>
                        {ALL_SHORTCUTS.filter(sc => !sc.isForm).map(sc => {
                            const active = settings.shortcuts?.includes(sc.id);
                            return (
                                <TouchableOpacity
                                    key={sc.id}
                                    style={[
                                        styles.shortcutChip,
                                        { backgroundColor: colors.background, borderColor: colors.border },
                                        active && { backgroundColor: colors.primary, borderColor: colors.primary }
                                    ]}
                                    onPress={() => toggleShortcut(sc.id)}
                                    activeOpacity={0.7}
                                >
                                    <ShortcutIcon name={sc.icon} size={16} color={active ? '#FFF' : colors.textSecondary} />
                                    <Text style={[styles.chipLabel, { color: colors.textSecondary }, active && { color: '#FFF' }]}>{sc.label}</Text>
                                    {active && <Check size={12} color="#FFF" style={{ marginLeft: 4 }} />}
                                </TouchableOpacity>
                            );
                        })}
                    </View>

                    {/* Grupo: Formularios */}
                    <View style={[styles.shortcutGroupDivider, { borderTopColor: colors.border }]} />
                    <Text style={[styles.shortcutGroupLabel, { color: '#34C759' }]}>➕ FORMULARIOS — Creación directa</Text>
                    <View style={styles.shortcutsGrid}>
                        {ALL_SHORTCUTS.filter(sc => sc.isForm).map(sc => {
                            const active = settings.shortcuts?.includes(sc.id);
                            return (
                                <TouchableOpacity
                                    key={sc.id}
                                    style={[
                                        styles.shortcutChip,
                                        { backgroundColor: colors.background, borderColor: '#34C75960' },
                                        active && { backgroundColor: '#34C759', borderColor: '#34C759' }
                                    ]}
                                    onPress={() => toggleShortcut(sc.id)}
                                    activeOpacity={0.7}
                                >
                                    <ShortcutIcon name={sc.icon} size={16} color={active ? '#FFF' : '#34C759'} />
                                    <Text style={[styles.chipLabel, { color: '#34C759' }, active && { color: '#FFF' }]}>{sc.label}</Text>
                                    {active && <Check size={12} color="#FFF" style={{ marginLeft: 4 }} />}
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                    <View style={{ height: 8 }} />
                </View>

                {/* ─── ALERTAS Y NOTIFICACIONES ─────────────────── */}
                <SectionHeader title="ALERTAS Y NOTIFICACIONES" icon={<Bell size={18} />} iconColor="#34C759" />
                <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
                    <SettingRow label="Activar Notificaciones" sub="Notificaciones push de la app">
                        <Switch
                            value={settings.notificationsEnabled}
                            onValueChange={v => update('notificationsEnabled', v)}
                            trackColor={{ false: colors.border, true: '#34C759' }}
                            thumbColor={Platform.OS === 'ios' ? undefined : (settings.notificationsEnabled ? '#FFF' : '#f4f3f4')}
                        />
                    </SettingRow>
                    <View style={[styles.separator, { backgroundColor: colors.border }]} />
                    <SettingRow label="Nuevas Órdenes" sub="Aviso al recibir una nueva orden de trabajo">
                        <Switch
                            value={settings.alertNewOrder}
                            onValueChange={v => update('alertNewOrder', v)}
                            trackColor={{ false: colors.border, true: '#34C759' }}
                            thumbColor={Platform.OS === 'ios' ? undefined : (settings.alertNewOrder ? '#FFF' : '#f4f3f4')}
                            disabled={!settings.notificationsEnabled}
                        />
                    </SettingRow>
                    <View style={[styles.separator, { backgroundColor: colors.border }]} />
                    <SettingRow label="Rescates" sub="Aviso al crear un nuevo rescate">
                        <Switch
                            value={settings.alertRescue}
                            onValueChange={v => update('alertRescue', v)}
                            trackColor={{ false: colors.border, true: '#34C759' }}
                            thumbColor={Platform.OS === 'ios' ? undefined : (settings.alertRescue ? '#FFF' : '#f4f3f4')}
                            disabled={!settings.notificationsEnabled}
                        />
                    </SettingRow>
                    <View style={[styles.separator, { backgroundColor: colors.border }]} />
                    <SettingRow label="Recordatorio de Citas" sub="Aviso antes de cada cita agendada">
                        <Switch
                            value={settings.alertAppointment}
                            onValueChange={v => update('alertAppointment', v)}
                            trackColor={{ false: colors.border, true: '#34C759' }}
                            thumbColor={Platform.OS === 'ios' ? undefined : (settings.alertAppointment ? '#FFF' : '#f4f3f4')}
                            disabled={!settings.notificationsEnabled}
                        />
                    </SettingRow>
                </View>

                {/* ─── PERMISOS DEL SISTEMA ─────────────────────── */}
                <SectionHeader title="PERMISOS DEL SISTEMA" icon={<Shield size={18} />} iconColor="#AF52DE" />
                <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
                    <SettingRow label="Ubicación (GPS)" sub="Necesario para el mapa y rescates">
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                            <PermissionBadge status={locationPermission} />
                            {locationPermission !== 'granted' && (
                                <TouchableOpacity onPress={requestLocationPermission} style={[styles.grantBtn, { backgroundColor: colors.primary }]}>
                                    <Text style={styles.grantBtnText}>Activar</Text>
                                </TouchableOpacity>
                            )}
                        </View>
                    </SettingRow>
                    <View style={[styles.separator, { backgroundColor: colors.border }]} />
                    <SettingRow label="Notificaciones" sub="Necesario para alertas y avisos">
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                            <PermissionBadge status={notifPermission} />
                            {notifPermission === 'expo-go' && (
                                <Text style={{ color: colors.textSecondary, fontSize: 11 }}>Build requerido</Text>
                            )}
                            {notifPermission !== 'granted' && notifPermission !== 'web' && notifPermission !== 'expo-go' && (
                                <TouchableOpacity onPress={requestNotifPermission} style={[styles.grantBtn, { backgroundColor: colors.primary }]}>
                                    <Text style={styles.grantBtnText}>Activar</Text>
                                </TouchableOpacity>
                            )}
                        </View>
                    </SettingRow>
                </View>

                {/* ─── BOTÓN GUARDAR ────────────────────────────── */}
                <TouchableOpacity
                    style={[styles.saveBtn, { backgroundColor: colors.primary }, saved && styles.saveBtnSuccess]}
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
                <View style={{ flex: 1, backgroundColor: colors.background }}>
                    <View style={[styles.mapHeader, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
                        <TouchableOpacity onPress={() => setMapModalVisible(false)} style={styles.mapCloseBtn}>
                            <X size={22} color={colors.text} />
                        </TouchableOpacity>
                        <Text style={[styles.mapTitle, { color: colors.text }]}>Ubicación del Taller</Text>
                        <TouchableOpacity onPress={confirmMapLocation} style={[styles.mapConfirmBtn, { backgroundColor: colors.primary }]}>
                            <Check size={22} color="#FFF" />
                        </TouchableOpacity>
                    </View>

                    <View style={[styles.mapAddressBar, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
                        <MapPin size={16} color="#FF3B30" />
                        {mapLoading ? (
                            <ActivityIndicator size="small" color={colors.primary} style={{ marginLeft: 8 }} />
                        ) : (
                            <Text style={[styles.mapAddressText, { color: colors.text }]} numberOfLines={2}>{mapAddress || 'Sin dirección'}</Text>
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
                                    onRegionChangeComplete={(region) => {
                                        update('tallerLat', region.latitude);
                                        update('tallerLng', region.longitude);
                                        reverseGeocode(region.latitude, region.longitude);
                                    }}
                                />
                            ) : (
                                <View style={styles.mapPlaceholder}>
                                    <ActivityIndicator size="large" color={colors.primary} />
                                </View>
                            )
                        )}
                        {Platform.OS !== 'web' && (
                            <View style={{ position: 'absolute', top: '50%', left: '50%', marginLeft: -16, marginTop: -32, pointerEvents: 'none' }}>
                                <MapPin size={32} color="#FF3B30" fill="white" />
                            </View>
                        )}
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    screen: { flex: 1 },
    scroll: { padding: 16, paddingBottom: 40 },

    sectionHeader: {
        flexDirection: 'row', alignItems: 'center',
        marginTop: 24, marginBottom: 14,
    },
    sectionIconBox: {
        width: 32, height: 32, borderRadius: 10, justifyContent: 'center', alignItems: 'center',
        marginRight: 12,
    },
    sectionTitle: {
        fontSize: 13, fontWeight: '700',
        letterSpacing: 1, textTransform: 'uppercase',
    },

    card: {
        borderRadius: 16,
        borderWidth: 1,
        overflow: 'hidden',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
    },
    inputGroup: { padding: 16, borderBottomWidth: 1 },
    inputLabel: { color: '#8E8E93', fontSize: 11, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 },
    input: {
        fontSize: 16,
        paddingVertical: 4,
    },

    themeToggleContainer: {
        flexDirection: 'row',
        padding: 12,
        gap: 8,
    },
    themeOption: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 12,
        borderRadius: 12,
    },
    themeOptionLabel: {
        fontSize: 14,
        fontWeight: '600',
    },

    locationRow: {
        flexDirection: 'row', alignItems: 'center', padding: 16,
    },
    hint: {
        fontSize: 12, paddingHorizontal: 16, paddingBottom: 14, lineHeight: 18,
    },

    shortcutsGrid: { flexDirection: 'row', flexWrap: 'wrap', padding: 12, gap: 10 },
    shortcutChip: {
        flexDirection: 'row', alignItems: 'center', gap: 6,
        borderRadius: 20,
        paddingHorizontal: 14, paddingVertical: 10,
        borderWidth: 1,
    },
    chipLabel: { fontSize: 13, fontWeight: '500' },

    settingRow: {
        flexDirection: 'row', alignItems: 'center',
        paddingHorizontal: 16, paddingVertical: 14,
    },
    settingLabel: { fontSize: 15, fontWeight: '600' },
    settingSubLabel: { fontSize: 13, marginTop: 2 },
    separator: { height: 1, marginHorizontal: 16 },

    badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
    badgeText: { color: '#FFF', fontSize: 11, fontWeight: '700' },
    grantBtn: {
        paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10,
    },
    grantBtnText: { color: '#FFF', fontSize: 11, fontWeight: '700' },

    saveBtn: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
        borderRadius: 16,
        paddingVertical: 18, marginTop: 32,
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
    },
    saveBtnSuccess: { backgroundColor: '#34C759' },
    saveBtnText: { color: '#FFF', fontSize: 17, fontWeight: '700' },

    // Map Modal
    mapHeader: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: 16, paddingTop: Platform.OS === 'ios' ? 60 : 20, paddingBottom: 14,
        borderBottomWidth: 1,
    },
    mapCloseBtn: { padding: 6, borderRadius: 20 },
    mapTitle: { fontSize: 17, fontWeight: '700' },
    mapConfirmBtn: {
        padding: 10, borderRadius: 12,
    },
    mapAddressBar: {
        flexDirection: 'row', alignItems: 'center', gap: 10,
        padding: 14, minHeight: 60,
        borderBottomWidth: 1,
    },
    mapAddressText: { fontSize: 14, flex: 1, lineHeight: 20 },
    mapPlaceholder: {
        flex: 1, justifyContent: 'center', alignItems: 'center',
    },
});
