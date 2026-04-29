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

export type PublicKnowledgeItem = Omit<KnowledgeItem, "storagePath">;

export type KnowledgeChunk = {
  id: string;
  itemId: string;
  itemName: string;
  domain: string;
  index: number;
  text: string;
};

export type KnowledgeSource = Pick<KnowledgeItem, "name" | "domain" | "summary"> & {
  id: string;
  itemId: string;
  chunks: number;
  snippet: string;
  chunkIndex: number;
};

const storageRoot = process.env.DANIU_STORAGE_DIR || path.join(process.cwd(), ".daniu");
const uploadsDir = path.join(storageRoot, "uploads");
const manifestPath = path.join(storageRoot, "knowledge.json");
const chunksPath = path.join(storageRoot, "chunks.json");

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

const seedChunks: KnowledgeChunk[] = [
  {
    id: "seed-product-x9-1",
    itemId: "seed-product-x9",
    itemName: "产品手册_X9.pdf",
    domain: "产品资料",
    index: 1,
    text: "X9 适合中小型产线的标准部署，推荐在需要本地知识问答、设备故障辅助和售后经验沉淀的场景使用。",
  },
  {
    id: "seed-product-x9-2",
    itemId: "seed-product-x9",
    itemName: "产品手册_X9.pdf",
    domain: "产品资料",
    index: 2,
    text: "安装前需要确认局域网连通、电源稳定、服务器所在机柜通风良好，并由管理员完成首次账号授权。",
  },
  {
    id: "seed-product-x9-3",
    itemId: "seed-product-x9",
    itemName: "产品手册_X9.pdf",
    domain: "产品资料",
    index: 3,
    text: "如果客户强调数据不出厂区，应优先推荐本地大模型与本地知识库组合部署，不建议默认使用纯云端方案。",
  },
  {
    id: "seed-after-sales-1",
    itemId: "seed-after-sales",
    itemName: "售后故障案例.xlsx",
    domain: "售后案例",
    index: 1,
    text: "压力回落缓慢时，先检查 3 号阀压力回落曲线，再确认传感器接线是否松动，最后排查阀体卡滞。",
  },
  {
    id: "seed-after-sales-2",
    itemId: "seed-after-sales",
    itemName: "售后故障案例.xlsx",
    domain: "售后案例",
    index: 2,
    text: "E17 报警通常与传感器异常、接线松动或阀体动作迟滞有关，处理前需要保留现场日志。",
  },
  {
    id: "seed-after-sales-3",
    itemId: "seed-after-sales",
    itemName: "售后故障案例.xlsx",
    domain: "售后案例",
    index: 3,
    text: "同类故障连续出现两次以上，应升级为项目复盘问题，由售后负责人补充标准处理方案。",
  },
  {
    id: "seed-price-rule-1",
    itemId: "seed-price-rule",
    itemName: "报价规则.docx",
    domain: "报价规则",
    index: 1,
    text: "华东区域大客户报价需要销售负责人审批，低于标准折扣线时必须补充项目背景和竞争对手信息。",
  },
  {
    id: "seed-price-rule-2",
    itemId: "seed-price-rule",
    itemName: "报价规则.docx",
    domain: "报价规则",
    index: 2,
    text: "渠道客户报价要先确认保护关系，避免同一项目多渠道重复报价导致价格体系混乱。",
  },
  {
    id: "seed-price-rule-3",
    itemId: "seed-price-rule",
    itemName: "报价规则.docx",
    domain: "报价规则",
    index: 3,
    text: "报价单中涉及非标交付、现场安装或长期售后服务时，应单独列明服务范围和验收条件。",
  },
];

export async function getKnowledgeItems(): Promise<KnowledgeItem[]> {
  const stored = await readManifest();
  return [...stored, ...seedItems].sort((a, b) => Date.parse(b.uploadedAt) - Date.parse(a.uploadedAt));
}

export async function getPublicKnowledgeItems(): Promise<PublicKnowledgeItem[]> {
  const items = await getKnowledgeItems();
  return items.map(toPublicKnowledgeItem);
}

export async function getKnowledgeChunks(): Promise<KnowledgeChunk[]> {
  const stored = await readChunks();
  return [...stored, ...seedChunks];
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
  const extractedText = extractText(buffer, safeName, file.type);
  const chunks = chunkText(extractedText).map((text, index) => ({
    id: `${id}-${index + 1}`,
    itemId: id,
    itemName: safeName,
    domain: inferDomain(safeName),
    index: index + 1,
    text,
  }));

  await writeFile(storagePath, buffer);

  const item: KnowledgeItem = {
    id,
    name: safeName,
    size: file.size,
    type: file.type || inferMimeType(safeName),
    domain: inferDomain(safeName),
    status: chunks.length ? "learned" : "needs_review",
    chunks: chunks.length || estimateChunks(file.size),
    uploadedAt: new Date().toISOString(),
    summary: chunks.length ? summarizeText(extractedText, safeName) : buildSummary(safeName),
    storagePath,
  };

  const [currentItems, currentChunks] = await Promise.all([readManifest(), readChunks()]);
  await Promise.all([writeManifest([item, ...currentItems]), writeChunks([...chunks, ...currentChunks])]);

  return toPublicKnowledgeItem(item);
}

