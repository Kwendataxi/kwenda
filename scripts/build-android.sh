#!/bin/bash

# ============================================
# 🚀 Kwenda - Script de Build Android Complet
# ============================================

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}"
echo "╔════════════════════════════════════════╗"
echo "║     🚀 KWENDA ANDROID BUILD SCRIPT     ║"
echo "╚════════════════════════════════════════╝"
echo -e "${NC}"

# Vérifier les prérequis
echo -e "${YELLOW}📋 Vérification des prérequis...${NC}"

if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js n'est pas installé${NC}"
    exit 1
fi

if ! command -v npm &> /dev/null; then
    echo -e "${RED}❌ npm n'est pas installé${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Node.js $(node -v) détecté${NC}"
echo -e "${GREEN}✅ npm $(npm -v) détecté${NC}"

# Étape 1: Mise à jour des dépendances
echo ""
echo -e "${BLUE}📦 Étape 1/5 : Installation des dépendances...${NC}"
npm install

# Étape 2: Supprimer l'ancien dossier Android
echo ""
echo -e "${BLUE}🗑️  Étape 2/5 : Nettoyage du dossier Android...${NC}"
if [ -d "android" ]; then
    rm -rf android
    echo -e "${GREEN}✅ Ancien dossier android supprimé${NC}"
else
    echo -e "${YELLOW}⚠️  Pas de dossier android existant${NC}"
fi

# Étape 3: Build web
echo ""
echo -e "${BLUE}🏗️  Étape 3/5 : Build de l'application web...${NC}"
npm run build

if [ ! -d "dist" ]; then
    echo -e "${RED}❌ Le build a échoué - dossier dist non trouvé${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Build web terminé${NC}"

# Étape 4: Ajouter Android
echo ""
echo -e "${BLUE}📱 Étape 4/5 : Ajout de la plateforme Android...${NC}"
npx cap add android

if [ ! -f "android/gradlew" ]; then
    echo -e "${RED}❌ L'ajout d'Android a échoué - gradlew non trouvé${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Plateforme Android ajoutée${NC}"

# Étape 5: Synchronisation
echo ""
echo -e "${BLUE}🔄 Étape 5/5 : Synchronisation Capacitor...${NC}"
npx cap sync android
echo -e "${GREEN}✅ Synchronisation terminée${NC}"

# Vérifier google-services.json
echo ""
if [ -f "android/app/google-services.json" ]; then
    echo -e "${GREEN}✅ google-services.json détecté${NC}"
else
    echo -e "${YELLOW}⚠️  google-services.json manquant${NC}"
    echo -e "${YELLOW}   Copiez-le depuis Firebase Console :${NC}"
    echo -e "${YELLOW}   cp ~/Downloads/google-services.json android/app/${NC}"
fi

# Résumé
echo ""
echo -e "${GREEN}"
echo "╔════════════════════════════════════════╗"
echo "║      ✅ BUILD ANDROID TERMINÉ !        ║"
echo "╚════════════════════════════════════════╝"
echo -e "${NC}"

echo ""
echo -e "${BLUE}📁 Structure générée :${NC}"
echo "   android/"
echo "   ├── gradlew ✓"
echo "   ├── gradlew.bat ✓"
echo "   ├── gradle/wrapper/ ✓"
echo "   ├── build.gradle ✓"
echo "   └── app/"
echo "       ├── build.gradle ✓"
echo "       └── src/main/assets/public/ ✓"

echo ""
echo -e "${BLUE}🚀 Prochaines étapes :${NC}"
echo "   1. Copier google-services.json (si pas fait)"
echo "   2. npx cap open android"
echo "   3. Build > Generate Signed Bundle / APK"
echo "   4. Publier sur Google Play Console"

echo ""
echo -e "${YELLOW}💡 Astuce : Exécutez 'npx cap open android' pour ouvrir Android Studio${NC}"
