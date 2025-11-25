#!/bin/bash

# ============================================
# 🧪 Test Direct Orange Money B2B - Production RDC
# ============================================
# Ce script teste l'API Orange Money B2B RDC directement
# sans passer par Supabase pour isoler les problèmes
# ============================================

set -e

# ===== VARIABLES À CONFIGURER =====
# ⚠️ IMPORTANT : Remplacer avec vos vraies valeurs de production
CLIENT_ID="votre_client_id"
CLIENT_SECRET="votre_client_secret"
POS_ID="GeQpqUI"
PHONE="991234567"  # 9 chiffres sans 243
AMOUNT=5000

# ===== COULEURS POUR OUTPUT =====
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}============================================${NC}"
echo -e "${BLUE}🧪 Test Orange Money B2B - Production RDC${NC}"
echo -e "${BLUE}============================================${NC}"
echo ""

# ===== ÉTAPE 1 : OBTENIR LE TOKEN OAUTH =====
echo -e "${YELLOW}🔐 Étape 1/2 : Obtention du token OAuth...${NC}"
echo ""

# Calculer le header Authorization Basic
AUTH_BASIC=$(echo -n "$CLIENT_ID:$CLIENT_SECRET" | base64)
echo -e "Auth Header: Basic ${AUTH_BASIC:0:20}..."

TOKEN_RESPONSE=$(curl -s -X POST 'https://api.orange.com/oauth/v3/token' \
  -H "Authorization: Basic $AUTH_BASIC" \
  -H 'Content-Type: application/x-www-form-urlencoded' \
  -d 'grant_type=client_credentials')

# Vérifier si le token est obtenu
if echo "$TOKEN_RESPONSE" | grep -q "access_token"; then
  ACCESS_TOKEN=$(echo $TOKEN_RESPONSE | jq -r '.access_token')
  EXPIRES_IN=$(echo $TOKEN_RESPONSE | jq -r '.expires_in')
  echo -e "${GREEN}✅ Token obtenu avec succès${NC}"
  echo -e "   Token: ${ACCESS_TOKEN:0:30}..."
  echo -e "   Expire dans: ${EXPIRES_IN}s"
else
  echo -e "${RED}❌ Échec de l'obtention du token${NC}"
  echo -e "${RED}Réponse:${NC}"
  echo "$TOKEN_RESPONSE" | jq '.'
  exit 1
fi

echo ""
echo -e "${BLUE}--------------------------------------------${NC}"
echo ""

# ===== ÉTAPE 2 : INITIER LE CASHOUT =====
echo -e "${YELLOW}💳 Étape 2/2 : Initiation du Cashout B2B...${NC}"
echo ""

# Générer un ID de transaction unique
TRANSACTION_ID="KWENDA_TEST_$(date +%s)"
echo -e "Transaction ID: ${TRANSACTION_ID}"
echo -e "Montant: ${AMOUNT} CDF"
echo -e "Téléphone: ${PHONE}"
echo -e "POS ID: ${POS_ID}"
echo ""

# ===== REQUÊTE CASHOUT B2B =====
echo -e "${YELLOW}📡 Envoi de la requête à Orange...${NC}"
echo ""

CASHOUT_RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}" -X POST 'https://api.orange.com/orange-money-b2b/v1/cd/transactions' \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H 'Content-Type: application/json' \
  -H "X-Pos-Id: $POS_ID" \
  -d "{
    \"amount\": $AMOUNT,
    \"currency\": \"CDF\",
    \"partnerTransactionId\": \"$TRANSACTION_ID\",
    \"receiverMSISDN\": \"$PHONE\",
    \"description\": \"Kwenda Cashout Test\"
  }")

# Extraire le code HTTP et le body
HTTP_STATUS=$(echo "$CASHOUT_RESPONSE" | grep "HTTP_STATUS" | cut -d: -f2)
RESPONSE_BODY=$(echo "$CASHOUT_RESPONSE" | sed '/HTTP_STATUS/d')

