/**
 * SnapSell Backend API
 * Frontend ayrı bir sunucuda çalışır (Vite, static host vb.).
 * Bu sunucu sadece /api/* ve /admin/* endpoint'lerini sunar.
 */
const dotenv = require("dotenv");
dotenv.config();
console.log("SnapSell API starting...");

if (typeof globalThis.fetch !== "function") {
  globalThis.fetch = require("node-fetch");
}
const axios = require("axios");
const express = require("express");
const path = require("path");
const fs = require("fs");
const { randomUUID } = require("crypto");
const FormDataPkg = (function () { try { return require("form-data"); } catch (_) { return null; } })();
let supabase = null;
try {
  const url = (process.env.SUPABASE_URL || "").trim();
  const key = (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || "").trim();
  if (url && key) {
    const { createClient } = require("@supabase/supabase-js");
    supabase = createClient(url, key);
    console.log("Supabase hazir.");
  }
} catch (err) {
  console.warn("Supabase yuklenemedi:", err.message);
}

if (typeof globalThis.File === "undefined") {
  try { globalThis.File = require("node:buffer").File; } catch (_) {}
}

process.on("uncaughtException", function (err) {
  console.error("uncaughtException:", err);
});
process.on("unhandledRejection", function (reason, p) {
  console.error("unhandledRejection:", reason);
});

const CREDITS_PER_CONVERSION = 10;
const FREE_CREDITS = 30;
const DEMO_REFILL_CREDITS = 100;
const USERS_COLLECTION = "users";

const PRO_PLANS = ["monthly_plan", "monthly_plan_pro", "yearly_plan", "enterprise"];
const EDITOR_PLANS = ["addon"];
const PRO_PLAN_DEMO = process.env.PRO_PLAN_DEMO === "true" || process.env.PRO_PLAN_DEMO === "1";
const DATA_DIR = path.join(__dirname, "data");
try { if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true }); } catch (_) {}

function loadJsonFile(filename, defaultValue) {
  const p = path.join(DATA_DIR, filename);
  try {
    if (fs.existsSync(p)) return JSON.parse(fs.readFileSync(p, "utf8"));
  } catch (e) { console.warn("loadJsonFile", filename, e.message); }
  return defaultValue !== undefined ? defaultValue : {};
}

function saveJsonFile(filename, data) {
  try {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
    fs.writeFileSync(path.join(DATA_DIR, filename), JSON.stringify(data, null, 2), "utf8");
    return true;
  } catch (e) {
    console.warn("saveJsonFile", filename, e.message);
    return false;
  }
}

const LOGIN_LOGS_FILE = "login_logs.jsonl";

/** Giriş kaydını hem dosyaya (append) hem Supabase login_logs tablosuna yazar. */
async function recordLogin(uid, email, displayName) {
  const entry = {
    user_id: uid,
    email: email || null,
    display_name: displayName || null,
    logged_at: new Date().toISOString()
  };
  try {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
    fs.appendFileSync(path.join(DATA_DIR, LOGIN_LOGS_FILE), JSON.stringify(entry) + "\n", "utf8");
  } catch (e) {
    console.warn("recordLogin file:", e.message);
  }
  if (supabase) {
    try {
      await supabase.from("login_logs").insert({
        user_id: uid,
        email: email || null,
        display_name: displayName || null,
        logged_at: new Date().toISOString()
      });
    } catch (e) {
      console.warn("recordLogin db:", e.message);
    }
  }
}

function savePlanPrices(updatedPrices) {
  planPrices = updatedPrices;
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  const filePath = path.join(DATA_DIR, "plan-prices.json");
  fs.writeFileSync(filePath, JSON.stringify(updatedPrices, null, 2), "utf8");
}

function saveSitePlans(updatedPlans) {
  sitePlans = updatedPlans;
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  const filePath = path.join(DATA_DIR, "site-plans.json");
  fs.writeFileSync(filePath, JSON.stringify(updatedPlans, null, 2), "utf8");
}

/** Tek kaynak: fiyat listesi sadece burada. Dosyadan okuma yok, eski veri geri gelmez. */
const DEFAULT_PLAN_PRICES = { free: 0, monthly_plan: 40, monthly_plan_pro: 65, yearly_plan: 440, enterprise: 0, addon: 15 };
const DEFAULT_SITE_PLANS = [
  { id: "free", name: "Ücretsiz", price: "0", period: "ay", description: "3 dönüşüm, temel özellikler", features: ["3 dönüşüm", "Temel özellikler"], cta: "Ücretsiz başla", href: "/register", highlighted: false, planType: "conversion", credits: 30 },
  { id: "monthly_plan", name: "Aylık plan", price: "40", period: "ay", description: "30 dönüşüm", features: ["30 dönüşüm", "Tüm özellikler", "SEO açıklama", "Fiyat analizi"], cta: "Başla", href: "/register?plan=monthly_plan", highlighted: true, planType: "conversion", credits: 300 },
  { id: "monthly_plan_pro", name: "Aylık plan Pro", price: "65", period: "ay", description: "80 dönüşüm", features: ["80 dönüşüm", "Tüm özellikler", "SEO açıklama", "Fiyat analizi"], cta: "Pro'ya geç", href: "/register?plan=monthly_plan_pro", highlighted: false, planType: "conversion", credits: 800 },
  { id: "yearly_plan", name: "Yıllık plan", price: "440", period: "yıl", description: "1200 dönüşüm, aylık 100 yüklenecek", features: ["1200 dönüşüm", "Aylık 100 dönüşüm yüklenecek", "Tüm özellikler", "SEO açıklama", "Fiyat analizi", "Özellik gelişmeleri dahil"], cta: "Yıllık seç", href: "/register?plan=yearly_plan", highlighted: false, planType: "conversion", credits: 12000 },
  { id: "enterprise", name: "Kurumsal", price: "—", period: "yıl", description: "Bize ulaşın", features: ["Ekibiniz ile takım kurma ayrıcalığı", "Tüm özellikler", "SEO açıklama", "Fiyat analizi", "Yüklenecek özellik gelişmeleri dahil", "Yıllık faturalandırma"], cta: "Bize ulaşın", href: "/destek", highlighted: false, planType: "conversion", credits: 0 },
  { id: "addon", name: "Ek paket", price: "15", period: "ay", description: "25 dönüşüm", features: ["25 dönüşüm", "Tüm özellikler dahil"], cta: "Ek paket al", href: "/register?plan=addon", highlighted: false, planType: "addon", credits: 250 }
];

function applyPlanType(plans) {
  return plans.map(function (p) {
    const id = (p.id || "").toString();
    const planType = p.planType || (EDITOR_PLANS.some(function (e) { return id === e; }) ? "editor" : id === "addon" ? "addon" : "conversion");
    return { ...p, planType };
  });
}

/** Başlangıç: admin daha önce kaydettiyse dosyadan yükle, yoksa kod içi varsayılan. */
function loadPlanPricesFromDisk() {
  const loaded = loadJsonFile("plan-prices.json", null);
  if (loaded && typeof loaded === "object" && !Array.isArray(loaded)) return { ...DEFAULT_PLAN_PRICES, ...loaded };
  return { ...DEFAULT_PLAN_PRICES };
}
function loadSitePlansFromDisk() {
  const loaded = loadJsonFile("site-plans.json", null);
  const arr = Array.isArray(loaded) && loaded.length > 0 ? loaded : DEFAULT_SITE_PLANS;
  return applyPlanType(arr);
}

let planPrices = loadPlanPricesFromDisk();
let enterprisePlans = loadJsonFile("enterprise-plans.json", []);
let sitePlans = loadSitePlansFromDisk();

/** Plan satın alındığında atanacak kredi. Bellekteki sitePlans kullanılır. */
function getCreditsForPlan(planId) {
  const p = sitePlans.find(function (x) { return (x.id || x.name) === planId; });
  if (p && typeof p.credits === "number") return p.credits;
  return 0;
}

function getTodayKey() {
  return new Date().toISOString().slice(0, 10);
}
function loadDailyStats() {
  return loadJsonFile("daily_stats.json", {});
}
function incrementDailyStat(field) {
  const key = getTodayKey();
  const stats = loadDailyStats();
  if (!stats[key]) stats[key] = { visitors: 0, conversions: 0, signups: 0 };
  stats[key][field] = (stats[key][field] || 0) + 1;
  saveJsonFile("daily_stats.json", stats);
}

let teams = loadJsonFile("teams.json", []);
function loadTeams() {
  teams = loadJsonFile("teams.json", []);
  return teams;
}
function saveTeams(data) {
  teams = Array.isArray(data) ? data : teams;
  saveJsonFile("teams.json", teams);
  return teams;
}

function getEnterprisePlan(planId) {
  return Array.isArray(enterprisePlans) && enterprisePlans.find(function (p) { return p.id === planId; });
}

function isProPlan(plan) {
  if (PRO_PLAN_DEMO) return true;
  if (!plan) return false;
  if (PRO_PLANS.includes(String(plan))) return true;
  if (String(plan).startsWith("enterprise_")) {
    const ep = getEnterprisePlan(String(plan));
    return ep && ep.isPro;
  }
  return false;
}
function isEditorPlan(plan) {
  if (!plan) return false;
  if (EDITOR_PLANS.includes(String(plan))) return true;
  if (String(plan).startsWith("enterprise_")) {
    const ep = getEnterprisePlan(String(plan));
    return ep && ep.isEditor;
  }
  return false;
}
function resolvePlan(plan) {
  if (PRO_PLAN_DEMO) return "monthly_plan_pro";
  return plan || "free";
}

let adminAuth = null;
let firebaseAuthInitDone = false;

/** Firebase: sadece Auth (Google token doğrulama). Veritabanı Supabase. */
function initFirebaseAuth() {
  if (firebaseAuthInitDone) return;
  firebaseAuthInitDone = true;
  try {
    const admin = require("firebase-admin");
    if (!admin.apps.length) {
      if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
        const cred = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
        admin.initializeApp({ credential: admin.credential.cert(cred) });
      } else {
        admin.initializeApp({ credential: admin.credential.applicationDefault() });
      }
    }
    adminAuth = admin.auth();
    console.log("Firebase Auth hazir.");
  } catch (err) {
    console.warn("Firebase Auth baslatilamadi:", err.message);
  }
}

const memoryUsers = new Map();
const MEMORY_USERS_FILE = "users_memory.json";

function saveMemoryUsers() {
  if (supabase) return;
  const obj = {};
  memoryUsers.forEach((u, id) => {
    obj[id] = {
      credits: u.credits,
      plan: u.plan,
      totalConversions: u.totalConversions ?? 0,
      email: u.email || null,
      displayName: u.displayName || null,
      createdAt: u.createdAt != null ? u.createdAt : null
    };
  });
  saveJsonFile(MEMORY_USERS_FILE, obj);
}

function loadMemoryUsers() {
  if (supabase) return;
  const obj = loadJsonFile(MEMORY_USERS_FILE, {});
  Object.keys(obj).forEach((id) => {
    const u = obj[id];
    memoryUsers.set(id, {
      credits: u.credits != null ? u.credits : FREE_CREDITS,
      plan: u.plan || "free",
      totalConversions: u.totalConversions != null ? u.totalConversions : 0,
      email: u.email || null,
      displayName: u.displayName || null,
      createdAt: u.createdAt != null ? u.createdAt : null
    });
  });
  if (memoryUsers.size > 0) console.log("Bellek kullanicilar yuklendi:", memoryUsers.size);
}
loadMemoryUsers();

const processedImages = new Map();
const PROCESSED_IMAGE_TTL_MS = 5 * 60 * 1000;

function cleanupProcessedImages() {
  const now = Date.now();
  for (const [id, entry] of processedImages.entries()) {
    if (now - entry.createdAt > PROCESSED_IMAGE_TTL_MS) processedImages.delete(id);
  }
}

/** Veritabanında kullanıcı güncelle (Supabase veya bellek). */
async function updateUserInDb(userId, data) {
  const payload = {};
  if (data.credits != null) payload.credits = data.credits;
  if (data.plan != null) payload.plan = data.plan;
  if (data.totalConversions != null) payload.total_conversions = data.totalConversions;
  if (data.email != null) payload.email = data.email;
  if (data.displayName != null) payload.display_name = data.displayName;
  if (Object.keys(payload).length === 0) return;
  if (supabase) {
    const { error } = await supabase.from("users").update(payload).eq("id", userId);
    if (error) throw new Error(error.message);
    return;
  }
  if (memoryUsers.has(userId)) {
    const u = memoryUsers.get(userId);
    if (data.credits != null) u.credits = data.credits;
    if (data.plan != null) u.plan = data.plan;
    if (data.totalConversions != null) u.totalConversions = data.totalConversions;
    if (data.email != null) u.email = data.email;
    if (data.displayName != null) u.displayName = data.displayName;
    saveMemoryUsers();
  }
}

async function getOrCreateUser(sessionIdOrUid, opts) {
  opts = opts || {};
  if (supabase) {
    const { data: row, error: fetchErr } = await supabase.from("users").select("*").eq("id", sessionIdOrUid).maybeSingle();
    if (fetchErr) throw new Error(fetchErr.message);
    if (row) {
      const plan = resolvePlan(row.plan);
      const createdAt = row.created_at ? new Date(row.created_at) : null;
      return {
        id: sessionIdOrUid,
        ref: { update: async (d) => updateUserInDb(sessionIdOrUid, d) },
        credits: row.credits ?? FREE_CREDITS,
        plan,
        email: row.email || null,
        displayName: row.display_name || null,
        createdAt,
        totalConversions: row.total_conversions ?? 0
      };
    }
    // Aynı e-posta ile daha önce kayıt varsa onu kullan (ücretsiz hak yenilenmesin)
    if (opts.email != null && String(opts.email).trim() !== "") {
      const emailNorm = String(opts.email).trim().toLowerCase();
      const { data: existingByEmail, error: emailErr } = await supabase.from("users").select("*").ilike("email", emailNorm).maybeSingle();
      if (!emailErr && existingByEmail) {
        const plan = resolvePlan(existingByEmail.plan);
        const createdAt = existingByEmail.created_at ? new Date(existingByEmail.created_at) : null;
        return {
          id: existingByEmail.id,
          ref: { update: async (d) => updateUserInDb(existingByEmail.id, d) },
          credits: existingByEmail.credits ?? FREE_CREDITS,
          plan,
          email: existingByEmail.email || null,
          displayName: existingByEmail.display_name || null,
          createdAt,
          totalConversions: existingByEmail.total_conversions ?? 0
        };
      }
    }
    // Session (X-Session-Id) ile gelip kullanıcı yoksa yeni oluşturma; ücretsiz 3 hak sadece POST /api/register ile verilsin
    if (opts.email == null && opts.displayName == null) return null;
    const plan = resolvePlan("free");
    const insertRow = {
      id: sessionIdOrUid,
      plan: "free",
      credits: FREE_CREDITS,
      total_conversions: 0
    };
    if (opts.email != null) insertRow.email = String(opts.email);
    if (opts.displayName != null) insertRow.display_name = String(opts.displayName);
    const { error: insertErr } = await supabase.from("users").insert(insertRow);
    if (insertErr) throw new Error(insertErr.message);
    try { incrementDailyStat("signups"); } catch (_) {}
    return {
      id: sessionIdOrUid,
      ref: { update: async (d) => updateUserInDb(sessionIdOrUid, d) },
      credits: FREE_CREDITS,
      plan,
      email: opts.email || null,
      displayName: opts.displayName || null,
      createdAt: new Date(),
      totalConversions: 0
    };
  }
  // Bellek deposu: aynı e-posta varsa onu kullan (ücretsiz hak yenilenmesin)
  if (opts.email != null && String(opts.email).trim() !== "") {
    const emailNorm = String(opts.email).trim().toLowerCase();
    for (const [id, u] of memoryUsers.entries()) {
      if (u.email && String(u.email).trim().toLowerCase() === emailNorm) {
        return {
          id,
          ref: { update: async (d) => updateUserInDb(id, d) },
          credits: u.credits ?? FREE_CREDITS,
          plan: resolvePlan(u.plan),
          totalConversions: u.totalConversions ?? 0,
          email: u.email || null,
          displayName: u.displayName || null,
          createdAt: u.createdAt != null ? (typeof u.createdAt === "number" ? u.createdAt : new Date(u.createdAt).getTime()) : null,
          _memory: true
        };
      }
    }
  }
  if (!memoryUsers.has(sessionIdOrUid)) {
    if (opts.email == null && opts.displayName == null) return null;
    memoryUsers.set(sessionIdOrUid, {
      credits: FREE_CREDITS,
      plan: "free",
      createdAt: Date.now(),
      totalConversions: 0,
      email: opts.email != null ? String(opts.email) : null,
      displayName: opts.displayName != null ? String(opts.displayName) : null
    });
    saveMemoryUsers();
    try { incrementDailyStat("signups"); } catch (_) {}
  } else if (opts.email != null || opts.displayName != null) {
    const existing = memoryUsers.get(sessionIdOrUid);
    if (opts.email != null) existing.email = String(opts.email);
    if (opts.displayName != null) existing.displayName = String(opts.displayName);
  }
  const u = memoryUsers.get(sessionIdOrUid);
  return {
    id: sessionIdOrUid,
    ref: { update: async (d) => updateUserInDb(sessionIdOrUid, d) },
    credits: u.credits ?? FREE_CREDITS,
    plan: resolvePlan(u.plan),
    totalConversions: u.totalConversions ?? 0,
    email: u.email || null,
    displayName: u.displayName || null,
    createdAt: u.createdAt != null ? (typeof u.createdAt === "number" ? u.createdAt : new Date(u.createdAt).getTime()) : null,
    _memory: true
  };
}

