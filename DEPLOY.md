# 📋 Guia de Deploy - IP Telecom Dashboard

## 📌 Informações do Servidor

- **IP:** `177.11.50.137`
- **Domínio:** (será configurado na Wix - futuro)
- **Banco de Dados:** AWS RDS `54.232.95.241:3306` (já configurado)
- **Outros projetos:** Já rodam no mesmo IP (usar portas diferentes + Nginx)

---

## 🏗️ Arquitetura do Projeto

```
┌─────────────────────────────────────────────────────────────┐
│                    177.11.50.137 (VPS)                       │
│  ┌─────────────────┐    ┌──────────────────────────────┐ │
│  │   Nginx (80/443)│    │   Outros Projetos (existentes)│ │
│  │   Reverse Proxy │    │   • Porta 3000 - Site A       │ │
│  └────────┬────────┘    │   • Porta 8080 - API B        │ │
│           │             └──────────────────────────────┘ │
│           ▼                                                  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │         IP Telecom Dashboard                          │  │
│  │  ┌─────────────┐      ┌─────────────────────────┐   │  │
│  │  │ Frontend    │      │ Backend (API)            │   │  │
│  │  │ Vite        │◄────►│ Express + MySQL Pool     │   │  │
│  │  │ Porta 5173  │      │ Porta 3001               │   │  │
│  │  │ (React)     │      │ (Proxy /api/utech)       │   │  │
│  │  └─────────────┘      └─────────────────────────┘   │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

---

## 📦 Estrutura de Arquivos no Servidor

```
/opt/ip-telecom-dashboard/
├── docker-compose.yml          # Orquestração dos containers
├── .env                        # Variáveis de ambiente
├── nginx/
│   └── nginx.conf              # Configuração reverse proxy
├── frontend/                   # Build do Vite
│   └── dist/                   # (gerado pelo build)
└── backend/                    # API Express
    ├── index.js
    ├── package.json
    └── node_modules/
```

---

## 🚀 Opção 1: Deploy com Docker (Recomendado)

### 1.1 Arquivo `docker-compose.yml`

```yaml
version: '3.8'

services:
  # Backend API
  backend:
    image: node:20-alpine
    container_name: ip-telecom-backend
    working_dir: /app
    volumes:
      - ./backend:/app
      - /app/node_modules
    command: sh -c "npm install && node index.js"
    ports:
      - "3001:3001"
    environment:
      - DB_HOST=54.232.95.241
      - DB_USER=ip_telecom
      - DB_PASSWORD=Polo38422a
      - DB_NAME=ip_telecom
      - PORT=3001
    restart: unless-stopped
    networks:
      - ip-telecom-network

  # Frontend (servido via Nginx)
  frontend:
    image: nginx:alpine
    container_name: ip-telecom-frontend
    volumes:
      - ./frontend/dist:/usr/share/nginx/html:ro
      - ./nginx/nginx.conf:/etc/nginx/conf.d/default.conf:ro
    ports:
      - "5173:80"  # Porta interna, Nginx redireciona
    depends_on:
      - backend
    restart: unless-stopped
    networks:
      - ip-telecom-network

  # Nginx Reverse Proxy (porta 80/443)
  nginx-proxy:
    image: nginx:alpine
    container_name: ip-telecom-proxy
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/proxy.conf:/etc/nginx/conf.d/default.conf:ro
      - ./ssl:/etc/nginx/ssl:ro  # Certificados SSL
    depends_on:
      - frontend
      - backend
    restart: unless-stopped
    networks:
      - ip-telecom-network

networks:
  ip-telecom-network:
    driver: bridge
