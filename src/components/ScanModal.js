import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, ActivityIndicator, Dimensions, Platform } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { X, Camera, Zap, ZapOff, RefreshCcw } from 'lucide-react-native';
import { performOCR } from '../utils/ocrService';

const { width, height } = Dimensions.get('window');

/**
 * Modal de Cámara Real para escaneo de VIN/Matrícula
 * @param {boolean} visible 
 * @param {function} onClose 
 * @param {function} onScan Resultado del escaneo (texto detectado)
 * @param {string} field Nombre del campo que se está escaneando
 */
export const ScanModal = ({ visible, onClose, onScan, field, colors }) => {
    const [permission, requestPermission] = useCameraPermissions();
    const [scanned, setScanned] = useState(false);
    const [loading, setLoading] = useState(false);
    const [flash, setFlash] = useState('off');
    const [facing, setFacing] = useState('back');
    const cameraRef = useRef(null);

    useEffect(() => {
        if (visible && !permission?.granted) {
            requestPermission();
        }
    }, [visible, permission]);

    if (!permission) return null;

    const handleTakePhoto = async () => {
        if (!cameraRef.current || loading) return;

        try {
            setLoading(true);
            const photo = await cameraRef.current.takePictureAsync({
                quality: 0.5,
                base64: true,
                skipProcessing: true
            });

            // Usar OCR real
            const result = await performOCR(photo.base64);
            
            if (result) {
                onScan(result);
                onClose();
            } else {
                alert("No se pudo detectar texto claro. Intenta de nuevo.");
            }
        } catch (error) {
            console.error('Error al tomar foto:', error);
            alert("Error al procesar la imagen.");
        } finally {
            setLoading(false);
        }
    };

    if (!permission.granted) {
        return (
            <Modal visible={visible} animationType="slide">
                <View style={[styles.container, { backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }]}>
                    <Text style={{ color: colors.text, textAlign: 'center', padding: 20 }}>
                        Necesitamos permiso para usar la cámara y escanear la {field || 'información'}.
                    </Text>
                    <TouchableOpacity 
                        style={[styles.btn, { backgroundColor: colors.primary }]} 
                        onPress={requestPermission}
                    >
                        <Text style={{ color: '#FFF', fontWeight: 'bold' }}>CONCEDER PERMISO</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={{ marginTop: 20 }} onPress={onClose}>
                        <Text style={{ color: colors.textSecondary }}>Cancelar</Text>
                    </TouchableOpacity>
                </View>
            </Modal>
        );
    }

    return (
        <Modal visible={visible} animationType="fade" transparent={false}>
            <View style={[styles.container, { backgroundColor: '#000' }]}>
                <CameraView 
                    style={styles.camera} 
                    ref={cameraRef} 
                    enableTorch={flash === 'on'}
                    facing={facing}
                >
                    <View style={styles.overlay}>
                        <View style={styles.header}>
                            <TouchableOpacity onPress={onClose} style={styles.roundBtn}>
                                <X size={24} color="#FFF" />
                            </TouchableOpacity>
                            <Text style={styles.headerTitle}>ESCANEAR {field?.toUpperCase()}</Text>
                            <TouchableOpacity 
                                onPress={() => setFlash(flash === 'on' ? 'off' : 'on')} 
                                style={styles.roundBtn}
                            >
                                {flash === 'on' ? <Zap size={24} color="#FFD700" /> : <ZapOff size={24} color="#FFF" />}
                            </TouchableOpacity>
                        </View>

                        <View style={styles.viewfinderContainer}>
                            <View style={[styles.viewfinder, { borderColor: loading ? colors.primary : '#FFF' }]}>
                                {loading && (
                                    <View style={styles.loadingOverlay}>
                                        <ActivityIndicator size="large" color={colors.primary} />
                                        <Text style={{ color: '#FFF', marginTop: 10, fontWeight: 'bold' }}>PROCESANDO...</Text>
                                    </View>
                                )}
                                {!loading && (
                                    <View style={styles.scanLine} />
                                )}
                            </View>
                            <Text style={styles.guideText}>
                                Enfoca la {field?.toLowerCase() || 'matrícula'} dentro del recuadro
                            </Text>
                        </View>

                        <View style={styles.footer}>
                            <TouchableOpacity 
                                onPress={() => setFacing(facing === 'back' ? 'front' : 'back')} 
                                style={styles.roundBtn}
                            >
                                <RefreshCcw size={24} color="#FFF" />
                            </TouchableOpacity>
                            
                            <TouchableOpacity 
                                style={[styles.captureBtn, { borderColor: colors.primary }]} 
                                onPress={handleTakePhoto}
                                disabled={loading}
                            >
                                <View style={[styles.captureInner, { backgroundColor: loading ? colors.textSecondary : colors.primary }]} />
                            </TouchableOpacity>

                            <View style={{ width: 44 }} /> 
                        </View>
                    </View>
                </CameraView>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    camera: { flex: 1 },
    overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.3)', justifyContent: 'space-between' },
    header: { 
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', 
        paddingTop: Platform.OS === 'ios' ? 50 : 20, paddingHorizontal: 20 
    },
    headerTitle: { color: '#FFF', fontSize: 16, fontWeight: 'bold', letterSpacing: 1 },
    roundBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
    
    viewfinderContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    viewfinder: { 
        width: width * 0.8, height: height * 0.25, borderWidth: 2, borderRadius: 12, 
        justifyContent: 'center', alignItems: 'center', backgroundColor: 'transparent'
    },
    scanLine: { width: '100%', height: 2, backgroundColor: '#00FF00', shadowColor: '#00FF00', shadowOpacity: 1, shadowRadius: 10, elevation: 5 },
    loadingOverlay: { backgroundColor: 'rgba(0,0,0,0.7)', padding: 20, borderRadius: 10, alignItems: 'center' },
    guideText: { color: '#FFF', marginTop: 20, fontSize: 14, textShadowColor: '#000', textShadowRadius: 3 },

    footer: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', paddingBottom: 40, paddingHorizontal: 20 },
    captureBtn: { width: 70, height: 70, borderRadius: 35, borderWidth: 4, justifyContent: 'center', alignItems: 'center' },
    captureInner: { width: 54, height: 54, borderRadius: 27 },
    btn: { paddingHorizontal: 30, paddingVertical: 15, borderRadius: 25, marginTop: 20 }
});