async function getRequestUser(req) {
  const authHeader = req.headers.authorization;
  if (authHeader && typeof authHeader === "string" && authHeader.startsWith("Bearer ")) {
    const token = authHeader.slice(7).trim();
    if (!token) return null;
    if (!adminAuth) initFirebaseAuth();
    if (!adminAuth) return null;
    try {
      const decoded = await adminAuth.verifyIdToken(token);
      const uid = decoded.uid;
      const email = decoded.email || null;
      const displayName = decoded.name || decoded.email || null;
      return await getOrCreateUser(uid, { email, displayName });
    } catch (e) {
      console.warn("Firebase token verify:", e.message);
      return null;
    }
  }
  const sessionId = req.headers["x-session-id"];
  if (sessionId && typeof sessionId === "string") return await getOrCreateUser(sessionId.trim());
  return null;
}

const APP_DOMAIN = (process.env.APP_DOMAIN || "").trim();
const cors = require("cors");

const CORS_ALLOWED_ORIGINS = [
  "https://snapsell.website",
  "https://www.snapsell.website"
];

const corsOptions = {
  origin: CORS_ALLOWED_ORIGINS,
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Session-Id"]
};

const app = express();
app.disable("x-powered-by");

// 0) Explicit preflight handler first – ensures OPTIONS always gets CORS headers (avoids 502/no header)
app.use(function (req, res, next) {
  const origin = req.headers.origin;
  if (req.method === "OPTIONS") {
    if (origin && CORS_ALLOWED_ORIGINS.includes(origin)) {
      res.setHeader("Access-Control-Allow-Origin", origin);
      res.setHeader("Access-Control-Allow-Credentials", "true");
      res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
      res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Session-Id");
      res.setHeader("Access-Control-Max-Age", "86400");
    }
    return res.status(204).end();
  }
  next();
});

// 1) CORS for non-OPTIONS requests
app.use(cors(corsOptions));
app.options("*", cors(corsOptions));

// 2) Body parser
app.use(express.json({ limit: "50mb" }));

// 3) API routes (app.get, app.post, app.use("/api/...") etc. follow below)

app.get("/", function (req, res) {
  res.json({
    status: "ok",
    service: "SnapSell API",
    message: "SnapSell backend running"
  });
});

app.get("/health", function (req, res) {
  res.send("ok");
});

app.get("/favicon.ico", function (req, res) {
  res.status(204).end();
});
app.get("/ping", function (req, res) {
  res.send("pong");
});
app.get("/api/track-visit", function (req, res) {
  try { incrementDailyStat("visitors"); } catch (_) {}
  res.status(204).end();
});
app.get("/api/snapserver", function (req, res) {
  res.json({ ok: true, msg: "SnapSell API calisiyor" });
});

const ADMIN_PASSWORD = (process.env.ADMIN_PASSWORD || "").trim();
const ADMIN_EMAIL = (process.env.ADMIN_EMAIL || "Helai.ai.dijital.ajans@gmail.com").trim().toLowerCase();
const REPLICATE_ALLOWED_EMAILS = (process.env.REPLICATE_ALLOWED_EMAILS || "helyora349@gmail.com")
  .split(",")
  .map(function (e) { return e.trim().toLowerCase(); })
  .filter(Boolean);
function isAdminUser(user) {
  return user && user.email && String(user.email).toLowerCase() === ADMIN_EMAIL;
}
function canUseReplicate(user) {
  if (!user) return false;
  const email = (user.email || "").trim().toLowerCase();
  if (REPLICATE_ALLOWED_EMAILS.indexOf(email) >= 0) return true;
  return isEditorPlan(user.plan || "free") || isAdminUser(user);
}
function canUsePixian(user) {
  if (!user) return false;
  const plan = user.plan || "free";
  if (isEditorPlan(plan)) return false;
  return isProPlan(plan) || isAdminUser(user);
}
function canUsePhotoRoom(user) {
  if (!user) return false;
  const email = (user.email || "").trim().toLowerCase();
  // Admin ve özel izinli e-postalar limit dışı
  if (REPLICATE_ALLOWED_EMAILS.indexOf(email) >= 0 || isAdminUser(user)) return true;
  const plan = user.plan || "free";
  const credits = user.credits ?? FREE_CREDITS;
  // Herhangi bir kullanıcı için, plan ne olursa olsun en az bir dönüşüm kredisi olmalı
  if (credits < CREDITS_PER_CONVERSION) return false;
  // Ücretsiz planda: 3 deneme limiti / krediler başka yerde kontrol ediliyor, burada sadece erişime izin ver
  if (plan === "free") return true;
  // Ücretli planlarda da kredi temelli kullanım: editor/pro planı varsa ve kredisi yeterliyse izin ver
  return isEditorPlan(plan);
}
function canUseLeonardo(user) {
  return isProPlan(user.plan || "free") || isAdminUser(user);
}
function parseCookie(str) {
  const out = {};
  if (!str || typeof str !== "string") return out;
  str.split(";").forEach(function (part) {
    const i = part.indexOf("=");
    if (i > 0) out[part.slice(0, i).trim()] = part.slice(i + 1).trim();
  });
  return out;
}
async function requireAdmin(req, res, next) {
  const cookieToken = parseCookie(req.headers.cookie || "").snapsell_admin || "";
  const bearerToken = (req.headers.authorization && req.headers.authorization.startsWith("Bearer "))
    ? req.headers.authorization.slice(7).trim()
    : "";
  const token = cookieToken || bearerToken;
  if (token === ADMIN_PASSWORD) return next();
  if (bearerToken && bearerToken !== ADMIN_PASSWORD) {
    try {
      initFirebaseAuth();
      if (adminAuth) {
        const decoded = await adminAuth.verifyIdToken(bearerToken);
        const email = (decoded.email || "").toLowerCase();
        if (email === ADMIN_EMAIL) return next();
      }
    } catch (e) { /* token gecersiz */ }
  }
  if (!ADMIN_PASSWORD) return res.status(403).json({ error: "Admin sifresi .env icinde ADMIN_PASSWORD olarak ayarlanmali." });
  return res.status(401).json({ error: "Yetkisiz" });
}

app.get("/api/config", function (req, res) {
  res.json({
    appDomain: APP_DOMAIN || null,
    allowedOrigins: corsOptions.origin && corsOptions.origin.length ? corsOptions.origin : null
  });
});

app.get("/api/plan-prices", function (req, res) {
  enterprisePlans = loadJsonFile("enterprise-plans.json", enterprisePlans);
  res.json({ planPrices, enterprisePlans });
});
app.get("/api/site-plans", function (req, res) {
  res.setHeader("Content-Type", "application/json");
  res.status(200).json({ success: true, plans: sitePlans });
});

app.get("/api/plans", async function (req, res) {
  res.setHeader("Content-Type", "application/json");
  try {
    if (supabase) {
      const { data, error } = await supabase.from("plans").select("*");
      if (error) {
        return res.status(500).json({ success: false, error: error.message });
      }
      return res.status(200).json({ success: true, plans: data || [] });
    }
    res.status(200).json({ success: true, plans: sitePlans });
  } catch (err) {
    console.error("api/plans:", err.message);
    res.status(500).json({ success: false, error: err.message || "Plans error" });
  }
});

app.get("/api/stripe", (req, res) => {
  res.status(200).json({ message: "Payment system coming soon" });
});

/** Railway/deploy doğrulama: bu endpoint 200 dönerse admin route'ları yüklü demektir. */
app.get("/admin/ping", function (req, res) {
  res.json({ ok: true, msg: "admin routes loaded", hasPlans: true, hasImageEdits: true });
});

app.post("/admin/login", function (req, res) {
  const password = (req.body && req.body.password) || "";
  if (!ADMIN_PASSWORD) {
    return res.status(503).json({ error: "ADMIN_PASSWORD .env icinde ayarlanmali." });
  }
  if (password !== ADMIN_PASSWORD) {
    return res.status(401).json({ error: "Yanlis sifre." });
  }
  res.cookie("snapsell_admin", ADMIN_PASSWORD, { httpOnly: true, maxAge: 7 * 24 * 60 * 60 * 1000, path: "/", sameSite: "lax" });
  res.json({ ok: true, token: ADMIN_PASSWORD });
});

app.get("/admin/me", requireAdmin, function (req, res) {
  res.json({ ok: true });
});

app.get("/admin/users", requireAdmin, async function (req, res) {
  const list = [];
  if (supabase) {
    const { data: rows, error } = await supabase.from("users").select("id, email, display_name, plan, credits, total_conversions, created_at");
    if (!error && rows) {
      rows.forEach(function (r) {
        list.push({
          id: r.id,
          email: r.email || null,
          displayName: r.display_name || null,
          plan: r.plan || "free",
          credits: r.credits ?? FREE_CREDITS,
          totalConversions: r.total_conversions ?? 0,
          createdAt: r.created_at ? new Date(r.created_at).getTime() : null
        });
      });
    }
  }
  const seen = new Set(list.map(function (u) { return u.id; }));
  memoryUsers.forEach(function (u, id) {
    if (seen.has(id)) return;
    seen.add(id);
    list.push({
      id,
      email: u.email || null,
      displayName: u.displayName || null,
      plan: u.plan || "free",
      credits: u.credits ?? FREE_CREDITS,
      totalConversions: u.totalConversions ?? 0,
      createdAt: u.createdAt || null,
      _memory: true
    });
  });
  list.sort(function (a, b) {
    const ta = a.createdAt || 0;
    const tb = b.createdAt || 0;
    return tb - ta;
  });
  res.json({ users: list });
});

/** Planları döndürür. Bellekteki değer kullanılır; reset/put sonrası ekranın eskiye dönmesi engellenir. */
app.get("/admin/plans", requireAdmin, function (req, res) {
  res.json({ planPrices, enterprisePlans, sitePlans });
});

/** Fiyat ve planları kod içi varsayılana sıfırlar. */
app.post("/admin/plans/reset", requireAdmin, function (req, res) {
  try {
    planPrices = { ...DEFAULT_PLAN_PRICES };
    sitePlans = applyPlanType(DEFAULT_SITE_PLANS);
    savePlanPrices(planPrices);
    saveSitePlans(sitePlans);
    return res.json({ ok: true, planPrices, enterprisePlans, sitePlans });
  } catch (e) {
    return res.status(500).json({ ok: false, error: String(e && e.message) });
  }
});

/** Admin panelinden gelen fiyat/plan güncellemelerini kaydeder. Yanıtta ok: true ve güncel veri döner ki panel state güncellensin. */
app.put("/admin/plans", requireAdmin, function (req, res) {
  const body = req.body || {};
  if (body.planPrices != null && typeof body.planPrices === "object") {
    planPrices = body.planPrices;
    savePlanPrices(planPrices);
  }
  if (body.sitePlans != null && Array.isArray(body.sitePlans)) {
    sitePlans = applyPlanType(body.sitePlans);
    saveSitePlans(sitePlans);
  }
  if (body.enterprisePlans != null && Array.isArray(body.enterprisePlans)) {
    enterprisePlans = body.enterprisePlans;
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
    fs.writeFileSync(path.join(DATA_DIR, "enterprise-plans.json"), JSON.stringify(enterprisePlans, null, 2), "utf8");
  }
  res.json({ ok: true, planPrices, enterprisePlans, sitePlans });
});


app.post("/admin/users/:id/plan", requireAdmin, async function (req, res) {
  const sessionId = req.params.id;
  const plan = (req.body && req.body.plan) != null ? String(req.body.plan) : "";
  if (!sessionId || !plan) return res.status(400).json({ error: "id ve plan gerekli" });
  const planCredits = getCreditsForPlan(plan);
  const isAddon = plan === "addon";
  if (supabase) {
    const { data: row } = await supabase.from("users").select("credits").eq("id", sessionId).maybeSingle();
    if (row) {
      const currentCredits = row.credits ?? FREE_CREDITS;
      const newCredits = isAddon ? currentCredits + planCredits : planCredits;
      await updateUserInDb(sessionId, { plan, credits: newCredits });
      return res.json({ ok: true, plan, credits: newCredits });
    }
  }
  if (memoryUsers.has(sessionId)) {
    const u = memoryUsers.get(sessionId);
    const currentCredits = u.credits ?? FREE_CREDITS;
    u.plan = plan;
    u.credits = isAddon ? currentCredits + planCredits : planCredits;
    return res.json({ ok: true, plan, credits: u.credits });
  }
  return res.status(404).json({ error: "Kullanici bulunamadi" });
});

app.post("/admin/logout", function (req, res) {
  res.clearCookie("snapsell_admin", { path: "/" });
  res.json({ ok: true });
});

app.get("/admin/stats", requireAdmin, async function (req, res) {
  const today = getTodayKey();
  const stats = loadDailyStats();
  const todayData = stats[today] || { visitors: 0, conversions: 0, signups: 0 };
  const last7 = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    last7.push({ date: key, ...(stats[key] || { visitors: 0, conversions: 0, signups: 0 }) });
  }
  last7.reverse();
  res.json({
    today: todayData,
    dailyVisitors: todayData.visitors,
    dailyConversions: todayData.conversions,
    newSignupsToday: todayData.signups,
    last7Days: last7
  });
});

/** Giriş kayıtları: dosya + veritabanı (admin panel). */
app.get("/admin/logins", requireAdmin, async function (req, res) {
  const list = [];
  const filePath = path.join(DATA_DIR, LOGIN_LOGS_FILE);
  if (fs.existsSync(filePath)) {
    try {
      const lines = fs.readFileSync(filePath, "utf8").split("\n").filter(Boolean);
      lines.forEach(function (line) {
        try {
          const o = JSON.parse(line);
          list.push({
            user_id: o.user_id,
            email: o.email || null,
            display_name: o.display_name || null,
            logged_at: o.logged_at || null,
            source: "file"
          });
        } catch (_) {}
      });
    } catch (e) {
      console.warn("admin/logins file read:", e.message);
    }
  }
  if (supabase) {
    try {
      const { data: rows, error } = await supabase.from("login_logs").select("user_id, email, display_name, logged_at").order("logged_at", { ascending: false }).limit(2000);
      if (!error && rows) {
        const seen = new Set(list.map(function (e) { return (e.logged_at || "") + (e.user_id || ""); }));
        rows.forEach(function (r) {
          const key = (r.logged_at || "") + (r.user_id || "");
          if (seen.has(key)) return;
          seen.add(key);
          list.push({
            user_id: r.user_id,
            email: r.email || null,
            display_name: r.display_name || null,
            logged_at: r.logged_at || null,
            source: "db"
          });
        });
      }
    } catch (e) {
      console.warn("admin/logins db:", e.message);
    }
  }
  list.sort(function (a, b) {
    const ta = a.logged_at ? new Date(a.logged_at).getTime() : 0;
    const tb = b.logged_at ? new Date(b.logged_at).getTime() : 0;
    return tb - ta;
  });
  res.json({ logins: list.slice(0, 500) });
});

app.get("/admin/subscribers", requireAdmin, async function (req, res) {
  const list = [];
  if (supabase) {
    const { data: rows, error } = await supabase.from("users").select("id, email, display_name, plan, credits, total_conversions, created_at");
    if (!error && rows) {
      rows.forEach(function (r) {
        const plan = (r.plan || "free").toString();
        list.push({
          id: r.id,
          email: r.email || null,
          displayName: r.display_name || null,
          plan,
          credits: r.credits ?? FREE_CREDITS,
          totalConversions: r.total_conversions ?? 0,
          createdAt: r.created_at ? new Date(r.created_at).getTime() : null
        });
      });
    }
  }
  memoryUsers.forEach(function (u, id) {
    list.push({
      id,
      email: u.email || null,
      displayName: u.displayName || null,
      plan: u.plan || "free",
      credits: u.credits ?? FREE_CREDITS,
      totalConversions: u.totalConversions ?? 0,
      createdAt: u.createdAt || null
    });
  });
  const monthly = list.filter(function (u) {
    const p = (u.plan || "").toString();
    return p.startsWith("monthly_");
  });
  const yearly = list.filter(function (u) {
    const p = (u.plan || "").toString();
    return p.startsWith("yearly_");
  });
  res.json({ monthly, yearly, all: list });
});

/** Admin: Görsel düzenleme kayıtları. Şimdilik boş dizi; ileride data/image-edits.json veya Firestore ile doldurulabilir. */
app.get("/admin/image-edits", requireAdmin, function (req, res) {
  const loaded = loadJsonFile("image-edits.json", null);
  const edits = Array.isArray(loaded) ? loaded : [];
  res.json({ edits });
});