echo -e "${BLUE}--------------------------------------------${NC}"
echo -e "${BLUE}RÉSULTATS DU TEST${NC}"
echo -e "${BLUE}--------------------------------------------${NC}"
echo ""

# ===== ANALYSER LA RÉPONSE =====
if [ "$HTTP_STATUS" -eq 200 ] || [ "$HTTP_STATUS" -eq 201 ]; then
  echo -e "${GREEN}✅ SUCCÈS - Code HTTP: ${HTTP_STATUS}${NC}"
  echo ""
  echo -e "${GREEN}Réponse Orange Money:${NC}"
  echo "$RESPONSE_BODY" | jq '.'
  echo ""
  
  # Extraire les détails
  ORANGE_TX_ID=$(echo "$RESPONSE_BODY" | jq -r '.transactionId')
  TX_STATUS=$(echo "$RESPONSE_BODY" | jq -r '.transactionStatus')
  
  echo -e "${GREEN}📋 Détails de la transaction:${NC}"
  echo -e "   Orange Transaction ID: ${ORANGE_TX_ID}"
  echo -e "   Statut: ${TX_STATUS}"
  echo -e "   Montant: ${AMOUNT} CDF"
  echo -e "   Bénéficiaire: ${PHONE}"
  
elif [ "$HTTP_STATUS" -eq 404 ]; then
  echo -e "${RED}❌ ERREUR 404 - Endpoint non trouvé${NC}"
  echo ""
  echo -e "${RED}Réponse Orange Money:${NC}"
  echo "$RESPONSE_BODY" | jq '.' 2>/dev/null || echo "$RESPONSE_BODY"
  echo ""
  echo -e "${YELLOW}🔍 Hypothèses possibles:${NC}"
  echo "   1. URL incorrecte pour l'environnement RDC"
  echo "   2. Credentials non activés pour la production"
  echo "   3. POS_ID invalide"
  echo "   4. Endpoint spécifique RDC différent"
  echo ""
  echo -e "${YELLOW}💡 Actions recommandées:${NC}"
  echo "   - Vérifier l'URL exacte avec Orange Developer Support"
  echo "   - Confirmer l'activation des credentials en production"
  echo "   - Tester avec un autre POS_ID si disponible"
  
elif [ "$HTTP_STATUS" -eq 401 ]; then
  echo -e "${RED}❌ ERREUR 401 - Non autorisé${NC}"
  echo ""
  echo -e "${RED}Réponse:${NC}"
  echo "$RESPONSE_BODY" | jq '.' 2>/dev/null || echo "$RESPONSE_BODY"
  echo ""
  echo -e "${YELLOW}💡 Le token OAuth est peut-être expiré ou invalide${NC}"
  
else
  echo -e "${RED}❌ ERREUR - Code HTTP: ${HTTP_STATUS}${NC}"
  echo ""
  echo -e "${RED}Réponse complète:${NC}"
  echo "$RESPONSE_BODY" | jq '.' 2>/dev/null || echo "$RESPONSE_BODY"
fi

echo ""
echo -e "${BLUE}--------------------------------------------${NC}"
echo -e "${BLUE}📊 URL testée:${NC}"
echo "https://api.orange.com/orange-money-b2b/v1/cd/transactions"
echo ""
echo -e "${BLUE}📋 Payload envoyé:${NC}"
cat << EOF | jq '.'
{
  "amount": $AMOUNT,
  "currency": "CDF",
  "partnerTransactionId": "$TRANSACTION_ID",
  "receiverMSISDN": "$PHONE",
  "description": "Kwenda Cashout Test"
}
EOF
echo ""
echo -e "${BLUE}🔑 Headers envoyés:${NC}"
echo "Authorization: Bearer ${ACCESS_TOKEN:0:30}..."
echo "Content-Type: application/json"
echo "X-Pos-Id: $POS_ID"
echo ""
echo -e "${BLUE}============================================${NC}"

# Retourner le code HTTP comme exit code
if [ "$HTTP_STATUS" -eq 200 ] || [ "$HTTP_STATUS" -eq 201 ]; then
  exit 0
else
  exit 1
fi
