#!/bin/bash

# 🚀 Script de Deploy Automático - Dashboard Analytics
# Uso: ./deploy.sh

set -e  # Para execução em caso de erro

echo "🚀 Iniciando deploy do Dashboard Analytics..."
echo ""

# Cores para output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 1. Verificar se há mudanças remotas
echo -e "${BLUE}📡 Verificando atualizações...${NC}"
git fetch origin

# Verificar se há mudanças
LOCAL=$(git rev-parse @)
REMOTE=$(git rev-parse @{u})

if [ $LOCAL = $REMOTE ]; then
    echo -e "${YELLOW}⚠️  Nenhuma atualização disponível.${NC}"
    read -p "Deseja reconstruir o container mesmo assim? (s/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Ss]$ ]]; then
        echo "Deploy cancelado."
        exit 0
    fi
else
    echo -e "${GREEN}✅ Atualizações encontradas!${NC}"
fi

# 2. Fazer backup do commit atual
CURRENT_COMMIT=$(git rev-parse --short HEAD)
echo -e "${BLUE}📝 Commit atual: $CURRENT_COMMIT${NC}"

# 3. Pull das mudanças
echo -e "${BLUE}⬇️  Baixando atualizações...${NC}"
git pull origin main

NEW_COMMIT=$(git rev-parse --short HEAD)
echo -e "${GREEN}✅ Atualizado para commit: $NEW_COMMIT${NC}"
echo ""

# 4. Parar container atual
echo -e "${BLUE}⏸️  Parando container...${NC}"
docker compose -f docker-compose.analytics.yml down

# 5. Rebuild do container
echo -e "${BLUE}🔨 Reconstruindo container...${NC}"
docker compose -f docker-compose.analytics.yml build --no-cache

# 6. Iniciar container
echo -e "${BLUE}▶️  Iniciando container...${NC}"
docker compose -f docker-compose.analytics.yml up -d

# 7. Aguardar container iniciar
echo -e "${BLUE}⏳ Aguardando container iniciar...${NC}"
sleep 5

# 8. Verificar status
echo ""
echo -e "${BLUE}📊 Status do container:${NC}"
docker ps | grep analytics-dashboard

# 9. Mostrar logs
echo ""
echo -e "${BLUE}📋 Últimos logs (Ctrl+C para sair):${NC}"
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
docker logs analytics-dashboard --tail 50 -f
