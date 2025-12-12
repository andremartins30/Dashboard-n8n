# 🔧 Troubleshooting - Erro de Produção

## ❌ Erro Atual

```
Application error: a server-side exception has occurred
Digest: 3691800782
```

## 🎯 Causa Provável

O erro ocorre porque a aplicação **não consegue conectar ao banco de dados PostgreSQL** em produção. Isso pode acontecer por:

1. ❌ Arquivo `.env.local` não existe ou está vazio no servidor
2. ❌ Variáveis de ambiente incorretas
3. ❌ Banco de dados inacessível do container Docker
4. ❌ Credenciais incorretas

## ✅ Correções Implementadas

### 1. Melhor tratamento de erros em `lib/db.ts`
- ✅ Validação de variáveis de ambiente
- ✅ Suporte para `DATABASE_URL` ou parâmetros individuais
- ✅ Logs detalhados de erro
- ✅ Teste de conexão no startup

### 2. Error handling em todas as queries
- ✅ Try/catch em `getStats()`
- ✅ Try/catch em `getRecentData()`
- ✅ Try/catch em `getOverdueTitles()`

### 3. Endpoint de health check
- ✅ Criado `/api/health` para testar conexão

## 🔍 Como Diagnosticar

### 1️⃣ Verificar logs do container

```bash
ssh suporte@apps.palusa.com.br
docker logs analytics-dashboard
```

**O que procurar:**
- ✅ `✅ Database connection established successfully` = Conexão OK
- ❌ `❌ Failed to connect to database` = Problema de conexão
- ❌ `Database configuration missing` = Falta .env.local

### 2️⃣ Testar health check

Acesse no navegador:
```
http://apps.palusa.com.br:8020/api/health
```

**Resposta esperada (sucesso):**
```json
{
  "status": "healthy",
  "database": "connected",
  "timestamp": "2025-12-12T12:00:00.000Z",
  "version": "PostgreSQL 14.x..."
}
```

**Resposta de erro:**
```json
{
  "status": "unhealthy",
  "database": "disconnected",
  "error": "mensagem de erro detalhada"
}
```

### 3️⃣ Verificar variáveis de ambiente

```bash
# No servidor
cd /home/suporte/analytics
cat .env.local
```

**Deve conter:**
```env
DATABASE_URL=postgresql://usuario:senha@host:5432/banco
NODE_ENV=production
```

## 🛠️ Soluções

### Solução 1: Criar/Corrigir .env.local

```bash
# No servidor
cd /home/suporte/analytics
nano .env.local
```

**Adicionar:**
```env
DATABASE_URL=postgresql://seu_usuario:sua_senha@seu_host:5432/seu_banco
NODE_ENV=production
NEXT_PUBLIC_API_URL=http://apps.palusa.com.br:8020
```

**Salvar e reiniciar:**
```bash
docker compose -f docker-compose.analytics.yml restart
docker logs analytics-dashboard -f
```

### Solução 2: Verificar conectividade do banco

```bash
# Testar conexão do servidor ao banco
psql "postgresql://usuario:senha@host:5432/banco" -c "SELECT 1;"
```

Se falhar, verificar:
- ✅ Firewall liberado
- ✅ PostgreSQL aceitando conexões remotas
- ✅ Credenciais corretas

### Solução 3: Usar parâmetros individuais

Se `DATABASE_URL` não funcionar, use parâmetros separados no `.env.local`:

```env
DB_USER=seu_usuario
DB_PASSWORD=sua_senha
DB_HOST=seu_host
DB_PORT=5432
DB_NAME=seu_banco
NODE_ENV=production
```

### Solução 4: Rebuild completo

```bash
# No servidor
cd /home/suporte/analytics
docker compose -f docker-compose.analytics.yml down
docker compose -f docker-compose.analytics.yml build --no-cache
docker compose -f docker-compose.analytics.yml up -d
docker logs analytics-dashboard -f
```

## 📋 Checklist de Diagnóstico

- [ ] Logs do container verificados
- [ ] Endpoint `/api/health` testado
- [ ] Arquivo `.env.local` existe e está correto
- [ ] Conexão ao banco testada manualmente
- [ ] Container reconstruído após mudanças
- [ ] Aplicação acessível em http://apps.palusa.com.br:8020

## 🔄 Próximos Passos

1. **Verificar logs** do container no servidor
2. **Criar/corrigir** o arquivo `.env.local`
3. **Testar** o endpoint `/api/health`
4. **Rebuild** do container se necessário

## 💡 Dica

Para facilitar o debug, você pode temporariamente adicionar mais logs:

```bash
# Ver logs em tempo real
docker logs analytics-dashboard -f --tail 100
```

---

**Após corrigir, a aplicação deve funcionar normalmente! 🚀**
