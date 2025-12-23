#!/usr/bin/env node

/**
 * 🔥 KWENDA - Script de Configuration Firebase
 * 
 * Ce script configure les fichiers Firebase pour les notifications push.
 * 
 * Usage:
 *   node scripts/setup-firebase.js           # Mode interactif
 *   node scripts/setup-firebase.js client    # Configurer app Client
 *   node scripts/setup-firebase.js driver    # Configurer app Chauffeur
 *   node scripts/setup-firebase.js partner   # Configurer app Partenaire
 *   node scripts/setup-firebase.js all       # Configurer toutes les apps
 *   node scripts/setup-firebase.js validate  # Valider la configuration
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

// Configuration des apps
const APPS = {
  client: {
    name: 'Kwenda Client',
    packageId: 'cd.kwenda.client',
    color: '\x1b[31m' // Rouge
  },
  driver: {
    name: 'Kwenda Chauffeur',
    packageId: 'cd.kwenda.driver',
    color: '\x1b[33m' // Orange/Jaune
  },
  partner: {
    name: 'Kwenda Partenaire',
    packageId: 'cd.kwenda.partner',
    color: '\x1b[32m' // Vert
  }
};

const RESET = '\x1b[0m';
const BOLD = '\x1b[1m';
const GREEN = '\x1b[32m';
const RED = '\x1b[31m';
const YELLOW = '\x1b[33m';
const CYAN = '\x1b[36m';

// Chemins
const FIREBASE_DIR = path.join(__dirname, '..', 'firebase');
const ANDROID_DIR = path.join(__dirname, '..', 'android', 'app');
const IOS_DIR = path.join(__dirname, '..', 'ios', 'App', 'App');

/**
 * Affiche le header
 */
function printHeader() {
  console.log(`
${CYAN}╔════════════════════════════════════════════════════════════╗
║                                                            ║
║   🔥 KWENDA - Configuration Firebase                       ║
║   Notifications Push pour Android & iOS                    ║
║                                                            ║
╚════════════════════════════════════════════════════════════╝${RESET}
  `);
}

/**
 * Crée une interface readline
 */
function createReadline() {
  return readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
}

/**
 * Pose une question et attend la réponse
 */
function askQuestion(rl, question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer.trim().toLowerCase());
    });
  });
}

/**
 * Vérifie si un fichier Firebase existe
 */
function checkFirebaseFile(appType, platform) {
  const fileName = platform === 'android' ? 'google-services.json' : 'GoogleService-Info.plist';
  const filePath = path.join(FIREBASE_DIR, appType, fileName);
  return fs.existsSync(filePath);
}

/**
 * Valide le contenu d'un fichier google-services.json
 */
function validateGoogleServices(appType) {
  const filePath = path.join(FIREBASE_DIR, appType, 'google-services.json');
  
  if (!fs.existsSync(filePath)) {
    return { valid: false, error: 'Fichier non trouvé' };
  }
  
  try {
    const content = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    const expectedPackage = APPS[appType].packageId;
    
    // Vérifier le package name
    const client = content.client?.[0];
    if (!client) {
      return { valid: false, error: 'Structure client manquante' };
    }
    
    const packageName = client.client_info?.android_client_info?.package_name;
    if (packageName !== expectedPackage) {
      return { 
        valid: false, 
        error: `Package incorrect: ${packageName} (attendu: ${expectedPackage})` 
      };
    }
    
    // Vérifier les clés essentielles
    if (!content.project_info?.project_id) {
      return { valid: false, error: 'project_id manquant' };
    }
    
    if (!client.api_key?.[0]?.current_key) {
      return { valid: false, error: 'API key manquante' };
    }
    
    return { 
      valid: true, 
      projectId: content.project_info.project_id,
      packageName 
    };
  } catch (error) {
    return { valid: false, error: `Erreur de parsing: ${error.message}` };
  }
}

/**
 * Valide le contenu d'un fichier GoogleService-Info.plist
 */
