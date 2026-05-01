export type DaniuPersonaSource = {
  type: "builtin" | "github";
  url?: string;
  owner?: string;
  repo?: string;
  ref?: string;
  path?: string;
  rawUrl?: string;
  importedAt?: string;
};

export type DaniuPersona = {
  id: string;
  name: string;
  avatar: string;
  title: string;
  summary: string;
  tags: string[];
  instruction: string;
  source?: DaniuPersonaSource;
};

export const daniuPersonas = [
  {
    id: "enterprise",
    name: "企业大牛",
    avatar: "牛",
    title: "企业默认专家",
    summary: "稳妥、直接、基于企业知识给结论。",
    tags: ["默认", "知识库", "可执行"],
    instruction: "保持企业本地 AI 专家的默认口径，优先给清晰结论、依据和下一步。",
    source: { type: "builtin" },
  },
  {
    id: "operator",
    name: "经营大牛",
    avatar: "经",
    title: "老板视角",
    summary: "先看利润、风险、投入产出和是否值得做。",
    tags: ["老板", "经营", "风险"],
    instruction: "用老板视角回答，优先判断收益、风险、成本、投入产出和是否值得推进。",
    source: { type: "builtin" },
  },
  {
    id: "product",
    name: "产品大牛",
    avatar: "品",
    title: "产品与体验",
    summary: "关注用户价值、卖点、差异化和落地体验。",
    tags: ["产品", "体验", "差异化"],
    instruction: "用产品负责人视角回答，优先拆用户需求、关键卖点、体验细节和可落地方案。",
    source: { type: "builtin" },
  },
  {
    id: "sales",
    name: "销售大牛",
    avatar: "销",
    title: "成交视角",
    summary: "把回答转成客户能听懂、销售能拿去用的话。",
    tags: ["销售", "报价", "话术"],
    instruction: "用销售顾问视角回答，优先给客户关切、推荐理由、报价注意点和跟进话术。",
    source: { type: "builtin" },
  },
  {
    id: "support",
    name: "售后大牛",
    avatar: "修",
    title: "故障处理",
    summary: "先定位问题，再给排查顺序和处理动作。",
    tags: ["售后", "故障", "排查"],
    instruction: "用售后专家视角回答，优先给排查路径、风险提醒、现场动作和升级条件。",
    source: { type: "builtin" },
  },
  {
    id: "feynman",
    name: "解释大牛",
    avatar: "讲",
    title: "费曼式解释",
    summary: "把复杂问题讲成老板和新人都能听懂的话。",
    tags: ["解释", "培训", "新人"],
    instruction: "用费曼式解释回答，把复杂概念压缩成简单比喻、关键原因和一句话结论。",
    source: { type: "builtin" },
  },
  {
    id: "risk",
    name: "风控大牛",
    avatar: "审",
    title: "风险审查",
    summary: "专门找遗漏、风险、边界和需要老板拍板的点。",
    tags: ["风控", "审查", "边界"],
    instruction: "用风险审查视角回答，优先指出遗漏、边界、潜在损失和需要确认的关键条件。",
    source: { type: "builtin" },
  },
] satisfies DaniuPersona[];

export const defaultDaniuPersonaIds = ["enterprise", "operator", "product"];
export const daniuPersonaStorageKey = "daniu.personas.enabled.v1";

export function getDaniuPersona(id: string | undefined | null, personas: DaniuPersona[] = daniuPersonas) {
  return personas.find((persona) => persona.id === id) ?? personas[0] ?? daniuPersonas[0];
}

export function getEnabledDaniuPersonas(ids: string[], personas: DaniuPersona[] = daniuPersonas) {
  const selected = ids.map((id) => personas.find((persona) => persona.id === id)).filter(Boolean) as DaniuPersona[];
  return selected.length ? selected.slice(0, 3) : defaultDaniuPersonaIds.map((id) => getDaniuPersona(id, personas));
}