app.get("/admin/teams", requireAdmin, function (req, res) {
  loadTeams();
  res.json({ teams });
});
app.post("/admin/teams", requireAdmin, function (req, res) {
  const body = req.body || {};
  const name = (body.name || "").trim() || "Yeni Takım";
  const id = randomUUID().slice(0, 8);
  const team = { id, name, memberIds: [], enterprisePlanId: body.enterprisePlanId || null, createdAt: Date.now() };
  loadTeams();
  teams.push(team);
  saveTeams(teams);
  res.status(201).json({ ok: true, team });
});
app.put("/admin/teams/:id", requireAdmin, function (req, res) {
  const id = req.params.id;
  const body = req.body || {};
  loadTeams();
  const idx = teams.findIndex(function (t) { return t.id === id; });
  if (idx < 0) return res.status(404).json({ error: "Takim bulunamadi" });
  if (body.name != null) teams[idx].name = String(body.name);
  if (Array.isArray(body.memberIds)) teams[idx].memberIds = body.memberIds;
  if (body.enterprisePlanId != null) teams[idx].enterprisePlanId = body.enterprisePlanId;
  saveTeams(teams);
  res.json({ ok: true, team: teams[idx] });
});
app.delete("/admin/teams/:id", requireAdmin, function (req, res) {
  const id = req.params.id;
  loadTeams();
  const idx = teams.findIndex(function (t) { return t.id === id; });
  if (idx < 0) return res.status(404).json({ error: "Takim bulunamadi" });
  teams.splice(idx, 1);
  saveTeams(teams);
  res.json({ ok: true });
});

// --- Aynı admin route'ları /api/admin/* altında (Railway/proxy /admin 404 verirse kullan) ---
app.get("/api/admin/ping", function (req, res) {
  res.json({ ok: true, msg: "admin routes loaded", hasPlans: true, hasImageEdits: true });
});
app.post("/api/admin/login", function (req, res) {
  const password = (req.body && req.body.password) || "";
  if (!ADMIN_PASSWORD) return res.status(503).json({ error: "ADMIN_PASSWORD .env icinde ayarlanmali." });
  if (password !== ADMIN_PASSWORD) return res.status(401).json({ error: "Yanlis sifre." });
  res.cookie("snapsell_admin", ADMIN_PASSWORD, { httpOnly: true, maxAge: 7 * 24 * 60 * 60 * 1000, path: "/", sameSite: "lax" });
  res.json({ ok: true, token: ADMIN_PASSWORD });
});
app.get("/api/admin/me", requireAdmin, function (req, res) { res.json({ ok: true }); });
app.get("/api/admin/plans", requireAdmin, function (req, res) {
  res.json({ planPrices, enterprisePlans, sitePlans });
});
app.post("/api/admin/plans/reset", requireAdmin, function (req, res) {
  try {
    planPrices = { ...DEFAULT_PLAN_PRICES };
    sitePlans = applyPlanType(DEFAULT_SITE_PLANS);
    savePlanPrices(planPrices);
    saveSitePlans(sitePlans);
    return res.json({ ok: true, planPrices, enterprisePlans, sitePlans });
  } catch (e) {
    return res.status(500).json({ ok: false, error: String(e && e.message) });
  }
});
app.put("/api/admin/plans", requireAdmin, function (req, res) {
  const body = req.body || {};
  if (body.planPrices != null && typeof body.planPrices === "object") {
    planPrices = body.planPrices;
    savePlanPrices(planPrices);
  }
  if (body.sitePlans != null && Array.isArray(body.sitePlans)) {
    sitePlans = applyPlanType(body.sitePlans);
    saveSitePlans(sitePlans);
  }
  if (body.enterprisePlans != null && Array.isArray(body.enterprisePlans)) {
    enterprisePlans = body.enterprisePlans;
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
    fs.writeFileSync(path.join(DATA_DIR, "enterprise-plans.json"), JSON.stringify(enterprisePlans, null, 2), "utf8");
  }
  res.json({ ok: true, planPrices, enterprisePlans, sitePlans });
});
app.get("/api/admin/users", requireAdmin, async function (req, res) {
  const list = [];
  if (supabase) {
    const { data: rows, error } = await supabase.from("users").select("id, email, display_name, plan, credits, total_conversions, created_at");
    if (!error && rows) {
      rows.forEach(function (r) {
        list.push({
          id: r.id,
          email: r.email || null,
          displayName: r.display_name || null,
          plan: r.plan || "free",
          credits: r.credits ?? FREE_CREDITS,
          totalConversions: r.total_conversions ?? 0,
          createdAt: r.created_at ? new Date(r.created_at).getTime() : null
        });
      });
    }
  }
  const seen = new Set(list.map(function (u) { return u.id; }));
  memoryUsers.forEach(function (u, id) {
    if (seen.has(id)) return;
    seen.add(id);
    list.push({
      id, email: u.email || null, displayName: u.displayName || null, plan: u.plan || "free",
      credits: u.credits ?? FREE_CREDITS, totalConversions: u.totalConversions ?? 0,
      createdAt: u.createdAt || null, _memory: true
    });
  });
  list.sort(function (a, b) { return (b.createdAt || 0) - (a.createdAt || 0); });
  res.json({ users: list });
});
app.post("/api/admin/users/:id/plan", requireAdmin, async function (req, res) {
  const sessionId = req.params.id;
  const plan = (req.body && req.body.plan) != null ? String(req.body.plan) : "";
  if (!sessionId || !plan) return res.status(400).json({ error: "id ve plan gerekli" });
  const planCredits = getCreditsForPlan(plan);
  const isAddon = plan === "addon";
  if (supabase) {
    const { data: row } = await supabase.from("users").select("credits").eq("id", sessionId).maybeSingle();
    if (row) {
      const currentCredits = row.credits ?? FREE_CREDITS;
      const newCredits = isAddon ? currentCredits + planCredits : planCredits;
      await updateUserInDb(sessionId, { plan, credits: newCredits });
      return res.json({ ok: true, plan, credits: newCredits });
    }
  }
  if (memoryUsers.has(sessionId)) {
    const u = memoryUsers.get(sessionId);
    const currentCredits = u.credits ?? FREE_CREDITS;
    u.plan = plan;
    u.credits = isAddon ? currentCredits + planCredits : planCredits;
    return res.json({ ok: true, plan, credits: u.credits });
  }
  return res.status(404).json({ error: "Kullanici bulunamadi" });
});
app.post("/api/admin/logout", function (req, res) {
  res.clearCookie("snapsell_admin", { path: "/" });
  res.json({ ok: true });
});
app.get("/api/admin/stats", requireAdmin, async function (req, res) {
  const today = getTodayKey();
  const stats = loadDailyStats();
  const todayData = stats[today] || { visitors: 0, conversions: 0, signups: 0 };
  const last7 = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    last7.push({ date: key, ...(stats[key] || { visitors: 0, conversions: 0, signups: 0 }) });
  }
  last7.reverse();
  res.json({ today: todayData, dailyVisitors: todayData.visitors, dailyConversions: todayData.conversions, newSignupsToday: todayData.signups, last7Days: last7 });
});
app.get("/api/admin/logins", requireAdmin, async function (req, res) {
  const list = [];
  const filePath = path.join(DATA_DIR, LOGIN_LOGS_FILE);
  if (fs.existsSync(filePath)) {
    try {
      const lines = fs.readFileSync(filePath, "utf8").split("\n").filter(Boolean);
      lines.forEach(function (line) {
        try {
          const o = JSON.parse(line);
          list.push({ user_id: o.user_id, email: o.email || null, display_name: o.display_name || null, logged_at: o.logged_at || null, source: "file" });
        } catch (_) {}
      });
    } catch (e) {
      console.warn("api/admin/logins file:", e.message);
    }
  }
  if (supabase) {
    try {
      const { data: rows, error } = await supabase.from("login_logs").select("user_id, email, display_name, logged_at").order("logged_at", { ascending: false }).limit(2000);
      if (!error && rows) {
        const seen = new Set(list.map(function (e) { return (e.logged_at || "") + (e.user_id || ""); }));
        rows.forEach(function (r) {
          const key = (r.logged_at || "") + (r.user_id || "");
          if (seen.has(key)) return;
          seen.add(key);
          list.push({ user_id: r.user_id, email: r.email || null, display_name: r.display_name || null, logged_at: r.logged_at || null, source: "db" });
        });
      }
    } catch (e) {
      console.warn("api/admin/logins db:", e.message);
    }
  }
  list.sort(function (a, b) {
    const ta = a.logged_at ? new Date(a.logged_at).getTime() : 0;
    const tb = b.logged_at ? new Date(b.logged_at).getTime() : 0;
    return tb - ta;
  });
  res.json({ logins: list.slice(0, 500) });
});
app.get("/api/admin/subscribers", requireAdmin, async function (req, res) {
  const list = [];
  if (supabase) {
    const { data: rows, error } = await supabase.from("users").select("id, email, display_name, plan, credits, total_conversions, created_at");
    if (!error && rows) {
      rows.forEach(function (r) {
        const plan = (r.plan || "free").toString();
        list.push({
          id: r.id, email: r.email || null, displayName: r.display_name || null, plan,
          credits: r.credits ?? FREE_CREDITS, totalConversions: r.total_conversions ?? 0,
          createdAt: r.created_at ? new Date(r.created_at).getTime() : null
        });
      });
    }
  }
  memoryUsers.forEach(function (u, id) {
    list.push({
      id, email: u.email || null, displayName: u.displayName || null, plan: u.plan || "free",
      credits: u.credits ?? FREE_CREDITS, totalConversions: u.totalConversions ?? 0,
      createdAt: u.createdAt || null
    });
  });
  const monthly = list.filter(function (u) { return (u.plan || "").toString().startsWith("monthly_"); });
  const yearly = list.filter(function (u) { return (u.plan || "").toString().startsWith("yearly_"); });
  res.json({ monthly, yearly, all: list });
});
app.get("/api/admin/image-edits", requireAdmin, function (req, res) {
  const loaded = loadJsonFile("image-edits.json", null);
  res.json({ edits: Array.isArray(loaded) ? loaded : [] });
});
app.get("/api/admin/teams", requireAdmin, function (req, res) {
  loadTeams();
  res.json({ teams });
});
app.post("/api/admin/teams", requireAdmin, function (req, res) {
  const body = req.body || {};
  const name = (body.name || "").trim() || "Yeni Takım";
  const id = randomUUID().slice(0, 8);
  const team = { id, name, memberIds: [], enterprisePlanId: body.enterprisePlanId || null, createdAt: Date.now() };
  loadTeams();
  teams.push(team);
  saveTeams(teams);
  res.status(201).json({ ok: true, team });
});
app.put("/api/admin/teams/:id", requireAdmin, function (req, res) {
  const id = req.params.id;
  const body = req.body || {};
  loadTeams();
  const idx = teams.findIndex(function (t) { return t.id === id; });
  if (idx < 0) return res.status(404).json({ error: "Takim bulunamadi" });
  if (body.name != null) teams[idx].name = String(body.name);
  if (Array.isArray(body.memberIds)) teams[idx].memberIds = body.memberIds;
  if (body.enterprisePlanId != null) teams[idx].enterprisePlanId = body.enterprisePlanId;
  saveTeams(teams);
  res.json({ ok: true, team: teams[idx] });
});
app.delete("/api/admin/teams/:id", requireAdmin, function (req, res) {
  const id = req.params.id;
  loadTeams();
  const idx = teams.findIndex(function (t) { return t.id === id; });
  if (idx < 0) return res.status(404).json({ error: "Takim bulunamadi" });
  teams.splice(idx, 1);
  saveTeams(teams);
  res.json({ ok: true });
});

let _openai;
function getOpenAI() {
  if (!_openai) {
    const OpenAI = require("openai");
    const apiKey = (process.env.OPENAI_API_KEY || process.env.OPENAI_KEY || "").trim();
    _openai = new OpenAI({ apiKey: apiKey || undefined });
  }
  return _openai;
}

const SCRAPERAPI_API_KEY = (process.env.SCRAPERAPI_API_KEY || process.env.SCRAPER_API_KEY || "").trim();

/** Global pazaryerleri: URL ve para birimi (Turkiye + global). */
const PRICE_MARKETPLACES = [
  { urlBase: "https://www.amazon.com.tr/s?k=", currency: "TRY", name: "Amazon" },
  { urlBase: "https://www.trendyol.com/sr?q=", currency: "TRY", name: "Trendyol" },
  { urlBase: "https://www.hepsiburada.com/ara?q=", currency: "TRY", name: "Hepsiburada" },
  { urlBase: "https://www.n11.com/arama?q=", currency: "TRY", name: "N11" },
  { urlBase: "https://www.ciceksepeti.com/arama?q=", currency: "TRY", name: "Çiçek Sepeti" },
  { urlBase: "https://www.etsy.com/search?q=", currency: "USD", name: "Etsy" }
];

