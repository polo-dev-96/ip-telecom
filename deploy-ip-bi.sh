#!/bin/bash
# Script de Deploy - IP Telecom Dashboard (ip-bi)
# Servidor: 177.11.50.137
# Estrutura: /opt/ip-bi (segue padrão fieam-bi, polo-bi)

set -e

echo "🚀 Deploy IP Telecom Dashboard (ip-bi)"
echo "========================================"
echo ""

# Configurações
PROJECT_NAME="ip-bi"
PROJECT_DIR="/opt/${PROJECT_NAME}"
FRONTEND_PORT="5173"
BACKEND_PORT="3001"
DB_HOST="54.232.95.241"
DB_USER="ip_telecom"
DB_PASSWORD="Polo38422a"
DB_NAME="ip_telecom"

echo "📁 Criando estrutura em ${PROJECT_DIR}..."
mkdir -p ${PROJECT_DIR}/{backend,frontend/dist,logs}
cd ${PROJECT_DIR}

echo "📦 Backend Setup..."
cd ${PROJECT_DIR}/backend

# package.json para backend
cat > package.json << 'EOF'
{
  "name": "ip-bi-backend",
  "version": "1.0.0",
  "description": "IP Telecom Dashboard Backend",
  "main": "index.js",
  "scripts": {
    "start": "node index.js",
    "dev": "node index.js"
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

# .env para backend
cat > .env << EOF
DB_HOST=${DB_HOST}
DB_USER=${DB_USER}
DB_PASSWORD=${DB_PASSWORD}
DB_NAME=${DB_NAME}
PORT=${BACKEND_PORT}
NODE_ENV=production
EOF

echo "⬇️  Instalando dependências do backend..."
npm install

echo "📝 Criando index.js..."
# Nota: O conteúdo do index.js deve ser copiado do seu projeto local
# cp /caminho/local/server/index.js ${PROJECT_DIR}/backend/
echo "⚠️  Cole o conteúdo do seu index.js em ${PROJECT_DIR}/backend/index.js"

echo ""
echo "🎨 Frontend Setup..."
cd ${PROJECT_DIR}/frontend

# package.json para frontend (apenas para serve)
cat > package.json << 'EOF'
{
  "name": "ip-bi-frontend",
  "version": "1.0.0",
  "description": "IP Telecom Dashboard Frontend",
  "scripts": {
    "serve": "serve -s dist -l 5173"
  },
  "dependencies": {
    "serve": "^14.2.0"
  }
}
EOF

npm install

echo ""
echo "⚡ Configurando PM2..."

# Ecosystem config para PM2
cat > ${PROJECT_DIR}/ecosystem.config.js << EOF
module.exports = {
  apps: [
    {
      name: '${PROJECT_NAME}-backend',
      script: './backend/index.js',
      cwd: '${PROJECT_DIR}',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: ${BACKEND_PORT},
        DB_HOST: '${DB_HOST}',
        DB_USER: '${DB_USER}',
        DB_PASSWORD: '${DB_PASSWORD}',
        DB_NAME: '${DB_NAME}'
      },
      log_file: '${PROJECT_DIR}/logs/backend.log',
      out_file: '${PROJECT_DIR}/logs/backend-out.log',
      error_file: '${PROJECT_DIR}/logs/backend-error.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      max_memory_restart: '500M',
      restart_delay: 3000,
      max_restarts: 5,
      min_uptime: '10s',
      autorestart: true
    },
    {
      name: '${PROJECT_NAME}-frontend',
      script: 'serve',
      args: ['-s', 'dist', '-l', '${FRONTEND_PORT}'],
      cwd: '${PROJECT_DIR}/frontend',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production'
      },
      log_file: '${PROJECT_DIR}/logs/frontend.log',
      max_memory_restart: '300M',
      autorestart: true
    }
  ]
};
EOF

echo ""
echo "🌐 Configurando Nginx..."

# Configuração Nginx
cat > /etc/nginx/sites-available/${PROJECT_NAME} << EOF
server {
    listen 80;
    server_name 177.11.50.137 ip-bi.polo-it.com;

    access_log /var/log/nginx/${PROJECT_NAME}-access.log;
    error_log /var/log/nginx/${PROJECT_NAME}-error.log;

    # Frontend
    location / {
        proxy_pass http://localhost:${FRONTEND_PORT};
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Backend API
    location /api/ {
        proxy_pass http://localhost:${BACKEND_PORT}/;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        
        # Timeouts maiores para queries de BI
        proxy_connect_timeout 300s;
        proxy_send_timeout 300s;
        proxy_read_timeout 300s;
    }

    # API Utech (external)
    location /api/utech/ {
        proxy_pass https://ipfibra.ippolopabx.com.br/utech/;
        proxy_ssl_server_name on;
        proxy_set_header Host ipfibra.ippolopabx.com.br;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
    }
}
EOF

# Ativar site
ln -sf /etc/nginx/sites-available/${PROJECT_NAME} /etc/nginx/sites-enabled/

echo ""
echo "🔍 Testando configuração..."
nginx -t

echo ""
echo "📋 Resumo da estrutura criada:"
echo "================================"
echo "Diretório: ${PROJECT_DIR}"
echo "  ├── backend/"
echo "  │   ├── index.js (⚠️  COLE SEU CÓDIGO AQUI)"
echo "  │   ├── package.json"
echo "  │   └── .env"
echo "  ├── frontend/"
echo "  │   ├── dist/ (⚠️  COLE O BUILD AQUI)"
echo "  │   └── package.json"
echo "  ├── logs/"
echo "  └── ecosystem.config.js"
echo ""
echo "Portas:"
echo "  - Frontend: ${FRONTEND_PORT}"
echo "  - Backend: ${BACKEND_PORT}"
echo ""
echo "Próximos passos:"
echo "==============="
echo "1. Copie seu backend (server/index.js) para: ${PROJECT_DIR}/backend/"
echo "2. Copie o build do frontend (dist/) para: ${PROJECT_DIR}/frontend/dist/"
echo "3. Inicie com: pm2 start ${PROJECT_DIR}/ecosystem.config.js"
echo "4. Recarregue Nginx: systemctl reload nginx"
echo ""
echo "Comandos úteis:"
echo "  pm2 start ecosystem.config.js"
echo "  pm2 logs ${PROJECT_NAME}-backend"
echo "  pm2 logs ${PROJECT_NAME}-frontend"
echo "  pm2 restart all"
echo ""
