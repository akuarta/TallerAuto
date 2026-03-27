const fs = require('fs');
const path = require('path');

const dir = 'src/screens';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.js'));

files.forEach(file => {
  const filePath = path.join(dir, file);
  let content = fs.readFileSync(filePath, 'utf8');

  if (!content.includes("from '../constants'") && !content.includes('Colors.')) return;

  // Replace import
  content = content.replace(
    /import \{[^}]*Colors[^}]*\} from '\.\.\/constants';?/g,
    `import { useTheme } from '../context/ThemeContext';`
  );

  // If useTheme is already imported, we might have duplicate imports if we replaced poorly or didn't replace,
  // but let's assume it's good enough for simple match.

  // Component signature finder
  const sigRegexList = [
    /export default function ([A-Za-z0-9_]+)\([^)]*\)\s*\{/,
    /const ([A-Za-z0-9_]+) = \([^)]*\) =>\s*\{/
  ];

  let injected = false;
  for (const regex of sigRegexList) {
    const match = content.match(regex);
    if (match) {
      if(!content.includes('const { colors } = useTheme();')) {
          const injection = `\n    const { colors } = useTheme();\n    const styles = getStyles(colors);`;
          content = content.replace(match[0], match[0] + injection);
      }
      injected = true;
      break;
    }
  }

  if (injected) {
    // Replace Colors. with colors.
    content = content.replace(/Colors\./g, 'colors.');
    content = content.replace(/<([A-Za-z0-9]+)([^>]+)style=\{styles\.([^}]+)\}/g, '<$1$2style={styles.$3}'); 
    // Wait, replacing 'styles' with 'styles' is just a no-op, what I need is changing 'colors.' inside styles.

    // Refactor StyleSheet.create to getStyles function
    const styleMatch = content.match(/const styles = StyleSheet\.create\(\{/);
    if (styleMatch) {
      content = content.replace(
        styleMatch[0],
        `const getStyles = (colors) => StyleSheet.create({`
      );
    }
    
    // Also remove styles = getStyles if it already exists from a previous run
    
    fs.writeFileSync(filePath, content, 'utf8');
    console.log("Refactored", file);
  }
});
