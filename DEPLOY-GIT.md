# 🔄 Deploy com Git + Docker

## 📋 Visão Geral

Este guia mostra como fazer deploy usando **Git** para versionamento e **Docker** para execução, permitindo atualizações simples com `git pull`.

## 🎯 Vantagens desta Abordagem

✅ **Versionamento completo** - Todo histórico de mudanças rastreado  
✅ **Deploy simplificado** - Apenas `git pull` + rebuild do container  
✅ **Rollback fácil** - Voltar para versões anteriores com `git checkout`  
✅ **Colaboração** - Múltiplos desenvolvedores podem contribuir  
✅ **CI/CD pronto** - Base para automação futura com GitHub Actions  

## 🚀 Setup Inicial

### 1️⃣ Preparar o Repositório Local

```bash
cd "/home/andre/Área de Trabalho/Dashboard-n8n"

# Inicializar Git (se ainda não foi feito)
git init

# Adicionar todos os arquivos
git add .

# Primeiro commit
git commit -m "Initial commit - Dashboard Analytics"

# Criar repositório no GitHub e adicionar remote
git remote add origin https://github.com/seu-usuario/dashboard-n8n.git

# Push inicial
git branch -M main
git push -u origin main
```

### 2️⃣ Configurar o Servidor

```bash
# Conectar ao servidor
ssh suporte@apps.palusa.com.br

# Clonar o repositório
cd /home/suporte
git clone https://github.com/seu-usuario/dashboard-n8n.git analytics
cd analytics

# Criar arquivo .env.local com variáveis de produção
nano .env.local
```

**Conteúdo do `.env.local` no servidor:**
```env
DATABASE_URL=postgresql://usuario:senha@host:5432/banco
NEXT_PUBLIC_API_URL=http://apps.palusa.com.br:8020
NODE_ENV=production
```

### 3️⃣ Primeiro Deploy

```bash
# Construir e iniciar o container
docker compose -f docker-compose.analytics.yml up -d --build

# Verificar logs
docker logs analytics-dashboard -f
```

## 🔄 Workflow de Atualização

### No seu computador local:

```bash
# 1. Fazer suas alterações no código
# 2. Testar localmente
npm run dev

# 3. Commitar as mudanças
git add .
git commit -m "Descrição das mudanças"

# 4. Push para o GitHub
git push origin main
```

### No servidor:

```bash
# Conectar ao servidor
ssh suporte@apps.palusa.com.br
cd /home/suporte/analytics

# Puxar as atualizações
git pull origin main

# Reconstruir e reiniciar o container
docker compose -f docker-compose.analytics.yml up -d --build

# Verificar se está tudo OK
docker logs analytics-dashboard -f
```

## 🤖 Script de Deploy Automático

Criei um script `deploy.sh` que automatiza todo o processo no servidor!

### Uso do script:

```bash
# No servidor
cd /home/suporte/analytics
./deploy.sh
```

O script faz automaticamente:
1. ✅ Git pull das últimas mudanças
2. ✅ Rebuild do container Docker
3. ✅ Restart do serviço
4. ✅ Exibe os logs

## 🔐 Autenticação Git no Servidor

### Opção 1: SSH Key (Recomendado)

```bash
# No servidor, gerar chave SSH
ssh-keygen -t ed25519 -C "suporte@apps.palusa.com.br"

# Copiar a chave pública
cat ~/.ssh/id_ed25519.pub

# Adicionar no GitHub:
# Settings → SSH and GPG keys → New SSH key
```

### Opção 2: Personal Access Token

```bash
# No GitHub: Settings → Developer settings → Personal access tokens → Generate new token
# Permissões necessárias: repo (full control)

# No servidor, configurar credenciais
git config --global credential.helper store
git pull  # Digite o token quando solicitado
```

## 🎯 Boas Práticas

### 1. Branches para Desenvolvimento

```bash
# Criar branch para nova feature
git checkout -b feature/nova-funcionalidade

# Fazer alterações e commitar
git add .
git commit -m "Adiciona nova funcionalidade"

# Push da branch
git push origin feature/nova-funcionalidade

# Após aprovação, merge na main
git checkout main
git merge feature/nova-funcionalidade
git push origin main
```

### 2. Tags para Versões

```bash
# Criar tag de versão
git tag -a v1.0.0 -m "Versão 1.0.0 - Release inicial"
git push origin v1.0.0

# No servidor, fazer checkout de uma versão específica
git fetch --tags
git checkout v1.0.0
docker compose -f docker-compose.analytics.yml up -d --build
```

### 3. Rollback Rápido

```bash
# Ver histórico de commits
git log --oneline

# Voltar para commit anterior
git checkout <commit-hash>
docker compose -f docker-compose.analytics.yml up -d --build

# Ou voltar para uma tag
git checkout v1.0.0
docker compose -f docker-compose.analytics.yml up -d --build

# Voltar para a última versão
git checkout main
git pull
docker compose -f docker-compose.analytics.yml up -d --build
```

## 🔍 Comandos Úteis

### Verificar status do repositório
```bash
git status
git log --oneline -10
```

### Ver diferenças antes de pull
```bash
git fetch origin
git diff main origin/main
```

### Limpar arquivos não rastreados
```bash
git clean -fd
```

### Resetar mudanças locais
```bash
git reset --hard origin/main
```

## ⚠️ Arquivos Importantes

### Nunca versionar:
- ❌ `.env.local` - Contém credenciais sensíveis
- ❌ `node_modules/` - Dependências (instaladas via npm)
- ❌ `.next/` - Build gerado automaticamente

### Sempre versionar:
- ✅ `Dockerfile`
- ✅ `docker-compose.analytics.yml`
- ✅ `.dockerignore`
- ✅ `.env.example` - Template sem credenciais
- ✅ Código fonte (`app/`, `components/`, etc.)
- ✅ `package.json` e `package-lock.json`

## 🚨 Troubleshooting

### Conflitos no git pull
```bash
# Ver arquivos em conflito
git status

# Opção 1: Manter versão do servidor
git checkout --theirs <arquivo>

# Opção 2: Manter versão remota
git checkout --ours <arquivo>

# Opção 3: Descartar mudanças locais
git reset --hard origin/main
```

### Container não atualiza após pull
```bash
# Rebuild forçado sem cache
docker compose -f docker-compose.analytics.yml build --no-cache
docker compose -f docker-compose.analytics.yml up -d
```

### Verificar se há atualizações disponíveis
```bash
git fetch origin
git status
# Se aparecer "Your branch is behind", há atualizações
```

## 📊 Workflow Completo

```mermaid
graph LR
    A[Desenvolvimento Local] --> B[git commit]
    B --> C[git push]
    C --> D[GitHub]
    D --> E[Servidor: git pull]
    E --> F[docker compose up --build]
    F --> G[Aplicação Atualizada]
```

## ✅ Checklist de Deploy

- [ ] Repositório Git criado e configurado
- [ ] Código versionado no GitHub
- [ ] Servidor clonado o repositório
- [ ] Arquivo `.env.local` configurado no servidor
- [ ] SSH key ou token configurado para autenticação
- [ ] Primeiro deploy realizado com sucesso
- [ ] Script `deploy.sh` testado
- [ ] Processo de atualização documentado para a equipe

---

**Agora você tem um workflow profissional de deploy! 🚀**
