# 🚀 Guia de Deploy SUPER FÁCIL - IP Telecom Dashboard

> **Para iniciantes** - Passo a passo bem explicado

---

## 📋 O que você precisa

| Item | Descrição |
|------|-----------|
| **Seu PC** | Windows com o projeto aberto no Windsurf |
| **Servidor** | IP `177.11.50.137` (já configurado) |
| **Senha** | A senha de root do servidor |
| **Programas** | Git Bash (recomendado) ou Putty |

---

## 🛠️ Etapa 1: Instalar Git Bash (se não tiver)

O **Git Bash** é um programa que te permite "falar" com o servidor Linux usando comandos.

1. Acesse: https://git-scm.com/download/win
2. Baixe e instale (clicando "Next" em tudo)
3. Pronto! Agora você tem o Git Bash

---

## 🔌 Etapa 2: Acessar o Servidor (SSH)

### O que é SSH?
SSH é como um "controle remoto" de texto. Você digita comandos no seu PC e eles executam no servidor.

### Passos:

1. **Abra o Git Bash**
   - Clique no menu Iniciar → digite "Git Bash" → abra

2. **Digite o comando de conexão:**
   ```bash
   ssh root@177.11.50.137
   ```

3. **Digite a senha quando pedir**
   - (Quando digita a senha, não aparece nada na tela - é normal!)
   - Aperte Enter

4. **Se aparecer isso:**
   ```
   root@host50-137:~# 
   ```
   ✅ **Você está dentro do servidor!**

---

## 📁 Etapa 3: Criar as Pastas no Servidor

Agora você está "dentro" do servidor. Vamos criar a estrutura de pastas.

### Cole este comando (clique direito no Git Bash para colar):

```bash
mkdir -p /opt/ip-bi/{backend,frontend/dist,logs}
```

**O que isso faz?**
- Cria a pasta `/opt/ip-bi/`
- Dentro cria: `backend/`, `frontend/dist/`, `logs/`

### Verifique se criou:

```bash
ls -la /opt/ip-bi/
```

Deve aparecer:
```
drwxr-xr-x 5 root root 4096 ... backend
drwxr-xr-x 3 root root 4096 ... frontend
drwxr-xr-x 2 root root 4096 ... logs
```

✅ **Pastas criadas!**

---

## 📦 Etapa 4: Preparar Backend no Servidor

### 1. Crie o arquivo de configuração do backend:

```bash
cat > /opt/ip-bi/backend/package.json << 'EOF'
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
```

### 2. Instale as dependências:

```bash
cd /opt/ip-bi/backend && npm install
```

Vai aparecer uma barrinha carregando. Aguarde terminar.

✅ **Backend preparado!**

---

## 💻 Etapa 5: Baixar Projeto do GitHub (MODO FÁCIL!)

Se seu projeto está no GitHub, é **muito mais fácil**! Não precisa copiar arquivo por arquivo.

> ⚠️ **IMPORTANTE:** Se você ainda **não tem** o projeto no GitHub, use o método alternativo abaixo (Etapa 5B).

---

### 🌟 MODO FÁCIL - GitHub (Recomendado)

#### 1. No servidor (SSH), instale o git:

```bash
apt update && apt install -y git
```

#### 2. Clone seu repositório:

```bash
cd /opt

# Substitua pelo seu link do GitHub!
git clone https://github.com/SEU-USUARIO/NOME-DO-REPO.git ip-bi
```

**Exemplo real:**
```bash
git clone https://github.com/ryanpolo/ip-telecom-dashboard.git ip-bi
```

Vai pedir usuário/senha do GitHub se for privado.

#### 3. Organizar os arquivos:

```bash
cd /opt/ip-bi

# Verificar se tem pasta server/
ls -la server/

# Mover arquivos do backend
mkdir -p backend
cp -r server/* backend/ 2>/dev/null || echo "Pasta server/ não encontrada"

# Criar pasta do frontend
mkdir -p frontend/dist
```

#### 4. Buildar o Frontend no servidor:

```bash
cd /opt/ip-bi

# Instalar dependências
npm install

# Buildar (cria a pasta dist/)
npm run build

# Verificar se criou
ls -la dist/
```

