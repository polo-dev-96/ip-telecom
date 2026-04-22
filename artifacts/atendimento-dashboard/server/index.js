const express = require("express");
const mysql = require("mysql2/promise");
const cors = require("cors");
const path = require("path");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET || "ip-telecom-secret-2025";
const JWT_EXPIRES = "12h";
const ADMIN_EMAIL = "admin@polotelecom.com.br";
const ADMIN_PASS = "Polo@123";
const ADMIN_NAME = "Administrador";

const ALL_TABS = ["/", "/atendimentos", "/canais", "/agentes", "/acompanhamento", "/ramais"];

const app = express();
app.use(cors());
app.use(express.json());

// ─── Forward /api/utech/* → external UTech API ──────────────
app.use("/api/utech", async (req, res) => {
  const target = "https://ipfibra.ippolopabx.com.br/utech" + req.url;
  try {
    const resp = await fetch(target, {
      method: req.method,
      headers: { "Content-Type": "application/json" },
    });
    const data = await resp.text();
    res.status(resp.status).set("Content-Type", resp.headers.get("content-type") || "application/json").send(data);
  } catch (err) {
    console.error("UTech proxy error:", err.message);
    res.status(502).json({ error: "Erro ao conectar com API UTech", detail: err.message });
  }
});

// ─── Database config ───────────────────────────────────────────
const DB_CONFIG = {
  host: process.env.DB_HOST || "54.232.95.241",
  user: process.env.DB_USER || "ip_telecom",
  password: process.env.DB_PASSWORD || "Polo38422a",
  database: process.env.DB_NAME || "ip_telecom",
  waitForConnections: true,
  connectionLimit: 10,
  charset: "utf8mb4",
  dateStrings: true, // Avoid JS Date issues with '0000-00-00' values
};

const pool = mysql.createPool(DB_CONFIG);

// ─── External API config ──────────────────────────────────────
const API_TOKEN = "055e3548897785ebe18d691473fff7ab604f273e";
const AGENTS_URL = `https://ipfibra.ippolopabx.com.br/utech/v1/agents/agentlist?page=0&token=${API_TOKEN}`;
const QUEUES_URL = `https://ipfibra.ippolopabx.com.br/utech/v1/queue/queuelist?page=0&token=${API_TOKEN}`;

// ─── Name lookup maps ─────────────────────────────────────────
let AGENT_MAP = {}; // agentId -> name
let QUEUE_MAP = {};  // queueId -> name
let AGENT_QUEUES = {}; // agentId -> array of {queue, priority}

async function loadAgentNames() {
  try {
    const res = await fetch(AGENTS_URL);
    const json = await res.json();
    const agents = json?.agentlist?.agents || [];
    AGENT_MAP = {};
    AGENT_QUEUES = {};
    for (const agent of agents) {
      if (agent.agentid && agent.name) {
        AGENT_MAP[agent.agentid] = agent.name;
      }
      if (agent.agentid && agent.queues) {
        AGENT_QUEUES[agent.agentid] = agent.queues;
      }
    }
    console.log(`👤 Loaded ${Object.keys(AGENT_MAP).length} agent names`);
    console.log(`📋 Loaded queues for ${Object.keys(AGENT_QUEUES).length} agents`);
  } catch (err) {
    console.error("❌ Failed to load agent names:", err.message);
  }
}

async function loadQueueNames() {
  try {
    const res = await fetch(QUEUES_URL);
    const json = await res.json();
    const queues = json?.queuelist?.queues || [];
    QUEUE_MAP = {};
    for (const q of queues) {
      if (q.queue && q.name) {
        QUEUE_MAP[q.queue] = q.name;
      }
    }
    console.log(`📞 Loaded ${Object.keys(QUEUE_MAP).length} queue names`);
  } catch (err) {
    console.error("❌ Failed to load queue names:", err.message);
  }
}

function getAgentName(agentId) {
  if (!agentId) return null;
  return AGENT_MAP[String(agentId)] || String(agentId);
}

function getQueueName(queueId) {
  if (!queueId) return "Geral";
  return QUEUE_MAP[String(queueId)] || String(queueId);
}

function getAgentTeam(agentId) {
  if (!agentId) return "Geral";
  const queues = AGENT_QUEUES[String(agentId)] || [];
  // Find queue in the 8000 range (main team queue)
  const teamQueue = queues.find((q) => q.queue && q.queue.startsWith("8"));
  if (teamQueue) {
    return getQueueName(teamQueue.queue);
  }
  // Fallback to first queue if no 8000 range found
  if (queues.length > 0) {
    return getQueueName(queues[0].queue);
  }
  return "Geral";
}

