# 🚀 Comandos de Deploy - Windows → Servidor

## 📋 Resumo Rápido

| Passo | Comando/Arquivo |
|-------|-----------------|
| 1 | Criar estrutura no servidor |
| 2 | Copiar backend (`server/index.js`) |
| 3 | Buildar e copiar frontend |
| 4 | Iniciar serviços com PM2 |
| 5 | Configurar Nginx |

---

## 1️⃣ Criar Estrutura no Servidor

Abra **PowerShell** no Windows e acesse o servidor:

```powershell
# SSH no servidor (use Git Bash, WSL ou PuTTY)
ssh root@177.11.50.137
```

No servidor (depois do SSH):

```bash
# Criar estrutura
mkdir -p /opt/ip-bi/{backend,frontend/dist,logs}
mkdir -p /opt/ip-bi/backend/node_modules
mkdir -p /opt/ip-bi/frontend/node_modules

# Instalar PM2 e serve globalmente se não tiver
npm install -g pm2 serve
```

---

## 2️⃣ Copiar Backend (do Windows para Servidor)

### Opção A: Com SCP (Git Bash ou WSL)

```bash
# Abra Git Bash no Windows, na pasta do projeto
cd "C:/Users/Ryan Silva/Documents/Projetos de Sites/Ip Telecom Dash/artifacts/atendimento-dashboard"

# Copiar todo o conteúdo da pasta server/
scp -r server/* root@177.11.50.137:/opt/ip-bi/backend/

# Ou arquivo por arquivo:
scp server/index.js root@177.11.50.137:/opt/ip-bi/backend/
scp server/package.json root@177.11.50.137:/opt/ip-bi/backend/ 2>/dev/null || echo "package.json não existe, criar manualmente"
```

### Opção B: Com WinSCP (Interface Gráfica)

1. Baixe WinSCP: https://winscp.net/
2. Conecte: `root@177.11.50.137`
3. Navegue para `/opt/ip-bi/backend/`
4. Arraste os arquivos da pasta `server/` local

---

## 3️⃣ Instalar Dependências no Servidor

```bash
ssh root@177.11.50.137

cd /opt/ip-bi/backend

# Criar package.json se não copiou
cat > package.json << 'EOF'
{
  "name": "ip-bi-backend",
  "version": "1.0.0",
  "main": "index.js",
  "scripts": {
    "start": "node index.js"
  },
  "dependencies": {
    "express": "^4.18.2",
    "mysql2": "^3.6.0",
    "cors": "^2.8.5",
    "node-fetch": "^2.7.0",
    "dotenv": "^16.3.1"
  }
}
EOF

# Instalar
npm install

# Testar
node index.js
# Deve aparecer: "🚀 API server running on http://localhost:3001"
# Ctrl+C para parar
```

---

## 4️⃣ Buildar e Copiar Frontend

### Build local (Windows)

```powershell
cd "C:/Users/Ryan Silva/Documents/Projetos de Sites/Ip Telecom Dash/artifacts/atendimento-dashboard"

# Instalar dependências se necessário
npm install

# Buildar
npm run build

# Vai criar a pasta dist/
```

### Copiar para servidor

```bash
# Git Bash/WSL - copiar pasta dist/
scp -r dist/* root@177.11.50.137:/opt/ip-bi/frontend/dist/
```

Ou com WinSCP, arraste a pasta `dist/` para `/opt/ip-bi/frontend/`

---

## 5️⃣ Configurar PM2

No servidor:

```bash
# Criar arquivo ecosystem
ssh root@177.11.50.137 "cat > /opt/ip-bi/ecosystem.config.js" << 'EOF'
module.exports = {
  apps: [
    {
      name: 'ip-bi-backend',
      script: './backend/index.js',
      cwd: '/opt/ip-bi',
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
      log_file: '/opt/ip-bi/logs/backend.log',
      max_memory_restart: '500M',
      autorestart: true
    },
    {
      name: 'ip-bi-frontend',
      script: 'serve',
      args: ['-s', 'dist', '-l', '5173'],
      cwd: '/opt/ip-bi/frontend',
      instances: 1,
      env: {
        NODE_ENV: 'production'
      },
      max_memory_restart: '300M',
      autorestart: true
    }
  ]
};
EOF
```

