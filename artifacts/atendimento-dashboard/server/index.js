const express = require("express");
const mysql = require("mysql2/promise");
const cors = require("cors");
const path = require("path");

const app = express();
app.use(cors());
app.use(express.json());

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

async function initialize() {
  await Promise.all([discoverTable(), loadAgentNames(), loadQueueNames()]);
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
app.get("/api/attendances", async (req, res) => {
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
app.get("/api/filters", async (req, res) => {
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
app.use(express.static(path.join(__dirname, "public")));

// SPA fallback - qualquer rota não-API vai para o frontend
app.get("*", (req, res) => {
  if (!req.path.startsWith("/api")) {
    res.sendFile(path.join(__dirname, "public", "index.html"));
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
