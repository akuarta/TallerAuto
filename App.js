import 'react-native-gesture-handler';
import React from 'react';
import { Platform } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { DataProvider } from './src/context/DataContext';
import { Colors } from './src/constants';
import { StatusBar } from 'expo-status-bar';

import { CustomDrawerContent } from './src/components/CustomDrawerContent';
import { CustomTabBar } from './src/components/CustomTabBar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import DashboardScreen from './src/screens/DashboardScreen';
import VehicleCategoryScreen from './src/screens/VehicleCategoryScreen';
import BrandListScreen from './src/screens/BrandListScreen';
import ModelListScreen from './src/screens/ModelListScreen';
import VehicleListScreen from './src/screens/VehicleListScreen';
import VehicleDetailsScreen from './src/screens/VehicleDetailsScreen';
import ClientListScreen from './src/screens/ClientListScreen';
import ServiceListScreen from './src/screens/ServiceListScreen';
import GenericListScreen from './src/screens/GenericListScreen';
import GenericDetailsScreen from './src/screens/GenericDetailsScreen';
import VehicleSearchScreen from './src/screens/VehicleSearchScreen';
import FormScreen from './src/screens/FormScreen';
import OrderListScreen from './src/screens/OrderListScreen';
import GarageScreen from './src/screens/GarageScreen';
import InvoiceListScreen from './src/screens/InvoiceListScreen';
import VehicleManagerScreen from './src/screens/VehicleManagerScreen';
import TechnicianListScreen from './src/screens/TechnicianListScreen';
import AppointmentListScreen from './src/screens/AppointmentListScreen';
import RescueScreen from './src/screens/RescueScreen';
import RescueListScreen from './src/screens/RescueListScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import VehicleTechnicalDetailScreen from './src/screens/VehicleTechnicalDetailScreen';

import { Home, ClipboardList, List, Wrench, LayoutDashboard, Search, MapPin, Settings } from 'lucide-react-native';
import SplashScreen from './src/screens/SplashScreen';
import { useData } from './src/context/DataContext';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();
const Drawer = createDrawerNavigator();

// Silenciar la molesta advertencia de React Navigation en Web (falso positivo)
if (Platform.OS === 'web') {
  const originalConsoleError = console.error;
  console.error = (...args) => {
    if (typeof args[0] === 'string' && args[0].includes('Blocked aria-hidden')) {
      return;
    }
    originalConsoleError(...args);
  };
}

function VehicleReferenceStack() {
  return (
    <Stack.Navigator screenOptions={{
      headerShown: false,
      cardStyle: { backgroundColor: Colors.background }
    }}>
      <Stack.Screen name="VehicleCategories" component={VehicleCategoryScreen} />
      <Stack.Screen name="BrandList" component={BrandListScreen} />
      <Stack.Screen name="ModelList" component={ModelListScreen} />
      <Stack.Screen name="VehicleList" component={VehicleListScreen} />
      <Stack.Screen name="VehicleDetails" component={VehicleDetailsScreen} />
    </Stack.Navigator>
  );
}

function MainTabs() {
  return (
    <Tab.Navigator
      backBehavior="initialRoute"
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{
          tabBarIcon: ({ color }) => <Home color={color} size={24} />,
          tabBarLabel: 'INICIO',
        }}
      />
      <Tab.Screen
        name="VehicleSearch"
        component={VehicleSearchScreen}
        options={{
          tabBarIcon: ({ color }) => <Search color={color} size={24} />,
          tabBarLabel: 'BUSCAR',
        }}
      />
      <Tab.Screen
        name="Services"
        component={ServiceListScreen}
        options={{
          tabBarIcon: ({ color }) => <Wrench color={color} size={24} />,
          tabBarLabel: 'SERVICIOS'
        }}
      />
      <Tab.Screen
        name="Orders"
        component={OrderListScreen}
        options={{
          tabBarIcon: ({ color }) => <ClipboardList color={color} size={24} />,
          tabBarLabel: 'ORDENES'
        }}
      />
      <Tab.Screen
        name="Billing"
        component={InvoiceListScreen}
        options={{
          tabBarIcon: ({ color }) => <List color={color} size={24} />,
          tabBarLabel: 'FACTURACION'
        }}
      />
      <Tab.Screen
        name="Garage"
        component={GarageScreen}
        options={{
          tabBarIcon: ({ color }) => <LayoutDashboard color={color} size={24} />,
          tabBarLabel: 'GARAGE'
        }}
      />
      <Tab.Screen
        name="Rescue"
        component={RescueListScreen}
        options={{
          tabBarIcon: ({ color }) => <MapPin color={color} size={24} />,
          tabBarLabel: 'RESCATE'
        }}
      />
      <Tab.Screen
        name="RescueDetails"
        component={RescueScreen}
        options={{ unmountOnBlur: true, tabBarButton: () => null }}
      />
      <Tab.Screen
        name="AppointmentList"
        component={AppointmentListScreen}
        options={{ unmountOnBlur: true, tabBarButton: () => null }}
      />
      <Tab.Screen
        name="VehicleList"
        component={VehicleManagerScreen}
        options={{ unmountOnBlur: true, tabBarButton: () => null }}
      />
      <Tab.Screen
        name="ClientList"
        component={ClientListScreen}
        options={{ unmountOnBlur: true, tabBarButton: () => null }}
      />
      <Tab.Screen
        name="InvoicingList"
        component={GenericListScreen}
        initialParams={{ title: 'Facturando', dataKey: 'facturando' }}
        options={{ unmountOnBlur: true, tabBarButton: () => null }}
      />
      <Tab.Screen
        name="TechnicianList"
        component={TechnicianListScreen}
        options={{ unmountOnBlur: true, tabBarButton: () => null }}
      />
      <Tab.Screen
        name="GenericDetails"
        component={GenericDetailsScreen}
        options={{ unmountOnBlur: true, tabBarButton: () => null }}
      />
      <Tab.Screen
        name="Form"
        component={FormScreen}
        options={{ unmountOnBlur: true, tabBarButton: () => null }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{ unmountOnBlur: true, tabBarButton: () => null }}
      />
      <Tab.Screen
        name="VehicleTechnicalDetail"
        component={VehicleTechnicalDetailScreen}
        options={{ unmountOnBlur: true, tabBarButton: () => null }}
      />
    </Tab.Navigator>
  );
}

function MainStack() {
  return (
    <Stack.Navigator screenOptions={{
      headerShown: false,
      cardStyle: { backgroundColor: Colors.background }
    }}>
      <Stack.Screen name="Tabs" component={MainTabs} />
    </Stack.Navigator>
  );
}

function AppContent() {
  const { loading } = useData();

  if (loading) {
    return <SplashScreen />;
  }

  return (
    <NavigationContainer>
      <StatusBar style="light" />
      <Drawer.Navigator
        drawerContent={(props) => <CustomDrawerContent {...props} />}
        screenOptions={{
          headerShown: false,
          drawerStyle: { width: 300 },
        }}
      >
        <Drawer.Screen name="Main" component={MainStack} />
      </Drawer.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <DataProvider>
          <AppContent />
        </DataProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
