# Tab Stack Navigation Pattern

This skill documents how to implement a nested Stack navigator inside a Bottom Tab navigator to support infinite stacking of screens (like nested forms) while maintaining the Tab bar visibility and preventing layout/scroll shifts on Android.

## Architecture

1.  **Tab Navigator**: The root or main navigator for the bottom tabs.
2.  **Stack Navigator (Nested)**: Instead of providing a Screen component directly to a Tab.Screen, provide a Stack navigator.
3.  **Root Stack**: A global stack that contains the MainTabs (for when you DO want to hide the tab bar, like for technical viewers or settings).

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
  options={{ unmountOnBlur: true }} 
/>
```

## Benefits
- **Persistent Tabs**: The bottom navigation remains visible even during complex flows (e.g., adding a client while filling a rescue form).
- **Layout Stability**: Prevents `KeyboardAvoidingView` issues and scroll height jumps on Android that often occur when the tab bar disappears/reappears.
- **Deep Back Button Logic**: Allows using `navigation.canGoBack()` and `navigation.push()` to handle parent-child form relationships within the same UI context.

## Usage in Forms
To stack the same form component with different params:
1.  Navigate to the Tab root first if needed: `navigation.navigate('Form')`.
2.  Once in the Stack, use `navigation.push('MainScreen', newParams)` to add a new layer.
3.  Use `navigation.goBack()` to return to the parent form.
