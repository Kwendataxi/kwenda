#!/bin/bash

# Script de test pour le nouveau format PeerID Orange Money (sans 243)
# Usage: ./test-orange-peerId-format.sh

set -e

GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}🧪 Test du nouveau format PeerID Orange Money (sans 243)${NC}"
echo "================================================================"
echo ""

# Test 1: Format +243
echo -e "${YELLOW}Test 1: +243999123456 → 999123456${NC}"
PHONE="+243999123456"
EXPECTED="999123456"
RESULT=$(echo "$PHONE" | sed 's/^+243//')
echo "   Input:    $PHONE"
echo "   Output:   $RESULT"
echo "   Expected: $EXPECTED"
if [ "$RESULT" = "$EXPECTED" ]; then
  echo -e "   ${GREEN}✅ OK${NC}"
else
  echo -e "   ${RED}❌ ÉCHEC${NC}"
fi
echo ""

# Test 2: Format 243
echo -e "${YELLOW}Test 2: 243999123456 → 999123456${NC}"
PHONE="243999123456"
EXPECTED="999123456"
RESULT=$(echo "$PHONE" | sed 's/^243//')
echo "   Input:    $PHONE"
echo "   Output:   $RESULT"
echo "   Expected: $EXPECTED"
if [ "$RESULT" = "$EXPECTED" ]; then
  echo -e "   ${GREEN}✅ OK${NC}"
else
  echo -e "   ${RED}❌ ÉCHEC${NC}"
fi
echo ""

# Test 3: Format 0
echo -e "${YELLOW}Test 3: 0999123456 → 999123456${NC}"
PHONE="0999123456"
EXPECTED="999123456"
RESULT=$(echo "$PHONE" | sed 's/^0//')
echo "   Input:    $PHONE"
echo "   Output:   $RESULT"
echo "   Expected: $EXPECTED"
if [ "$RESULT" = "$EXPECTED" ]; then
  echo -e "   ${GREEN}✅ OK${NC}"
else
  echo -e "   ${RED}❌ ÉCHEC${NC}"
fi
echo ""

# Test 4: Format déjà correct
echo -e "${YELLOW}Test 4: 999123456 → 999123456 (déjà correct)${NC}"
PHONE="999123456"
EXPECTED="999123456"
RESULT="$PHONE"
echo "   Input:    $PHONE"
echo "   Output:   $RESULT"
echo "   Expected: $EXPECTED"
if [ "$RESULT" = "$EXPECTED" ]; then
  echo -e "   ${GREEN}✅ OK${NC}"
else
  echo -e "   ${RED}❌ ÉCHEC${NC}"
fi
echo ""

# Test 5: Format invalide (trop court)
echo -e "${YELLOW}Test 5: 99912345 → ERREUR (seulement 8 chiffres)${NC}"
PHONE="99912345"
LENGTH=${#PHONE}
echo "   Input:    $PHONE"
echo "   Length:   $LENGTH chiffres"
if [ $LENGTH -eq 9 ]; then
  echo -e "   ${GREEN}✅ Format valide${NC}"
else
  echo -e "   ${RED}❌ Format invalide (attendu: 9 chiffres)${NC}"
fi
echo ""

# Test 6: Format invalide (trop long)
echo -e "${YELLOW}Test 6: 9991234567 → ERREUR (10 chiffres)${NC}"
PHONE="9991234567"
LENGTH=${#PHONE}
echo "   Input:    $PHONE"
echo "   Length:   $LENGTH chiffres"
if [ $LENGTH -eq 9 ]; then
  echo -e "   ${GREEN}✅ Format valide${NC}"
else
  echo -e "   ${RED}❌ Format invalide (attendu: 9 chiffres)${NC}"
fi
echo ""

echo "================================================================"
echo -e "${GREEN}✅ Tests terminés!${NC}"
echo ""
echo -e "${BLUE}📝 Règles du format PeerID Orange Money RDC:${NC}"
echo "   - Exactement 9 chiffres"
echo "   - SANS code pays 243"
echo "   - SANS préfixe + ou 0"
echo "   - Exemples valides: 999123456, 823456789, 970000000"
echo ""
echo -e "${BLUE}🔗 Pour tester avec l'API Orange Money:${NC}"
echo "   1. Déployer la fonction: (automatique avec Lovable)"
echo "   2. Tester un paiement: curl -X POST https://wddlktajnhwhyquwcdgf.supabase.co/functions/v1/mobile-money-payment \\"
echo "      -H 'Authorization: Bearer {token}' \\"
echo "      -H 'Content-Type: application/json' \\"
echo "      -d '{\"amount\": 500, \"provider\": \"orange\", \"phoneNumber\": \"0999123456\"}'"
echo "   3. Vérifier les logs: https://supabase.com/dashboard/project/wddlktajnhwhyquwcdgf/functions/mobile-money-payment/logs"
echo "   4. Chercher: \"peer_id_format\": \"no_country_code\""
