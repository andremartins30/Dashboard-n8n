# 🐳 Guia de Deploy Docker - Dashboard Analytics

## 📋 Informações do Projeto

- **Nome do Projeto**: Dashboard-n8n (Analytics Dashboard)
- **Porta**: 8020
- **Container**: analytics-dashboard
- **URL de Acesso**: http://apps.palusa.com.br:8020

## 🔧 Arquivos Criados

1. ✅ `Dockerfile` - Multi-stage build otimizado para produção
2. ✅ `docker-compose.analytics.yml` - Configuração do Docker Compose
3. ✅ `.dockerignore` - Exclusão de arquivos desnecessários
4. ✅ `next.config.ts` - Atualizado com output standalone

## 📦 Variáveis de Ambiente

Certifique-se de que seu arquivo `.env.local` contém as variáveis necessárias:

```env
# Exemplo de variáveis (ajuste conforme necessário)
DATABASE_URL=postgresql://user:password@host:port/database
NEXT_PUBLIC_API_URL=http://apps.palusa.com.br:8020
```

## 🚀 Passo a Passo para Deploy

### 1️⃣ Preparar o Projeto Localmente

```bash
# Certifique-se de que o build funciona localmente
npm run build
```

### 2️⃣ Enviar para o Servidor

```bash
# Comprimir o projeto (exclui node_modules e .next)
cd "/home/andre/Área de Trabalho"
tar --exclude='node_modules' --exclude='.next' --exclude='.git' \
    -czf dashboard-n8n.tar.gz Dashboard-n8n/

# Enviar para o servidor
scp dashboard-n8n.tar.gz suporte@apps.palusa.com.br:/home/suporte/

# Limpar arquivo local
rm dashboard-n8n.tar.gz
```

### 3️⃣ No Servidor - Extrair e Configurar

```bash
# Conectar ao servidor
ssh suporte@apps.palusa.com.br

# Extrair o projeto
cd /home/suporte
tar -xzf dashboard-n8n.tar.gz
mv Dashboard-n8n analytics
cd analytics

# Criar/editar o arquivo .env.local com as variáveis de produção
nano .env.local
```

### 4️⃣ Construir e Iniciar o Container

```bash
# Construir e iniciar o container
docker compose -f docker-compose.analytics.yml up -d --build

# Verificar se está rodando
docker ps | grep analytics

# Ver logs
docker logs analytics-dashboard -f
```

### 5️⃣ Testar

Acesse no navegador:
```
http://apps.palusa.com.br:8020
```

## 🔍 Comandos Úteis

### Ver logs do container
```bash
docker logs analytics-dashboard -f
```

### Parar o container
```bash
docker compose -f docker-compose.analytics.yml down
```

### Reiniciar o container
```bash
docker compose -f docker-compose.analytics.yml restart
```

### Reconstruir após mudanças
```bash
docker compose -f docker-compose.analytics.yml up -d --build
```

### Acessar o container
```bash
docker exec -it analytics-dashboard sh
```

### Verificar uso de recursos
```bash
docker stats analytics-dashboard
```

## 🐛 Troubleshooting

### Container não inicia
```bash
# Ver logs detalhados
docker logs analytics-dashboard

# Verificar se a porta está em uso
netstat -tuln | grep 8020
```

### Problemas de build
```bash
# Limpar cache do Docker
docker builder prune

# Rebuild sem cache
docker compose -f docker-compose.analytics.yml build --no-cache
```

### Problemas de conexão com banco de dados
- Verifique se as variáveis de ambiente estão corretas no `.env.local`
- Certifique-se de que o banco de dados está acessível do container
- Teste a conexão manualmente

## 📝 Notas Importantes

1. **Segurança**: O arquivo `.env.local` NÃO deve ser commitado no Git
2. **Porta**: A porta 8020 deve estar liberada no firewall do servidor
3. **Restart Policy**: O container está configurado para reiniciar automaticamente (`unless-stopped`)
4. **Build Otimizado**: O Dockerfile usa multi-stage build para reduzir o tamanho da imagem final
5. **Usuário não-root**: O container roda com usuário `nextjs` para maior segurança

## 🎯 Checklist de Deploy

- [ ] Arquivos Docker criados localmente
- [ ] Build local testado (`npm run build`)
- [ ] Projeto enviado para o servidor
- [ ] Arquivo `.env.local` configurado no servidor
- [ ] Container construído e iniciado
- [ ] Aplicação acessível via http://apps.palusa.com.br:8020
- [ ] Logs verificados sem erros
- [ ] Funcionalidades testadas

---

**Pronto para deploy! 🚀**
