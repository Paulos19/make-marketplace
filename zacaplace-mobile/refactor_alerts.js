const fs = require('fs');
const path = require('path');

const targetDirs = ['app', 'components'];
const rootDir = process.cwd();

function getRelativeImportPath(filePath) {
  const customAlertPath = path.join(rootDir, 'components/ui/CustomAlert.tsx');
  const dir = path.dirname(filePath);
  let rel = path.relative(dir, customAlertPath).replace(/\\/g, '/').replace('.tsx', '');
  if (!rel.startsWith('.')) rel = './' + rel;
  return rel;
}

function processDirectory(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      processDirectory(fullPath);
    } else if (entry.isFile() && (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) && fullPath !== path.join(rootDir, 'components/ui/CustomAlert.tsx')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      if (content.includes('Alert.alert(')) {
        // Replace Alert.alert
        content = content.replace(/Alert\.alert\(/g, 'CustomAlert.alert(');
        
        // Add import
        const importPath = getRelativeImportPath(fullPath);
        const importStatement = `import { CustomAlert } from '${importPath}';\n`;
        
        // Insert after the last import or at the top
        const importMatch = content.lastIndexOf('import ');
        if (importMatch !== -1) {
          const endOfLine = content.indexOf('\n', importMatch);
          content = content.slice(0, endOfLine + 1) + importStatement + content.slice(endOfLine + 1);
        } else {
          content = importStatement + content;
        }
        
        fs.writeFileSync(fullPath, content, 'utf8');
        console.log('Updated: ' + fullPath);
      }
    }
  }
}

targetDirs.forEach(d => {
  const p = path.join(rootDir, d);
  if (fs.existsSync(p)) processDirectory(p);
});
