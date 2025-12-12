# 🔧 Configuração de Rede - PostgreSQL em Container Separado

## 🎯 Situação

Seu PostgreSQL está rodando em um **container Docker separado** (parte do stack n8n).

**Credenciais do PostgreSQL:**
- Host: `postgres` (nome do container) ou `localhost:5432` (porta exposta)
- Database: `n8n`
- User: `n8n`
- Password: `palusa26`

## ✅ Opção 1: Network Mode Host (RECOMENDADO - Mais Simples)

### 1. Usar o `docker-compose.analytics.yml` atual (já configurado)

### 2. Configurar `.env.local` no servidor:

```bash
cd /home/suporte/analytics
nano .env.local
```

**Conteúdo:**
```env
DATABASE_URL=postgresql://n8n:palusa26@localhost:5432/n8n
NODE_ENV=production
NEXT_PUBLIC_API_URL=http://apps.palusa.com.br:8020
```

### 3. Deploy:

```bash
cd /home/suporte/analytics
docker compose -f docker-compose.analytics.yml down
docker compose -f docker-compose.analytics.yml up -d --build
docker logs analytics-dashboard -f
```

**Por que funciona:**
- ✅ Com `network_mode: host`, o container acessa `localhost:5432`
- ✅ A porta 5432 está exposta no host pelo container postgres
- ✅ Conexão direta, sem complicações de rede

---

## ✅ Opção 2: Conectar à Rede do N8N (Mais Isolado)

Se preferir manter isolamento de rede:

### 1. Descobrir o nome da rede do n8n:

```bash
docker network ls | grep n8n
```

Provavelmente será: `n8n_default` ou `suporte_default`

### 2. Usar o arquivo alternativo:

```bash
cd /home/suporte/analytics

# Usar o arquivo docker-compose.analytics-network.yml
docker compose -f docker-compose.analytics-network.yml down
docker compose -f docker-compose.analytics-network.yml up -d --build
```

### 3. Configurar `.env.local`:

```env
# Usar o NOME DO CONTAINER (não localhost)
DATABASE_URL=postgresql://n8n:palusa26@postgres:5432/n8n
NODE_ENV=production
NEXT_PUBLIC_API_URL=http://apps.palusa.com.br:8020
```

**Por que funciona:**
- ✅ Container analytics conecta à rede `n8n_default`
- ✅ Pode acessar o container `postgres` pelo nome
- ✅ Comunicação interna entre containers

---

## 🎯 Qual Escolher?

### Use Opção 1 (host mode) se:
- ✅ Quer simplicidade
- ✅ Não se importa com isolamento de rede
- ✅ Quer deploy rápido

### Use Opção 2 (rede compartilhada) se:
- ✅ Quer manter isolamento
- ✅ Quer seguir boas práticas Docker
- ✅ Pode ter outros serviços na mesma rede

---

## 📝 Checklist de Deploy

### Para Opção 1 (Host Mode):
- [ ] Arquivo `.env.local` com `DATABASE_URL=postgresql://n8n:palusa26@localhost:5432/n8n`
- [ ] Usar `docker-compose.analytics.yml`
- [ ] Deploy e verificar logs

### Para Opção 2 (Rede Compartilhada):
- [ ] Descobrir nome da rede: `docker network ls`
- [ ] Atualizar `docker-compose.analytics-network.yml` se necessário
- [ ] Arquivo `.env.local` com `DATABASE_URL=postgresql://n8n:palusa26@postgres:5432/n8n`
- [ ] Deploy e verificar logs

---

## 🔍 Verificar se Funcionou

```bash
# Ver logs
docker logs analytics-dashboard -f

# Deve mostrar:
# ✅ Database connection established successfully
# ✓ Ready in XXXms

# Testar no navegador
curl http://localhost:8020/api/health
```

---

**Recomendo começar com a Opção 1 (mais simples)! 🚀**