export async function findKnowledgeSources(query: string, limit = 3): Promise<KnowledgeSource[]> {
  const [items, chunks] = await Promise.all([getKnowledgeItems(), getKnowledgeChunks()]);
  const itemMap = new Map(items.map((item) => [item.id, item]));
  const tokens = tokenize(query);

  const chunkMatches = chunks
    .map((chunk) => ({ chunk, score: scoreText(`${chunk.itemName} ${chunk.domain} ${chunk.text}`, tokens, chunk.domain) }))
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(({ chunk }) => {
      const item = itemMap.get(chunk.itemId);
      return {
        id: chunk.id,
        itemId: chunk.itemId,
        name: chunk.itemName,
        domain: chunk.domain,
        summary: item?.summary ?? chunk.text.slice(0, 80),
        chunks: item?.chunks ?? 1,
        snippet: chunk.text,
        chunkIndex: chunk.index,
      };
    });

  if (chunkMatches.length) {
    return chunkMatches;
  }

  return items
    .map((item) => ({ item, score: scoreText(`${item.name} ${item.domain} ${item.summary}`, tokens, item.domain) }))
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(({ item }) => ({
      id: item.id,
      itemId: item.id,
      name: item.name,
      domain: item.domain,
      summary: item.summary,
      chunks: item.chunks,
      snippet: item.summary,
      chunkIndex: 0,
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

async function readChunks(): Promise<KnowledgeChunk[]> {
  try {
    const content = await readFile(chunksPath, "utf8");
    const parsed = JSON.parse(content) as KnowledgeChunk[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function writeManifest(items: KnowledgeItem[]) {
  await ensureStorage();
  await writeFile(manifestPath, JSON.stringify(items, null, 2), "utf8");
}

async function writeChunks(chunks: KnowledgeChunk[]) {
  await ensureStorage();
  await writeFile(chunksPath, JSON.stringify(chunks, null, 2), "utf8");
}

async function ensureStorage() {
  await mkdir(uploadsDir, { recursive: true });
}

function toPublicKnowledgeItem(item: KnowledgeItem): PublicKnowledgeItem {
  return {
    id: item.id,
    name: item.name,
    size: item.size,
    type: item.type,
    domain: item.domain,
    status: item.status,
    chunks: item.chunks,
    uploadedAt: item.uploadedAt,
    summary: item.summary,
  };
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
  if ([".txt", ".md", ".csv", ".json", ".html", ".xml"].includes(ext)) return "text/plain";
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

function estimateChunks(size: number) {
  return Math.max(1, Math.ceil(size / 18000));
}

function buildSummary(name: string) {
  return `${inferDomain(name)}相关资料已保存；当前格式暂未解析正文，需要后续接入专用解析器。`;
}

function summarizeText(text: string, name: string) {
  const compact = normalizeText(text);
  const summary = compact.slice(0, 90);
  return summary ? `${inferDomain(name)}：${summary}` : buildSummary(name);
}

function extractText(buffer: Buffer, name: string, mimeType: string) {
  const ext = path.extname(name).toLowerCase();
  const isTextLike =
    mimeType.startsWith("text/") ||
    [".txt", ".md", ".csv", ".json", ".html", ".xml", ".log"].includes(ext);

  if (!isTextLike) {
    return "";
  }

  return normalizeText(buffer.toString("utf8"));
}

function normalizeText(text: string) {
  return text
    .replace(/\u0000/g, "")
    .replace(/\r\n/g, "\n")
    .replace(/[\t ]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function chunkText(text: string) {
  const normalized = normalizeText(text);
  if (!normalized) {
    return [];
  }

  const maxLength = 520;
  const overlap = 80;
  const chunks: string[] = [];
  let start = 0;

  while (start < normalized.length) {
    const end = Math.min(start + maxLength, normalized.length);
    chunks.push(normalized.slice(start, end).trim());
    if (end === normalized.length) {
      break;
    }
    start = Math.max(0, end - overlap);
  }

  return chunks.filter(Boolean).slice(0, 200);
}

function tokenize(query: string) {
  const normalized = query.toLowerCase();
  const words = normalized
    .split(/[\s,，。？?、/\\|;；:：()[\]{}"'`~!@#$%^&*_+=-]+/)
    .filter((token) => token.length >= 2);
  const chineseTerms = ["产品", "报价", "故障", "售后", "制度", "项目", "培训", "压力", "传感器", "阀", "折扣", "客户"];

  return [...new Set([...words, ...chineseTerms.filter((term) => normalized.includes(term))])];
}

function scoreText(text: string, tokens: string[], domain: string) {
  const haystack = text.toLowerCase();
  const tokenScore = tokens.reduce((sum, token) => sum + (haystack.includes(token) ? token.length + 2 : 0), 0);
  const domainScore = /(产品|报价|故障|售后|制度|项目|培训)/.test(haystack) ? 1 : 0;
  const domainBoost =
    (tokens.includes("报价") && domain === "报价规则") ||
    ((tokens.includes("故障") || tokens.includes("售后") || tokens.includes("压力")) && domain === "售后案例") ||
    (tokens.includes("产品") && domain === "产品资料") ||
    (tokens.includes("制度") && domain === "制度流程") ||
    (tokens.includes("项目") && domain === "项目方案") ||
    (tokens.includes("培训") && domain === "新人培训")
      ? 8
      : 0;

  return tokenScore + domainScore + domainBoost;
}
