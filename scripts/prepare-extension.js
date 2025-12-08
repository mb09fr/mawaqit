import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Copier manifest.json dans dist
const manifestSrc = path.resolve(__dirname, '../manifest.json');
const manifestDest = path.resolve(__dirname, '../dist/manifest.json');

fs.copyFileSync(manifestSrc, manifestDest);
console.log('✓ manifest.json copié dans dist/');

// Créer le dossier icons dans dist si nécessaire
const iconsDir = path.resolve(__dirname, '../dist/icons');
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

// Copier les icons si ils existent
const iconsSrcDir = path.resolve(__dirname, '../icons');
if (fs.existsSync(iconsSrcDir)) {
  const files = fs.readdirSync(iconsSrcDir);
  files.forEach(file => {
    fs.copyFileSync(
      path.join(iconsSrcDir, file),
      path.join(iconsDir, file)
    );
  });
  console.log('✓ Icons copiés dans dist/icons/');
} else {
  console.log('⚠ Dossier icons/ non trouvé - créez vos icônes');
}

console.log('\n✓ Extension prête dans le dossier dist/');
console.log('Pour charger l\'extension dans Chrome:');
console.log('1. Ouvrez chrome://extensions/');
console.log('2. Activez le "Mode développeur"');
console.log('3. Cliquez sur "Charger l\'extension non empaquetée"');
console.log('4. Sélectionnez le dossier dist/');