/** Script/JSON icindeki fiyat desenlerini cikarir (marketplace para birimi ile). */
function extractPricesFromScripts(html, currency) {
  if (!html || typeof html !== "string" || !currency) return [];
  const seen = new Set();
  const out = [];
  const limits = CURRENCY_LIMITS[currency] || [1, 100000];
  function add(n) {
    if (n < limits[0] || n > limits[1]) return;
    const key = n;
    if (seen.has(key)) return;
    seen.add(key);
    out.push({ value: Math.round(n * 100) / 100, currency });
  }
  const patterns = [
    /"(?:price|amount|currentPrice|minPrice|maxPrice|value|fiyat|birimFiyat|salePrice|discountPrice|sellingPrice|originalPrice|productPrice|listPrice|marketPrice)"\s*:\s*(\d+(?:[.,]\d+)?)/gi,
    /"(?:price|amount|currentPrice|sellingPrice)"\s*:\s*\{\s*"(?:value|amount)"\s*:\s*(\d+(?:[.,]\d+)?)/gi,
    /data-(?:price|amount|product-price|sale-price)="(\d+(?:[.,]\d+)?)"/gi,
    /data-price="(\d+(?:[.,]\d+)?)"/gi,
    /"price"\s*:\s*\{\s*"value"\s*:\s*(\d+(?:[.,]\d+)?)/gi,
    /discountedPrice["\s:]+(\d+(?:[.,]\d+)?)/gi,
    /sellingPrice["\s:]+(\d+(?:[.,]\d+)?)/gi
  ];
  for (const re of patterns) {
    let m;
    while ((m = re.exec(html)) !== null) {
      const s = (m[1] || "").replace(",", ".");
      const n = parseFloat(s);
      if (!Number.isNaN(n)) add(n);
    }
  }
  return out;
}

/** Sayfa metninden tum para birimlerinde fiyatlari cikarir. Donus: [{ value, currency }, ...] */
function extractPricesWithCurrency(text) {
  if (!text || typeof text !== "string") return [];
  const normalized = text.replace(/\s+/g, " ");
  const seen = new Set();
  const out = [];

  function add(value, currency) {
    const n = Math.round(value * 100) / 100;
    if (n < 0.5 || n > 500000) return;
    const key = currency + ":" + n;
    if (seen.has(key)) return;
    seen.add(key);
    out.push({ value: n, currency });
  }

  // TRY: ₺ / TL (Turkce format: 1.234,56 veya 1234,56)
  let m;
  const tlRegex = /(?:₺|TL)\s*(\d[\d.,]*\d|\d+)/gi;
  while ((m = tlRegex.exec(normalized)) !== null) {
    const s = (m[1] || "").replace(/\./g, "").replace(",", ".");
    const n = parseFloat(s);
    if (!Number.isNaN(n)) add(n, "TRY");
  }
  const tryFormat = /\d{1,3}(?:\.\d{3})*(?:,\d{1,2})?[\s]*(?:TL|₺)/gi;
  while ((m = tryFormat.exec(normalized)) !== null) {
    const s = m[0].replace(/\s*(?:TL|₺)\s*/gi, "").replace(/\./g, "").replace(",", ".");
    const n = parseFloat(s);
    if (!Number.isNaN(n)) add(n, "TRY");
  }
  const tryPlain = /\d{1,3}(?:\.\d{3})*,\d{2}(?=\s|$|[^0-9])/g;
  while ((m = tryPlain.exec(normalized)) !== null) {
    const s = (m[0] || "").replace(/\./g, "").replace(",", ".");
    const n = parseFloat(s);
    if (!Number.isNaN(n)) add(n, "TRY");
  }

  // USD: $ (ABD format: 1,234.56 veya 12.99)
  const usdRegex = /\$\s*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?|\d+(?:\.\d{2})?)/g;
  while ((m = usdRegex.exec(normalized)) !== null) {
    const n = parseFloat((m[1] || "").replace(/,/g, ""));
    if (!Number.isNaN(n)) add(n, "USD");
  }
  const usdAfter = /(\d{1,3}(?:,\d{3})*(?:\.\d{2})?|\d+(?:\.\d{2})?)\s*USD/gi;
  while ((m = usdAfter.exec(normalized)) !== null) {
    const n = parseFloat((m[1] || "").replace(/,/g, ""));
    if (!Number.isNaN(n)) add(n, "USD");
  }

  // EUR: € (1.234,56 veya 12,99)
  const eurRegex = /€\s*(\d[\d.,]*\d|\d+)/g;
  while ((m = eurRegex.exec(normalized)) !== null) {
    const s = (m[1] || "").replace(/\./g, "").replace(",", ".");
    const n = parseFloat(s);
    if (!Number.isNaN(n)) add(n, "EUR");
  }
  const eurAfter = /(\d{1,3}(?:\.\d{3})*(?:,\d{1,2})?|\d+(?:,\d{2})?)\s*EUR/gi;
  while ((m = eurAfter.exec(normalized)) !== null) {
    const s = (m[1] || "").replace(/\./g, "").replace(",", ".");
    const n = parseFloat(s);
    if (!Number.isNaN(n)) add(n, "EUR");
  }

  // GBP: £
  const gbpRegex = /£\s*(\d[\d.,]*\d|\d+)/g;
  while ((m = gbpRegex.exec(normalized)) !== null) {
    const s = (m[1] || "").replace(/,/g, "");
    const n = parseFloat(s);
    if (!Number.isNaN(n)) add(n, "GBP");
  }
  const gbpAfter = /(\d{1,3}(?:,\d{3})*(?:\.\d{2})?|\d+(?:\.\d{2})?)\s*GBP/gi;
  while ((m = gbpAfter.exec(normalized)) !== null) {
    const n = parseFloat((m[1] || "").replace(/,/g, ""));
    if (!Number.isNaN(n)) add(n, "GBP");
  }

  return out.sort((a, b) => a.currency.localeCompare(b.currency) || a.value - b.value);
}

/** Para birimine gore makul fiyat sinirlari (indirim/kargo/sayi gibi gurultuyu ele). */
const CURRENCY_LIMITS = { TRY: [25, 80000], USD: [1, 5000], EUR: [1, 5000], GBP: [1, 5000] };

/** IQR ile aykiri degerleri cikarir; min/avg/max ve sayi doner. */
function cleanPricesMinAvgMax(list, currency) {
  const limits = CURRENCY_LIMITS[currency] || [1, 100000];
  let arr = (list || []).filter(v => v >= limits[0] && v <= limits[1]);
  if (arr.length === 0) return { minPrice: null, avgPrice: null, maxPrice: null, count: 0 };
  if (arr.length === 1) return { minPrice: arr[0], avgPrice: arr[0], maxPrice: arr[0], count: 1 };
  arr = arr.slice().sort((a, b) => a - b);
  const q1 = Math.floor(arr.length * 0.25);
  const q3 = Math.ceil(arr.length * 0.75) - 1;
  const p25 = arr[q1];
  const p75 = arr[Math.min(q3, arr.length - 1)];
  const iqr = p75 - p25 || 1;
  arr = arr.filter(v => v >= p25 - 1.5 * iqr && v <= p75 + 1.5 * iqr);
  if (arr.length === 0) return { minPrice: null, avgPrice: null, maxPrice: null, count: 0 };
  const minP = arr[0];
  const maxP = arr[arr.length - 1];
  const sum = arr.reduce((a, b) => a + b, 0);
  return { minPrice: minP, avgPrice: Math.round((sum / arr.length) * 100) / 100, maxPrice: maxP, count: arr.length };
}

/** Sayfa metninden satici/sonuc sayisini cikarmayi dener (Trendyol/Hepsiburada/Amazon/Etsy). */
function extractSellerOrResultCount(htmlOrText) {
  if (!htmlOrText || typeof htmlOrText !== "string") return null;
  const t = htmlOrText.slice(0, 50000);
  const patterns = [
    /(\d{1,5})\s*satıcı/i,
    /(\d{1,5})\s*ürün/i,
    /(\d{1,5})\s*sonuç/i,
    /(\d{1,5})\s*results?/i,
    /(\d{1,5})\s*sellers?/i,
    /"sellerCount"\s*:\s*(\d+)/i,
    /"totalResults?"\s*:\s*(\d+)/i
  ];
  for (const re of patterns) {
    const m = t.match(re);
    if (m) {
      const n = parseInt(m[1], 10);
      if (n >= 1 && n <= 100000) return n;
    }
  }
  return null;
}

/**
 * Akis: Kullanici foto yukler -> urun tespit (productDescription veya SEO) -> ScraperAPI platform bazli fiyat ceker
 * -> algoritma (temizleme + min/avg/max) -> GPT rapor -> Dashboard'a yapisal veri doner.
 * Donus: { productName, platforms: [{ name, currency, sellerCount, minPrice, avgPrice, maxPrice }], summaryText } veya null.
 */
async function getPriceAnalysisWithScraperAPI(productDescription) {
  if (!SCRAPERAPI_API_KEY || !productDescription || typeof productDescription !== "string") return null;
  const productName = productDescription.trim().slice(0, 200);
  const words = productName.replace(/\s+/g, " ").trim().split(" ").filter(Boolean).slice(0, 10);
  const searchQuery = encodeURIComponent(words.join(" "));
  if (!searchQuery) return null;

  const platforms = [];
  try {
    for (const marketplace of PRICE_MARKETPLACES) {
      const targetUrl = marketplace.urlBase + searchQuery;
      const apiUrl = "https://api.scraperapi.com?api_key=" + SCRAPERAPI_API_KEY + "&url=" + encodeURIComponent(targetUrl);
      let html = "";
      const maxRetries = 2;
      for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
          const res = await fetch(apiUrl, { method: "GET", signal: AbortSignal.timeout(90000) });
          if (res.ok) html = await res.text();
          if (html && html.length > 500) break;
        } catch (e) {
          if (attempt === maxRetries) console.warn("ScraperAPI " + marketplace.name + ":", e.message);
        }
        if (attempt < maxRetries) await new Promise(function (r) { setTimeout(r, 1500); });
      }
      if (!html || html.length < 200) continue;
      const textNoScripts = html.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, " ").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
      const fromText = extractPricesWithCurrency(textNoScripts);
      const fromScripts = extractPricesFromScripts(html, marketplace.currency);
      const extracted = fromText.concat(fromScripts);
      const pricesForCurrency = (extracted.filter(p => p.currency === marketplace.currency)).map(p => p.value);
      const stats = cleanPricesMinAvgMax(pricesForCurrency, marketplace.currency);
      const sellerCount = extractSellerOrResultCount(html) || extractSellerOrResultCount(textNoScripts);
      platforms.push({
        name: marketplace.name,
        currency: marketplace.currency,
        sellerCount: sellerCount != null ? sellerCount : null,
        minPrice: stats.minPrice,
        avgPrice: stats.avgPrice,
        maxPrice: stats.maxPrice,
        sampleCount: stats.count
      });
    }
    if (platforms.length === 0) {
      console.warn("ScraperAPI: hic platformdan veri alinamadi");
      return null;
    }

    const isTurkish = /[\u0130\u0131\u011e\u011f\u00fc\u00f6\u00e7\u015f\u00dc\u00d6\u00c7\u015e]|[ğüşıöçĞÜŞİÖÇ]/i.test(productName);
    const openai = getOpenAI();
    const tableDesc = platforms.map(p => {
      const fmt = (v) => v == null ? "—" : (p.currency === "TRY" ? v.toLocaleString("tr-TR", { minimumFractionDigits: 2 }) : v.toLocaleString("en-US", { minimumFractionDigits: 2 }));
      return p.name + ": " + (p.sellerCount != null ? p.sellerCount + " satıcı, " : "") + "En düşük " + fmt(p.minPrice) + ", Ortalama " + fmt(p.avgPrice) + ", En yüksek " + fmt(p.maxPrice) + " " + p.currency;
    }).join("\n");
    const prompt = `Ürün: "${productName}". Aşağıdaki rakip analizi tablosu verilerine göre 2-3 cümlelik kısa bir özet ve rekabetçi fiyat stratejisi yaz. Sadece verilen rakamları kullan.\n\n${tableDesc}\n\nCevabı ${isTurkish ? "Türkçe" : "İngilizce"} yaz.`;
    let summaryText = "";
    try {
      const analysisRes = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }]
      });
      summaryText = (analysisRes.choices && analysisRes.choices[0] && analysisRes.choices[0].message && analysisRes.choices[0].message.content) || "";
      summaryText = summaryText.trim();
    } catch (e) {
      console.warn("GPT fiyat özeti:", e.message);
    }

    return {
      productName: productName || "Ürün",
      platforms,
      summaryText: summaryText || "Fiyat verileri yukarıdaki tabloya göre değerlendirilebilir."
    };
  } catch (e) {
    console.warn("ScraperAPI fiyat analizi:", e.message);
    return null;
  }
}

/** ScraperAPI veri dönmezse GPT ile detaylı pazar araştırması yapıp platform bazlı min/ort/maks fiyat üretir. */
async function getPriceAnalysisFallbackWithGPT(productDescription) {
  if (!productDescription || typeof productDescription !== "string") return null;
  const productName = productDescription.trim().slice(0, 300);
  if (!productName) return null;
  try {
    const openai = getOpenAI();
    const prompt = `Sen bir e-ticaret fiyat analisti ve pazar araştırmacısısın. Aşağıdaki ürün/kategori için Türkiye ve Etsy piyasasında GERÇEKÇI fiyat aralıkları üret.

ÜRÜN / KATEGORİ: "${productName}"

YAPMAN GEREKENLER:
1. Bu ürünün hangi kategoriye girdiğini düşün (elektronik, giyim, ev eşyası, kozmetik, gıda takviyesi, hediyelik eşya vb.).
2. Türkiye'de 2024 yılı bu kategorideki TİPİK perakende fiyat aralığını (en ucuz satıcıdan en pahalıya) biliyormuşsun gibi davran. Örnek: kadın deri ceket 800-4500 TL, bluetooth kulaklık 150-1200 TL, makyaj seti 80-600 TL.
3. Her platformun pazar konumunu dikkate al: Amazon TR orta-üst segment; Trendyol ve Hepsiburada geniş yelpaze, indirimli fiyatlar; N11 genelde benzer veya biraz daha uygun; Çiçek Sepeti hediye/özel gün ağırlıklı; Etsy USD, el yapımı/unique.
4. minPrice = en düşük gerçekçi fiyat, avgPrice = ortalama satış fiyatı, maxPrice = premium taraf. Aralıklar makul olsun (min-max en az %20-30 fark).

ÇIKTI: Sadece aşağıdaki JSON. Başka metin yok. Tüm sayılar number.
{"platforms":[{"name":"Amazon","currency":"TRY","minPrice":sayi,"avgPrice":sayi,"maxPrice":sayi},{"name":"Trendyol","currency":"TRY","minPrice":sayi,"avgPrice":sayi,"maxPrice":sayi},{"name":"Hepsiburada","currency":"TRY","minPrice":sayi,"avgPrice":sayi,"maxPrice":sayi},{"name":"N11","currency":"TRY","minPrice":sayi,"avgPrice":sayi,"maxPrice":sayi},{"name":"Çiçek Sepeti","currency":"TRY","minPrice":sayi,"avgPrice":sayi,"maxPrice":sayi},{"name":"Etsy","currency":"USD","minPrice":sayi,"avgPrice":sayi,"maxPrice":sayi}],"summaryText":"2-4 cümle Türkçe: piyasa aralığı, platform farkları ve rekabetçi fiyat bilgisi (sadece bilgi amaçlı)."}`;
    const res = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "Sen e-ticaret fiyat analisti ve pazar araştırmacısısın. Türkiye (TRY) ve Etsy (USD) için gerçekçi, kategorisine uygun fiyat aralıkları üretirsin. Yanıtını sadece geçerli JSON olarak verirsin." },
        { role: "user", content: prompt }
      ],
      response_format: { type: "json_object" }
    });
    const raw = (res.choices && res.choices[0] && res.choices[0].message && res.choices[0].message.content) || "";
    const parsed = JSON.parse(raw);
    if (!parsed.platforms || !Array.isArray(parsed.platforms) || parsed.platforms.length === 0) return null;
    const platforms = parsed.platforms.map(function (p) {
      return {
        name: p.name || "Platform",
        currency: p.currency || "TRY",
        minPrice: typeof p.minPrice === "number" ? Math.round(p.minPrice * 100) / 100 : null,
        avgPrice: typeof p.avgPrice === "number" ? Math.round(p.avgPrice * 100) / 100 : null,
        maxPrice: typeof p.maxPrice === "number" ? Math.round(p.maxPrice * 100) / 100 : null
      };
    });
    return {
      productName: productName || "Ürün",
      platforms,
      summaryText: (parsed.summaryText && String(parsed.summaryText).trim()) || "Fiyat verileri yukarıdaki tabloya göre değerlendirilebilir."
    };
  } catch (e) {
    console.warn("GPT fiyat fallback:", e.message);
    return null;
  }
}

app.post("/api/register", async (req, res) => {
  try {
    const sessionId = randomUUID();
    if (supabase) {
      const { error } = await supabase.from("users").insert({
        id: sessionId,
        credits: FREE_CREDITS,
        plan: "free",
        total_conversions: 0
      });
      if (error) throw new Error(error.message);
    } else {
      memoryUsers.set(sessionId, { credits: FREE_CREDITS, plan: "free", createdAt: Date.now(), totalConversions: 0 });
      saveMemoryUsers();
    }
    res.json({ sessionId, credits: FREE_CREDITS, plan: resolvePlan("free") });
  } catch (err) {
    console.error("api/register:", err.message);
    res.status(500).json({ error: err.message || "Kayit hatasi" });
  }
});

app.post("/api/auth/google", async (req, res) => {
  try {
    console.log("Received Google auth request");
    const idToken = (req.body && req.body.idToken) ? String(req.body.idToken).trim() : "";
    if (!idToken) {
      return res.status(400).json({ error: "Missing idToken", message: "idToken gerekli" });
    }
    if (!adminAuth) initFirebaseAuth();
    if (!adminAuth) {
      return res.status(503).json({ error: "Google giris yapilandirilmadi" });
    }
    const decoded = await adminAuth.verifyIdToken(idToken);
    const uid = decoded.uid;
    const email = decoded.email || null;
    const displayName = decoded.name || decoded.email || null;
    const user = await getOrCreateUser(uid, { email, displayName });
    try {
      await recordLogin(uid, email, displayName);
    } catch (_) {}
    const credits = user.credits ?? FREE_CREDITS;
    const plan = user.plan || "free";
    const isAdmin = email && email.toLowerCase() === ADMIN_EMAIL;
    return res.json({
      ok: true,
      user: { uid, email, displayName: displayName || email || "Kullanici" },
      credits,
      plan,
      conversions: Math.floor(credits / CREDITS_PER_CONVERSION),
      hasLeonardo: isProPlan(plan),
      hasEditor: isEditorPlan(plan),
      isAdmin: !!isAdmin
    });
  } catch (error) {
    console.error("Google auth error:", error);
    if (res.headersSent) return;
    const isTokenError = error && (error.code === "auth/id-token-expired" || error.code === "auth/argument-error" || error.message && /token|invalid|expired/i.test(error.message));
    if (isTokenError) {
      return res.status(401).json({ error: "Gecersiz token", message: error.message || "Token verification failed" });
    }
    return res.status(500).json({ error: "Google authentication failed", message: error.message || "Internal error" });
  }
});

app.get("/api/credits", async (req, res) => {
  const user = await getRequestUser(req);
  if (!user) return res.status(401).json({ error: "Oturum gerekli" });
  const credits = user.credits ?? FREE_CREDITS;
  const plan = user.plan || "free";
  const conversions = Math.floor(credits / CREDITS_PER_CONVERSION);
  res.json({
    credits,
    plan,
    conversions,
    hasLeonardo: isProPlan(plan),
    hasEditor: isEditorPlan(plan)
  });
});

/** Hesap ayarları sayfası: profil, plan, dönüşüm sayıları, abonelik bilgisi */
app.get("/api/account", async (req, res) => {
  const user = await getRequestUser(req);
  if (!user) return res.status(401).json({ error: "Oturum gerekli" });
  const credits = user.credits ?? FREE_CREDITS;
  const plan = user.plan || "free";
  const conversions = Math.floor(credits / CREDITS_PER_CONVERSION);
  const planInfo = sitePlans.find(function (p) { return (p.id || p.name) === plan; }) || { name: plan, features: [], price: "", period: "" };
  const createdAt = user.createdAt ? (typeof user.createdAt === "object" && user.createdAt.getTime ? user.createdAt.getTime() : user.createdAt) : null;
  res.json({
    email: user.email || null,
    displayName: user.displayName || null,
    credits,
    plan,
    conversions,
    totalConversions: user.totalConversions ?? 0,
    hasLeonardo: isProPlan(plan),
    hasEditor: isEditorPlan(plan),
    planName: planInfo.name,
    planFeatures: planInfo.features || [],
    planPrice: planInfo.price,
    planPeriod: planInfo.period,
    createdAt: createdAt ? new Date(createdAt).toISOString() : null
  });
});

/** Aboneliği iptal et: planı free yapar (yenileme durdurulur). */
app.post("/api/account/cancel-subscription", async (req, res) => {
  const user = await getRequestUser(req);
  if (!user) return res.status(401).json({ error: "Oturum gerekli" });
  const currentPlan = user.plan || "free";
  if (currentPlan === "free") {
    return res.status(200).json({ success: true, message: "Zaten ücretsiz plandasınız.", plan: "free" });
  }
  try {
    await updateUserInDb(user.id, { plan: "free" });
    res.status(200).json({ success: true, message: "Abonelik iptal edildi.", plan: "free" });
  } catch (err) {
    console.error("cancel-subscription:", err.message);
    res.status(500).json({ error: "İptal işlemi sırasında bir hata oluştu.", message: err.message });
  }
});