function validateGoogleServiceInfo(appType) {
  const filePath = path.join(FIREBASE_DIR, appType, 'GoogleService-Info.plist');
  
  if (!fs.existsSync(filePath)) {
    return { valid: false, error: 'Fichier non trouvé' };
  }
  
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const expectedBundle = APPS[appType].packageId;
    
    // Vérifier le bundle ID (simple regex)
    const bundleMatch = content.match(/<key>BUNDLE_ID<\/key>\s*<string>([^<]+)<\/string>/);
    if (!bundleMatch) {
      return { valid: false, error: 'BUNDLE_ID non trouvé' };
    }
    
    const bundleId = bundleMatch[1];
    if (bundleId !== expectedBundle) {
      return { 
        valid: false, 
        error: `Bundle ID incorrect: ${bundleId} (attendu: ${expectedBundle})` 
      };
    }
    
    // Vérifier GCM_SENDER_ID
    const senderMatch = content.match(/<key>GCM_SENDER_ID<\/key>\s*<string>([^<]+)<\/string>/);
    if (!senderMatch || senderMatch[1] === 'VOTRE_SENDER_ID') {
      return { valid: false, error: 'GCM_SENDER_ID invalide' };
    }
    
    return { 
      valid: true, 
      bundleId,
      senderId: senderMatch[1]
    };
  } catch (error) {
    return { valid: false, error: `Erreur de lecture: ${error.message}` };
  }
}

/**
 * Copie les fichiers Firebase vers les dossiers natifs
 */
function copyFirebaseFiles(appType) {
  const results = { android: false, ios: false };
  
  // Copier google-services.json vers Android
  const androidSource = path.join(FIREBASE_DIR, appType, 'google-services.json');
  const androidDest = path.join(ANDROID_DIR, 'google-services.json');
  
  if (fs.existsSync(androidSource)) {
    try {
      // Créer le dossier si nécessaire
      if (!fs.existsSync(ANDROID_DIR)) {
        fs.mkdirSync(ANDROID_DIR, { recursive: true });
      }
      fs.copyFileSync(androidSource, androidDest);
      results.android = true;
      console.log(`${GREEN}✓${RESET} Copié: google-services.json → android/app/`);
    } catch (error) {
      console.log(`${RED}✗${RESET} Erreur copie Android: ${error.message}`);
    }
  } else {
    console.log(`${YELLOW}⚠${RESET} google-services.json non trouvé pour ${appType}`);
  }
  
  // Copier GoogleService-Info.plist vers iOS
  const iosSource = path.join(FIREBASE_DIR, appType, 'GoogleService-Info.plist');
  const iosDest = path.join(IOS_DIR, 'GoogleService-Info.plist');
  
  if (fs.existsSync(iosSource)) {
    try {
      // Créer le dossier si nécessaire
      if (!fs.existsSync(IOS_DIR)) {
        fs.mkdirSync(IOS_DIR, { recursive: true });
      }
      fs.copyFileSync(iosSource, iosDest);
      results.ios = true;
      console.log(`${GREEN}✓${RESET} Copié: GoogleService-Info.plist → ios/App/App/`);
    } catch (error) {
      console.log(`${RED}✗${RESET} Erreur copie iOS: ${error.message}`);
    }
  } else {
    console.log(`${YELLOW}⚠${RESET} GoogleService-Info.plist non trouvé pour ${appType}`);
  }
  
  return results;
}

/**
 * Affiche le statut de configuration pour une app
 */
function printAppStatus(appType) {
  const app = APPS[appType];
  console.log(`\n${app.color}${BOLD}${app.name}${RESET} (${app.packageId})`);
  console.log('─'.repeat(50));
  
  // Android
  const hasAndroid = checkFirebaseFile(appType, 'android');
  const androidValidation = hasAndroid ? validateGoogleServices(appType) : null;
  
  if (hasAndroid && androidValidation?.valid) {
    console.log(`  ${GREEN}✓${RESET} Android: google-services.json ${GREEN}(valide)${RESET}`);
    console.log(`    └─ Project: ${androidValidation.projectId}`);
  } else if (hasAndroid) {
    console.log(`  ${RED}✗${RESET} Android: google-services.json ${RED}(invalide)${RESET}`);
    console.log(`    └─ ${androidValidation?.error}`);
  } else {
    console.log(`  ${YELLOW}○${RESET} Android: google-services.json ${YELLOW}(manquant)${RESET}`);
  }
  
  // iOS
  const hasIOS = checkFirebaseFile(appType, 'ios');
  const iosValidation = hasIOS ? validateGoogleServiceInfo(appType) : null;
  
  if (hasIOS && iosValidation?.valid) {
    console.log(`  ${GREEN}✓${RESET} iOS: GoogleService-Info.plist ${GREEN}(valide)${RESET}`);
    console.log(`    └─ Sender ID: ${iosValidation.senderId}`);
  } else if (hasIOS) {
    console.log(`  ${RED}✗${RESET} iOS: GoogleService-Info.plist ${RED}(invalide)${RESET}`);
    console.log(`    └─ ${iosValidation?.error}`);
  } else {
    console.log(`  ${YELLOW}○${RESET} iOS: GoogleService-Info.plist ${YELLOW}(manquant)${RESET}`);
  }
  
  return {
    android: hasAndroid && androidValidation?.valid,
    ios: hasIOS && iosValidation?.valid
  };
}

