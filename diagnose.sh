#!/bin/bash

# 🔍 Script de Diagnóstico Docker - Dashboard Analytics

echo "🔍 Diagnóstico do Container Analytics Dashboard"
echo "=============================================="
echo ""

# Cores
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 1. Verificar se o container está rodando
echo -e "${BLUE}1. Status do Container${NC}"
echo "---"
if docker ps | grep -q analytics-dashboard; then
    echo -e "${GREEN}✅ Container está rodando${NC}"
    docker ps | grep analytics-dashboard
else
    echo -e "${RED}❌ Container NÃO está rodando${NC}"
    echo ""
    echo "Containers parados:"
    docker ps -a | grep analytics-dashboard
fi
echo ""

# 2. Verificar logs do container
echo -e "${BLUE}2. Últimos Logs do Container${NC}"
echo "---"
docker logs analytics-dashboard --tail 30 2>&1
echo ""

# 3. Verificar porta
echo -e "${BLUE}3. Verificação de Porta 8020${NC}"
echo "---"
if command -v netstat &> /dev/null; then
    netstat -tuln | grep 8020 || echo -e "${YELLOW}⚠️  Porta 8020 não está sendo escutada${NC}"
elif command -v ss &> /dev/null; then
    ss -tuln | grep 8020 || echo -e "${YELLOW}⚠️  Porta 8020 não está sendo escutada${NC}"
else
    echo -e "${YELLOW}⚠️  Comandos netstat/ss não disponíveis${NC}"
fi
echo ""

# 4. Verificar mapeamento de portas do Docker
echo -e "${BLUE}4. Mapeamento de Portas do Docker${NC}"
echo "---"
docker port analytics-dashboard 2>&1 || echo -e "${RED}❌ Não foi possível verificar portas${NC}"
echo ""

# 5. Verificar arquivo .env.local
echo -e "${BLUE}5. Arquivo .env.local${NC}"
echo "---"
if [ -f .env.local ]; then
    echo -e "${GREEN}✅ Arquivo .env.local existe${NC}"
    echo "Variáveis configuradas (sem valores):"
    grep -v '^#' .env.local | grep '=' | cut -d'=' -f1 | sed 's/^/  - /'
else
    echo -e "${RED}❌ Arquivo .env.local NÃO encontrado${NC}"
fi
echo ""

# 6. Testar conexão interna do container
echo -e "${BLUE}6. Teste de Conexão Interna${NC}"
echo "---"
if docker ps | grep -q analytics-dashboard; then
    echo "Testando se a aplicação responde dentro do container..."
    docker exec analytics-dashboard wget -q -O- http://localhost:8020/api/health 2>&1 || \
    echo -e "${YELLOW}⚠️  Aplicação não responde internamente${NC}"
else
    echo -e "${YELLOW}⚠️  Container não está rodando${NC}"
fi
echo ""

# 7. Verificar recursos do container
echo -e "${BLUE}7. Uso de Recursos${NC}"
echo "---"
docker stats analytics-dashboard --no-stream 2>&1 || echo -e "${YELLOW}⚠️  Não foi possível verificar recursos${NC}"
echo ""

# 8. Verificar rede
echo -e "${BLUE}8. Configuração de Rede${NC}"
echo "---"
docker network inspect analytics-network 2>&1 | grep -A 5 "analytics-dashboard" || \
echo -e "${YELLOW}⚠️  Container não encontrado na rede${NC}"
echo ""

# 9. Resumo e Recomendações
echo -e "${BLUE}9. Resumo e Próximos Passos${NC}"
echo "---"

if ! docker ps | grep -q analytics-dashboard; then
    echo -e "${RED}❌ PROBLEMA: Container não está rodando${NC}"
    echo "   Solução: docker compose -f docker-compose.analytics.yml up -d"
elif ! [ -f .env.local ]; then
    echo -e "${RED}❌ PROBLEMA: Arquivo .env.local não existe${NC}"
    echo "   Solução: Criar arquivo .env.local com as variáveis necessárias"
else
    echo -e "${GREEN}✅ Container rodando e configurado${NC}"
    echo "   Teste: curl http://localhost:8020/api/health"
fi

echo ""
echo "=============================================="
echo "Diagnóstico completo!"
