# Tab Stack Navigation Pattern

This skill documents how to implement a nested Stack navigator inside a Bottom Tab navigator to support infinite stacking of screens (like nested forms) while maintaining the Tab bar visibility and preventing layout/scroll shifts on Android.

## Architecture

1.  **Tab Navigator**: The root or main navigator for the bottom tabs.
2.  **Stack Navigator (Nested)**: Instead of providing a Screen component directly to a Tab.Screen, provide a Stack navigator.
3.  **Root Stack**: A global stack that contains the MainTabs.

### Implementation in React Navigation

```javascript
const SubStack = createStackNavigator();

function SubNavigator() {
  return (
    <SubStack.Navigator screenOptions={{ headerShown: false }}>
      <SubStack.Screen name="MainScreen" component={MyScreen} />
    </SubStack.Navigator>
  );
}

// Inside MainTabs
<Tab.Screen 
  name="TabName" 
  component={SubNavigator} 
  initialParams={{ fields: [] }} // ROBUSTNESS: Ensure initial params exist
  options={{ unmountOnBlur: true }} 
/>
```

## Critical Fix: Parameter Robustness
When using nested stacks, navigators might lose or not receive params during transition/tab switching. Always protect your components with default empty values:
- Use `(fields || []).map(...)` instead of `fields.map(...)`.
- Use `const getIdField = () => (fields || []).find(...)`.
- Define `initialParams` in the Tab definition to prevent `undefined` properties during mount.

## Benefits
- **Persistent Tabs**: The bottom navigation remains visible even during complex flows (e.g., adding a client while filling a rescue form).
- **Layout Stability**: Prevents `KeyboardAvoidingView` issues and scroll height jumps on Android.
- **Deep Back Button Logic**: Allows using `navigation.canGoBack()` and `navigation.push()` to handle parent-child form relationships within the same UI context.

## Usage in Forms
To stack the same form component with different params:
1.  Navigate to the Tab root first if needed: `navigation.navigate('Form')`.
2.  Once in the Stack, use `navigation.push('MainScreen', newParams)` to add a new layer.
3.  Use `navigation.goBack()` to return to the parent form.