/**
 * Configure une application spécifique
 */
async function configureApp(appType) {
  const app = APPS[appType];
  console.log(`\n${CYAN}━━━ Configuration de ${app.name} ━━━${RESET}\n`);
  
  // Vérifier les fichiers
  const hasAndroid = checkFirebaseFile(appType, 'android');
  const hasIOS = checkFirebaseFile(appType, 'ios');
  
  if (!hasAndroid && !hasIOS) {
    console.log(`${YELLOW}⚠ Aucun fichier Firebase trouvé pour ${app.name}${RESET}`);
    console.log(`\nPlacez les fichiers dans: ${CYAN}firebase/${appType}/${RESET}`);
    console.log(`  - google-services.json (depuis Firebase Console > Android)`);
    console.log(`  - GoogleService-Info.plist (depuis Firebase Console > iOS)`);
    return false;
  }
  
  // Valider
  if (hasAndroid) {
    const validation = validateGoogleServices(appType);
    if (!validation.valid) {
      console.log(`${RED}✗ google-services.json invalide: ${validation.error}${RESET}`);
      return false;
    }
    console.log(`${GREEN}✓ google-services.json valide${RESET}`);
  }
  
  if (hasIOS) {
    const validation = validateGoogleServiceInfo(appType);
    if (!validation.valid) {
      console.log(`${RED}✗ GoogleService-Info.plist invalide: ${validation.error}${RESET}`);
      return false;
    }
    console.log(`${GREEN}✓ GoogleService-Info.plist valide${RESET}`);
  }
  
  // Copier vers les dossiers natifs
  console.log(`\n${CYAN}Copie vers les projets natifs...${RESET}`);
  const copyResults = copyFirebaseFiles(appType);
  
  return copyResults.android || copyResults.ios;
}

/**
 * Affiche les instructions pour obtenir les fichiers Firebase
 */
function printInstructions() {
  console.log(`
${CYAN}${BOLD}📋 Comment obtenir les fichiers Firebase${RESET}

${BOLD}1. Créez un projet Firebase${RESET}
   → Allez sur ${CYAN}https://console.firebase.google.com/${RESET}
   → Cliquez sur "Ajouter un projet"
   → Nommez-le "kwenda-app" (ou autre)

${BOLD}2. Ajoutez les applications Android${RESET}
   Pour chaque app (Client, Driver, Partner):
   → Cliquez sur l'icône Android
   → Entrez le package name:
     • Client:  ${GREEN}cd.kwenda.client${RESET}
     • Driver:  ${GREEN}cd.kwenda.driver${RESET}
     • Partner: ${GREEN}cd.kwenda.partner${RESET}
   → Téléchargez ${CYAN}google-services.json${RESET}
   → Placez-le dans ${CYAN}firebase/[client|driver|partner]/${RESET}

${BOLD}3. Ajoutez les applications iOS${RESET}
   Pour chaque app:
   → Cliquez sur l'icône iOS
   → Entrez le bundle ID (même que package Android)
   → Téléchargez ${CYAN}GoogleService-Info.plist${RESET}
   → Placez-le dans ${CYAN}firebase/[client|driver|partner]/${RESET}

${BOLD}4. Activez Cloud Messaging${RESET}
   → Allez dans Paramètres > Cloud Messaging
   → Notez la "Server Key" pour les notifications serveur
   → Ajoutez-la dans Supabase: ${CYAN}FIREBASE_SERVER_KEY${RESET}

${BOLD}5. Exécutez ce script à nouveau${RESET}
   → ${CYAN}node scripts/setup-firebase.js${RESET}
`);
}