Se não tiver Node.js no servidor:
```bash
apt install -y nodejs npm
```

✅ **Projeto baixado e buildado!**

---

### 🔄 Atualizações Futuras (GitHub)

Quando fizer `git push` do Windows, só precisa executar no servidor:

```bash
cd /opt/ip-bi
git pull origin main      # Baixa alterações
npm run build             # Rebuilda frontend
pm2 restart all           # Reinicia tudo
```

---

## 💻 Etapa 5B: Copiar Manualmente (SEM GitHub)

Se você **não usa GitHub**, copie os arquivos manualmente:

### 5B.1 - Abra OUTRO Git Bash (não feche o primeiro!)

Deixe um Git Bash conectado no servidor (o primeiro) e abra outro.

### 5B.2 - No novo Git Bash, vá para a pasta do projeto:

```bash
cd "C:/Users/Ryan Silva/Documents/Projetos de Sites/Ip Telecom Dash/artifacts/atendimento-dashboard"
```

### 5B.3 - Copiar o arquivo principal do backend:

```bash
scp server/index.js root@177.11.50.137:/opt/ip-bi/backend/
```

Vai pedir senha novamente. Digite e aperte Enter.

### 5B.4 - Buildar o Frontend (no Windows):

```bash
npm run build
```

Isso cria a pasta `dist/` com o site pronto.

**Se der erro de "npm não encontrado"**, instale o Node.js:
- https://nodejs.org (baixe a versão LTS)

### 5B.5 - Copiar o Frontend para o servidor:

```bash
scp -r dist/* root@177.11.50.137:/opt/ip-bi/frontend/dist/
```

✅ **Arquivos copiados!**

---

## ⚙️ Etapa 6: Configurar PM2 (Gerenciador de Processos)

PM2 é um programa que mantém seu site rodando 24/7, mesmo se der erro.

### 1. Instalar PM2 no servidor:

No Git Bash que está conectado no servidor:

```bash
npm install -g pm2
```

### 2. Criar arquivo de configuração:

```bash
cat > /opt/ip-bi/ecosystem.config.js << 'EOF'
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
      out_file: '/opt/ip-bi/logs/backend-out.log',
      error_file: '/opt/ip-bi/logs/backend-error.log',
      max_memory_restart: '500M',
      autorestart: true
    },
    {
      name: 'ip-bi-frontend',
      script: 'serve',
      args: ['-s', 'dist', '-l', '5173'],
      cwd: '/opt/ip-bi/frontend',
      instances: 1,
      env: { NODE_ENV: 'production' },
      max_memory_restart: '300M',
      autorestart: true
    }
  ]
};
EOF
```

### 3. Instalar "serve" (programa para servir o frontend):

```bash
cd /opt/ip-bi/frontend && npm install serve
```

### 4. Iniciar os serviços:

```bash
cd /opt/ip-bi && pm2 start ecosystem.config.js
```

Deve aparecer:
```
[PM2] Starting /opt/ip-bi/backend/index.js in fork_mode (1 instance)
[PM2] Done.
┌────┬─────────────────────┬─────────┬─────────┬─────────┐
│ id │ name                │ mode    │ status  │ cpu     │
├────┼─────────────────────┼─────────┼─────────┼─────────┤
│ 0  │ ip-bi-backend       │ fork    │ online  │ 0%      │
│ 1  │ ip-bi-frontend      │ fork    │ online  │ 0%      │
└────┴─────────────────────┴─────────┴─────────┴─────────┘
```

✅ **Serviços rodando!**

### 5. Salvar para iniciar automaticamente no boot:

```bash
pm2 save
pm2 startup
```

Ele vai mostrar um comando. **Copie e cole esse comando**.

---

## 🌐 Etapa 7: Configurar Nginx (Porta 80)

Nginx é o programa que recebe as visitas na porta 80 e repassa para seu site.

### 1. Criar arquivo de configuração:

```bash
cat > /etc/nginx/sites-available/ip-bi << 'EOF'
server {
    listen 80;
    server_name 177.11.50.137;

    access_log /var/log/nginx/ip-bi-access.log;
    error_log /var/log/nginx/ip-bi-error.log;

    # Frontend (site React)
    location / {
        proxy_pass http://localhost:5173;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_cache_bypass $http_upgrade;
    }

    # Backend API
    location /api/ {
        proxy_pass http://localhost:3001/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_connect_timeout 300s;
        proxy_send_timeout 300s;
        proxy_read_timeout 300s;
    }

    # API externa Utech
    location /api/utech/ {
        proxy_pass https://ipfibra.ippolopabx.com.br/utech/;
        proxy_ssl_server_name on;
        proxy_set_header Host ipfibra.ippolopabx.com.br;
    }
}
EOF
```

### 2. Ativar o site:

```bash
ln -sf /etc/nginx/sites-available/ip-bi /etc/nginx/sites-enabled/
```

### 3. Testar configuração:

```bash
nginx -t
```

Deve aparecer:
```
nginx: the configuration file /etc/nginx/nginx.conf syntax is ok
nginx: configuration file /etc/nginx/nginx.conf test is successful
```

✅ **Configuração OK!**

### 4. Recarregar Nginx:

```bash
systemctl reload nginx
```

---

## 🎉 Etapa 8: TESTAR!

Abra seu navegador e acesse:

```
http://177.11.50.137
```

**Se aparecer seu dashboard:** 🎉 **FUNCIONOU!**

**Se der erro:** Veja a seção "Problemas Comuns" abaixo.

---

## 🔧 Problemas Comuns

### ❌ "Permission denied" ao conectar SSH

**Solução:** Verifique se a senha está correta.

### ❌ "npm: command not found"

**Solução:** Instale o Node.js no servidor:
```bash
apt update && apt install -y nodejs npm
```

### ❌ Backend não conecta no banco

**Teste no servidor:**
```bash
telnet 54.232.95.241 3306
```

Se não conectar, verifique firewall da AWS.

### ❌ Nginx: "address already in use"

**Solução:** Mude a porta do frontend/backend no arquivo ecosystem.config.js

### ❌ Site abre mas não carrega dados

**Verifique os logs:**
```bash
# Logs do backend
pm2 logs ip-bi-backend

# Logs do Nginx
tail -f /var/log/nginx/ip-bi-error.log
```

### ❌ Precisa reiniciar tudo

```bash
# Reiniciar serviços
pm2 restart all

# Recarregar Nginx
systemctl reload nginx
```

---

## 📊 Comandos Úteis para o Dia a Dia

| O que fazer | Comando |
|-------------|---------|
| Ver status | `pm2 status` |
| Ver logs | `pm2 logs` |
| Reiniciar | `pm2 restart all` |
| Parar | `pm2 stop all` |
| Monitor | `pm2 monit` |

---

## 🔄 Como Atualizar o Site (Futuro)

### Para atualizar o frontend:

```bash
# 1. No Windows, rebuild:
npm run build

# 2. Copiar para servidor:
scp -r dist/* root@177.11.50.137:/opt/ip-bi/frontend/dist/

# 3. No servidor, reiniciar:
ssh root@177.11.50.137 "pm2 restart ip-bi-frontend"
```

### Para atualizar o backend:

```bash
# 1. Copiar novo index.js:
scp server/index.js root@177.11.50.137:/opt/ip-bi/backend/

# 2. Reiniciar:
ssh root@177.11.50.137 "pm2 restart ip-bi-backend"
```

---

## ✅ Checklist Final

- [ ] Pasta `/opt/ip-bi/` criada no servidor
- [ ] Backend copiado (`index.js` na pasta backend)
- [ ] Frontend buildado e copiado (pasta `dist/`)
- [ ] `npm install` rodou no backend sem erro
- [ ] PM2 mostra 2 processos "online"
- [ ] Nginx configurado e testado
- [ ] Site acessível em http://177.11.50.137

---

## 🆘 Ainda com Dúvidas?

**Me diga exatamente onde travou!**

1. **Qual etapa?** (1, 2, 3, 4, 5, 6, 7 ou 8)
2. **Qual o erro?** (cole o texto do erro)
3. **O que aparece na tela?**

---

**Criado em:** Abril 2026  
**Versão:** 1.0 - Guia para Iniciantes