// ─── Auto-discover main table ──────────────────────────────────
let MAIN_TABLE = null;

async function discoverTable() {
  try {
    const [tables] = await pool.query("SHOW TABLES");
    const tableNames = tables.map((t) => Object.values(t)[0]);
    console.log("📋 Available tables:", tableNames);

    for (const table of tableNames) {
      const [cols] = await pool.query(`DESCRIBE \`${table}\``);
      const colNames = cols.map((c) => c.Field);
      if (
        colNames.includes("protocolo") &&
        colNames.includes("start_date") &&
        colNames.includes("end_date")
      ) {
        MAIN_TABLE = table;
        console.log(`✅ Main table found: ${table}`);
        console.log("   Columns:", colNames.join(", "));
        break;
      }
    }

    if (!MAIN_TABLE) {
      console.error("❌ Could not auto-detect main table. Available:", tableNames);
      if (tableNames.length > 0) {
        MAIN_TABLE = tableNames[0];
        console.log(`⚠️  Fallback to first table: ${MAIN_TABLE}`);
      }
    }
  } catch (err) {
    console.error("❌ DB connection error:", err.message);
  }
}

async function seedAdmin() {
  try {
    const [rows] = await pool.query("SELECT id FROM ip_users WHERE email = ? LIMIT 1", [ADMIN_EMAIL]);
    if (rows.length === 0) {
      const hash = await bcrypt.hash(ADMIN_PASS, 10);
      await pool.query(
        "INSERT INTO ip_users (name, email, password_hash, role, active, permissions) VALUES (?, ?, ?, 'admin', 1, ?)",
        [ADMIN_NAME, ADMIN_EMAIL, hash, JSON.stringify(ALL_TABS)]
      );
      console.log("✅ Admin user created:", ADMIN_EMAIL);
    } else {
      console.log("👤 Admin user already exists");
    }
  } catch (err) {
    console.error("❌ Failed to seed admin:", err.message);
  }
}

// ─── JWT Auth Middleware ───────────────────────────────────────
function authMiddleware(req, res, next) {
  const authHeader = req.headers["authorization"];
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Token de acesso requerido" });
  }
  const token = authHeader.split(" ")[1];
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ error: "Token inválido ou expirado" });
  }
}

function adminMiddleware(req, res, next) {
  if (req.user?.role !== "admin") {
    return res.status(403).json({ error: "Acesso restrito a administradores" });
  }
  next();
}

async function initialize() {
  await Promise.all([discoverTable(), loadAgentNames(), loadQueueNames()]);
  await seedAdmin();
}

// ─── Channel name mapping ──────────────────────────────────────
const CHANNEL_MAP = {
  whatsapp: "WhatsApp",
  instagram: "Instagram",
  webchat: "Webchat",
  email: "Email",
  telegram: "Telegram",
  chat: "Webchat",
  facebook: "Facebook",
};

function normalizeChannel(raw) {
  if (!raw) return "WhatsApp";
  const lower = raw.toLowerCase().trim();
  return CHANNEL_MAP[lower] || raw;
}

