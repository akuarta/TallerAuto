import React, { useRef, useState, useCallback } from 'react';
import {
    View, StyleSheet, Text, TouchableOpacity,
    Platform, FlatList, Modal, SafeAreaView
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { PremiumLoader } from '../components/PremiumLoader';
import { ArrowLeft, ArrowRight, RefreshCw, Globe, Home, List, X, Clock, ChevronRight } from 'lucide-react-native';

let WebView = null;
if (Platform.OS !== 'web') {
    WebView = require('react-native-webview').WebView;
}

const CHARM_ROOT = 'https://charm.li/';

function formatTime(date) {
    return date.toLocaleTimeString('es-DO', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

// ── Log panel ─────────────────────────────────────────────────────────────
function LogPanel({ visible, log, onClose, onNavigate }) {
    const { colors } = useTheme();
    const log_s = getLogStyles(colors);
    return (
        <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
            <SafeAreaView style={log_s.container}>
                {/* Header */}
                <View style={log_s.header}>
                    <View style={{ flex: 1 }}>
                        <Text style={log_s.title}>📋 Registro de Navegación</Text>
                        <Text style={log_s.subtitle}>{log.length} URLs visitadas</Text>
                    </View>
                    <TouchableOpacity style={log_s.closeBtn} onPress={onClose}>
                        <X size={20} color="#555" />
                    </TouchableOpacity>
                </View>

                {log.length === 0 ? (
                    <View style={log_s.empty}>
                        <Globe size={40} color="#DDD" />
                        <Text style={log_s.emptyText}>Ninguna navegación registrada aún</Text>
                    </View>
                ) : (
                    <FlatList
                        data={[...log].reverse()} // más reciente primero
                        keyExtractor={(_, i) => String(i)}
                        contentContainerStyle={{ padding: 12 }}
                        renderItem={({ item, index }) => (
                            <TouchableOpacity
                                style={[log_s.row, index === 0 && log_s.rowFirst]}
                                onPress={() => { onNavigate(item.url); onClose(); }}
                                activeOpacity={0.7}
                            >
                                <View style={log_s.rowLeft}>
                                    <View style={log_s.indexBadge}>
                                        <Text style={log_s.indexText}>{log.length - index}</Text>
                                    </View>
                                    <View style={{ flex: 1 }}>
                                        <Text style={log_s.rowTitle} numberOfLines={1}>
                                            {item.title || 'Sin título'}
                                        </Text>
                                        <Text style={log_s.rowUrl} numberOfLines={2}>
                                            {item.url.replace('https://charm.li/', '/')}
                                        </Text>
                                        <View style={log_s.meta}>
                                            <Clock size={10} color="#AAA" />
                                            <Text style={log_s.metaText}>{item.time}</Text>
                                        </View>
                                    </View>
                                </View>
                                <ChevronRight size={14} color="#CCC" />
                            </TouchableOpacity>
                        )}
                    />
                )}
            </SafeAreaView>
        </Modal>
    );
}

// ── CharmWebScreen ────────────────────────────────────────────────────────
export default function CharmWebScreen() {
    const { colors, isDark } = useTheme();
    const styles = getStyles(colors);
    const webRef = useRef(null);
    const [loading,    setLoading]    = useState(true);
    const [canGoBack,  setCanGoBack]  = useState(false);
    const [canGoFwd,   setCanGoFwd]   = useState(false);
    const [currentUrl, setCurrentUrl] = useState(CHARM_ROOT);
    const [navLog,     setNavLog]     = useState([]); // registro de clics
    const [showLog,    setShowLog]    = useState(false);

    // Dinámicamente aplicar el tema claro/oscuro cada vez que cambie o se cargue la página
    const applyThemeToWebView = useCallback(() => {
        if (Platform.OS !== 'web' && webRef.current) {
            webRef.current.injectJavaScript(`
                window.localStorage.setItem('APP_IS_DARK', '${isDark ? '1' : '0'}');
                true;
            `);
        }
    }, [isDark]);

    React.useEffect(() => {
        applyThemeToWebView();
    }, [isDark, applyThemeToWebView]);

    const handleNavChange = useCallback((navState) => {
        setCanGoBack(navState.canGoBack);
        setCanGoFwd(navState.canGoForward);
        const url = navState.url || '';
        setCurrentUrl(url);

        // Registrar solo si es una URL de charm.li diferente a la anterior
        setNavLog(prev => {
            const last = prev[prev.length - 1];
            if (last && last.url === url) return prev; // no duplicar
            const entry = {
                url,
                title: navState.title || '',
                time:  formatTime(new Date()),
                loading: navState.loading,
            };
            console.log('[CharmWeb] Clic →', url);
            return [...prev, entry];
        });
    }, []);

    const navigateTo = (url) => {
        webRef.current?.injectJavaScript(`window.location.href='${url}'; true;`);
    };

    // ── Web (iframe) ─────────────────────────────────────────────────────
    if (Platform.OS === 'web') {
        return (
            <View style={styles.container}>
                <View style={styles.toolbar}>
                    <Globe size={14} color={colors.textSecondary} />
                    <Text style={styles.urlText} numberOfLines={1}> {currentUrl}</Text>
                    <View style={{ flex: 1 }} />
                    <TouchableOpacity style={styles.navBtn} onPress={() => window.location.reload()}>
                        <RefreshCw size={18} color={colors.text} />
                    </TouchableOpacity>
                </View>
                <iframe 
                    src={CHARM_ROOT} 
                    style={{ 
                        flex: 1, 
                        border: 'none', 
                        width: '100%', 
                        height: '100%',
                        backgroundColor: '#FFFFFF',
                        filter: isDark ? 'invert(0.92) hue-rotate(180deg)' : 'none',
                        colorScheme: isDark ? 'dark' : 'light',
                    }} 
                    title="Charm.li" 
                />
            </View>
        );
    }

    // ── Nativo (WebView) ─────────────────────────────────────────────────
    return (
        <View style={styles.container}>
            {/* Toolbar */}
            <View style={styles.toolbar}>
                <TouchableOpacity style={[styles.navBtn, { opacity: canGoBack ? 1 : 0.3 }]} onPress={() => webRef.current?.goBack()} disabled={!canGoBack}>
                    <ArrowLeft size={18} color={colors.text} />
                </TouchableOpacity>
                <TouchableOpacity style={[styles.navBtn, { opacity: canGoFwd ? 1 : 0.3 }]} onPress={() => webRef.current?.goForward()} disabled={!canGoFwd}>
                    <ArrowRight size={18} color={colors.text} />
                </TouchableOpacity>
                <TouchableOpacity style={styles.navBtn} onPress={() => webRef.current?.reload()}>
                    <RefreshCw size={18} color={colors.text} />
                </TouchableOpacity>

                <View style={styles.urlBar}>
                    <Globe size={11} color={colors.textSecondary} style={{ marginRight: 5 }} />
                    <Text style={styles.urlText} numberOfLines={1}>
                        {currentUrl.replace('https://', '').replace('http://', '')}
                    </Text>
                </View>

                <TouchableOpacity style={styles.navBtn} onPress={() => navigateTo(CHARM_ROOT)}>
                    <Home size={18} color={colors.text} />
                </TouchableOpacity>

                {/* Botón de log con contador */}
                <TouchableOpacity style={styles.logBtn} onPress={() => setShowLog(true)}>
                    <List size={18} color={colors.primary} />
                    {navLog.length > 0 && (
                        <View style={styles.badge}>
                            <Text style={styles.badgeText}>
                                {navLog.length > 99 ? '99+' : navLog.length}
                            </Text>
                        </View>
                    )}
                </TouchableOpacity>
            </View>

            {/* WebView */}
            <WebView
                ref={webRef}
                source={{ uri: CHARM_ROOT }}
                style={styles.webview}
                onLoadStart={() => setLoading(true)}
                onLoadEnd={()  => { setLoading(false); applyThemeToWebView(); }}
                onNavigationStateChange={handleNavChange}
                javaScriptEnabled
                domStorageEnabled
                injectedJavaScriptForMainFrameOnly={false}
                setSupportMultipleWindows={false}
                injectedJavaScript={`
                    (function() {
                        // Guardar valor inicial en localStorage para sub-frames
                        if (${isDark}) { window.localStorage.setItem('APP_IS_DARK', '1'); } 
                        else if (!window.localStorage.getItem('APP_IS_DARK')) { window.localStorage.setItem('APP_IS_DARK', '0'); }

                        const styleId = 'force-theme-nuclear';
                        const force = () => {
                            let s = document.getElementById(styleId);
                            const isDarkNow = window.localStorage.getItem('APP_IS_DARK') === '1';
                            
                            if (isDarkNow) {
                                if (!s) {
                                    s = document.createElement('style');
                                    s.id = styleId;
                                    s.innerHTML = \`
                                        * { color: #FFFFFF !important; background-color: transparent !important; border-color: #333333 !important; }
                                        html, body { background-color: #000000 !important; }
                                        a { color: #5C7CFF !important; text-decoration: underline !important; }
                                        input, select, textarea { background-color: #1C1C1E !important; color: #FFFFFF !important; }
                                        img { filter: brightness(0.8) !important; }
                                    \`;
                                    if(document.head) document.head.appendChild(s);
                                }
                            } else {
                                if (s) s.remove();
                            }
                        };
                        force();
                        const obs = new MutationObserver(force);
                        if(document.documentElement) obs.observe(document.documentElement, { childList: true, subtree: true, attributes: true });
                        setInterval(force, 400);
                    })();
                    true;
                `}
                renderLoading={() => (
                    <View style={styles.loader}>
                        <PremiumLoader size={50} />
                    </View>
                )}
            />

            {loading && (
                <View style={styles.loaderOverlay}>
                    <PremiumLoader size={60} />
                    <Text style={styles.loaderText}>Sincronizando con Charm.li...</Text>
                </View>
            )}

            {/* Panel de log */}
            <LogPanel
                visible={showLog}
                log={navLog}
                onClose={() => setShowLog(false)}
                onNavigate={navigateTo}
            />
        </View>
    );
}

// ── Styles ────────────────────────────────────────────────────────────────
const getStyles = (colors) => StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    toolbar: {
        flexDirection: 'row', alignItems: 'center',
        backgroundColor: colors.card,
        paddingHorizontal: 6, paddingVertical: 7,
        borderBottomWidth: 1, borderBottomColor: colors.border,
    },
    navBtn: { width: 34, height: 34, justifyContent: 'center', alignItems: 'center', borderRadius: 8 },
    urlBar: {
        flex: 1, flexDirection: 'row', alignItems: 'center',
        backgroundColor: colors.background, borderRadius: 20,
        paddingHorizontal: 10, paddingVertical: 5, marginHorizontal: 4,
        borderWidth: 1, borderColor: colors.border,
    },
    urlText: { flex: 1, fontSize: 13, color: colors.textSecondary, fontWeight: '500' },
    logBtn: {
        width: 34, height: 34, justifyContent: 'center', alignItems: 'center',
        borderRadius: 8, position: 'relative',
    },
    badge: {
        position: 'absolute', top: 2, right: 2,
        backgroundColor: colors.primary, borderRadius: 8,
        minWidth: 16, paddingHorizontal: 3,
        alignItems: 'center', justifyContent: 'center',
    },
    badgeText: { color: '#FFF', fontSize: 9, fontWeight: 'bold' },
    webview: { flex: 1, backgroundColor: colors.background },
    loader: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background },
    loaderOverlay: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(18,18,18,0.85)' },
    loaderText: { marginTop: 10, fontSize: 14, color: colors.textSecondary, fontWeight: '500' },
});

