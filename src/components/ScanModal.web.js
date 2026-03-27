import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal } from 'react-native';
import { X, Camera } from 'lucide-react-native';

/**
 * Fallback de ScanModal para Web
 */
export const ScanModal = ({ visible, onClose, field, colors }) => {
    return (
        <Modal visible={visible} animationType="slide">
            <View style={[styles.container, { backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }]}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                        <X size={24} color={colors.text} />
                    </TouchableOpacity>
                </View>
                
                <Camera size={60} color={colors.primary} />
                <Text style={[styles.title, { color: colors.text }]}>Escáner no disponible en Web</Text>
                <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                    Por favor, utiliza la versión móvil para acceder a la funcionalidad de cámara real y escaneo OCR de {field || 'matrícula'}.
                </Text>

                <TouchableOpacity 
                    style={[styles.btn, { backgroundColor: colors.primary }]} 
                    onPress={onClose}
                >
                    <Text style={{ color: '#FFF', fontWeight: 'bold' }}>ENTENDIDO</Text>
                </TouchableOpacity>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, padding: 30 },
    header: { position: 'absolute', top: 40, right: 20 },
    closeBtn: { padding: 10 },
    title: { fontSize: 22, fontWeight: 'bold', marginTop: 20, textAlign: 'center' },
    subtitle: { fontSize: 16, marginTop: 15, textAlign: 'center', lineHeight: 24 },
    btn: { paddingHorizontal: 40, paddingVertical: 15, borderRadius: 25, marginTop: 30 }
});
