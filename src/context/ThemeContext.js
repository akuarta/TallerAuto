import React, { createContext, useContext, useState, useEffect } from 'react';
import { Appearance, useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors } from '../constants';

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
    const systemColorScheme = useColorScheme();
    const [themeMode, setThemeMode] = useState('system'); // 'dark', 'light', or 'system'
    const [currentTheme, setCurrentTheme] = useState(systemColorScheme === 'light' ? 'light' : 'dark');

    // Load persisted theme preference
    useEffect(() => {
        const loadTheme = async () => {
            try {
                const savedTheme = await AsyncStorage.getItem('user-theme-preference');
                if (savedTheme) {
                    setThemeMode(savedTheme);
                }
            } catch (e) {
                console.error('Failed to load theme preference', e);
            }
        };
        loadTheme();
    }, []);

    // Update currentTheme when themeMode or systemColorScheme changes
    useEffect(() => {
        if (themeMode === 'system') {
            setCurrentTheme(systemColorScheme === 'light' ? 'light' : 'dark');
        } else {
            setCurrentTheme(themeMode);
        }
    }, [themeMode, systemColorScheme]);

    const toggleTheme = async () => {
        const nextMode = currentTheme === 'dark' ? 'light' : 'dark';
        setThemeMode(nextMode);
        try {
            await AsyncStorage.setItem('user-theme-preference', nextMode);
        } catch (e) {
            console.error('Failed to save theme preference', e);
        }
    };

    const setTheme = async (mode) => {
        setThemeMode(mode);
        try {
            await AsyncStorage.setItem('user-theme-preference', mode);
        } catch (e) {
            console.error('Failed to save theme preference', e);
        }
    };

    const colors = Colors[currentTheme];

    return (
        <ThemeContext.Provider value={{ 
            themeMode, 
            currentTheme, 
            colors, 
            toggleTheme, 
            setTheme,
            isDark: currentTheme === 'dark'
        }}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
};
