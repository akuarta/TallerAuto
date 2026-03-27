const fs = require('fs');

const run = () => {
  const filePath = 'src/screens/FormScreen.js';
  let content = fs.readFileSync(filePath, 'utf8');

  // Replace import
  content = content.replace(
    /import \{ Colors \} from '\.\.\/constants';/g,
    `import { useTheme } from '../context/ThemeContext';`
  );

  // Replace the component signature to include the hooks
  const sigMatch = content.match(/export default function FormScreen\(\{[^}]+\}\) \{/);
  if (sigMatch) {
    const injection = `\n    const { colors } = useTheme();\n    const styles = getStyles(colors);`;
    content = content.replace(sigMatch[0], sigMatch[0] + injection);
  } else {
    console.log("Could not find FormScreen signature");
  }

  // Replace all instances of Colors. to colors.
  content = content.replace(/Colors\./g, 'colors.');

  // Refactor StyleSheet.create to getStyles function
  const styleMatch = content.match(/(const styles = StyleSheet\.create\(\{)/);
  if (styleMatch) {
    content = content.replace(
      styleMatch[0],
      `const getStyles = (colors) => StyleSheet.create({`
    );
  } else {
    console.log("Could not find styles definition");
  }

  fs.writeFileSync(filePath, content, 'utf8');
  console.log("Done refactoring FormScreen.js");
};

run();
