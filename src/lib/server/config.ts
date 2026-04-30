import "server-only";

import path from "path";

export type ReadinessIssue = {
  level: "error" | "warning";
  code: string;
  message: string;
};

export type RuntimeConfig = {
  appVersion: string;
  environment: string;
  storageDir: string;
  maxUploadBytes: number;
  maxUploadFiles: number;
  allowedUploadExtensions: string[];
  maxJsonBytes: number;
  chatMessageLimit: number;
  chatMessageMaxChars: number;
  ragSourceLimit: number;
  modelTimeoutMs: number;
  modelMaxTokens: number;
  rateLimitWindowMs: number;
  loginRateLimit: number;
  chatRateLimit: number;
  uploadRateLimit: number;
};

const defaultAllowedExtensions = [
  ".txt",
  ".md",
  ".csv",
  ".json",
  ".html",
  ".xml",
  ".log",
  ".pdf",
  ".docx",
  ".xlsx",
  ".xlsm",
  ".png",
  ".jpg",
  ".jpeg",
  ".webp",
  ".mp3",
  ".wav",
  ".m4a",
  ".mp4",
  ".mov",
  ".avi",
];

export function getRuntimeConfig(): RuntimeConfig {
  const maxUploadMb = readNumber("DANIU_MAX_UPLOAD_MB", 50, 1, 1024);

  return {
    appVersion: process.env.npm_package_version || "0.1.0",
    environment: process.env.NODE_ENV || "development",
    storageDir: process.env.DANIU_STORAGE_DIR || path.join(/*turbopackIgnore: true*/ process.cwd(), ".daniu"),
    maxUploadBytes: readNumber("DANIU_MAX_UPLOAD_BYTES", maxUploadMb * 1024 * 1024, 1024, 1024 * 1024 * 1024),
    maxUploadFiles: readNumber("DANIU_MAX_UPLOAD_FILES", 10, 1, 100),
    allowedUploadExtensions: readList("DANIU_ALLOWED_UPLOAD_EXTENSIONS", defaultAllowedExtensions).map(normalizeExtension),
    maxJsonBytes: readNumber("DANIU_MAX_JSON_BYTES", 256 * 1024, 1024, 5 * 1024 * 1024),
    chatMessageLimit: readNumber("DANIU_CHAT_MESSAGE_LIMIT", 12, 1, 50),
    chatMessageMaxChars: readNumber("DANIU_CHAT_MESSAGE_MAX_CHARS", 12000, 100, 100000),
    ragSourceLimit: readNumber("DANIU_RAG_SOURCE_LIMIT", 5, 1, 20),
    modelTimeoutMs: readNumber("DANIU_MODEL_TIMEOUT_MS", 60000, 1000, 10 * 60 * 1000),
    modelMaxTokens: readNumber("DANIU_MODEL_MAX_TOKENS", 2048, 128, 32768),
    rateLimitWindowMs: readNumber("DANIU_RATE_LIMIT_WINDOW_MS", 60000, 1000, 60 * 60 * 1000),
    loginRateLimit: readNumber("DANIU_LOGIN_RATE_LIMIT", 10, 1, 1000),
    chatRateLimit: readNumber("DANIU_CHAT_RATE_LIMIT", 60, 1, 10000),
    uploadRateLimit: readNumber("DANIU_UPLOAD_RATE_LIMIT", 20, 1, 10000),
  };
}

export function getProductionReadiness() {
  const config = getRuntimeConfig();
  const issues: ReadinessIssue[] = [];
  const isProduction = config.environment === "production";
  const sessionSecret = process.env.DANIU_SESSION_SECRET ?? "";
  const adminPassword = process.env.DANIU_ADMIN_PASSWORD ?? "";
  const hasLocalModel = Boolean(process.env.DANIU_LOCAL_LLM_BASE_URL && process.env.DANIU_LOCAL_LLM_API_KEY && process.env.DANIU_LOCAL_LLM_MODEL);
  const hasMiniMax = Boolean(process.env.MINIMAX_API_KEY);

  if (!sessionSecret || sessionSecret.length < 32 || sessionSecret === "daniu-dev-session-secret") {
    issues.push({
      level: isProduction ? "error" : "warning",
      code: "AUTH_SESSION_SECRET_WEAK",
      message: "DANIU_SESSION_SECRET 必须设置为至少 32 位随机字符串。",
    });
  }

  if (!adminPassword || adminPassword === "daniu123456" || adminPassword === "changeme") {
    issues.push({
      level: isProduction ? "error" : "warning",
      code: "AUTH_ADMIN_PASSWORD_DEFAULT",
      message: "DANIU_ADMIN_PASSWORD 必须改成企业自己的强密码。",
    });
  }

  if (!hasLocalModel && !hasMiniMax) {
    issues.push({
      level: isProduction ? "error" : "warning",
      code: "MODEL_PROVIDER_MISSING",
      message: "至少需要配置一个模型服务：本地大模型或 MiniMax。",
    });
  }

  return {
    ready: !issues.some((issue) => issue.level === "error"),
    checkedAt: new Date().toISOString(),
    environment: config.environment,
    storageDir: config.storageDir,
    issues,
  };
}

export function isUploadExtensionAllowed(name: string) {
  const ext = normalizeExtension(path.extname(name));
  return getRuntimeConfig().allowedUploadExtensions.includes(ext);
}

function readNumber(name: string, fallback: number, min: number, max: number) {
  const raw = process.env[name];
  const parsed = raw ? Number(raw) : fallback;
  if (!Number.isFinite(parsed)) {
    return fallback;
  }

  return Math.min(max, Math.max(min, Math.floor(parsed)));
}

function readList(name: string, fallback: string[]) {
  const raw = process.env[name];
  if (!raw) {
    return fallback;
  }

  const values = raw
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);

  return values.length ? values : fallback;
}

function normalizeExtension(value: string) {
  const ext = value.trim().toLowerCase();
  return ext.startsWith(".") ? ext : `.${ext}`;
}