/** Payment webhook – temporarily disabled; placeholder until payment system is re-enabled. */
app.post("/api/subscription-webhook", (req, res) => {
  res.status(200).json({ message: "Payment system coming soon" });
});

app.post("/api/refill-demo", async (req, res) => {
  const user = await getRequestUser(req);
  if (!user) return res.status(401).json({ error: "Oturum gerekli" });
  const current = user.credits ?? 0;
  const added = DEMO_REFILL_CREDITS;
  const newCredits = current + added;
  if (user._memory) {
    const u = memoryUsers.get(user.id);
    u.credits = newCredits;
  } else {
    await updateUserInDb(user.id, { credits: newCredits });
  }
  res.json({ credits: newCredits, added, conversions: Math.floor(newCredits / CREDITS_PER_CONVERSION) });
});

app.get("/api/leonardo/status", async (req, res) => {
  const user = await getRequestUser(req);
  if (!user) return res.status(401).json({ error: "Oturum gerekli" });
  res.json({ available: canUseLeonardo(user) });
});

app.get("/api/replicate/status", async (req, res) => {
  try {
    const user = await getRequestUser(req);
    if (!user) return res.status(401).json({ error: "Oturum gerekli" });
    const publicUrl = (process.env.PUBLIC_APP_URL || "").trim().replace(/\/$/, "");
    const photoRoom = canUsePhotoRoom(user);
    const pixian = canUsePixian(user);
    const credits = user.credits ?? FREE_CREDITS;
    const plan = user.plan || "free";
    const totalConversions = user.totalConversions ?? 0;
    const maxFreeConversions = 3;
    const conversionsFromCredits = Math.floor(credits / CREDITS_PER_CONVERSION);
    const remainingByTotal = Math.max(0, maxFreeConversions - totalConversions);
    const freeEditorUsesRemaining =
      plan === "free" ? Math.min(conversionsFromCredits, remainingByTotal) : null;
    res.json({
      available: photoRoom,
      photoRoomAvailable: photoRoom,
      pixianAvailable: pixian,
      needsPublicUrl: !publicUrl,
      freeEditorUsesRemaining,
      conversions: conversionsFromCredits
    });
  } catch (err) {
    console.error("api/replicate/status:", err.message);
    res.status(500).json({ error: err.message || "Error" });
  }
});

const REPLICATE_API_TOKEN = (process.env.REPLICATE_API_TOKEN || process.env.REPLICATE_API_KEY || "").trim();
/** Replicate goruntuyu bu URL'den ceker; localhost disaridan erisilemedigi icin public URL gerekir (ngrok veya canli domain). */
let PUBLIC_APP_URL = (process.env.PUBLIC_APP_URL || "").trim().replace(/\/$/, "");
if (PUBLIC_APP_URL.toLowerCase().includes("yourdomain.com")) {
  PUBLIC_APP_URL = (process.env.API_PUBLIC_URL || process.env.RAILWAY_STATIC_URL || "https://snapsell-production.up.railway.app").trim().replace(/\/$/, "");
}
const PHOTOROOM_API_KEY = (process.env.PHOTOROOM_API_KEY || "").trim();
const replicateTempImages = new Map();
const REPLICATE_TEMP_TTL_MS = 10 * 60 * 1000;
function cleanupReplicateTemp() {
  const now = Date.now();
  for (const [id, entry] of replicateTempImages.entries()) {
    if (now - (entry.createdAt || 0) > REPLICATE_TEMP_TTL_MS) replicateTempImages.delete(id);
  }
}
app.post("/api/replicate/upload", async (req, res) => {
  const user = await getRequestUser(req);
  if (!user) return res.status(401).json({ error: "Oturum gerekli" });
  if (!canUseReplicate(user)) {
    return res.status(403).json({ error: "Görsel düzenleme planı gerekli.", upgradeUrl: "/dashboard/fiyatlandirma" });
  }
  if (canUsePhotoRoom(user)) {
    return res.status(400).json({ error: "Pro planda sadece PhotoRoom kullanılır. Ürün stüdyo görseli sayfasından tek istek ile düzenleyin (arka plan silme + yeni arka plan).", code: "USE_PHOTOROOM_PIPELINE" });
  }
  const { image: base64 } = req.body || {};
  if (!base64 || typeof base64 !== "string") return res.status(400).json({ error: "image (base64) gerekli" });
  let buf;
  try {
    const data = base64.replace(/^data:image\/\w+;base64,/, "");
    buf = Buffer.from(data, "base64");
    if (buf.length > 10 * 1024 * 1024) return res.status(400).json({ error: "Görsel 10 MB'dan küçük olmalı" });
  } catch (e) {
    return res.status(400).json({ error: "Geçersiz base64 görsel" });
  }
  const REPLICATE_SIZE = 512;
  try {
    const sharp = getSharp();
    buf = await sharp(buf)
      .resize(REPLICATE_SIZE, REPLICATE_SIZE, { fit: "cover", kernel: "lanczos3" })
      .png({ effort: 2 })
      .toBuffer();
  } catch (e) {
    console.warn("Replicate upload resize:", e.message);
  }
  let maskBuffer = null;
  let noBgBuffer = null;
  try {
    const noBg = await removeBackgroundWithApi(buf, "image/png", null);
    if (noBg && noBg.length > 0) {
      const sharp = getSharp();
      const noBgResized = sharp(noBg)
        .resize(REPLICATE_SIZE, REPLICATE_SIZE, { fit: "cover", kernel: "lanczos3" })
        .ensureAlpha();
      maskBuffer = await sharp(noBg)
        .resize(REPLICATE_SIZE, REPLICATE_SIZE, { fit: "cover", kernel: "lanczos3" })
        .ensureAlpha()
        .extractChannel(3)
        .negate()
        .png()
        .toBuffer();
      let alphaToUse = null;
      try {
        const pixianAlphaRaw = await sharp(noBg)
          .resize(REPLICATE_SIZE, REPLICATE_SIZE, { fit: "cover" })
          .ensureAlpha()
          .extractChannel(3)
          .raw()
          .toBuffer();
        let allOpaque = true;
        for (let i = 0; i < pixianAlphaRaw.length; i += 51) {
          if (pixianAlphaRaw[i] < 250) { allOpaque = false; break; }
        }
        if (!allOpaque) {
          alphaToUse = await sharp(noBg)
            .resize(REPLICATE_SIZE, REPLICATE_SIZE, { fit: "cover", kernel: "lanczos3" })
            .ensureAlpha()
            .extractChannel(3)
            .threshold(128)
            .blur(2.5)
            .png()
            .toBuffer();
        }
      } catch (_) {}
      if (!alphaToUse) {
        alphaToUse = await sharp(noBg)
          .resize(REPLICATE_SIZE, REPLICATE_SIZE, { fit: "cover", kernel: "lanczos3" })
          .grayscale()
          .threshold(240)
          .negate()
          .blur(2.5)
          .png()
          .toBuffer();
      }
      noBgBuffer = await noBgResized
        .removeAlpha()
        .joinChannel(alphaToUse)
        .png()
        .toBuffer();
    }
    if (!maskBuffer) {
      const sharp = getSharp();
      maskBuffer = await sharp(buf)
        .grayscale()
        .threshold(235)
        .png()
        .toBuffer();
    }
  } catch (e) {
    console.warn("Replicate upload mask:", e.message);
  }
  let maskInpaintBuffer = null;
  try {
    const sharp = getSharp();
    maskInpaintBuffer = await sharp(buf)
      .resize(REPLICATE_SIZE, REPLICATE_SIZE, { fit: "cover" })
      .grayscale()
      .threshold(128)
      .png()
      .toBuffer();
  } catch (e) {
    console.warn("Replicate inpaint mask:", e.message);
  }
  cleanupReplicateTemp();
  const id = randomUUID().slice(0, 12);
  replicateTempImages.set(id, { buffer: buf, maskBuffer, maskInpaintBuffer, noBgBuffer, createdAt: Date.now() });
  const baseUrl = PUBLIC_APP_URL || (req.protocol || "http") + "://" + (req.get("host") || "localhost");
  res.json({ imageId: id, imageUrl: baseUrl + "/api/replicate/temp/" + id });
});
app.get("/api/replicate/temp/:id", function (req, res) {
  const id = req.params.id;
  const entry = replicateTempImages.get(id);
  if (!entry || !entry.buffer) return res.status(404).setHeader("Cache-Control", "no-store").send("Not found");
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("Content-Type", entry.contentType || "image/png");
  res.send(entry.buffer);
});
app.get("/api/replicate/temp/:id/mask", function (req, res) {
  const id = req.params.id;
  const entry = replicateTempImages.get(id);
  if (!entry || !entry.maskBuffer) return res.status(404).setHeader("Cache-Control", "no-store").send("Not found");
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("Content-Type", "image/png");
  res.send(entry.maskBuffer);
});
app.get("/api/replicate/temp/:id/mask-inpaint", function (req, res) {
  const id = req.params.id;
  const entry = replicateTempImages.get(id);
  if (!entry || !entry.maskInpaintBuffer) return res.status(404).setHeader("Cache-Control", "no-store").send("Not found");
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("Content-Type", "image/png");
  res.send(entry.maskInpaintBuffer);
});
app.get("/api/replicate/temp/:id/nobg", function (req, res) {
  const id = req.params.id;
  const entry = replicateTempImages.get(id);
  if (!entry || !entry.noBgBuffer) return res.status(404).setHeader("Cache-Control", "no-store").send("Not found");
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("Content-Type", "image/png");
  res.send(entry.noBgBuffer);
});

/** PhotoRoom: ürün algılama → arka plan silme → yeni AI arka plan → ürün orantılı ölçeklenir (fit), kesme izi yok, profesyonel stüdyo çıktısı. */
app.post("/api/photoroom/pipeline", async (req, res) => {
  const user = await getRequestUser(req);
  if (!user) return res.status(401).json({ error: "Oturum gerekli" });
  if (!canUsePhotoRoom(user)) {
    const plan = user.plan || "free";
    const credits = user.credits ?? FREE_CREDITS;
    const totalConversions = user.totalConversions ?? 0;
    const maxFreeConversions = 3;
    if (plan === "free" && (credits < CREDITS_PER_CONVERSION || totalConversions >= maxFreeConversions)) {
      return res.status(402).json({
        error: "Ücretsiz 3 deneme hakkınızı kullandınız. Devam etmek için plan yükseltin.",
        upgradeUrl: "/fiyatlandirma",
        limitReached: true
      });
    }
    return res.status(403).json({ error: "Bu özellik Pro plan (Görsel Düzenleme) gerektirir. PhotoRoom ile arka plan silme ve yeni arka plan oluşturma.", upgradeUrl: "/dashboard/fiyatlandirma" });
  }
  if (!PHOTOROOM_API_KEY) return res.status(503).json({ error: "PHOTOROOM_API_KEY .env dosyasına ekleyin." });
  const { image: base64, prompt } = req.body || {};
  if (!base64 || typeof base64 !== "string") return res.status(400).json({ error: "image (base64) gerekli" });
  let buf;
  try {
    const data = base64.replace(/^data:image\/\w+;base64,/, "");
    buf = Buffer.from(data, "base64");
    if (buf.length > 10 * 1024 * 1024) return res.status(400).json({ error: "Görsel 10 MB'dan küçük olmalı" });
  } catch (e) { return res.status(400).json({ error: "Geçersiz base64 görsel" }); }
  const bgPrompt = (prompt && typeof prompt === "string") ? prompt.trim().slice(0, 500) : "professional product photography, studio lighting, clean neutral background, soft shadows";
  try {
    let body;
    let headers = {
      "x-api-key": PHOTOROOM_API_KEY,
      "pr-ai-background-model-version": "background-studio-beta-2025-03-17"
    };
    if (FormDataPkg) {
      const form = new FormDataPkg();
      form.append("imageFile", buf, { filename: "image.png", contentType: "image/png" });
      form.append("removeBackground", "true");
      form.append("referenceBox", "subjectBox");
      form.append("scaling", "fit");
      form.append("outputSize", "1200x1200");
      form.append("padding", "0.12");
      form.append("background.prompt", bgPrompt);
      Object.assign(headers, form.getHeaders());
      body = await new Promise(function (resolve, reject) {
        const chunks = [];
        const t = setTimeout(function () { reject(new Error("Form buffer timeout")); }, 30000);
        form.on("data", function (c) { chunks.push(Buffer.isBuffer(c) ? c : (typeof c === "string" ? Buffer.from(c, "binary") : Buffer.from(c))); });
        form.on("end", function () { clearTimeout(t); resolve(Buffer.concat(chunks)); });
        form.on("error", function (err) { clearTimeout(t); reject(err); });
        if (typeof form.resume === "function") form.resume();
      });
    } else {
      const FormData = globalThis.FormData;
      const form = new FormData();
      const blob = globalThis.File ? new File([buf], "image.png", { type: "image/png" }) : new Blob([buf], { type: "image/png" });
      form.append("imageFile", blob, "image.png");
      form.append("removeBackground", "true");
      form.append("referenceBox", "subjectBox");
      form.append("scaling", "fit");
      form.append("outputSize", "1200x1200");
      form.append("padding", "0.12");
      form.append("background.prompt", bgPrompt);
      body = form;
    }
    const phAbort = new AbortController();
    const phTimeout = setTimeout(function () { phAbort.abort(); }, 90000);
    let phRes;
    try {
      phRes = await fetch("https://image-api.photoroom.com/v2/edit", {
        method: "POST",
        headers,
        body,
        signal: phAbort.signal
      });
    } finally {
      clearTimeout(phTimeout);
    }
    if (!phRes.ok) {
      const errText = await phRes.text();
      let detail = errText.slice(0, 400);
      try {
        const j = JSON.parse(errText);
        const raw = j.message || j.error || j.detail || detail;
        detail = typeof raw === "string" ? raw : (raw && typeof raw === "object" ? (raw.message || raw.error || JSON.stringify(raw)) : String(raw));
      } catch (_) {}
      console.warn("PhotoRoom API", phRes.status, detail);
      const status = phRes.status === 402 ? 402 : 502;
      const detailStr = typeof detail === "string" ? detail : JSON.stringify(detail || "");
      const isExhausted = /exhausted|number of images|plan.*limit|kotanız.*doldu/i.test(detailStr);
      const msg = isExhausted
        ? "PhotoRoom aylık görsel kotanız dolmuş. Image Editing (Plus) planınızı veya kredinizi https://app.photoroom.com/api-dashboard adresinden yenileyin."
        : detailStr ? "PhotoRoom: " + detailStr.slice(0, 220) : "PhotoRoom API hatası. API anahtarını ve planı kontrol edin.";
      return res.status(status).json({
        error: msg,
        detail: detailStr,
        ...(isExhausted && { billingUrl: "https://app.photoroom.com/api-dashboard", photoroomDashboardUrl: "https://app.photoroom.com/api-dashboard" })
      });
    }
    const resultBuffer = Buffer.from(await phRes.arrayBuffer());
    if (!resultBuffer || resultBuffer.length === 0) {
      console.warn("PhotoRoom pipeline: boş yanıt");
      return res.status(502).json({ error: "PhotoRoom boş yanıt. PHOTOROOM_API_KEY ve PhotoRoom hesap kredinizi kontrol edin." });
    }
    const isPng = resultBuffer[0] === 0x89 && resultBuffer[1] === 0x50;
    const isJpeg = resultBuffer[0] === 0xFF && resultBuffer[1] === 0xD8;
    if (!isPng && !isJpeg) {
      const asText = resultBuffer.toString("utf8");
      let errMsg = "PhotoRoom beklenmeyen yanıt.";
      if (asText.trim().startsWith("{")) {
        try {
          const j = JSON.parse(asText);
          errMsg = j.message || j.error || j.detail || errMsg;
        } catch (_) {}
      }
      console.warn("PhotoRoom pipeline: görsel yerine metin/JSON döndü:", asText.slice(0, 200));
      return res.status(502).json({ error: errMsg, detail: asText.slice(0, 400) });
    }
    const contentType = isJpeg ? "image/jpeg" : "image/png";
    cleanupReplicateTemp();
    const resultId = randomUUID().slice(0, 12);
    replicateTempImages.set(resultId, { buffer: resultBuffer, contentType, createdAt: Date.now() });
    const baseUrl = PUBLIC_APP_URL || (req.protocol || "http") + "://" + (req.get("host") || "localhost");
    const outputUrl = baseUrl + "/api/replicate/temp/" + resultId;

    const openaiKey = (process.env.OPENAI_API_KEY || process.env.OPENAI_KEY || "").trim();
    let seoText = "";
    if (openaiKey && buf && buf.length > 0) {
      console.log("PhotoRoom pipeline: SEO üretimi başlıyor (OpenAI çağrılacak)...");
      try {
        seoText = await (async function generateSeoForPipeline() {
          let seoBuf = buf;
          try {
            const sharp = getSharp();
            seoBuf = await sharp(buf)
              .resize(512, 512, { fit: "inside", withoutEnlargement: true })
              .jpeg({ quality: 75 })
              .toBuffer();
          } catch (sharpErr) {
            console.warn("PhotoRoom pipeline: sharp resize hatası, orijinal kullanılıyor:", sharpErr.message);
          }
          if (seoBuf.length > 800 * 1024) {
            console.warn("PhotoRoom pipeline: Görsel 800KB üzeri, SEO atlanıyor (OpenAI limit).");
            return "";
          }
          const b64 = seoBuf.toString("base64");
          const imgDataUrl = "data:image/jpeg;base64," + b64;
          const OpenAI = require("openai");
          const openai = new OpenAI({ apiKey: openaiKey });
          const seoRes = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [{
              role: "user",
              content: [
                { type: "text", text: "Bu ürün fotoğrafını analiz et. Önce kısa bir SEO başlığı yaz (tek satır, en fazla 60 karakter). Sonra e-ticaret için 2-4 cümlelik bir SEO açıklaması yaz. Tam olarak şu formatta cevap ver, başka ekleme yapma:\nBaşlık: [buraya başlık]\nAçıklama: [buraya açıklama]" },
                { type: "image_url", image_url: { url: imgDataUrl, detail: "low" } }
              ]
            }]
          });
          const raw = (seoRes.choices && seoRes.choices[0] && seoRes.choices[0].message && seoRes.choices[0].message.content) || "";
          return typeof raw === "string" ? raw.trim() : "";
        })();
        if (seoText) console.log("PhotoRoom pipeline: SEO üretimi bitti, uzunluk:", seoText.length);
        else console.warn("PhotoRoom pipeline: OpenAI SEO yanıtı boş döndü.");
      } catch (seoErr) {
        console.error("PhotoRoom pipeline SEO HATASI (OpenAI cevap vermeden önce yanıt GÖNDERİLMEDİ):", seoErr.message);
        console.error("PhotoRoom pipeline SEO hata detayı:", seoErr.status, seoErr.code, seoErr.stack);
        if (seoErr.status === 401) console.error("OpenAI API anahtarı geçersiz. Railway OPENAI_API_KEY kontrol edin.");
        if (seoErr.status === 429) console.error("OpenAI rate limit. Biraz bekleyip tekrar deneyin.");
        if (seoErr.code === "ENOTFOUND" || (seoErr.message && seoErr.message.includes("fetch"))) console.error("OpenAI API ağ hatası.");
      }
      console.log("PhotoRoom pipeline: SEO aşaması tamamlandı, yanıt gönderilecek.");
    } else {
      if (!openaiKey) console.warn("PhotoRoom pipeline: OPENAI_API_KEY tanımlı değil, SEO atlanıyor. Railway Environment Variables'a ekleyin.");
    }

    // Tüm planlarda dönüşüm başına krediyi düşür (admin / özel izinli kullanıcılar hariç)
    const email = (user.email || "").trim().toLowerCase();
    const isUnlimitedUser = REPLICATE_ALLOWED_EMAILS.indexOf(email) >= 0 || isAdminUser(user);
    if (!isUnlimitedUser) {
      const credits = user.credits ?? FREE_CREDITS;
      const newCredits = Math.max(0, credits - CREDITS_PER_CONVERSION);
      const newTotal = (user.totalConversions ?? 0) + 1;
      if (user._memory) {
        const u = memoryUsers.get(user.id);
        if (u) {
          u.credits = newCredits;
          u.totalConversions = newTotal;
        }
      } else {
        await updateUserInDb(user.id, { credits: newCredits, totalConversions: newTotal });
      }
    }

    console.log("PhotoRoom pipeline: res.json gönderiliyor (seo uzunluk:", (seoText || "").length, ")");
    return res.json({ ok: true, outputUrl, output: [outputUrl], seo: seoText || "" });
  } catch (e) {
    console.error("PhotoRoom pipeline error:", e);
    const isTimeout = e && (e.name === "AbortError" || /abort|timeout|Form buffer timeout/i.test(String(e.message)));
    if (isTimeout) return res.status(504).json({ error: "İşlem zaman aşımına uğradı. Lütfen tekrar deneyin." });
    return res.status(500).json({ error: "PhotoRoom çağrısı başarısız: " + (e.message || String(e)) });
  }
});