const getLogStyles = (colors) => StyleSheet.create({
    container:  { flex: 1, backgroundColor: colors.background },
    header: {
        flexDirection: 'row', alignItems: 'center',
        backgroundColor: colors.card, padding: 16,
        borderBottomWidth: 1, borderBottomColor: colors.border,
    },
    title:    { fontSize: 16, fontWeight: 'bold', color: colors.text },
    subtitle: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
    closeBtn: { width: 36, height: 36, justifyContent: 'center', alignItems: 'center', borderRadius: 18, backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border },

    empty:     { flex: 1, justifyContent: 'center', alignItems: 'center' },
    emptyText: { color: colors.border, marginTop: 12, fontSize: 14 },

    row: {
        flexDirection: 'row', alignItems: 'center',
        backgroundColor: colors.card, borderRadius: 12, padding: 12, marginBottom: 8,
        borderWidth: 1, borderColor: colors.border,
    },
    rowFirst: { borderLeftWidth: 3, borderLeftColor: colors.primary },
    rowLeft:  { flex: 1, flexDirection: 'row', alignItems: 'flex-start' },

    indexBadge: {
        width: 24, height: 24, borderRadius: 12,
        backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center',
        marginRight: 10, marginTop: 2, borderWidth: 1, borderColor: colors.border,
    },
    indexText: { fontSize: 10, fontWeight: 'bold', color: colors.textSecondary },

    rowTitle: { fontSize: 14, fontWeight: '500', color: colors.text, marginBottom: 2 },
    rowUrl:   { fontSize: 11, color: colors.textSecondary, lineHeight: 16 },
    meta:     { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
    metaText: { fontSize: 10, color: colors.border, marginLeft: 4 },
});