```

### 1.2 Configuração Nginx (`nginx/nginx.conf`)

```nginx
server {
    listen 80;
    server_name 177.11.50.137 dashboard.ip-telecom.com;  # Adicionar domínio Wix depois

    # Frontend (arquivos estáticos)
    location / {
        root /usr/share/nginx/html;
        try_files $uri $uri/ /index.html;
        add_header Cache-Control "public, max-age=31536000";
    }

    # Backend API
    location /api/ {
        proxy_pass http://backend:3001/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # API Utech (proxy para ippolopabx)
    location /api/utech/ {
        proxy_pass https://ipfibra.ippolopabx.com.br/utech/;
        proxy_ssl_server_name on;
        proxy_set_header Host ipfibra.ippolopabx.com.br;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

### 1.3 Configuração Reverse Proxy Multi-Site (`nginx/proxy.conf`)

```nginx
# IP Telecom Dashboard
server {
    listen 80;
    listen [::]:80;
    server_name dashboard.ip-telecom.com 177.11.50.137;

    location / {
        proxy_pass http://localhost:5173;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}

# Outros projetos (exemplos - já existentes no servidor)
# server {
#     listen 80;
#     server_name sitea.ip-telecom.com;
#     location / {
#         proxy_pass http://localhost:3000;
#     }
# }
```

---

## 🚀 Opção 2: Deploy com PM2 (Node.js nativo)

### 2.1 Estrutura de Pastas no Servidor

```bash
# Criar estrutura
sudo mkdir -p /opt/ip-telecom-dashboard
sudo chown -R $USER:$USER /opt/ip-telecom-dashboard
cd /opt/ip-telecom-dashboard

# Backend
mkdir backend
cd backend
npm init -y
npm install express mysql2 cors node-fetch

# Frontend (será buildado local e enviado)
mkdir frontend
cd frontend
npm create vite@latest . -- --template react-ts
npm install
npm run build  # Gera a pasta dist
```

### 2.2 PM2 Config (`ecosystem.config.js`)

```javascript
module.exports = {
  apps: [
    {
      name: 'ip-telecom-backend',
      script: './backend/index.js',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: 3001,
        DB_HOST: '54.232.95.241',
        DB_USER: 'ip_telecom',
        DB_PASSWORD: 'Polo38422a',
        DB_NAME: 'ip_telecom'
      },
      log_file: './logs/backend.log',
      out_file: './logs/backend-out.log',
      error_file: './logs/backend-error.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      max_memory_restart: '500M',
      restart_delay: 3000,
      max_restarts: 5,
      min_uptime: '10s',
      watch: false,
      autorestart: true
    },
    {
      name: 'ip-telecom-frontend',
      script: 'serve',
      args: ['-s', 'dist', '-l', '5173'],
      instances: 1,
      exec_mode: 'fork',
      cwd: './frontend',
      env: {
        NODE_ENV: 'production'
      },
      log_file: './logs/frontend.log',
      max_memory_restart: '300M'
    }
  ]
};
```

### 2.3 Comandos PM2

```bash
# Iniciar
pm2 start ecosystem.config.js

# Salvar configuração
pm2 save
pm2 startup  # Gera comando para iniciar no boot

# Monitorar
pm2 status
pm2 logs ip-telecom-backend
pm2 monit

# Reiniciar
pm2 restart ip-telecom-backend
pm2 reload all

# Parar
pm2 stop all
pm2 delete all
```

---

## 🔧 Passo a Passo - Deploy Manual (PM2 + Nginx)

### 1. Preparar o Servidor (177.11.50.137)

```bash
# Acessar o servidor via SSH
ssh usuario@177.11.50.137

# Instalar dependências
sudo apt update && sudo apt upgrade -y
sudo apt install -y nodejs npm nginx git

# Instalar PM2 globalmente
sudo npm install -g pm2 serve

# Criar diretório do projeto
sudo mkdir -p /opt/ip-telecom-dashboard
sudo chown -R $USER:$USER /opt/ip-telecom-dashboard
cd /opt/ip-telecom-dashboard
```

### 2. Deploy do Backend

```bash
# Copiar arquivos do backend
mkdir backend
cd backend

# Copiar index.js, package.json (via scp ou git clone)
# Exemplo com scp (do seu PC Windows):
# scp -r artifacts/atendimento-dashboard/server/* usuario@177.11.50.137:/opt/ip-telecom-dashboard/backend/

# Instalar dependências
npm install

# Testar
node index.js
# Deve aparecer: "🚀 API server running on http://localhost:3001"
# Ctrl+C para parar

# Iniciar com PM2
pm2 start index.js --name ip-telecom-backend
pm2 save
```

### 3. Deploy do Frontend

```bash
cd /opt/ip-telecom-dashboard
mkdir frontend
cd frontend

# Copiar build do Vite
# No Windows, execute primeiro:
# cd artifacts/atendimento-dashboard
# npm run build
# scp -r dist usuario@177.11.50.137:/opt/ip-telecom-dashboard/frontend/

# Ou instalar e buildar no servidor:
npm install
npm run build

# Servir com serve (via PM2)
pm2 serve dist 5173 --name ip-telecom-frontend
pm2 save
```

### 4. Configurar Nginx (Reverse Proxy)

```bash
sudo nano /etc/nginx/sites-available/ip-telecom-dashboard
```

Adicionar:

```nginx
server {
    listen 80;
    server_name 177.11.50.137 dashboard.ip-telecom.com;

    # Logs
    access_log /var/log/nginx/ip-telecom-access.log;
    error_log /var/log/nginx/ip-telecom-error.log;

    # Frontend
    location / {
        proxy_pass http://localhost:5173;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Backend API
    location /api/ {
        proxy_pass http://localhost:3001/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # API Utech (external)
    location /api/utech/ {
        proxy_pass https://ipfibra.ippolopabx.com.br/utech/;
        proxy_ssl_server_name on;
        proxy_set_header Host ipfibra.ippolopabx.com.br;
    }
}
```

Ativar:

```bash
sudo ln -s /etc/nginx/sites-available/ip-telecom-dashboard /etc/nginx/sites-enabled/
sudo nginx -t  # Testar configuração
sudo systemctl restart nginx
```

### 5. Configurar Firewall

```bash
# Verificar status
sudo ufw status

# Permitir portas necessárias
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS (futuro)
sudo ufw allow 3001/tcp  # Backend API (se acessar diretamente)

# Se UFW estiver inativo e quiser ativar:
# sudo ufw enable
```

---

## 🌐 Configuração do Domínio Wix

### 1. Configurar DNS na Wix

Quando tiver o domínio (ex: `dashboard.ip-telecom.com`):

1. Acesse o painel DNS da Wix
2. Crie um registro **A**:
   - **Nome:** `dashboard` (ou `@` para raiz)
   - **Valor:** `177.11.50.137`
   - **TTL:** 3600

3. Opcional - WWW:
   - **Nome:** `www`
   - **Valor:** `177.11.50.137`
   - Ou CNAME para `dashboard.ip-telecom.com`

### 2. Atualizar Nginx

```bash
sudo nano /etc/nginx/sites-available/ip-telecom-dashboard
```

Alterar `server_name`:

```nginx
server {
    listen 80;
    server_name dashboard.ip-telecom.com www.dashboard.ip-telecom.com 177.11.50.137;
    # ... resto da config
}
```

```bash
sudo nginx -t
sudo systemctl reload nginx
```

### 3. Configurar SSL (HTTPS) - Let's Encrypt

```bash
# Instalar certbot
sudo apt install certbot python3-certbot-nginx

# Obter certificado
sudo certbot --nginx -d dashboard.ip-telecom.com -d www.dashboard.ip-telecom.com

# Auto-renewal (já configurado pelo certbot)
sudo systemctl status certbot.timer
```

---

## 🔄 Script de Deploy Automatizado

Crie `deploy.sh` no servidor:

```bash
#!/bin/bash
set -e

echo "🚀 Iniciando deploy do IP Telecom Dashboard..."

# Diretório do projeto
PROJECT_DIR="/opt/ip-telecom-dashboard"
BACKUP_DIR="/opt/backups/ip-telecom-$(date +%Y%m%d-%H%M%S)"

echo "📦 Criando backup..."
mkdir -p "$BACKUP_DIR"
cp -r "$PROJECT_DIR/backend" "$BACKUP_DIR/" 2>/dev/null || true
cp -r "$PROJECT_DIR/frontend/dist" "$BACKUP_DIR/" 2>/dev/null || true

echo "⬇️  Baixando novos arquivos..."
cd "$PROJECT_DIR"

# Se usando git:
# git pull origin main

# Ou copiar manualmente (feito via SCP antes)

echo "🔧 Instalando dependências do backend..."
cd "$PROJECT_DIR/backend"
npm install --production

echo "🏗️  Buildando frontend..."
cd "$PROJECT_DIR/frontend"
npm install
npm run build

echo "🔄 Reiniciando serviços..."
pm2 restart ip-telecom-backend
pm2 restart ip-telecom-frontend

echo "✅ Deploy concluído!"
echo "📊 Status:"
pm2 status

echo ""
echo "🔗 URLs:"
echo "   Local: http://localhost:5173"
echo "   Rede:  http://177.11.50.137"
echo "   Domínio: http://dashboard.ip-telecom.com (quando configurado)"
```

Tornar executável:

```bash
chmod +x /opt/ip-telecom-dashboard/deploy.sh
```

---

## 📁 Arquivos de Configuração Importantes

### `.env` (Backend)

```env
# Database (já configurado no código, mas pode sobrescrever)
DB_HOST=54.232.95.241
DB_USER=ip_telecom
DB_PASSWORD=Polo38422a
DB_NAME=ip_telecom

# API
PORT=3001
NODE_ENV=production

# External APIs
VITE_UTECH_API_TOKEN=055e3548897785ebe18d691473fff7ab604f273e
```

### `vite.config.ts` (Frontend - já configurado)

Já está configurado com proxy para `/api/utech`. No deploy, o Nginx cuida disso.

---

## 🔍 Troubleshooting

### Backend não conecta no banco

```bash
# Testar conexão MySQL
telnet 54.232.95.241 3306

# Ou instalar cliente MySQL
sudo apt install mysql-client
mysql -h 54.232.95.241 -u ip_telecom -p

# Verificar logs
tail -f /opt/ip-telecom-dashboard/logs/backend-error.log
pm2 logs ip-telecom-backend
```

### Frontend não carrega

```bash
# Verificar se build existe
ls -la /opt/ip-telecom-dashboard/frontend/dist/

# Verificar se está servindo
curl http://localhost:5173

# Logs PM2
pm2 logs ip-telecom-frontend
```

### Nginx erro 502 Bad Gateway

```bash
# Verificar se serviços estão rodando
pm2 status
curl http://localhost:3001/api/health
curl http://localhost:5173

# Verificar logs Nginx
sudo tail -f /var/log/nginx/ip-telecom-error.log
```

### Porta já em uso

```bash
# Verificar o que está usando a porta
sudo netstat -tulpn | grep 3001
sudo netstat -tulpn | grep 5173

# Matar processo
sudo kill -9 <PID>

# Ou mudar porta no .env e nginx.conf
```

---

## 📊 Monitoramento

### PM2 + Monitor

```bash
# Instalar monitor PM2 (opcional, pago)
pm2 install pm2-server-monit

# Ou usar simples
pm2 monit
```

### Logs

```bash
# Backend
pm2 logs ip-telecom-backend --lines 100

# Frontend
pm2 logs ip-telecom-frontend --lines 100

# Nginx
sudo tail -f /var/log/nginx/ip-telecom-*.log
```

---

## ✅ Checklist Pré-Deploy

- [ ] Backend roda localmente (`node index.js`)
- [ ] Frontend builda sem erros (`npm run build`)
- [ ] Acesso SSH ao servidor 177.11.50.137 configurado
- [ ] Nginx instalado e configurado
- [ ] PM2 instalado (`npm install -g pm2`)
- [ ] Portas 3001 e 5173 liberadas no firewall
- [ ] Banco de dados AWS acessível do servidor
- [ ] Domínio Wix configurado (DNS apontando para 177.11.50.137)
- [ ] SSL configurado (opcional, mas recomendado)

---

## 🎯 Comandos Rápidos

```bash
# Status geral
pm2 status && sudo nginx -t && sudo ufw status

# Restart completo
pm2 restart all && sudo systemctl reload nginx

# Ver logs em tempo real
pm2 logs --lines 50

# Backup rápido
cp -r /opt/ip-telecom-dashboard /opt/backups/ip-telecom-$(date +%Y%m%d)

# Update (após git pull ou upload de arquivos)
cd /opt/ip-telecom-dashboard/backend && npm install && pm2 restart ip-telecom-backend
cd /opt/ip-telecom-dashboard/frontend && npm install && npm run build && pm2 restart ip-telecom-frontend
```

---

## 📞 Suporte

Se encontrar problemas:

1. Verifique os logs: `pm2 logs` e `sudo tail /var/log/nginx/error.log`
2. Teste o backend diretamente: `curl http://localhost:3001/api/health`
3. Teste o frontend: `curl http://localhost:5173`
4. Verifique conectividade: `ping 54.232.95.241` (banco)

---

**Data da documentação:** Abril 2026  
**Versão do projeto:** 1.0.0  
**Última atualização:** Deploy inicial