/** PhotoRoom ile sadece arka plan kaldır + beyaz zemin (damga yok). Pro plan (Görsel Düzenleme) akışında Pixian yerine kullanılır. */
async function photoRoomRemoveBackgroundWhite(rawBuffer) {
  if (!PHOTOROOM_API_KEY || !rawBuffer || rawBuffer.length === 0) return null;
  try {
    let body;
    const headers = { "x-api-key": PHOTOROOM_API_KEY };
    if (FormDataPkg) {
      const form = new FormDataPkg();
      form.append("imageFile", rawBuffer, { filename: "image.png", contentType: "image/png" });
      form.append("removeBackground", "true");
      form.append("referenceBox", "subjectBox");
      form.append("padding", "0.08");
      form.append("background.color", "FFFFFF");
      Object.assign(headers, form.getHeaders());
      body = await new Promise(function (resolve, reject) {
        const chunks = [];
        const t = setTimeout(function () { reject(new Error("Form buffer timeout")); }, 15000);
        form.on("data", function (c) { chunks.push(Buffer.isBuffer(c) ? c : (typeof c === "string" ? Buffer.from(c, "binary") : Buffer.from(c))); });
        form.on("end", function () { clearTimeout(t); resolve(Buffer.concat(chunks)); });
        form.on("error", function (err) { clearTimeout(t); reject(err); });
        if (typeof form.resume === "function") form.resume();
      });
    } else {
      const form = new (globalThis.FormData)();
      const blob = globalThis.File ? new File([rawBuffer], "image.png", { type: "image/png" }) : new Blob([rawBuffer], { type: "image/png" });
      form.append("imageFile", blob, "image.png");
      form.append("removeBackground", "true");
      form.append("referenceBox", "subjectBox");
      form.append("padding", "0.08");
      form.append("background.color", "FFFFFF");
      body = form;
    }
    const res = await fetch("https://image-api.photoroom.com/v2/edit", { method: "POST", headers, body });
    if (!res.ok) return null;
    const out = Buffer.from(await res.arrayBuffer());
    if (out.length > 100 && ((out[0] === 0x89 && out[1] === 0x50) || (out[0] === 0xFF && out[1] === 0xD8))) return out;
    return null;
  } catch (e) {
    console.warn("photoRoomRemoveBackgroundWhite:", e.message);
    return null;
  }
}

app.post("/api/replicate/run", async (req, res) => {
  const user = await getRequestUser(req);
  if (!user) return res.status(401).json({ error: "Oturum gerekli" });
  if (!canUseReplicate(user)) {
    return res.status(403).json({
      error: "Bu özellik için Görsel düzenleme planı gerekli. Hangi planın ücretini öderseniz onu kullanırsınız.",
      upgradeUrl: "/dashboard/fiyatlandirma"
    });
  }
  if (!REPLICATE_API_TOKEN) {
    return res.status(503).json({ error: "Replicate henüz yapılandırılmadı.", message: "REPLICATE_API_TOKEN .env dosyasına ekleyin." });
  }
  const { imageUrl, imageId, prompt } = req.body || {};
  const runBaseUrl = PUBLIC_APP_URL || (req.protocol || "http") + "://" + (req.get("host") || "localhost");
  let url = imageUrl || (imageId ? runBaseUrl + "/api/replicate/temp/" + imageId : null);
  if (!url || typeof url !== "string") return res.status(400).json({ error: "imageUrl veya imageId gerekli" });

  const match = url.match(/\/api\/replicate\/temp\/([^/?]+)/);
  const tempId = imageId || (match && match[1]);
  const entry = tempId ? replicateTempImages.get(tempId) : null;

  function parseBackgroundColor(text) {
    if (!text || typeof text !== "string") return null;
    const t = text.toLowerCase().trim();
    const hexMatch = t.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/);
    if (hexMatch) {
      let hex = hexMatch[1];
      if (hex.length === 3) hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
      return { r: parseInt(hex.slice(0, 2), 16), g: parseInt(hex.slice(2, 4), 16), b: parseInt(hex.slice(4, 6), 16) };
    }
    if (/^(beyaz|white)$/.test(t)) return { r: 255, g: 255, b: 255 };
    if (/^(siyah|black)$/.test(t)) return { r: 0, g: 0, b: 0 };
    if (/^(gri|gray|grey)$/.test(t)) return { r: 128, g: 128, b: 128 };
    if (/^(mavi|blue)$/.test(t)) return { r: 74, g: 144, b: 217 };
    if (/^(yeşil|green)$/.test(t)) return { r: 76, g: 175, b: 80 };
    if (/^(kırmızı|red)$/.test(t)) return { r: 244, g: 67, b: 54 };
    return null;
  }
  const simpleColor = !prompt || typeof prompt !== "string" ? null : parseBackgroundColor(prompt.trim());
  const isSimpleColorOnly = simpleColor !== null && (!prompt || !prompt.trim() || /^(beyaz|white|siyah|black|gri|gray|grey|mavi|blue|yeşil|green|kırmızı|red|#[\da-fA-F]{3,6})\s*$/.test(prompt.trim().toLowerCase()));
  const userPrompt = (prompt && typeof prompt === "string") ? prompt.trim().slice(0, 1000) : "";
  const isPublicUrl = !url.startsWith("http://localhost") && !url.startsWith("http://127.0.0.1") && !url.startsWith("https://localhost") && !url.startsWith("https://127.0.0.1");

  if (!isPublicUrl) {
    return res.status(400).json({
      error: "Arka plan değişimi için PUBLIC_APP_URL gerekli (ngrok veya canlı domain). .env dosyasına ekleyip sunucuyu yeniden başlatın.",
      code: "NEEDS_PUBLIC_URL"
    });
  }

  if (!entry || !entry.noBgBuffer) {
    return res.status(400).json({
      error: "Arka plan değişimi için görsel yükleyip tekrar deneyin veya Pro plan ile Ürün stüdyo görseli sayfasını kullanın.",
      code: "NEEDS_PRODUCT_OR_SETUP"
    });
  }

  const sharp = getSharp();
  const REPLICATE_SIZE = 512;

  function rgbToHex(c) {
    const r = Math.max(0, Math.min(255, c.r));
    const g = Math.max(0, Math.min(255, c.g));
    const b = Math.max(0, Math.min(255, c.b));
    return "#" + [r, g, b].map(x => ("0" + x.toString(16)).slice(-2)).join("");
  }

  try {
    let bgBuffer = null;
    if (isSimpleColorOnly && simpleColor) {
        // Bria product-packshot: beyaz/siyah/hex vb. için tek profesyonel görsel. Version hash: https://replicate.com/bria/product-packshot/api
        const briaVersion = (process.env.REPLICATE_BRIA_PACKSHOT_VERSION || "").trim();
        if (briaVersion) {
          const nobgUrl = runBaseUrl + "/api/replicate/temp/" + tempId + "/nobg";
          const hexColor = rgbToHex(simpleColor);
          try {
            const createRes = await fetch("https://api.replicate.com/v1/predictions", {
              method: "POST",
              headers: { "Authorization": "Token " + REPLICATE_API_TOKEN, "Content-Type": "application/json" },
              body: JSON.stringify({
                version: briaVersion,
                input: { image: nobgUrl, background_color: hexColor }
              })
            });
            const createData = await createRes.json().catch(() => ({}));
            if (createRes.ok && createData.id) {
              for (let i = 0; i < 60; i++) {
                await new Promise(r => setTimeout(r, 2000));
                const pollRes = await fetch("https://api.replicate.com/v1/predictions/" + createData.id, { headers: { "Authorization": "Token " + REPLICATE_API_TOKEN } });
                const pollData = await pollRes.json().catch(() => ({}));
                if (pollData.status === "succeeded" && pollData.output != null) {
                  const out = Array.isArray(pollData.output) ? pollData.output[0] : pollData.output;
                  const outUrl = typeof out === "string" ? out : (out && typeof out === "object" && typeof out.url === "string" ? out.url : null);
                  if (outUrl) {
                    const imgRes = await fetch(outUrl);
                    if (imgRes.ok) {
                      const resultBuf = Buffer.from(await imgRes.arrayBuffer());
                      const resultId = randomUUID().slice(0, 12);
                      replicateTempImages.set(resultId, { buffer: resultBuf, createdAt: Date.now() });
                      return res.json({
                        ok: true,
                        outputUrl: runBaseUrl + "/api/replicate/temp/" + resultId,
                        output: [runBaseUrl + "/api/replicate/temp/" + resultId]
                      });
                    }
                  }
                  break;
                }
                if (pollData.status === "failed" || pollData.status === "canceled") break;
              }
            }
          } catch (briaErr) {
            console.warn("Bria packshot fallback:", briaErr.message);
          }
        }
        const bg = simpleColor || { r: 255, g: 255, b: 255 };
        bgBuffer = await sharp({
          create: { width: REPLICATE_SIZE, height: REPLICATE_SIZE, channels: 4, background: { r: bg.r, g: bg.g, b: bg.b, alpha: 1 } }
        }).png().toBuffer();
    } else {
        let productDescription = "product";
        try {
          const openai = getOpenAI();
          const b64 = entry.noBgBuffer.toString("base64");
          const visionRes = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            max_tokens: 60,
            messages: [{
              role: "user",
              content: [
                { type: "text", text: "What is this product? Reply with only 2-5 words in English, e.g. 'plush toy', 'water bottle', 'sneakers'. No background, no sentence." },
                { type: "image_url", image_url: { url: "data:image/png;base64," + b64 } }
              ]
            }]
          });
          const text = (visionRes.choices && visionRes.choices[0] && visionRes.choices[0].message && visionRes.choices[0].message.content) || "";
          const cleaned = text.replace(/\s+/g, " ").trim().slice(0, 80);
          if (cleaned) productDescription = cleaned;
        } catch (e) { console.warn("Vision product description:", e.message); }

        const userScene = (userPrompt && typeof userPrompt === "string" && userPrompt.trim()) ? userPrompt.trim() : "";
        const bgPrompt = userScene
          ? (userScene + ", soft natural light")
          : ("natural setting for " + productDescription + ", soft daylight");

        async function pollPrediction(predId, maxWait) {
          for (let i = 0; i < maxWait; i++) {
            await new Promise(r => setTimeout(r, 2000));
            const res = await fetch("https://api.replicate.com/v1/predictions/" + predId, { headers: { "Authorization": "Token " + REPLICATE_API_TOKEN } });
            const data = await res.json().catch(() => ({}));
            if (data.status === "succeeded" && data.output != null) {
              const out = Array.isArray(data.output) ? data.output[0] : data.output;
              return typeof out === "string" ? out : (out && out.url);
            }
            if (data.status === "failed" || data.status === "canceled") return null;
          }
          return null;
        }

        const TXT2IMG_VERSION = "ac732df83cea7fff18b8472768c88ad041fa750ff7682a21affe81863cbe77e4";
        try {
          const createRes = await fetch("https://api.replicate.com/v1/predictions", {
            method: "POST",
            headers: { "Authorization": "Token " + REPLICATE_API_TOKEN, "Content-Type": "application/json" },
            body: JSON.stringify({
              version: TXT2IMG_VERSION,
              input: {
                prompt: bgPrompt,
                negative_prompt: "watermark, text, logo, cartoon, 3d render, blurry",
                width: REPLICATE_SIZE,
                height: REPLICATE_SIZE,
                num_outputs: 1,
                num_inference_steps: 45,
                guidance_scale: 7.5
              }
            })
          });
          const createData = await createRes.json().catch(() => ({}));
          if (!createRes.ok) {
            const errStr = String(createData.detail || createData.error || "").toLowerCase();
            if (errStr.includes("insufficient credit") || errStr.includes("billing")) {
              return res.status(402).json({ error: "Replicate hesabında kredi yok.", billingUrl: "https://replicate.com/account/billing#billing" });
            }
          }
          if (createRes.ok && createData.id) {
            const bgUrl = await pollPrediction(createData.id, 90);
            if (bgUrl) {
              const bgRes = await fetch(bgUrl);
              if (bgRes.ok) bgBuffer = Buffer.from(await bgRes.arrayBuffer());
            }
          }
        } catch (e) { console.warn("Txt2img background:", e.message); }

        if (!bgBuffer) {
          const W = REPLICATE_SIZE, H = REPLICATE_SIZE;
          const buf = Buffer.alloc(W * H * 4);
          const topR = 248, topG = 245, topB = 240;
          const botR = 232, botG = 228, botB = 222;
          for (let y = 0; y < H; y++) {
            const t = y / (H - 1);
            const r = Math.round(topR * (1 - t) + botR * t);
            const g = Math.round(topG * (1 - t) + botG * t);
            const b = Math.round(topB * (1 - t) + botB * t);
            for (let x = 0; x < W; x++) {
              const i = (y * W + x) * 4;
              buf[i] = r; buf[i + 1] = g; buf[i + 2] = b; buf[i + 3] = 255;
            }
          }
          bgBuffer = await sharp(buf, { raw: { width: W, height: H, channels: 4 } }).blur(4).png().toBuffer();
        }
    }

    if (bgBuffer) {
      const bgResized = await sharp(bgBuffer)
        .resize(REPLICATE_SIZE, REPLICATE_SIZE, { fit: "cover" })
        .png()
        .toBuffer();
      const noBg = entry.noBgBuffer;
      let productPro = noBg;
      try {
        const alphaBuf = await sharp(noBg).ensureAlpha().extractChannel(3).png().toBuffer();
        productPro = await sharp(noBg)
          .removeAlpha()
          .sharpen(0.3)
          .blur(0.4)
          .linear(1.01, 12)
          .modulate({ saturation: 0.99 })
          .joinChannel(alphaBuf)
          .png()
          .toBuffer();
      } catch (_) {}
      let centerX = REPLICATE_SIZE / 2, centerY = REPLICATE_SIZE / 2;
      try {
        const alphaRaw = await sharp(productPro).ensureAlpha().extractChannel(3).raw().toBuffer();
        let sumX = 0, sumY = 0, sumA = 0;
        for (let y = 0; y < REPLICATE_SIZE; y++) {
          for (let x = 0; x < REPLICATE_SIZE; x++) {
            const a = alphaRaw[y * REPLICATE_SIZE + x];
            if (a > 10) {
              sumX += x * a;
              sumY += y * a;
              sumA += a;
            }
          }
        }
        if (sumA > 0) {
          centerX = sumX / sumA;
          centerY = sumY / sumA;
        }
      } catch (_) {}
      let offsetX = Math.round(REPLICATE_SIZE / 2 - centerX);
      let offsetY = Math.round(REPLICATE_SIZE / 2 - centerY);
      const maxOffset = 60;
      offsetX = Math.max(0, Math.min(maxOffset, offsetX));
      offsetY = Math.max(0, Math.min(maxOffset, offsetY));
      let bgR = 128, bgG = 128, bgB = 128;
      try {
        const avgPixel = await sharp(bgResized).ensureAlpha().resize(1, 1).raw().toBuffer();
        bgR = avgPixel[0]; bgG = avgPixel[1]; bgB = avgPixel[2];
      } catch (_) {}
      let contactShadowBuffer = null;
      let softShadowBuffer = null;
      try {
        const alphaForShadow = await sharp(productPro).ensureAlpha().extractChannel(3).raw().toBuffer();
        function makeShadow(offsetX, offsetY, sigma, alphaMul, r, g, b) {
          const out = Buffer.alloc(REPLICATE_SIZE * REPLICATE_SIZE * 4);
          for (let y = 0; y < REPLICATE_SIZE; y++) {
            for (let x = 0; x < REPLICATE_SIZE; x++) {
              const srcY = y - offsetY;
              const srcX = x - offsetX;
              let a = 0;
              if (srcX >= 0 && srcX < REPLICATE_SIZE && srcY >= 0 && srcY < REPLICATE_SIZE) {
                a = alphaForShadow[srcY * REPLICATE_SIZE + srcX];
              }
              a = (a / 255) * alphaMul;
              const i = (y * REPLICATE_SIZE + x) * 4;
              out[i] = Math.round(r * a);
              out[i + 1] = Math.round(g * a);
              out[i + 2] = Math.round(b * a);
              out[i + 3] = Math.round(255 * a);
            }
          }
          return sharp(out, { raw: { width: REPLICATE_SIZE, height: REPLICATE_SIZE, channels: 4 } }).blur(sigma).png().toBuffer();
        }
        contactShadowBuffer = await makeShadow(3, 6, 18, 0.2, 22, 22, 26);
        softShadowBuffer = await makeShadow(10, 16, 34, 0.1, 32, 32, 36);
      } catch (_) {}
      let productOverlay = productPro;
      try {
        const alphaChan = await sharp(productPro).ensureAlpha().extractChannel(3);
        const alphaSoft = await alphaChan.blur(7).png().toBuffer();
        productOverlay = await sharp(productPro)
          .removeAlpha()
          .joinChannel(alphaSoft)
          .png()
          .toBuffer();
        const edgeR = Math.min(255, Math.round(bgR * 0.65 + 88));
        const edgeG = Math.min(255, Math.round(bgG * 0.65 + 88));
        const edgeB = Math.min(255, Math.round(bgB * 0.65 + 88));
        const premul = await sharp(productOverlay).ensureAlpha().raw().toBuffer();
        for (let i = 0; i < premul.length; i += 4) {
          const a = premul[i + 3] / 255;
          if (a >= 0.01 && a <= 0.99) {
            const t = a <= 0.5 ? (a / 0.5) : ((1 - a) / 0.5);
            const blend = 0.2 + 0.7 * t;
            const r = premul[i], g = premul[i + 1], b = premul[i + 2];
            const newR = r * (1 - blend) + edgeR * blend;
            const newG = g * (1 - blend) + edgeG * blend;
            const newB = b * (1 - blend) + edgeB * blend;
            premul[i] = Math.round(newR * a);
            premul[i + 1] = Math.round(newG * a);
            premul[i + 2] = Math.round(newB * a);
          } else {
            premul[i] = Math.round(premul[i] * a);
            premul[i + 1] = Math.round(premul[i + 1] * a);
            premul[i + 2] = Math.round(premul[i + 2] * a);
          }
        }
        productOverlay = await sharp(premul, { raw: { width: REPLICATE_SIZE, height: REPLICATE_SIZE, channels: 4 } })
          .png()
          .toBuffer();
      } catch (_) {}
      try {
        const tintR = Math.min(255, Math.max(0, bgR + 20));
        const tintG = Math.min(255, Math.max(0, bgG + 18));
        const tintB = Math.min(255, Math.max(0, bgB + 22));
        const tintLayer = await sharp({
          create: { width: REPLICATE_SIZE, height: REPLICATE_SIZE, channels: 4, background: { r: tintR, g: tintG, b: tintB, alpha: 0.032 } }
        }).png().toBuffer();
        productOverlay = await sharp(productOverlay)
          .composite([{ input: tintLayer, gravity: "center", blend: "over" }])
          .png()
          .toBuffer();
      } catch (_) {}
      const productScale = 0.72;
      const productSize = Math.round(REPLICATE_SIZE * productScale);
      const compositeLeft = Math.round((REPLICATE_SIZE - productSize) / 2);
      const compositeTop = Math.round((REPLICATE_SIZE - productSize) / 2);
      try {
        if (contactShadowBuffer) contactShadowBuffer = await sharp(contactShadowBuffer).resize(productSize, productSize, { fit: "cover" }).png().toBuffer();
        if (softShadowBuffer) softShadowBuffer = await sharp(softShadowBuffer).resize(productSize, productSize, { fit: "cover" }).png().toBuffer();
        productOverlay = await sharp(productOverlay).resize(productSize, productSize, { fit: "cover" }).png().toBuffer();
      } catch (_) {}
      const composites = [];
      if (contactShadowBuffer) composites.push({ input: contactShadowBuffer, left: compositeLeft, top: compositeTop, blend: "over" });
      if (softShadowBuffer) composites.push({ input: softShadowBuffer, left: compositeLeft, top: compositeTop, blend: "over" });
      composites.push({ input: productOverlay, left: compositeLeft, top: compositeTop, blend: "over" });
      let resultBuf = await sharp(bgResized)
        .composite(composites)
        .png()
        .toBuffer();
      try {
        resultBuf = await sharp(resultBuf)
          .gamma(1.0)
          .linear(1.01, 18)
          .modulate({ saturation: 0.97 })
          .png()
          .toBuffer();
      } catch (_) {}
      const resultId = randomUUID().slice(0, 12);
      replicateTempImages.set(resultId, { buffer: resultBuf, createdAt: Date.now() });
      return res.json({
        ok: true,
        outputUrl: runBaseUrl + "/api/replicate/temp/" + resultId,
        output: [runBaseUrl + "/api/replicate/temp/" + resultId]
      });
    }
  } catch (e) {
    console.warn("Replicate run composite:", e.message);
  }

  return res.status(400).json({
    error: "Ürün aynı kalıp sadece arka planı değiştirmek için: net bir ürün fotoğrafı yükleyin ve PUBLIC_APP_URL ayarlı olsun. Pro planda Ürün stüdyo görseli sayfasını kullanın.",
    code: "NEEDS_PRODUCT_OR_SETUP"
  });
});

