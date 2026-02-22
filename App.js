import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { DataProvider } from './src/context/DataContext';
import { Colors } from './src/constants';
import { StatusBar } from 'expo-status-bar';

import { CustomDrawerContent } from './src/components/CustomDrawerContent';

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

import { Home, ClipboardList, List, Wrench, LayoutDashboard, Search } from 'lucide-react-native';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();
const Drawer = createDrawerNavigator();

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
      screenOptions={{
        headerShown: false,
        tabBarStyle: { height: 60, backgroundColor: Colors.card, borderTopColor: Colors.border, paddingBottom: 5 },
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textSecondary,
        tabBarLabelStyle: { fontSize: 10, fontWeight: '600' }
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
      <Stack.Screen name="GenericDetails" component={GenericDetailsScreen} />
      <Stack.Screen name="Form" component={FormScreen} />
    </Stack.Navigator>
  );
}

export default function App() {
  return (
    <DataProvider>
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
          <Drawer.Screen name="GenericDetails" component={GenericDetailsScreen} />
          <Drawer.Screen name="Form" component={FormScreen} />
          <Drawer.Screen name="Citas" component={GenericListScreen} initialParams={{ title: 'Citas', dataKey: 'citas' }} />
          <Drawer.Screen name="Clients" component={ClientListScreen} />
          <Drawer.Screen name="InvoiceDetails" component={GenericListScreen} initialParams={{ title: 'Detalle de Factura', dataKey: 'detalleFactura' }} />
          <Drawer.Screen name="Entradas" component={GenericListScreen} initialParams={{ title: 'Entradas', dataKey: 'entradas' }} />
          <Drawer.Screen name="Facturando" component={GenericListScreen} initialParams={{ title: 'Facturando', dataKey: 'facturando' }} />
          <Drawer.Screen name="Invoices" component={InvoiceListScreen} />
          <Drawer.Screen name="FotosEntrada" component={GenericListScreen} initialParams={{ title: 'Fotos Entrada', dataKey: 'fotosEntrada' }} />
          <Drawer.Screen name="FotosSalidas" component={GenericListScreen} initialParams={{ title: 'Fotos Salidas', dataKey: 'fotosSalidas' }} />
          <Drawer.Screen name="Productos" component={GenericListScreen} initialParams={{ title: 'Productos', dataKey: 'productos' }} />
          <Drawer.Screen name="Salidas" component={GenericListScreen} initialParams={{ title: 'Salidas', dataKey: 'salidas' }} />
          <Drawer.Screen name="Tecnicos" component={GenericListScreen} initialParams={{ title: 'Técnicos', dataKey: 'tecnicos' }} />
          <Drawer.Screen name="Herramientas" component={GenericListScreen} initialParams={{ title: 'Herramientas', dataKey: 'herramientas' }} />
          <Drawer.Screen name="ReferenceStack" component={VehicleReferenceStack} />
        </Drawer.Navigator>
      </NavigationContainer>
    </DataProvider>
  );
}
