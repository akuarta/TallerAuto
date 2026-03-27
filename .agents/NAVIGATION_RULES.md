# 🚨 REGLA CRÍTICA DE NAVEGACIÓN — TallerApp

## Arquitectura de Navegación

```
DrawerNavigator
  └── "Main" → MainStack (Stack.Navigator)
        ├── "Tabs"  → MainTabs (Tab.Navigator)
        │     ├── "Dashboard"     ← DashboardScreen
        │     ├── "VehicleSearch" ← VehicleSearchScreen
        │     ├── "Orders"        ← OrderListScreen
        │     ├── "Rescue"        ← RescueListScreen
        │     ├── "VehicleManager"← VehicleManagerScreen
        │     ├── "ClientList"    ← ClientListScreen
        │     ├── "AppointmentList"← AppointmentListScreen
        │     ├── "CharmWeb"      ← CharmWebScreen (hidden, drawer only)
        │     ├── "Garage", "Billing", "Services", "TechnicianList"...
        │     └── "Settings"      ← SettingsScreen
        │
        ├── "Form"            ← FormScreen       (STACK SCREEN)
        ├── "GenericDetails"  ← GenericDetailsScreen (STACK SCREEN)
        ├── "VehicleDetails"  ← VehicleDetailsScreen (STACK SCREEN)
        ├── "RescueDetails"   ← RescueScreen         (STACK SCREEN)
        └── "VehicleTechnicalDetail"               (STACK SCREEN)
```

## ✅ REGLA: ¿Cómo navegar a pantallas Tab desde un Stack Screen?

Las pantallas **Stack** (`Form`, `GenericDetails`, `VehicleDetails`, `RescueDetails`) NO pueden navegar directamente a pantallas Tab. Deben usar el prefijo `Tabs`:

```js
// ❌ MAL — falla desde Stack screens
navigation.navigate('Dashboard')
navigation.navigate('Orders')
navigation.navigate('VehicleManager')
navigation.navigate('ClientList')

// ✅ BIEN — correcto desde Stack screens
navigation.navigate('Tabs', { screen: 'Dashboard' })
navigation.navigate('Tabs', { screen: 'Orders' })
navigation.navigate('Tabs', { screen: 'VehicleManager' })
navigation.navigate('Tabs', { screen: 'ClientList' })
```

## ✅ EXCEPCIÓN: Pantallas dentro de Tabs pueden navegar entre sí directamente

Las pantallas que **ya son Tab screens** (Dashboard, Orders, etc.) SÍ pueden navegar entre sí sin el prefijo `Tabs`:

```js
// ✅ BIEN — desde DashboardScreen (que es un Tab) hacia otro Tab
navigation.navigate('Orders')
navigation.navigate('ClientList')
```

## ✅ REGLA: Formularios (Form Screen)

Todas las pantallas pueden navegar a `Form` sin prefijo porque `Form` es un Stack screen:

```js
// ✅ BIEN — desde cualquier pantalla
navigation.navigate('Form', { title: '...', dataKey: '...', fields: [...] })
```

## Truco rápido para saber si necesitas el prefijo:

1. ¿La pantalla actual aparece en `MainTabs`? → NO necesita prefijo `Tabs`
2. ¿La pantalla actual aparece SOLO en `MainStack`? → SÍ necesita `Tabs` prefix para navegar a tabs