const LEONARDO_API_KEY = process.env.LEONARDO_API_KEY || "";
const LEONARDO_BASE = "https://cloud.leonardo.ai/api/rest/v1";

app.post("/api/leonardo/generate", async (req, res) => {
  const user = await getRequestUser(req);
  if (!user) return res.status(401).json({ error: "Oturum gerekli" });
  if (!canUseLeonardo(user)) {
    return res.status(403).json({
      error: "Leonardo AI yalnızca Pro planlarda kullanılabilir.",
      upgradeUrl: "/pricing.html"
    });
  }
  const { prompt } = req.body || {};
  if (!prompt || typeof prompt !== "string") {
    return res.status(400).json({ error: "prompt gerekli" });
  }
  if (!LEONARDO_API_KEY) {
    return res.status(503).json({
      error: "Leonardo AI henüz yapılandırılmadı.",
      message: "LEONARDO_API_KEY .env dosyasına ekleyin."
    });
  }
  try {
    const resLeo = await fetch(LEONARDO_BASE + "/generations", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + LEONARDO_API_KEY.trim()
      },
      body: JSON.stringify({
        prompt: prompt.slice(0, 1000),
        modelId: "b24e16ff-06e3-43eb-8d33-4416c2d75876",
        num_images: 1,
        width: 1024,
        height: 1024
      })
    });
    const data = await resLeo.json().catch(() => ({}));
    if (!resLeo.ok) {
      console.warn("Leonardo API:", resLeo.status, JSON.stringify(data).slice(0, 300));
      return res.status(502).json({
        error: data.error?.message || "Leonardo AI yanıt vermedi.",
        detail: data.error?.message || ("HTTP " + resLeo.status)
      });
    }
    const genId = data.sdGenerationJob?.generationId || data.generationId || data.id;
    res.json({
      generationId: genId || null,
      message: genId ? "Görsel oluşturuluyor. Birkaç saniye sonra sonucu kontrol edin." : "İstek alındı."
    });
  } catch (e) {
    console.error("Leonardo generate:", e);
    res.status(500).json({ error: e.message || "Leonardo AI hatası" });
  }
});

app.get("/api/leonardo/generation/:id", async (req, res) => {
  const user = await getRequestUser(req);
  if (!user) return res.status(401).json({ error: "Oturum gerekli" });
  if (!canUseLeonardo(user)) {
    return res.status(403).json({ error: "Pro plan gerekli" });
  }
  const id = req.params.id;
  if (!id || !/^[a-f0-9-]{36}$/i.test(id)) return res.status(400).json({ error: "Geçersiz generation id" });
  if (!LEONARDO_API_KEY) return res.status(503).json({ error: "Leonardo API yapılandırılmadı" });
  try {
    const r = await fetch(LEONARDO_BASE + "/generations/" + id, {
      headers: { "Authorization": "Bearer " + LEONARDO_API_KEY.trim() }
    });
    const data = await r.json().catch(() => ({}));
    if (!r.ok) return res.status(502).json({ error: "Leonardo yanıt vermedi", detail: data });
    const pk = data.generations_by_pk;
    if (!pk) return res.json({ status: "PENDING", imageUrls: [] });
    const status = (pk.status || "PENDING").toUpperCase();
    const images = pk.generated_images || [];
    const imageUrls = images.map(function (img) { return img.url; }).filter(Boolean);
    res.json({ status, imageUrls });
  } catch (e) {
    console.error("Leonardo get generation:", e);
    res.status(500).json({ error: e.message });
  }
});

function dataUrlToBuffer(dataUrl) {
  const s = (dataUrl || "").trim();
  let base64 = s;
  if (s.startsWith("data:image")) {
    base64 = s.replace(/^data:image\/[^;]+;base64,/, "");
  }
  if (!base64) return null;
  return Buffer.from(base64, "base64");
}

var sharpLib = null;
function getSharp() {
  if (!sharpLib) sharpLib = require("sharp");
  return sharpLib;
}

function getMimeFromDataUrl(dataUrl) {
  if (!dataUrl || typeof dataUrl !== "string") return "image/jpeg";
  const m = dataUrl.match(/^data:(image\/[a-z+]+);/i);
  return m ? m[1] : "image/jpeg";
}

const PIXIAN_API_ID = process.env.PIXIAN_API_ID || "";
const PIXIAN_API_SECRET = process.env.PIXIAN_API_SECRET || "";
const PIXIAN_TEST = process.env.PIXIAN_TEST !== "false";

/** Pixian.AI API ile arka plan kaldir. imageUrl varsa image.url ile gonder (Pixian indirir), yoksa base64 dene. productionNoWatermark=true ise test gonderilmez, cikti damgasiz olur (ucretli). */
async function removeBackgroundWithApi(rawBuffer, mimeType, imageUrl, productionNoWatermark) {
  if (!PIXIAN_API_ID || !PIXIAN_API_SECRET) return null;
  const basicAuth = Buffer.from(PIXIAN_API_ID + ":" + PIXIAN_API_SECRET).toString("base64");
  const authHeader = { "Authorization": "Basic " + basicAuth };
  const useTest = PIXIAN_TEST && !productionNoWatermark;

  const tryWithUrl = async () => {
    if (!imageUrl || typeof imageUrl !== "string" || !imageUrl.startsWith("http")) return null;
    try {
      const formData = new FormData();
      formData.append("image.url", imageUrl);
      formData.append("background.color", "#ffffff");
      if (useTest) formData.append("test", "true");
      const res = await fetch("https://api.pixian.ai/api/v2/remove-background", {
        method: "POST",
        headers: authHeader,
        body: formData
      });
      if (!res.ok) {
        const errText = await res.text();
        console.warn("Pixian (image.url):", res.status, errText.slice(0, 300));
        return null;
      }
      const out = Buffer.from(await res.arrayBuffer());
      if (out.length > 0 && !isJsonBuffer(out)) {
        console.log("Pixian (image.url): arka plan kaldirildi, boyut:", out.length);
        return out;
      }
      if (out.length > 0) console.warn("Pixian (image.url): JSON yanit (hata?), body:", out.slice(0, 200).toString());
      return null;
    } catch (e) {
      console.warn("Pixian (image.url) hata:", e.message);
      return null;
    }
  };

  const tryWithBase64 = async () => {
    if (!rawBuffer || rawBuffer.length === 0) return null;
    const maxBase64 = 1024 * 1024 - 10000;
    const b64 = rawBuffer.toString("base64");
    if (b64.length > maxBase64) {
      console.warn("Pixian (base64): resim cok buyuk, atlanıyor");
      return null;
    }
    try {
      const formData = new FormData();
      formData.append("image.base64", b64);
      formData.append("background.color", "#ffffff");
      if (useTest) formData.append("test", "true");
      const res = await fetch("https://api.pixian.ai/api/v2/remove-background", {
        method: "POST",
        headers: authHeader,
        body: formData
      });
      if (!res.ok) {
        const errText = await res.text();
        console.warn("Pixian (image.base64):", res.status, errText.slice(0, 300));
        return null;
      }
      const out = Buffer.from(await res.arrayBuffer());
      if (out.length > 0 && !isJsonBuffer(out)) {
        console.log("Pixian (image.base64): arka plan kaldirildi, boyut:", out.length);
        return out;
      }
      return null;
    } catch (e) {
      console.warn("Pixian (image.base64) hata:", e.message);
      return null;
    }
  };

  let out = await tryWithUrl();
  if (out) return out;
  out = await tryWithBase64();
  return out;
}

function isJsonBuffer(buf) {
  const s = buf.slice(0, 50).toString("utf8").trim();
  return s.startsWith("{") || s.startsWith("[");
}

/** Pro plan: Leonardo AI ile yuklenen goruntuyu iyilestir (image-to-image). Urun aslini korur, sadece arka plan/isik iyilestirir. */
async function leonardoEnhanceImage(rawBuffer, userPrompt) {
  if (!LEONARDO_API_KEY || !rawBuffer || rawBuffer.length === 0) return null;
  const sharp = getSharp();
  const auth = "Bearer " + LEONARDO_API_KEY.trim();
  const userText = (userPrompt && String(userPrompt).trim()) ? String(userPrompt).trim().slice(0, 800) : "";
  const prompt = userText
    ? "Keep the product and object exactly as in the image, do not alter or replace the product. Only improve: " + userText
    : "Keep the product exactly as in the image. Only improve to professional e-commerce photo: white background, clean lighting, high quality, sharp. Do not change the product itself.";
  console.log("Leonardo enhance prompt:", prompt.slice(0, 100) + (prompt.length > 100 ? "..." : ""));
  try {
    let pngBuffer = rawBuffer;
    try {
      pngBuffer = await sharp(rawBuffer, { failOnError: false }).resize(1024, 1024, { fit: "inside", withoutEnlargement: true }).png().toBuffer();
      if (!pngBuffer || pngBuffer.length === 0) pngBuffer = rawBuffer;
    } catch (_) {}
    const initRes = await fetch(LEONARDO_BASE + "/init-image", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": auth },
      body: JSON.stringify({ extension: "png" })
    });
    const initData = await initRes.json().catch(() => ({}));
    const uploadInfo = initData.uploadInitImage || initData.uploadDatasetImage;
    if (!initRes.ok || !uploadInfo || !uploadInfo.id) {
      console.warn("Leonardo init-image:", initRes.status, JSON.stringify(initData).slice(0, 200));
      return null;
    }
    const fields = typeof uploadInfo.fields === "string" ? JSON.parse(uploadInfo.fields) : uploadInfo.fields || {};
    const formData = new FormData();
    for (const [k, v] of Object.entries(fields)) formData.append(k, String(v));
    formData.append("file", new Blob([pngBuffer], { type: "image/png" }), "image.png");
    const uploadRes = await fetch(uploadInfo.url, { method: "POST", body: formData });
    if (!uploadRes.ok) {
      console.warn("Leonardo S3 upload:", uploadRes.status);
      return null;
    }
    const genRes = await fetch(LEONARDO_BASE + "/generations", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": auth },
      body: JSON.stringify({
        prompt,
        init_image_id: uploadInfo.id,
        init_strength: 0.15,
        num_images: 1,
        width: 1024,
        height: 1024,
        modelId: "b24e16ff-06e3-43eb-8d33-4416c2d75876"
      })
    });
    const genData = await genRes.json().catch(() => ({}));
    const genId = genData.sdGenerationJob?.generationId || genData.generationId;
    if (!genRes.ok || !genId) {
      console.warn("Leonardo generations:", genRes.status, JSON.stringify(genData).slice(0, 200));
      return null;
    }
    for (let i = 0; i < 40; i++) {
      await new Promise(r => setTimeout(r, 3000));
      const pollRes = await fetch(LEONARDO_BASE + "/generations/" + genId, { headers: { "Authorization": auth } });
      const pollData = await pollRes.json().catch(() => ({}));
      const pk = pollData.generations_by_pk;
      if (!pk) continue;
      const status = (pk.status || "").toUpperCase();
      if (status === "FAILED") {
        console.warn("Leonardo generation FAILED");
        return null;
      }
      if (status === "COMPLETE") {
        const imgs = pk.generated_images || [];
        const url = imgs[0]?.url;
        if (url) {
          const imgRes = await fetch(url, { redirect: "follow" });
          if (imgRes.ok) {
            const out = Buffer.from(await imgRes.arrayBuffer());
            console.log("Leonardo: iyilestirme tamam, boyut:", out.length);
            return out;
          }
        }
        return null;
      }
    }
    console.warn("Leonardo: zaman asimi");
    return null;
  } catch (e) {
    console.warn("Leonardo enhance:", e.message);
    return null;
  }
}

