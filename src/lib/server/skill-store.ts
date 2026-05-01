import "server-only";

import path from "path";
import { mkdir, readFile, rename, writeFile } from "fs/promises";
import { daniuPersonas, getDaniuPersona, type DaniuPersona } from "@/lib/skills/daniu-personas";
import { getRuntimeConfig } from "@/lib/server/config";

const maxCustomPersonas = 80;

export async function getAllDaniuPersonas() {
  const customPersonas = await getCustomDaniuPersonas();
  const customById = new Map(customPersonas.map((persona) => [persona.id, persona]));
  const builtinIds = new Set(daniuPersonas.map((persona) => persona.id));
  const safeCustomPersonas = [...customById.values()].filter((persona) => !builtinIds.has(persona.id));

  return [...daniuPersonas, ...safeCustomPersonas];
}

export async function getServerDaniuPersona(id: string | undefined | null) {
  return getDaniuPersona(id, await getAllDaniuPersonas());
}

export async function getCustomDaniuPersonas(): Promise<DaniuPersona[]> {
  try {
    const content = await readFile(/* turbopackIgnore: true */ getSkillsPath(), "utf8");
    const parsed = JSON.parse(content) as DaniuPersona[];
    return Array.isArray(parsed) ? parsed.filter(isValidPersona).slice(0, maxCustomPersonas) : [];
  } catch {
    return [];
  }
}

export async function saveCustomDaniuPersona(persona: DaniuPersona) {
  const safePersona = normalizePersona(persona);
  const current = await getCustomDaniuPersonas();
  const next = [safePersona, ...current.filter((item) => item.id !== safePersona.id)].slice(0, maxCustomPersonas);
  await writeJsonAtomic(getSkillsPath(), next);

  return safePersona;
}

function normalizePersona(persona: DaniuPersona): DaniuPersona {
  return {
    id: sanitizeId(persona.id),
    name: String(persona.name).trim().slice(0, 32) || "GitHub 大牛",
    avatar: String(persona.avatar).trim().slice(0, 2) || "技",
    title: String(persona.title).trim().slice(0, 40) || "GitHub Skill",
    summary: String(persona.summary).trim().slice(0, 160) || "从 GitHub 导入的专家思维方式。",
    tags: persona.tags.map((tag) => String(tag).trim()).filter(Boolean).slice(0, 4),
    instruction: String(persona.instruction).trim().slice(0, 8000),
    source: persona.source,
  };
}

function isValidPersona(value: unknown): value is DaniuPersona {
  if (!value || typeof value !== "object") {
    return false;
  }

  const maybe = value as Partial<DaniuPersona>;
  return Boolean(maybe.id && maybe.name && maybe.instruction && Array.isArray(maybe.tags));
}

function sanitizeId(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 96);
}

async function writeJsonAtomic(filePath: string, value: unknown) {
  await ensureSkillsDir();
  const tempPath = `${filePath}.${process.pid}.${Date.now()}.tmp`;
  await writeFile(/* turbopackIgnore: true */ tempPath, JSON.stringify(value, null, 2), "utf8");
  await rename(/* turbopackIgnore: true */ tempPath, filePath);
}

async function ensureSkillsDir() {
  await mkdir(/* turbopackIgnore: true */ getRuntimeConfig().storageDir, { recursive: true });
}

function getSkillsPath() {
  return path.join(/* turbopackIgnore: true */ getRuntimeConfig().storageDir, "skills.json");
}