// ─── Map DB row to ClosedAttendance format ─────────────────────
function mapRow(row) {
  const startDate = row.start_date ? new Date(row.start_date) : new Date();
  const endDate = row.end_date ? new Date(row.end_date) : new Date();

  // Handle primeiro_atendimento = '0000-00-00 00:00:00' as null
  const primeiroRaw = row.primeiro_atendimento;
  const primeiroAtendimento =
    primeiroRaw &&
    primeiroRaw !== "0000-00-00 00:00:00" &&
    !primeiroRaw.startsWith("0000")
      ? new Date(primeiroRaw)
      : null;

  const ttrMinutes = Math.max(0, (endDate - startDate) / (1000 * 60));
  const frtMinutes = primeiroAtendimento
    ? Math.max(0, (primeiroAtendimento - startDate) / (1000 * 60))
    : null;

  const channel = normalizeChannel(row.tipo_de_canal);

  return {
    id: String(row.id),
    protocol: row.protocolo || "",
    customerIdMasked: row.telefone || "",
    customerNameMasked: row.contato || "",
    channel,
    queue: getQueueName(row.fila),
    team: getAgentTeam(row.agente),
    agentId: row.agente ? String(row.agente) : null,
    agentName: row.agente ? getAgentName(row.agente) : null,
    openedAt: startDate.toISOString(),
    firstResponseAt: primeiroAtendimento
      ? primeiroAtendimento.toISOString()
      : null,
    botEscalatedAt: null,
    firstHumanResponseAt: primeiroAtendimento
      ? primeiroAtendimento.toISOString()
      : null,
    closedAt: endDate.toISOString(),
    status: "finalizado",
    resolutionType: primeiroAtendimento ? "humano" : "bot",
    hadBot: !primeiroAtendimento,
    automatedOnly: !primeiroAtendimento,
    hadHandoff: false,
    handoffSeconds: null,
    transferCount: 0,
    acwSeconds: 0,
    ttrMinutes,
    frtMinutes,
    slaResolutionTargetMinutes: 60,
    withinResolutionSla: ttrMinutes <= 60,
    resolvedFirstContact: true,
    reopenedWithin7Days: false,
    csatScore: null,
    npsScore: null,
    tags: [],
    sentiment: "neutro",
    complianceRecordComplete: true,
    issueType: "Atendimento",
    campaignSource: null,
  };
}