/** Pazaryeri fotografi: Pro planda PhotoRoom (damga yok), normal planda Pixian; Sharp ile beyaz zemin, resize, PNG. */
async function marketplacePhoto(imageUrl, imageBase64, options) {
  const usePhotoRoom = options && options.usePhotoRoom === true;
  const sharp = getSharp();
  var raw = null;
  var mimeType = "image/jpeg";

  if (imageBase64 && typeof imageBase64 === "string") {
    mimeType = getMimeFromDataUrl(imageBase64);
    try {
      raw = dataUrlToBuffer(imageBase64);
    } catch (e) {
      console.warn("marketplacePhoto base64:", e.message);
    }
  }
  if ((!raw || raw.length === 0) && imageUrl && typeof imageUrl === "string" && imageUrl.startsWith("http")) {
    try {
      const res = await fetch(imageUrl, { redirect: "follow" });
      if (!res.ok) throw new Error("HTTP " + res.status);
      raw = Buffer.from(await res.arrayBuffer());
      const ct = res.headers.get("content-type");
      if (ct && ct.startsWith("image/")) mimeType = ct.split(";")[0].trim();
    } catch (e) {
      console.warn("marketplacePhoto fetch:", e.message);
    }
  }
  if (!raw || raw.length === 0) {
    console.warn("marketplacePhoto: gecersiz giris (raw yok)");
    return null;
  }

  var toProcess = raw;
  if (usePhotoRoom && PHOTOROOM_API_KEY) {
    const noBg = await photoRoomRemoveBackgroundWhite(raw);
    if (noBg && noBg.length > 0) toProcess = noBg;
  } else {
    const noBg = await removeBackgroundWithApi(raw, mimeType, imageUrl || null);
    if (noBg && noBg.length > 0) toProcess = noBg;
  }

  try {
    const out = await sharp(toProcess, { failOnError: false })
      .rotate()
      .resize(2000, 2000, { fit: "inside", withoutEnlargement: true })
      .flatten({ background: "#ffffff" })
      .extend({ top: 40, bottom: 40, left: 40, right: 40, background: "#ffffff" })
      .png()
      .toBuffer();
    if (out && out.length > 0) {
      console.log("marketplacePhoto: tamam, boyut:", out.length);
      return out;
    }
  } catch (e) {
    console.warn("marketplacePhoto pipeline:", e.message);
  }

  try {
    const out = await sharp(raw, { failOnError: false })
      .rotate()
      .resize(2000, 2000, { fit: "inside", withoutEnlargement: true })
      .flatten({ background: "#ffffff" })
      .extend({ top: 40, bottom: 40, left: 40, right: 40, background: "#ffffff" })
      .png()
      .toBuffer();
    if (out && out.length > 0) {
      console.log("marketplacePhoto: yedek (Sharp only), boyut:", out.length);
      return out;
    }
  } catch (e2) {
    console.error("marketplacePhoto yedek:", e2.message);
  }
  return null;
}

app.get("/api/processed-image/:id", function (req, res) {
  const id = req.params.id;
  const entry = processedImages.get(id);
  if (!entry || !entry.buffer) {
    return res.status(404).setHeader("Cache-Control", "no-store").send("Not found");
  }
  res.setHeader("Content-Type", "image/png");
  res.setHeader("Cache-Control", "no-store");
  res.send(entry.buffer);
});

app.post("/api/process", async (req, res) => {
  const user = await getRequestUser(req);
  if (!user) return res.status(401).json({ error: "Oturum gerekli. Lutfen giris yapin veya sayfayi yenileyin." });
  const credits = user.credits ?? FREE_CREDITS;
  const plan = user.plan || "free";
  const totalConversions = user.totalConversions ?? 0;
  const maxFreeConversions = 3;
  if (plan === "free" && totalConversions >= maxFreeConversions) {
    return res.status(402).json({
      error: "FREE_LIMIT_REACHED",
      message: "Ücretsiz 3 deneme hakkınızı kullandınız. Devam etmek için plan yükseltin.",
      limitReached: true,
      credits,
      totalConversions
    });
  }
  if (credits < CREDITS_PER_CONVERSION) {
    return res.status(402).json({
      error: "INSUFFICIENT_CREDITS",
      message: "Donusum hakkiniz kalmadi. Lutfen bir plan secin.",
      credits
    });
  }

  const { imageUrl, imageBase64, productDescription: productDescriptionBody } = req.body;
  if (!imageUrl && !imageBase64) {
    return res.status(400).json({ error: "imageUrl veya imageBase64 gerekli" });
  }
  const userProductDescription = (productDescriptionBody && String(productDescriptionBody).trim()) || "";
  console.log("api/process: imageUrl=" + (imageUrl ? "var" : "yok") + ", imageBase64=" + (imageBase64 ? "var" : "yok") + ", productDescription=" + (userProductDescription ? "var" : "yok"));
  const imgUrl = imageUrl || imageBase64 || null;

  try {
    // Her dönüşüm krediden düşer (SEO + fiyat analizi de krediye dahildir)
    if (user._memory) {
      const u = memoryUsers.get(user.id);
      u.credits = (u.credits || FREE_CREDITS) - CREDITS_PER_CONVERSION;
      u.totalConversions = (u.totalConversions || 0) + 1;
    } else {
      await updateUserInDb(user.id, {
        credits: credits - CREDITS_PER_CONVERSION,
        totalConversions: (user.totalConversions || 0) + 1
      });
    }
    const newCredits = credits - CREDITS_PER_CONVERSION;
    try { incrementDailyStat("conversions"); } catch (_) {}

    // Pro plan (Gorsel Duzenleme): PhotoRoom ile arka plan + beyaz (damga yok). Normal plan: Pixian + Sharp.
    const enhancedBuffer = await marketplacePhoto(imgUrl, imageBase64 || null, { usePhotoRoom: canUsePhotoRoom(user) });
    let enhancedImageUrl = null;
    if (enhancedBuffer && enhancedBuffer.length > 0) {
      cleanupProcessedImages();
      const id = randomUUID().slice(0, 12);
      processedImages.set(id, { buffer: enhancedBuffer, createdAt: Date.now() });
      enhancedImageUrl = "/api/processed-image/" + id;
      console.log("marketplacePhoto: iyilestirilmis gorsel hazir, id=" + id + ", boyut=" + enhancedBuffer.length);
    } else {
      console.warn("marketplacePhoto: iyilestirme sonucu bos (enhancedBuffer null), orijinal gosterilecek");
    }

    var seoText = "";
    var priceText = "";
    try {
      const seoRes = await getOpenAI().chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{
          role: "user",
          content: [
            { type: "text", text: "Bu urun fotografini analiz et ve SEO aciklamasi yaz" },
            { type: "image_url", image_url: { url: imgUrl } }
          ]
        }]
      });
      seoText = (seoRes.choices && seoRes.choices[0] && seoRes.choices[0].message && seoRes.choices[0].message.content) || "";
    } catch (seoErr) {
      console.error("api/process SEO hatasi:", seoErr.message);
      seoText = "[SEO alinamadi: " + (seoErr.message || "baglanti hatasi") + "]";
    }
    var priceAnalysis = null;
    try {
      var priceInput = userProductDescription || seoText;
      priceAnalysis = await getPriceAnalysisWithScraperAPI(priceInput);
      if (priceAnalysis && priceAnalysis.platforms && priceAnalysis.platforms.length > 0) {
        priceText = priceAnalysis.summaryText || "";
        if (!priceText && priceAnalysis.platforms.length) {
          priceText = priceAnalysis.platforms.map(p => {
            const fmt = (v) => v == null ? "—" : (p.currency === "TRY" ? Number(v).toLocaleString("tr-TR", { minimumFractionDigits: 2 }) : Number(v).toLocaleString("en-US", { minimumFractionDigits: 2 }));
            return p.name + ": Min " + fmt(p.minPrice) + ", Ort. " + fmt(p.avgPrice) + ", Maks " + fmt(p.maxPrice) + " " + p.currency;
          }).join("\n");
        }
      } else {
        priceAnalysis = await getPriceAnalysisFallbackWithGPT(priceInput);
        if (priceAnalysis && priceAnalysis.platforms && priceAnalysis.platforms.length > 0) {
          priceText = priceAnalysis.summaryText || "";
        } else {
          priceAnalysis = null;
          const priceRes = await getOpenAI().chat.completions.create({
            model: "gpt-4o-mini",
            messages: [{
              role: "user",
              content: [
                {
                  type: "text",
                  text: "Bu urun fotografini analiz et ve fiyat analizi yap. Urunun tahmini piyasa fiyati (TL), platform fiyat araligi, onerilen satis fiyati ve rekabetci fiyatlandirma stratejisi belirt."
                },
                { type: "image_url", image_url: { url: imgUrl } }
              ]
            }]
          });
          priceText = (priceRes.choices && priceRes.choices[0] && priceRes.choices[0].message && priceRes.choices[0].message.content) || "";
        }
      }
    } catch (priceErr) {
      console.error("api/process Fiyat hatasi:", priceErr.message);
      priceText = "[Fiyat alinamadi: " + (priceErr.message || "baglanti hatasi") + "]";
    }

    res.json({
      seo: seoText,
      enhancedImageUrl: enhancedImageUrl || null,
      originalImageUrl: enhancedImageUrl ? null : imgUrl,
      price: priceText,
      priceAnalysis: priceAnalysis || undefined,
      credits: newCredits
    });
  } catch (err) {
    // Hata durumunda krediyi geri ver
    if (user._memory) {
      const u = memoryUsers.get(user.id);
      u.credits = (u.credits || 0) + CREDITS_PER_CONVERSION;
      if (u.totalConversions > 0) u.totalConversions--;
    } else {
      try {
        await updateUserInDb(user.id, {
          credits: (user.credits || 0) + CREDITS_PER_CONVERSION,
          totalConversions: Math.max(0, (user.totalConversions || 0) - 1)
        });
      } catch (_) {}
    }
    console.error("api/process genel hata:", err);
    res.status(500).json({ error: err.message || "Islem hatasi" });
  }
});

app.post("/api/seo", async (req, res) => {
  try {
    const { product } = req.body || {};
    const productStr = typeof product === "string" ? product.trim() : (product ? String(product) : "");
    if (!productStr) {
      return res.status(400).json({ error: "product is required in body" });
    }
    const apiKey = (process.env.OPENAI_API_KEY || process.env.OPENAI_KEY || "").trim();
    if (!apiKey) {
      return res.status(503).json({ error: "OPENAI_API_KEY not configured" });
    }
    let data = {};
    try {
      const response = await axios.post(
        "https://api.openai.com/v1/chat/completions",
        {
          model: "gpt-4o-mini",
          messages: [
            { role: "system", content: "You are an SEO expert writing product descriptions." },
            { role: "user", content: "Write an SEO optimized product description for: " + productStr }
          ]
        },
        {
          headers: {
            "Content-Type": "application/json",
            "Authorization": "Bearer " + apiKey
          },
          timeout: 60000,
          validateStatus: function () { return true; }
        }
      );
      data = response.data || {};
      if (response.status !== 200) {
        console.error("SEO generation OpenAI error:", response.status, data);
        return res.status(response.status >= 500 ? 502 : response.status).json({ error: "SEO generation failed" });
      }
    } catch (openaiErr) {
      console.error("SEO generation OpenAI request error:", openaiErr.message);
      return res.status(500).json({ error: "SEO generation failed" });
    }
    const text = (data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content) || "";
    res.json({ text });
  } catch (error) {
    console.error("SEO generation error:", error);
    res.status(500).json({ error: "SEO generation failed" });
  }
});

app.post("/seo", async (req, res) => {
  try {
    const { imageUrl } = req.body;
    const response = await getOpenAI().chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{
        role: "user",
        content: [
          { type: "text", text: "Bu urun fotografini analiz et ve SEO aciklamasi yaz" },
          { type: "image_url", image_url: { url: imageUrl } }
        ]
      }]
    });
    res.json({ text: response.choices[0].message.content });
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "SEO ERROR" });
  }
});

app.post("/enhance", async (req, res) => {
  try {
    const sharp = getSharp();
    const { imageUrl, imageBase64 } = req.body;
    if (!imageUrl && !imageBase64) return res.status(400).json({ error: "imageUrl veya imageBase64 gerekli" });

    let raw = null;
    let mimeType = "image/jpeg";
    if (imageBase64 && typeof imageBase64 === "string") {
      mimeType = getMimeFromDataUrl(imageBase64);
      raw = dataUrlToBuffer(imageBase64);
    }
    if ((!raw || raw.length === 0) && imageUrl) {
      const imageResponse = await fetch(imageUrl, { redirect: "follow" });
      if (!imageResponse.ok) return res.status(400).json({ error: "Resim indirilemedi" });
      raw = Buffer.from(await imageResponse.arrayBuffer());
      const ct = imageResponse.headers.get("content-type");
      if (ct && ct.startsWith("image/")) mimeType = ct.split(";")[0].trim();
    }
    if (!raw || raw.length === 0) return res.status(400).json({ error: "Gecersiz gorsel" });

    let toProcess = raw;
    const noBg = await removeBackgroundWithApi(raw, mimeType, imageUrl || null);
    if (noBg && noBg.length > 0) toProcess = noBg;

    const finalBuffer = await sharp(toProcess, { failOnError: false })
      .rotate()
      .flatten({ background: "#ffffff" })
      .png()
      .toBuffer();

    res.json({ image: "data:image/png;base64," + finalBuffer.toString("base64") });
  } catch (err) {
    console.error("enhance error:", err);
    res.status(500).json({ error: "ENHANCE ERROR: " + (err.message || err) });
  }
});

app.post("/price", async (req, res) => {
  try {
    const { imageUrl } = req.body;
    if (!imageUrl) return res.status(400).json({ error: "imageUrl gerekli" });

    let productDesc = "";
    try {
      const descRes = await getOpenAI().chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{
          role: "user",
          content: [
            { type: "text", text: "Bu urun fotografini tek cumlede acikla. Sadece urun adi ve kisa ozellik." },
            { type: "image_url", image_url: { url: imageUrl } }
          ]
        }]
      });
      productDesc = (descRes.choices && descRes.choices[0] && descRes.choices[0].message && descRes.choices[0].message.content) || "";
    } catch (_) {}
    let text = await getPriceAnalysisWithScraperAPI(productDesc);
    if (!text) {
      const response = await getOpenAI().chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{
          role: "user",
          content: [
            { type: "text", text: "Bu urun fotografini analiz et ve fiyat analizi yap. TL piyasa fiyati, platform fiyat araligi, onerilen satis fiyati ve rekabetci strateji belirt." },
            { type: "image_url", image_url: { url: imageUrl } }
          ]
        }]
      });
      text = response.choices[0].message.content;
    }
    res.json({ text });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "PRICE ERROR" });
  }
});

app.use(function (req, res) {
  console.warn("404:", req.method, req.path);
  res.status(404).json({ error: "Not Found", path: req.path, method: req.method });
});

app.use(function (err, req, res, next) {
  var origin = req.headers.origin;
  res.setHeader("Access-Control-Allow-Origin", origin || "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Session-Id");
  console.error("Unhandled error:", err);
  res.status(500).json({ error: err.message || "Server error" });
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, "0.0.0.0", () => {
  console.log("Server is running on port", PORT);
});

module.exports = { app };
