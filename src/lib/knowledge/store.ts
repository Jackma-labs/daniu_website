import "server-only";

import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";

export type KnowledgeStatus = "learned" | "processing" | "needs_review";

export type KnowledgeItem = {
  id: string;
  name: string;
  size: number;
  type: string;
  domain: string;
  status: KnowledgeStatus;
  chunks: number;
  uploadedAt: string;
  summary: string;
  storagePath?: string;
};

export type KnowledgeSource = Pick<KnowledgeItem, "id" | "name" | "domain" | "summary"> & {
  chunks: number;
};

const storageRoot = process.env.DANIU_STORAGE_DIR || path.join(process.cwd(), ".daniu");
const uploadsDir = path.join(storageRoot, "uploads");
const manifestPath = path.join(storageRoot, "knowledge.json");

const seedItems: KnowledgeItem[] = [
  {
    id: "seed-product-x9",
    name: "产品手册_X9.pdf",
    size: 2480000,
    type: "application/pdf",
    domain: "产品资料",
    status: "learned",
    chunks: 128,
    uploadedAt: "2026-04-21T09:30:00.000Z",
    summary: "X9 设备参数、安装要求、型号差异和推荐场景。",
  },
  {
    id: "seed-after-sales",
    name: "售后故障案例.xlsx",
    size: 920000,
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    domain: "售后案例",
    status: "processing",
    chunks: 86,
    uploadedAt: "2026-04-26T14:20:00.000Z",
    summary: "常见报警、压力回落、阀体卡滞和传感器排查记录。",
  },
  {
    id: "seed-price-rule",
    name: "报价规则.docx",
    size: 360000,
    type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    domain: "报价规则",
    status: "needs_review",
    chunks: 42,
    uploadedAt: "2026-04-27T11:10:00.000Z",
    summary: "区域折扣、渠道保护、项目报价审批和特殊条款。",
  },
];

export async function getKnowledgeItems() {
  const stored = await readManifest();
  return [...stored, ...seedItems].sort((a, b) => Date.parse(b.uploadedAt) - Date.parse(a.uploadedAt));
}

export async function getKnowledgeStats() {
  const items = await getKnowledgeItems();
  const learned = items.filter((item) => item.status === "learned").length;
  const pending = items.length - learned;
  const chunks = items.reduce((sum, item) => sum + item.chunks, 0);
  const domains = new Set(items.map((item) => item.domain)).size;

  return {
    total: items.length,
    learned,
    pending,
    chunks,
    domains,
  };
}

export async function saveKnowledgeFile(file: File) {
  await ensureStorage();

  const id = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
  const safeName = sanitizeFileName(file.name || "untitled");
  const storageName = `${id}-${safeName}`;
  const storagePath = path.join(uploadsDir, storageName);
  const buffer = Buffer.from(await file.arrayBuffer());

  await writeFile(storagePath, buffer);

  const item: KnowledgeItem = {
    id,
    name: safeName,
    size: file.size,
    type: file.type || inferMimeType(safeName),
    domain: inferDomain(safeName),
    status: inferStatus(safeName),
    chunks: estimateChunks(file.size),
    uploadedAt: new Date().toISOString(),
    summary: buildSummary(safeName),
    storagePath,
  };

  const current = await readManifest();
  await writeManifest([item, ...current]);

  return item;
}

export async function findKnowledgeSources(query: string, limit = 3): Promise<KnowledgeSource[]> {
  const items = await getKnowledgeItems();
  const tokens = tokenize(query);

  return items
    .map((item) => ({ item, score: scoreItem(item, tokens) }))
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(({ item }) => ({
      id: item.id,
      name: item.name,
      domain: item.domain,
      summary: item.summary,
      chunks: item.chunks,
    }));
}

async function readManifest(): Promise<KnowledgeItem[]> {
  try {
    const content = await readFile(manifestPath, "utf8");
    const parsed = JSON.parse(content) as KnowledgeItem[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function writeManifest(items: KnowledgeItem[]) {
  await ensureStorage();
  await writeFile(manifestPath, JSON.stringify(items, null, 2), "utf8");
}

async function ensureStorage() {
  await mkdir(uploadsDir, { recursive: true });
}

function sanitizeFileName(name: string) {
  return name.replace(/[<>:"/\\|?*\u0000-\u001F]/g, "_").slice(0, 120) || "untitled";
}

function inferMimeType(name: string) {
  const ext = path.extname(name).toLowerCase();
  if (ext === ".pdf") return "application/pdf";
  if ([".doc", ".docx"].includes(ext)) return "application/msword";
  if ([".xls", ".xlsx", ".csv"].includes(ext)) return "application/vnd.ms-excel";
  if ([".ppt", ".pptx"].includes(ext)) return "application/vnd.ms-powerpoint";
  if ([".png", ".jpg", ".jpeg", ".webp"].includes(ext)) return "image/*";
  if ([".mp3", ".wav", ".m4a"].includes(ext)) return "audio/*";
  if ([".mp4", ".mov", ".avi"].includes(ext)) return "video/*";
  return "application/octet-stream";
}

function inferDomain(name: string) {
  const text = name.toLowerCase();
  if (/(报价|价格|折扣|price|quote)/i.test(text)) return "报价规则";
  if (/(售后|故障|维修|报警|case|repair)/i.test(text)) return "售后案例";
  if (/(制度|流程|规范|rule|policy)/i.test(text)) return "制度流程";
  if (/(方案|项目|复盘|project|plan)/i.test(text)) return "项目方案";
  if (/(培训|新人|课程|training)/i.test(text)) return "新人培训";
  return "产品资料";
}

function inferStatus(name: string): KnowledgeStatus {
  const ext = path.extname(name).toLowerCase();
  if ([".pdf", ".doc", ".docx", ".xls", ".xlsx", ".csv", ".ppt", ".pptx", ".txt", ".md"].includes(ext)) {
    return "learned";
  }
  return "needs_review";
}

function estimateChunks(size: number) {
  return Math.max(1, Math.ceil(size / 18000));
}

function buildSummary(name: string) {
  return `${inferDomain(name)}相关资料，已进入本地知识库，可作为问答来源。`;
}

function tokenize(query: string) {
  return query
    .toLowerCase()
    .split(/[\s,，。？?、/\\|;；:：()[\]{}"'`~!@#$%^&*_+=-]+/)
    .filter((token) => token.length >= 2);
}

function scoreItem(item: KnowledgeItem, tokens: string[]) {
  const haystack = `${item.name} ${item.domain} ${item.summary}`.toLowerCase();
  const statusBoost = item.status === "learned" ? 2 : 0;
  const tokenScore = tokens.reduce((sum, token) => sum + (haystack.includes(token) ? 3 : 0), 0);
  const domainScore = tokenScore || /(产品|报价|故障|售后|制度|项目|培训)/.test(haystack) ? 1 : 0;

  return statusBoost + tokenScore + domainScore;
}
