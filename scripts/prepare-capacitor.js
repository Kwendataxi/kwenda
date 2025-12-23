#!/usr/bin/env node
/**
 * 🔧 KWENDA - Script de préparation Capacitor
 * 
 * Usage: node scripts/prepare-capacitor.js [client|driver|partner]
 * 
 * Ce script:
 * 1. Copie la bonne config capacitor.config.[type].ts → capacitor.config.ts
 * 2. Met à jour les ressources (icônes, splash screens)
 * 3. Affiche les informations de l'app
 */

const fs = require('fs');
const path = require('path');

// Configuration des apps
const APPS = {
  client: {
    name: 'Kwenda Client',
    id: 'cd.kwenda.client',
    config: 'capacitor.config.client.ts',
    color: '#DC2626', // Rouge
    description: 'Application client pour commander des courses VTC et livraisons'
  },
  driver: {
    name: 'Kwenda Driver',
    id: 'cd.kwenda.driver',
    config: 'capacitor.config.driver.ts',
    color: '#F59E0B', // Orange/Ambre
    description: 'Application chauffeur pour accepter et gérer les courses'
  },
  partner: {
    name: 'Kwenda Partner',
    id: 'cd.kwenda.partner',
    config: 'capacitor.config.partner.ts',
    color: '#10B981', // Vert
    description: 'Application partenaire pour gérer les flottes de véhicules'
  }
};

// Couleurs console
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logStep(step, message) {
  console.log(`${colors.cyan}[${step}]${colors.reset} ${message}`);
}

function logSuccess(message) {
  console.log(`${colors.green}✅ ${message}${colors.reset}`);
}

function logError(message) {
  console.log(`${colors.red}❌ ${message}${colors.reset}`);
}

function logWarning(message) {
  console.log(`${colors.yellow}⚠️  ${message}${colors.reset}`);
}

// Récupérer le type d'app depuis les arguments
const appType = process.argv[2];

if (!appType || !APPS[appType]) {
  logError('Type d\'application invalide ou manquant');
  console.log('\nUsage: node scripts/prepare-capacitor.js [client|driver|partner]\n');
  console.log('Applications disponibles:');
  Object.entries(APPS).forEach(([key, app]) => {
    console.log(`  ${colors.cyan}${key}${colors.reset} - ${app.name} (${app.id})`);
  });
  process.exit(1);
}

const app = APPS[appType];

console.log('\n' + '='.repeat(60));
log(`📱 KWENDA - Préparation de l'application`, 'bright');
console.log('='.repeat(60) + '\n');

console.log(`Application: ${colors.cyan}${app.name}${colors.reset}`);
console.log(`Bundle ID:   ${colors.yellow}${app.id}${colors.reset}`);
console.log(`Couleur:     ${app.color}`);
console.log(`Description: ${app.description}\n`);

// Étape 1: Vérifier que le fichier de config existe
logStep('1/4', 'Vérification de la configuration...');

const sourceConfig = path.join(process.cwd(), app.config);
const destConfig = path.join(process.cwd(), 'capacitor.config.ts');

if (!fs.existsSync(sourceConfig)) {
  logError(`Fichier de configuration non trouvé: ${app.config}`);
  process.exit(1);
}

logSuccess(`Configuration trouvée: ${app.config}`);

// Étape 2: Copier la configuration
logStep('2/4', 'Copie de la configuration Capacitor...');

try {
  fs.copyFileSync(sourceConfig, destConfig);
  logSuccess(`${app.config} → capacitor.config.ts`);
} catch (error) {
  logError(`Erreur lors de la copie: ${error.message}`);
  process.exit(1);
}

// Étape 3: Créer/Vérifier le dossier resources
logStep('3/4', 'Vérification des ressources...');

const resourcesDir = path.join(process.cwd(), 'resources', appType);

if (!fs.existsSync(resourcesDir)) {
  logWarning(`Dossier resources/${appType} non trouvé`);
  console.log(`   Créez ce dossier avec les icônes et splash screens pour ${app.name}`);
  console.log(`   Structure attendue:`);
  console.log(`   resources/${appType}/`);
  console.log(`   ├── icon.png (1024x1024)`);
  console.log(`   ├── splash.png (2732x2732)`);
  console.log(`   ├── android/`);
  console.log(`   │   └── mipmap-*/ic_launcher.png`);
  console.log(`   └── ios/`);
  console.log(`       └── AppIcon.appiconset/`);
} else {
  logSuccess(`Dossier resources/${appType} trouvé`);
  
  // Copier les ressources si elles existent
  const iconSource = path.join(resourcesDir, 'icon.png');
  const splashSource = path.join(resourcesDir, 'splash.png');
  
  if (fs.existsSync(iconSource)) {
    logSuccess('Icône trouvée');
  } else {
    logWarning('Icône (icon.png) non trouvée');
  }
  
  if (fs.existsSync(splashSource)) {
    logSuccess('Splash screen trouvé');
  } else {
    logWarning('Splash screen (splash.png) non trouvé');
  }
}

// Étape 4: Créer le fichier .env.local avec le type d'app
logStep('4/4', 'Configuration de l\'environnement...');

const envContent = `# Auto-généré par prepare-capacitor.js
# Type d'application pour le build
VITE_APP_TYPE=${appType}
VITE_APP_NAME=${app.name}
VITE_APP_ID=${app.id}
`;

try {
  fs.writeFileSync(path.join(process.cwd(), '.env.build'), envContent);
  logSuccess('Fichier .env.build créé');
} catch (error) {
  logWarning(`Impossible de créer .env.build: ${error.message}`);
}

// Résumé final
console.log('\n' + '='.repeat(60));
log('📋 RÉSUMÉ', 'bright');
console.log('='.repeat(60) + '\n');

console.log(`${colors.green}✅ Préparation terminée pour ${app.name}${colors.reset}\n`);

console.log('Prochaines étapes:');
console.log(`  1. ${colors.cyan}npm run build${colors.reset} - Compiler le projet web`);
console.log(`  2. ${colors.cyan}npx cap sync${colors.reset} - Synchroniser avec les projets natifs`);
console.log(`  3. ${colors.cyan}npx cap open android${colors.reset} ou ${colors.cyan}npx cap open ios${colors.reset}`);
console.log('');

// Afficher les commandes rapides
console.log('Commandes rapides:');
console.log(`  ${colors.yellow}npm run cap:sync:${appType}${colors.reset} - Build + Sync complet`);
console.log(`  ${colors.yellow}npm run android:build:${appType}${colors.reset} - Build Android Release`);
console.log(`  ${colors.yellow}npm run ios:build:${appType}${colors.reset} - Build iOS Release`);
console.log('');