/**
 * Mode validation uniquement
 */
function validateAll() {
  console.log(`\n${CYAN}${BOLD}Validation de la configuration Firebase${RESET}\n`);
  
  let allValid = true;
  
  for (const appType of Object.keys(APPS)) {
    const status = printAppStatus(appType);
    if (!status.android && !status.ios) {
      allValid = false;
    }
  }
  
  console.log('\n' + '═'.repeat(50));
  
  if (allValid) {
    console.log(`${GREEN}${BOLD}✓ Toutes les configurations sont valides!${RESET}`);
  } else {
    console.log(`${YELLOW}${BOLD}⚠ Certaines configurations sont manquantes ou invalides${RESET}`);
    console.log(`\nExécutez ${CYAN}node scripts/setup-firebase.js${RESET} pour plus d'infos.`);
  }
  
  return allValid;
}

/**
 * Mode interactif
 */
async function interactiveMode() {
  const rl = createReadline();
  
  // Afficher le statut actuel
  console.log(`${CYAN}${BOLD}Statut actuel de la configuration:${RESET}`);
  
  const statuses = {};
  for (const appType of Object.keys(APPS)) {
    statuses[appType] = printAppStatus(appType);
  }
  
  console.log('\n' + '═'.repeat(50));
  
  // Vérifier si des fichiers manquent
  const missingApps = Object.entries(statuses)
    .filter(([_, status]) => !status.android && !status.ios)
    .map(([appType]) => appType);
  
  if (missingApps.length === 3) {
    console.log(`\n${YELLOW}Aucun fichier Firebase configuré.${RESET}`);
    printInstructions();
    rl.close();
    return;
  }
  
  // Proposer les actions
  console.log(`\n${BOLD}Que voulez-vous faire ?${RESET}`);
  console.log('  1. Copier les fichiers vers les projets natifs');
  console.log('  2. Voir les instructions de configuration');
  console.log('  3. Valider la configuration');
  console.log('  4. Quitter');
  
  const choice = await askQuestion(rl, '\nVotre choix (1-4): ');
  
  switch (choice) {
    case '1':
      console.log(`\n${CYAN}Quelle application configurer ?${RESET}`);
      console.log('  1. Client');
      console.log('  2. Driver');
      console.log('  3. Partner');
      console.log('  4. Toutes');
      
      const appChoice = await askQuestion(rl, '\nVotre choix (1-4): ');
      const appTypes = appChoice === '4' 
        ? Object.keys(APPS) 
        : [['client', 'driver', 'partner'][parseInt(appChoice) - 1]];
      
      for (const appType of appTypes) {
        if (appType) {
          await configureApp(appType);
        }
      }
      break;
      
    case '2':
      printInstructions();
      break;
      
    case '3':
      validateAll();
      break;
      
    case '4':
    default:
      console.log('\nAu revoir! 👋');
  }
  
  rl.close();
}

/**
 * Point d'entrée principal
 */
async function main() {
  printHeader();
  
  const args = process.argv.slice(2);
  const command = args[0];
  
  if (!command) {
    // Mode interactif
    await interactiveMode();
  } else if (command === 'validate') {
    // Validation uniquement
    validateAll();
  } else if (command === 'all') {
    // Configurer toutes les apps
    for (const appType of Object.keys(APPS)) {
      await configureApp(appType);
    }
  } else if (APPS[command]) {
    // Configurer une app spécifique
    await configureApp(command);
  } else {
    console.log(`${RED}Commande inconnue: ${command}${RESET}`);
    console.log(`\nUsage:`);
    console.log(`  node scripts/setup-firebase.js           # Mode interactif`);
    console.log(`  node scripts/setup-firebase.js client    # Configurer Client`);
    console.log(`  node scripts/setup-firebase.js driver    # Configurer Driver`);
    console.log(`  node scripts/setup-firebase.js partner   # Configurer Partner`);
    console.log(`  node scripts/setup-firebase.js all       # Toutes les apps`);
    console.log(`  node scripts/setup-firebase.js validate  # Valider`);
    process.exit(1);
  }
}

main().catch(console.error);