// ─── Auth routes ───────────────────────────────────────────────
app.post("/api/auth/login", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: "Email e senha são obrigatórios" });
  }
  try {
    const [rows] = await pool.query(
      "SELECT * FROM ip_users WHERE email = ? AND active = 1 LIMIT 1",
      [email.trim().toLowerCase()]
    );
    if (rows.length === 0) {
      return res.status(401).json({ error: "Email ou senha inválidos" });
    }
    const user = rows[0];
    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) {
      return res.status(401).json({ error: "Email ou senha inválidos" });
    }
    let permissions = ALL_TABS;
    if (user.permissions) {
      try {
        permissions = typeof user.permissions === "string"
          ? JSON.parse(user.permissions)
          : user.permissions;
      } catch { permissions = ALL_TABS; }
    }
    const payload = { id: user.id, name: user.name, email: user.email, role: user.role, permissions };
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES });
    res.json({ token, user: payload });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/auth/me", authMiddleware, async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT id, name, email, role, permissions FROM ip_users WHERE id = ? AND active = 1 LIMIT 1",
      [req.user.id]
    );
    if (rows.length === 0) return res.status(401).json({ error: "Usuário não encontrado" });
    const u = rows[0];
    let permissions = ALL_TABS;
    if (u.permissions) {
      try { permissions = typeof u.permissions === "string" ? JSON.parse(u.permissions) : u.permissions; } catch { permissions = ALL_TABS; }
    }
    res.json({ user: { id: u.id, name: u.name, email: u.email, role: u.role, permissions } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── User management (admin only) ──────────────────────────────
app.get("/api/users", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT id, name, email, role, active, permissions, created_at FROM ip_users ORDER BY created_at DESC"
    );
    const users = rows.map((u) => ({
      ...u,
      permissions: u.permissions
        ? (typeof u.permissions === "string" ? JSON.parse(u.permissions) : u.permissions)
        : ALL_TABS,
    }));
    res.json({ users });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/users", authMiddleware, adminMiddleware, async (req, res) => {
  const { name, email, password, permissions } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ error: "Nome, email e senha são obrigatórios" });
  }
  try {
    const [existing] = await pool.query("SELECT id FROM ip_users WHERE email = ? LIMIT 1", [email.trim().toLowerCase()]);
    if (existing.length > 0) {
      return res.status(409).json({ error: "Email já cadastrado" });
    }
    const hash = await bcrypt.hash(password, 10);
    const perms = Array.isArray(permissions) && permissions.length > 0 ? permissions : ALL_TABS;
    const [result] = await pool.query(
      "INSERT INTO ip_users (name, email, password_hash, role, active, permissions) VALUES (?, ?, ?, 'user', 1, ?)",
      [name.trim(), email.trim().toLowerCase(), hash, JSON.stringify(perms)]
    );
    res.status(201).json({ id: result.insertId, name, email, role: "user", permissions: perms });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put("/api/users/:id", authMiddleware, adminMiddleware, async (req, res) => {
  const { id } = req.params;
  const { permissions } = req.body;
  if (!Array.isArray(permissions)) {
    return res.status(400).json({ error: "Permissões inválidas" });
  }
  try {
    await pool.query(
      "UPDATE ip_users SET permissions = ?, updated_at = NOW() WHERE id = ?",
      [JSON.stringify(permissions), id]
    );
    res.json({ success: true, permissions });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete("/api/users/:id", authMiddleware, adminMiddleware, async (req, res) => {
  const { id } = req.params;
  if (String(id) === String(req.user.id)) {
    return res.status(400).json({ error: "Não é possível remover o próprio usuário" });
  }
  try {
    await pool.query("DELETE FROM ip_users WHERE id = ?", [id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Health check ──────────────────────────────────────────────
app.get("/api/health", async (req, res) => {
  try {
    const [tables] = await pool.query("SHOW TABLES");
    const tableNames = tables.map((t) => Object.values(t)[0]);
    res.json({
      status: "ok",
      mainTable: MAIN_TABLE,
      tables: tableNames,
    });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
});

// ─── Main attendances endpoint ─────────────────────────────────
app.get("/api/attendances", authMiddleware, async (req, res) => {
  if (!MAIN_TABLE) {
    return res.status(503).json({ error: "Table not discovered yet" });
  }

  try {
    const { dateFrom, dateTo, channels, queues, agents, id } = req.query;

    let sql = `SELECT * FROM \`${MAIN_TABLE}\` WHERE end_date IS NOT NULL AND end_date != '0000-00-00 00:00:00'`;
    const params = [];

    if (id) {
      sql += " AND id = ?";
      params.push(id);
    }

    if (dateFrom) {
      sql += " AND end_date >= ?";
      params.push(dateFrom + " 00:00:00");
    }
    if (dateTo) {
      sql += " AND end_date <= ?";
      params.push(dateTo + " 23:59:59");
    }
    if (channels) {
      const channelList = channels.split(",").map((c) => c.trim().toLowerCase());
      sql += ` AND LOWER(tipo_de_canal) IN (${channelList.map(() => "?").join(",")})`;
      params.push(...channelList);
    }
    if (queues) {
      const queueList = queues.split(",");
      sql += ` AND fila IN (${queueList.map(() => "?").join(",")})`;
      params.push(...queueList);
    }
    if (agents) {
      const agentList = agents.split(",");
      sql += ` AND agente IN (${agentList.map(() => "?").join(",")})`;
      params.push(...agentList);
    }

    sql += " ORDER BY end_date DESC";

    const [rows] = await pool.query(sql, params);
    const mapped = rows.map(mapRow);

    res.json({ data: mapped, total: mapped.length });
  } catch (err) {
    console.error("Query error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─── Filter options (distinct values) ──────────────────────────
app.get("/api/filters", authMiddleware, async (req, res) => {
  if (!MAIN_TABLE) {
    return res.status(503).json({ error: "Table not discovered yet" });
  }

  try {
    const [channelRows] = await pool.query(
      `SELECT DISTINCT tipo_de_canal FROM \`${MAIN_TABLE}\` WHERE tipo_de_canal IS NOT NULL AND tipo_de_canal != '' ORDER BY tipo_de_canal`
    );
    const [queueRows] = await pool.query(
      `SELECT DISTINCT fila FROM \`${MAIN_TABLE}\` WHERE fila IS NOT NULL ORDER BY fila`
    );
    const [agentRows] = await pool.query(
      `SELECT DISTINCT agente FROM \`${MAIN_TABLE}\` WHERE agente IS NOT NULL AND agente != '' ORDER BY agente`
    );

    res.json({
      channels: channelRows.map((r) => ({
        value: r.tipo_de_canal,
        label: normalizeChannel(r.tipo_de_canal),
      })),
      queues: queueRows.map((r) => ({
        value: String(r.fila),
        label: getQueueName(r.fila),
      })),
      agents: agentRows.map((r) => ({
        value: String(r.agente),
        label: getAgentName(r.agente),
      })),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Serve frontend (unified mode) ─────────────────────────────
app.use(express.static(path.join(__dirname, "../dist/public")));

// SPA fallback - qualquer rota não-API vai para o frontend
app.get("*", (req, res) => {
  if (!req.path.startsWith("/api")) {
    res.sendFile(path.join(__dirname, "../dist/public", "index.html"));
  }
});

// ─── Start server ──────────────────────────────────────────────
const PORT = process.env.PORT || 3001;

initialize().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 API server running on http://localhost:${PORT}`);
    console.log(`   Health: http://localhost:${PORT}/api/health`);
  });
});