Ou crie manualmente no servidor:

```bash
ssh root@177.11.50.137
cd /opt/ip-bi
pm2 init simple  # Cria ecosystem simples, depois edite
nano ecosystem.config.js  # Cole o conteúdo acima
```

---

## 6️⃣ Iniciar Serviços

```bash
ssh root@177.11.50.137

cd /opt/ip-bi

# Iniciar
pm2 start ecosystem.config.js

# Salvar configuração
pm2 save

# Criar startup automático
pm2 startup systemd
# Ele vai dar um comando, execute-o
```

---

## 7️⃣ Configurar Nginx

```bash
ssh root@177.11.50.137

# Criar configuração
cat > /etc/nginx/sites-available/ip-bi << 'EOF'
server {
    listen 80;
    server_name 177.11.50.137 ip-bi.polo-it.com;

    access_log /var/log/nginx/ip-bi-access.log;
    error_log /var/log/nginx/ip-bi-error.log;

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
        proxy_read_timeout 86400;
    }

    location /api/ {
        proxy_pass http://localhost:3001/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_connect_timeout 300s;
        proxy_send_timeout 300s;
        proxy_read_timeout 300s;
    }

    location /api/utech/ {
        proxy_pass https://ipfibra.ippolopabx.com.br/utech/;
        proxy_ssl_server_name on;
        proxy_set_header Host ipfibra.ippolopabx.com.br;
    }
}
EOF

# Ativar
ln -sf /etc/nginx/sites-available/ip-bi /etc/nginx/sites-enabled/

# Testar
nginx -t

# Recarregar
systemctl reload nginx
```

---

## ✅ Verificar Funcionamento

```bash
# Status PM2
ssh root@177.11.50.137 "pm2 status"

# Testar backend
ssh root@177.11.50.137 "curl -s http://localhost:3001/api/health"

# Testar frontend
ssh root@177.11.50.137 "curl -s http://localhost:5173 | head -5"

# Acessar no navegador
# http://177.11.50.137
```

---

## 🔄 Atualização Futura

Quando precisar atualizar:

```powershell
# 1. Build local
npm run build

# 2. Copiar novo dist
scp -r dist/* root@177.11.50.137:/opt/ip-bi/frontend/dist/

# 3. Copiar backend se mudou
scp server/index.js root@177.11.50.137:/opt/ip-bi/backend/

# 4. Restart no servidor
ssh root@177.11.50.137 "pm2 restart ip-bi-backend ip-bi-frontend"
```

---

## 🆘 Troubleshooting

### Erro de conexão no banco

```bash
# Testar do servidor
ssh root@177.11.50.137 "telnet 54.232.95.241 3306"

# Ou instalar mysql-client
apt install mysql-client -y
mysql -h 54.232.95.241 -u ip_telecom -p
# Senha: Polo38422a
```

### Porta já em uso

```bash
# Verificar
ssh root@177.11.50.137 "netstat -tulpn | grep 3001"

# Matar processo
ssh root@177.11.50.137 "kill -9 $(lsof -t -i:3001)"
```

### Erro 502 no Nginx

```bash
# Ver logs
ssh root@177.11.50.137 "tail -f /var/log/nginx/ip-bi-error.log"

# Verificar se backend está rodando
ssh root@177.11.50.137 "pm2 logs ip-bi-backend"
```

---

## 📊 Comandos Úteis PM2

```bash
# Status
pm2 status

# Logs em tempo real
pm2 logs

# Restart
pm2 restart all

# Parar
pm2 stop all

# Monitor
pm2 monit
```

---

## 🔐 SSL (HTTPS) - Quando tiver domínio

```bash
# Instalar certbot
apt install certbot python3-certbot-nginx

# Obter certificado
certbot --nginx -d ip-bi.polo-it.com

# Auto-renewal já configurado
```

---

## ✅ Checklist Final

Após deploy, verifique:

- [ ] http://177.11.50.137 carrega o frontend
- [ ] http://177.11.50.137/api/health responde
- [ ] Dashboard mostra dados do banco
- [ ] PM2 está rodando: `pm2 status`
- [ ] Nginx configurado: `nginx -t`
- [ ] Logs não mostram erros graves

**Data:** Abril 2026
