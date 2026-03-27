const fs = require('fs');
const path = require('path');

const dir = 'src/screens';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.js'));

files.forEach(file => {
  const filePath = path.join(dir, file);
  let content = fs.readFileSync(filePath, 'utf8');

  // Skips files that we already refactored manually
  if (['VehicleManagerScreen.js', 'ClientListScreen.js', 'OrderListScreen.js', 'AppointmentListScreen.js', 'VehicleDetailsScreen.js', 'GenericDetailsScreen.js', 'FormScreen.js'].includes(file)) return;

  if (!content.includes('Colors.')) return;

  // Ensure useTheme is imported
  if (!content.includes("import { useTheme }")) {
      content = content.replace(/import \{.*?Colors.*?\} from '\.\.\/constants';?/, `import { useTheme } from '../context/ThemeContext';`);
  } else {
      content = content.replace(/import \{.*?Colors.*?\} from '\.\.\/constants';?\n?/, "");
  }

  // Find the default export function
  const exportMatch = content.match(/export default function ([A-Za-z0-9_]+)\([^)]*\)\s*\{/);
  if (exportMatch) {
      if (!content.includes('const { colors } = useTheme();')) {
          content = content.replace(exportMatch[0], exportMatch[0] + "\n    const { colors } = useTheme();\n    const styles = getStyles(colors);");
      }
      content = content.replace(/Colors\./g, 'colors.');
      
      const styleMatch = content.match(/const styles = StyleSheet\.create\(\{/);
      if (styleMatch) {
          content = content.replace(styleMatch[0], 'const getStyles = (colors) => StyleSheet.create({');
      }

      fs.writeFileSync(filePath, content, 'utf8');
      console.log("Refactored", file);
  }
});
